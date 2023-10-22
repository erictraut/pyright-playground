/*
 * Copyright (c) Eric Traut
 * Manages a collection of playground sessions. It tracks the set of active
 * sessions and manages their lifetimes.
 */

import { exec, fork } from 'node:child_process';
import * as fs from 'fs';
import * as rpc from 'vscode-jsonrpc/node';
import * as path from 'path';
import packageJson from 'package-json';
import { v4 as uuid } from 'uuid';
import { Session, SessionId } from './session';
import {
    DidOpenTextDocumentNotification,
    DidOpenTextDocumentParams,
    InitializeParams,
    InitializeRequest,
} from 'vscode-languageserver';

export interface InstallPyrightInfo {
    pyrightVersion: string;
    localDirectory: string;
}

// Map of sessions indexed by ID
const activeSessions = new Map<string, Session>();

const useIpcTransport = true;

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
        console.log(process.cwd());
        const binaryPath = path.join(
            process.cwd(),
            localDirectory,
            './node_modules/pyright/langserver.index.js'
        );
        console.log(binaryPath);
        const langServerProcess = fork(
            binaryPath,
            [
                useIpcTransport ? '--node-ipc' : '--stdio',
                `--clientProcessId=${process.pid.toString()}`,
            ],
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
            documentText: '',
            documentVersion: 1,
        };

        // Start tracking the session.
        activeSessions.set(sessionId, session);

        langServerProcess.on('spawn', () => {
            console.log(`Pyright language server started`);
            session.langServerProcess = langServerProcess;

            setUpSessionConnection(session)
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

async function setUpSessionConnection(session: Session) {
    if (!session.langServerProcess) {
        return;
    }

    session.langServerProcess.stderr?.on('data', (data) => handleDataLoggedByLanguageServer(data));

    if (useIpcTransport) {
        session.langServerProcess.stdout?.on('data', (data) =>
            handleDataLoggedByLanguageServer(data)
        );
    }

    const connection = rpc.createMessageConnection(
        useIpcTransport
            ? new rpc.IPCMessageReader(session.langServerProcess)
            : new rpc.StreamMessageReader(session.langServerProcess.stdout!),
        useIpcTransport
            ? new rpc.IPCMessageWriter(session.langServerProcess)
            : new rpc.StreamMessageWriter(session.langServerProcess.stdin!)
    );

    connection.listen();

    session.connection = connection;

    console.log('Sending initialization request to language server');
    const init: InitializeParams = {
        rootUri: 'file:///tmp',
        processId: 1,
        capabilities: {},
        workspaceFolders: null,
    };

    await connection.sendRequest(InitializeRequest.type, init);

    const notification = new rpc.NotificationType<DidOpenTextDocumentParams>(
        'textDocument/didOpen'
    );

    await connection.sendNotification(notification, {
        textDocument: {
            uri: 'untitled:test.py',
            languageId: 'python',
            version: session.documentVersion,
            text: 'print("Hello world")',
        },
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
