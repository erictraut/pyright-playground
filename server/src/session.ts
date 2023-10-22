/*
 * Copyright (c) Eric Traut
 * Represents a single session of the playground. A session represents
 * an instantiated language server. Sessions persists across API calls for
 * performance reasons.
 */

import { ChildProcess } from 'node:child_process';
import * as rpc from 'vscode-jsonrpc/node';

export type SessionId = string;

export interface Session {
    // A unique ID for this session.
    id: SessionId;

    // Child process running the language server for this session.
    langServerProcess?: ChildProcess;

    // Bidirectional connection to the language server.
    connection?: rpc.MessageConnection;

    // Timestamp of last request to the session.
    lastAccessTime: number;

    // Last document text received.
    documentText: string;

    // Last document version number received.
    documentVersion: number;
}
