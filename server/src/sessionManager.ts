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
import { Session, SessionId, SessionOptions } from './session';

export interface InstallPyrightInfo {
    pyrightVersion: string;
    localDirectory: string;
}

// Map of sessions indexed by ID
const activeSessions = new Map<SessionId, Session>();

// Maximum time a session can be idle before it is closed.
const maxSessionLifetime = 1 * 60 * 1000; // 1 minute

// Maximum number of pyright versions to return to the caller.
const maxPyrightVersionCount = 50;

// Active lifetime timer for harvesting old sessions.
let lifetimeTimer: NodeJS.Timeout | undefined;

export function getSessionById(id: SessionId) {
    const session = activeSessions.get(id);

    if (session) {
        session.lastAccessTime = Date.now();
    }

    return session;
}

// Allocate a new session and return its ID.
export async function createNewSession(
    sessionOptions: SessionOptions | undefined
): Promise<SessionId> {
    scheduleSessionLifetimeTimer();

    return installPyright(sessionOptions?.pyrightVersion).then((info) => {
        return startSession(info.localDirectory, sessionOptions);
    });
}

// Attempts to close the session and cleans up its resources. It
// silently fails if it cannot.
export function closeSession(sessionId: SessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
        return;
    }

    session.langClient?.cancelRequests();

    // If the process exists, attempt to kill it.
    if (session.langServerProcess) {
        session.langServerProcess.kill();
    }

    session.langServerProcess = undefined;
    activeSessions.delete(sessionId);
}

export async function getPyrightVersions(): Promise<string[]> {
    return packageJson('pyright', { allVersions: true, fullMetadata: false })
        .then((response) => {
            let versions = Object.keys(response.versions);

            // Filter out the really old versions (1.0.x).
            versions = versions.filter((version) => !version.startsWith('1.0.'));

            // Return the latest version first.
            versions = versions.reverse();

            // Limit the number of versions returned.
            versions = versions.slice(0, maxPyrightVersionCount);

            return versions;
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

export function startSession(
    localDirectory: string,
    sessionOptions?: SessionOptions
): Promise<SessionId> {
    return new Promise<SessionId>((resolve, reject) => {
        // Launch a new instance of the language server in another process.
        console.log(`Spawning new pyright language server from ${localDirectory}`);
        const binaryPath = path.join(
            process.cwd(),
            localDirectory,
            './node_modules/pyright/langserver.index.js'
        );

        // Set the environment variable for the locale. Older versions
        // of pyright don't handle the local passed via the LSP initialize
        // request.
        const env = { ...process.env };
        if (sessionOptions?.locale) {
            env.LC_ALL = sessionOptions.locale;
        }

        const langServerProcess = fork(
            binaryPath,
            ['--node-ipc', `--clientProcessId=${process.pid.toString()}`],
            {
                cwd: process.cwd(),
                silent: true,
                env,
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
                .initialize(sessionOptions)
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

// If there is no session lifetime timer, schedule one.
function scheduleSessionLifetimeTimer() {
    if (lifetimeTimer) {
        return;
    }

    const lifetimeTimerFrequency = 1 * 60 * 1000; // 1 minute

    lifetimeTimer = setTimeout(() => {
        lifetimeTimer = undefined;

        const curTime = Date.now();

        activeSessions.forEach((session, sessionId) => {
            if (curTime - session.lastAccessTime > maxSessionLifetime) {
                console.log(`Session ${sessionId} timed out; deleting`);
                closeSession(sessionId);
                activeSessions.delete(sessionId);
            }
        });

        if (activeSessions.size === 0) {
            scheduleSessionLifetimeTimer();
        }
    }, lifetimeTimerFrequency);
}
