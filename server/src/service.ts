/*
 * Copyright (c) Eric Traut
 * Implements primary API endpoints for the seb service.
 */

import { Request, Response } from 'express';
import * as SessionManager from './sessionManager';
import { Session } from './session';
import { Position } from 'vscode-languageserver';

interface SessionOptions {
    pythonVersion?: string;
    pyrightVersion?: string;
}

interface CodeWithOptions {
    code: string;
    position?: Position;
}

// Creates a new language server session and returns its ID.
export function createSession(req: Request, res: Response) {
    const parsedRequest = validateSessionOptions(req, res);
    if (!parsedRequest) {
        return;
    }

    SessionManager.createNewSession(parsedRequest.pyrightVersion)
        .then((sessionId) => {
            res.status(200).json({ sessionId });
        })
        .catch((err) => {
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

export function closeSession(req: Request, res: Response) {
    const session = validateSession(req, res);
    if (!session) {
        return;
    }

    SessionManager.closeSession(session.id);
    res.status(200);
}

// Given some Python code and associated options, returns
// a list of diagnostics.
export function getDiagnostics(req: Request, res: Response) {
    const session = validateSession(req, res);
    const langClient = session?.langClient;
    if (!langClient) {
        return;
    }

    const codeWithOptions = validateCodeWithOptions(req, res);
    if (!codeWithOptions) {
        return;
    }

    langClient
        .getDiagnostics(codeWithOptions.code)
        .then((diagnostics) => {
            res.status(200).json({ diagnostics });
        })
        .catch((err) => {
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

// Given some Python code and a position within that code,
// returns hover information.
export function getHoverInfo(req: Request, res: Response) {
    const session = validateSession(req, res);
    const langClient = session?.langClient;
    if (!langClient) {
        return;
    }

    const codeWithOptions = validateCodeWithOptions(req, res, ['position']);
    if (!codeWithOptions) {
        return;
    }

    langClient
        .getHoverInfo(codeWithOptions.code, codeWithOptions.position!)
        .then((hover) => {
            res.status(200).json({ hover });
        })
        .catch((err) => {
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

function validateSessionOptions(req: Request, res: Response): SessionOptions | undefined {
    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ message: 'Invalid request body' });
        return undefined;
    }

    const pyrightVersion = req.body.pyrightVersion;
    if (pyrightVersion !== undefined && typeof pyrightVersion !== 'string') {
        res.status(400).json({ message: 'Invalid pyrightVersion' });
        return undefined;
    }

    // TODO - validate other options

    return { pyrightVersion };
}

function validateCodeWithOptions(
    req: Request,
    res: Response,
    options?: string[]
): CodeWithOptions | undefined {
    let foundError = false;

    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ message: 'Invalid request body' });
        return undefined;
    }

    const code = req.body.code;
    if (typeof code !== 'string') {
        res.status(400).json({ message: 'Invalid code' });
        return undefined;
    }

    const response: CodeWithOptions = { code };

    options?.forEach((option) => {
        if (option === 'position') {
            const position = req.body.position;
            if (
                typeof position !== 'object' ||
                typeof position.line !== 'number' ||
                typeof position.character !== 'number'
            ) {
                res.status(400).json({ message: 'Invalid position' });
                foundError = true;
            } else {
                response.position = {
                    line: position.line,
                    character: position.character,
                };
            }
        }
    });

    return foundError ? undefined : response;
}

function validateSession(req: Request, res: Response): Session | undefined {
    const sessionId = req.params.sid;
    if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({ message: 'Invalid session ID' });
        return undefined;
    }

    const session = SessionManager.getSessionById(sessionId);
    if (!session?.langClient) {
        res.status(400).json({ message: 'Unknown session ID' });
        return undefined;
    }

    return session;
}
