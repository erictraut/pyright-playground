/*
 * Copyright (c) Eric Traut
 * Manages a collection of playground sessions. It tracks the set of active
 * sessions and manages their lifetimes.
 */

import * as fs from 'fs';
import { exec, fork } from 'node:child_process';
import packageJson from 'package-json';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { LspClient } from './lspClient';
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
        // Launch a new instance of the language server in another process.
        console.log(`Spawning new pyright language server from ${localDirectory}`);
        const binaryPath = path.join(
            process.cwd(),
            localDirectory,
            './node_modules/pyright/langserver.index.js'
        );

        const langServerProcess = fork(
            binaryPath,
            ['--node-ipc', `--clientProcessId=${process.pid.toString()}`],
            {
                cwd: process.cwd(),
                silent: true,
            }
        );

        // Create a new UUID for a session ID.
        const sessionId = uuid();

        // Create a new session object.
        const session: Session = {
            id: sessionId,
            lastAccessTime: Date.now(),
        };

        // Start tracking the session.
        activeSessions.set(sessionId, session);

        langServerProcess.on('spawn', () => {
            console.log(`Pyright language server started`);
            session.langServerProcess = langServerProcess;
            session.langClient = new LspClient(langServerProcess);

            session.langClient
                .initialize()
                .then(() => {
                    resolve(sessionId);
                })
                .catch((err) => {
                    reject(`Failed to start pyright language server connection`);
                    closeSession(sessionId);
                });
        });

        langServerProcess.on('error', (err) => {
            // Errors can be reported for a variety of reasons even after
            // the language server has been started.
            if (!session.langServerProcess) {
                console.log(`Pyright language server failed to start: ${err.message}`);
                reject(`Failed to spawn pyright language server instance`);
            }

            closeSession(sessionId);
        });

        langServerProcess.on('exit', (code) => {
            console.log(`Pyright language server exited with code ${code}`);
            closeSession(sessionId);
        });

        langServerProcess.on('close', (code) => {
            console.log(`Pyright language server closed with code ${code}`);
            closeSession(sessionId);
        });
    });
}

function handleDataLoggedByLanguageServer(data: any) {
    console.log(
        `Logged from pyright language server: ${
            typeof data === 'string' ? data : data.toString('utf8')
        }`
    );
}

async function installPyright(requestedVersion: string | undefined): Promise<InstallPyrightInfo> {
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
