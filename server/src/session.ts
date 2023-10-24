/*
 * Copyright (c) Eric Traut
 * Represents a single session of the playground. A session represents
 * an instantiated language server. Sessions persists across API calls for
 * performance reasons.
 */

import { ChildProcess } from 'node:child_process';
import { LspClient } from './lspClient';

export type SessionId = string;

export interface Session {
    // A unique ID for this session.
    readonly id: SessionId;

    // Child process running the language server for this session.
    langServerProcess?: ChildProcess;

    // Proxy language client that interacts with the server.
    langClient?: LspClient;

    // Timestamp of last request to the session.
    lastAccessTime: number;
}