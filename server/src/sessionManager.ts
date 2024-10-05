/*
 * Copyright (c) Eric Traut
 * Manages a collection of playground sessions. It tracks the set of active
 * sessions and manages their lifetimes.
 */

import * as fs from 'fs';
import { exec, fork } from 'node:child_process';
import * as os from 'os';
import packageJson from 'package-json';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { LspClient } from './lspClient';
import { Session, SessionId, SessionOptions } from './session';
import { logger } from './logging';

export interface InstallPyrightInfo {
    pyrightVersion: string;
    localDirectory: string;
}

// Map of active sessions indexed by ID
const activeSessions = new Map<SessionId, Session>();

// List of inactive sessions that can be reused.
const inactiveSessions: Session[] = [];

// Maximum time a session can be idle before it is closed.
const maxSessionLifetime = 1 * 60 * 1000; // 1 minute

// Maximum number of pyright versions to return to the caller.
const maxPyrightVersionCount = 50;

// If the caller doesn't specify the pythonVersion or pythonPlatform,
// default to these. Otherwise the language server will pick these
// based on whatever version of Python happens to be installed in
// the container it's running in.
const defaultPythonVersion = '3.12';
const defaultPythonPlatform = 'All';

// Active lifetime timer for harvesting old sessions.
let lifetimeTimer: NodeJS.Timeout | undefined;

// Cached "latest" version of pyright.
const timeBetweenVersionRequestsInMs = 60 * 60 * 1000; // 1 hour
let lastVersionRequestTime = 0;
let lastVersion = '';

const maxInactiveSessionCount = 64;

export function getSessionById(id: SessionId) {
    const session = activeSessions.get(id);

    if (session) {
        session.lastAccessTime = Date.now();
    }

    return session;
}

// Allocate a new session and return its ID.
export async function createSession(
    sessionOptions: SessionOptions | undefined
): Promise<SessionId> {
    scheduleSessionLifetimeTimer();

    // See if there are any inactive sessions that can be reused.
    const inactiveSession = getCompatibleInactiveSession(sessionOptions);
    if (inactiveSession) {
        return restartSession(inactiveSession, sessionOptions);
    }

    return installPyright(sessionOptions?.pyrightVersion).then((info) => {
        return startSession(info.localDirectory, sessionOptions);
    });
}

// Places an existing session into an inactive pool that can be used
// for future requests.
export function recycleSession(sessionId: SessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
        return;
    }

    session.langClient?.cancelRequests();

    activeSessions.delete(sessionId);
    inactiveSessions.push(session);

    if (inactiveSessions.length > maxInactiveSessionCount) {
        const session = inactiveSessions.shift();
        if (session) {
            terminateSession(session);
        }
    }

    logger.info(`Recycling session (currently ${inactiveSessions.length} in inactive queue)`);
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
    const timeSinceLastRequest = Date.now() - lastVersionRequestTime;

    if (timeSinceLastRequest < timeBetweenVersionRequestsInMs) {
        logger.info(`Returning cached latest pyright version: ${lastVersion}`);
        return lastVersion;
    }

    return packageJson('pyright')
        .then((response) => {
            if (typeof response.version === 'string') {
                logger.info(`Received latest pyright version from npm index: ${response.version}`);

                lastVersionRequestTime = Date.now();

                if (lastVersion !== response.version) {
                    lastVersion = response.version;

                    // We need to terminate all inactive sessions because an empty
                    // version string in the session options changes meaning when
                    // the version of pyright changes.
                    terminateInactiveSessions();
                }

                return response.version;
            }

            throw new Error(`Received unexpected latest version for pyright`);
        })
        .catch((err) => {
            throw new Error(`Failed to get latest version of pyright: ${err}`);
        });
}

function startSession(binaryDirPath: string, sessionOptions?: SessionOptions): Promise<SessionId> {
    return new Promise<SessionId>((resolve, reject) => {
        // Launch a new instance of the language server in another process.
        logger.info(`Spawning new pyright language server from ${binaryDirPath}`);
        const binaryPath = path.join(
            process.cwd(),
            binaryDirPath,
            './node_modules/pyright/langserver.index.js'
        );

        // Create a temp directory where we can store a synthesized config file.
        const tempDirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'pyright_playground'));

        // Synthesize a "pyrightconfig.json" file from the session options and write
        // it to the temp directory so the language server can find it.
        synthesizePyrightConfigFile(tempDirPath, sessionOptions);

        // Synthesize an empty venv directory so that pyright doesn't try to
        // resolve imports using the default Python environment installed on
        // the server's docker container.
        synthesizeVenvDirectory(tempDirPath);

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
                cwd: tempDirPath,
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
            tempDirPath,
            options: sessionOptions,
        };

        // Start tracking the session.
        activeSessions.set(sessionId, session);

        langServerProcess.on('spawn', () => {
            logger.info(`Pyright language server started`);
            session.langServerProcess = langServerProcess;
            session.langClient = new LspClient(langServerProcess);

            session.langClient
                .initialize(tempDirPath, sessionOptions)
                .then(() => {
                    if (sessionOptions?.code !== undefined) {
                        if (session.langClient) {
                            // Warm up the service by sending it an empty file.
                            logger.info('Sending initial code to warm up service');

                            session.langClient
                                .getDiagnostics(sessionOptions.code)
                                .then(() => {
                                    // Throw away results.
                                    logger.info('Received diagnostics from warm up');
                                })
                                .catch((err) => {
                                    // Throw away error;
                                });
                        }
                    }

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
                logger.error(`Pyright language server failed to start: ${err.message}`);
                reject(`Failed to spawn pyright language server instance`);
            }

            closeSession(sessionId);
        });

        langServerProcess.on('exit', (code) => {
            logger.info(`Pyright language server exited with code ${code}`);
            closeSession(sessionId);
        });

        langServerProcess.on('close', (code) => {
            logger.info(`Pyright language server closed with code ${code}`);
            closeSession(sessionId);
        });
    });
}

function restartSession(session: Session, sessionOptions?: SessionOptions): SessionId {
    logger.info(`Restarting inactive session ${session.id}`);

    session.lastAccessTime = Date.now();
    session.options = sessionOptions;

    // Start tracking the session.
    activeSessions.set(session.id, session);

    if (session.langClient) {
        // Send the initial code (or an empty file) to warm up the service.
        session.langClient
            .getDiagnostics(sessionOptions?.code ?? '')
            .then(() => {
                // Throw away results.
                logger.info('Received diagnostics from warm up');
            })
            .catch((err) => {
                // Throw away error;
            });
    }

    return session.id;
}

// Attempts to close the session and cleans up its resources. It
// silently fails if it cannot.
function closeSession(sessionId: SessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
        return;
    }

    session.langClient?.cancelRequests();

    activeSessions.delete(sessionId);

    terminateSession(session);
}

function terminateInactiveSessions() {
    // Pop all inactive sessions and terminate them.
    while (true) {
        const session = inactiveSessions.pop();
        if (!session) {
            break;
        }

        terminateSession(session);
    }
}

function terminateSession(session: Session) {
    // If the process exists, attempt to kill it.
    if (session.langServerProcess) {
        session.langServerProcess.kill();
    }

    session.langServerProcess = undefined;
    // Dispose of the temporary directory.
    try {
        fs.rmSync(session.tempDirPath, { recursive: true });
    } catch (e) {
        // Ignore error.
    }
}

function getCompatibleInactiveSession(sessionOptions?: SessionOptions): Session | undefined {
    logger.info(`Looking for compatible inactive session`);

    const sessionIndex = inactiveSessions.findIndex((session) => {
        if (
            sessionOptions?.pythonVersion !== session.options?.pythonVersion ||
            sessionOptions?.pythonPlatform !== session.options?.pythonPlatform ||
            sessionOptions?.pyrightVersion !== session.options?.pyrightVersion ||
            sessionOptions?.locale !== session.options?.locale ||
            sessionOptions?.typeCheckingMode !== session.options?.typeCheckingMode
        ) {
            return false;
        }

        const requestedOverrides = sessionOptions?.configOverrides || {};
        const existingOverrides = session.options?.configOverrides || {};

        if (requestedOverrides.length !== existingOverrides.length) {
            return false;
        }

        for (const key of Object.keys(requestedOverrides)) {
            if (requestedOverrides[key] !== existingOverrides[key]) {
                return false;
            }
        }

        return true;
    });

    if (sessionIndex < 0) {
        return undefined;
    }

    logger.info(`Found compatible inactive session`);
    return inactiveSessions.splice(sessionIndex, 1)[0];
}

async function installPyright(requestedVersion: string | undefined): Promise<InstallPyrightInfo> {
    logger.info(`Pyright version ${requestedVersion || 'latest'} requested`);

    let version: string;
    if (requestedVersion) {
        version = requestedVersion;
    } else {
        version = await getPyrightLatestVersion();
    }

    return new Promise<InstallPyrightInfo>((resolve, reject) => {
        const dirName = `./pyright_local/${version}`;

        if (fs.existsSync(dirName)) {
            logger.info(`Pyright version ${version} already installed`);
            resolve({ pyrightVersion: version, localDirectory: dirName });
            return;
        }

        logger.info(`Attempting to install pyright version ${version}`);
        exec(
            `mkdir -p ${dirName}/node_modules && cd ${dirName} && npm install pyright@${version}`,
            (err) => {
                if (err) {
                    logger.error(`Failed to install pyright ${version}`);
                    reject(`Failed to install pyright@${version}`);
                    return;
                }

                logger.info(`Install of pyright ${version} succeeded`);

                resolve({ pyrightVersion: version, localDirectory: dirName });
            }
        );
    });
}

function synthesizeVenvDirectory(tempDirPath: string) {
    const venvPath = path.join(tempDirPath, 'venv', 'lib', 'site-packages');
    fs.mkdirSync(venvPath, { recursive: true });
}

function synthesizePyrightConfigFile(tempDirPath: string, sessionOptions?: SessionOptions) {
    const configFilePath = path.join(tempDirPath, 'pyrightconfig.json');
    const config: any = {};

    if (sessionOptions?.pythonVersion) {
        config.pythonVersion = sessionOptions.pythonVersion;
    } else {
        config.pythonVersion = defaultPythonVersion;
    }

    if (sessionOptions?.pythonPlatform) {
        config.pythonPlatform = sessionOptions.pythonPlatform;
    } else {
        config.pythonPlatform = defaultPythonPlatform;
    }

    if (sessionOptions?.typeCheckingMode === 'strict') {
        config.typeCheckingMode = 'strict';
    }

    // Set the venvPath to a synthesized venv to prevent pyright from
    // trying to resolve imports using the default Python environment
    // installed on the server's docker container.
    config.venvPath = '.';
    config.venv = 'venv';

    // Indicate that we don't want to resolve native libraries. This is
    // expensive, and we know there will be no native libraries in the
    // playground.
    config.skipNativeLibraries = true;

    if (sessionOptions?.configOverrides) {
        Object.keys(sessionOptions.configOverrides).forEach((key) => {
            config[key] = sessionOptions.configOverrides![key];
        });
    }

    const configJson = JSON.stringify(config);
    fs.writeFileSync(configFilePath, configJson);
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
                logger.info(`Session ${sessionId} timed out; recycling`);
                recycleSession(sessionId);
                activeSessions.delete(sessionId);
            }
        });

        if (activeSessions.size === 0) {
            scheduleSessionLifetimeTimer();
        }
    }, lifetimeTimerFrequency);
}
