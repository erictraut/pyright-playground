/*
 * Copyright (c) Eric Traut
 * Manages a collection of playground sessions. It tracks the set of active
 * sessions and manages their lifetimes.
 */

import { exec, spawn } from 'node:child_process';
import * as fs from 'fs';
import packageJson from 'package-json';
import { v4 as uuid } from 'uuid';
import { Session, SessionId } from './session';

export interface InstallPyrightInfo {
    pyrightVersion: string;
    localDirectory: string;
}

// Map of sessions indexed by ID
const activeSessions = new Map<string, Session>();

// Allocate a new session and return its ID.
export async function createNewSession(pyrightVersion: string | undefined): Promise<SessionId> {
    return installPyright(pyrightVersion).then((info) => {
        return startSession(info.localDirectory);
    });
}

export function closeSession(sessionId: SessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
        // If the process exists, attempt to kill it.
        if (session.langServerProcess) {
            session.langServerProcess.kill();
        }

        session.langServerProcess = undefined;
        activeSessions.delete(sessionId);
    }
}

export async function getPyrightVersions(): Promise<string[]> {
    return packageJson('pyright', { allVersions: true })
        .then((response) => {
            return Object.keys(response.versions);
        })
        .catch((err) => {
            throw new Error(`Failed to get versions of pyright: ${err}`);
        });
}

export async function getPyrightLatestVersion(): Promise<string> {
    return packageJson('pyright')
        .then((response) => {
            if (typeof response.version === 'string') {
                console.log(`Received response from package-json: ${response.version}`);
                return response.version;
            }

            throw new Error(`Received unexpected latest version for pyright`);
        })
        .catch((err) => {
            throw new Error(`Failed to get latest version of pyright: ${err}`);
        });
}

export function startSession(localDirectory: string): Promise<SessionId> {
    return new Promise<SessionId>((resolve, reject) => {
        console.log(`Spawning new pyright language server from ${localDirectory}`);
        const langServerProcess = spawn(
            `${localDirectory}/node_modules/pyright/langserver.index.js`,
            ['--node-ipc']
        );

        // Create a new GUID for a session ID.
        const sessionId = uuid();

        // Create a new session object.
        const session: Session = {
            id: sessionId,
            lastAccessTime: Date.now(),
        };

        // Add it to the map.
        activeSessions.set(sessionId, session);

        langServerProcess.on('spawn', () => {
            console.log(`Pyright language server started`);
            session.langServerProcess = langServerProcess;
            resolve(sessionId);
        });

        langServerProcess.on('error', (err) => {
            // Errors can be reported for a variety of reasons even after
            // the language server has been started.
            if (!session.langServerProcess) {
                console.log(`Pyright language server failed to start: ${err.message}`);
                reject(`Failed to start pyright language server`);
            }

            closeSession(sessionId);
        });

        langServerProcess.on('exit', () => {
            closeSession(sessionId);
        });

        langServerProcess.on('close', () => {
            closeSession(sessionId);
        });
    });
}

export async function installPyright(
    requestedVersion: string | undefined
): Promise<InstallPyrightInfo> {
    console.log(`Pyright version ${requestedVersion || 'latest'} requested`);

    let version: string;
    if (requestedVersion) {
        version = requestedVersion;
    } else {
        console.log(`Fetching latest version of pyright`);
        version = await getPyrightLatestVersion();
        console.log(`Latest version of pyright is ${version}`);
    }

    return new Promise<InstallPyrightInfo>((resolve, reject) => {
        const dirName = `./pyright_local/${version}`;

        if (fs.existsSync(dirName)) {
            console.log(`Pyright version ${version} already installed`);
            resolve({ pyrightVersion: version, localDirectory: dirName });
            return;
        }

        console.log(`Attempting to install pyright version ${version}`);
        exec(
            `mkdir -p ${dirName}/node_modules && cd ${dirName} && npm install pyright@${version}`,
            (err) => {
                if (err) {
                    reject(`Failed to install pyright@${version}`);
                    return;
                }

                console.log(`Install of pyright ${version} succeeded`);

                resolve({ pyrightVersion: version, localDirectory: dirName });
            }
        );
    });
}
