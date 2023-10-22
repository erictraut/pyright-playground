/*
 * Copyright (c) Eric Traut
 * Implements primary API endpoints for the seb service.
 */

import { Request, Response } from 'express';
import * as SessionManager from './sessionManager';

interface SessionOptions {
    pythonVersion?: string;
    pyrightVersion?: string;
}

interface CodeWithOptions {
    code: string;
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
            res.status(500).json({ message: err || 'An internal error occurred' });
        });
}

export function closeSession(req: Request, res: Response) {
    res.status(500).json({ message: 'Not implemented' });
}

// Given some Python code and associated options, returns
// a list of diagnostics.
export function getDiagnostics(req: Request, res: Response) {
    const parsedRequest = validateCodeWithOptions(req, res);
    if (!parsedRequest) {
        return;
    }

    res.status(500).json({ message: 'Not implemented' });
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

function validateCodeWithOptions(req: Request, res: Response): CodeWithOptions | undefined {
    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ message: 'Invalid request body' });
        return undefined;
    }

    const code = req.body.code;
    if (typeof code !== 'string') {
        res.status(400).json({ message: 'Invalid code' });
        return undefined;
    }

    return { code };
}
