/*
 * Copyright (c) Eric Traut
 * Represents a single session of the playground. A session represents
 * an instantiated language server. Sessions persists across API calls for
 * performance reasons.
 */

export type SessionId = string;

export interface Session {
    // A unique ID for this session.
    id: SessionId;

    // Is the session active or closed?
    isActive: boolean;

    // Version of pyright used for this session.
    pyrightVersion: string;

    // Timestamp of last request to the session.
    lastAccessTime: number;
}
