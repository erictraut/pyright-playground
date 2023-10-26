/*
 * Copyright (c) Eric Traut
 * Implements primary API endpoints for the seb service.
 */

import { Request, Response } from 'express';
import * as SessionManager from './sessionManager';
import { Session, SessionOptions } from './session';
import { Position } from 'vscode-languageserver';
import { logger } from './logging';

interface CodeWithOptions {
    code: string;
    position?: Position;
}

// Retrieves the current status of the service including the
// versions of pyright that it supports.
export function getStatus(req: Request, res: Response) {
    SessionManager.getPyrightVersions()
        .then((pyrightVersions) => {
            res.status(200).json({ pyrightVersions });
        })
        .catch((err) => {
            logger.error(`getStatus returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

// Creates a new language server session and returns its ID.
export function createSession(req: Request, res: Response) {
    const sessionOptions = validateSessionOptions(req, res);
    if (!sessionOptions) {
        return;
    }

    SessionManager.createNewSession(sessionOptions)
        .then((sessionId) => {
            res.status(200).json({ sessionId });
        })
        .catch((err) => {
            logger.error(`createNewSession returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

export function closeSession(req: Request, res: Response) {
    const session = validateSession(req, res);
    if (!session) {
        return;
    }

    SessionManager.closeSession(session.id);
    res.status(200).json({});
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
            logger.error(`getDiagnostics returning a 500: ${err}`);
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
            logger.error(`getHoverInfo returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

export function getSignatureHelp(req: Request, res: Response) {
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
        .getSignatureHelp(codeWithOptions.code, codeWithOptions.position!)
        .then((signatureHelp) => {
            res.status(200).json({ signatureHelp });
        })
        .catch((err) => {
            logger.error(`getSignatureHelp returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

export function getCompletion(req: Request, res: Response) {
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
        .getCompletion(codeWithOptions.code, codeWithOptions.position!)
        .then((completionList) => {
            res.status(200).json({ completionList });
        })
        .catch((err) => {
            logger.error(`getCompletion returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

export function resolveCompletion(req: Request, res: Response) {
    const session = validateSession(req, res);
    const langClient = session?.langClient;
    if (!langClient) {
        return;
    }

    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ message: 'Invalid request body' });
        return;
    }

    const completionItem = req.body.completionItem;
    if (typeof completionItem !== 'object') {
        res.status(400).json({ message: 'Invalid completionItem' });
        return;
    }

    langClient
        .resolveCompletion(completionItem)
        .then((completionItem) => {
            res.status(200).json({ completionItem });
        })
        .catch((err) => {
            logger.error(`resolveCompletion returning a 500: ${err}`);
            res.status(500).json({ message: err || 'An unexpected error occurred' });
        });
}

function validateSessionOptions(req: Request, res: Response): SessionOptions | undefined {
    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ message: 'Invalid request body' });
        return undefined;
    }

    const pyrightVersion = req.body.pyrightVersion;
    if (pyrightVersion !== undefined) {
        if (typeof pyrightVersion !== 'string' || !pyrightVersion.match(/1.[0-9]+.[0-9]+/)) {
            res.status(400).json({ message: 'Invalid pyrightVersion' });
            return undefined;
        }
    }

    const pythonVersion = req.body.pythonVersion;
    if (pythonVersion !== undefined) {
        if (typeof pythonVersion !== 'string' || !pythonVersion.match(/3.[0-9]+/)) {
            res.status(400).json({ message: 'Invalid pythonVersion' });
            return undefined;
        }
    }

    const pythonPlatform = req.body.pythonPlatform;
    if (pythonPlatform !== undefined) {
        if (typeof pythonPlatform !== 'string') {
            res.status(400).json({ message: 'Invalid pythonPlatform' });
            return undefined;
        }
    }

    const locale = req.body.locale;
    if (locale !== undefined) {
        if (typeof locale !== 'string') {
            res.status(400).json({ message: 'Invalid locale' });
            return undefined;
        }
    }

    const typeCheckingMode = req.body.typeCheckingMode;
    if (typeCheckingMode !== undefined) {
        if (typeCheckingMode !== 'strict') {
            res.status(400).json({ message: 'Invalid typeCheckingMode' });
            return undefined;
        }
    }

    const configOverrides: { [name: string]: boolean } = {};
    if (req.body.configOverrides !== undefined) {
        if (typeof req.body.configOverrides !== 'object') {
            res.status(400).json({ message: 'Invalid configOverrides' });
            return undefined;
        }

        for (const key of Object.keys(req.body.configOverrides)) {
            const value = req.body.configOverrides[key];
            if (typeof value !== 'boolean') {
                res.status(400).json({ message: `Invalid value for configOverrides key ${key}` });
                return undefined;
            }

            configOverrides[key] = value;
        }
    }

    return {
        pyrightVersion,
        pythonVersion,
        pythonPlatform,
        typeCheckingMode,
        configOverrides,
        locale,
    };
}

function validateCodeWithOptions(
    req: Request,
    res: Response,
    options?: string[]
): CodeWithOptions | undefined {
    let reportedError = false;

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
                reportedError = true;
            } else {
                response.position = {
                    line: position.line,
                    character: position.character,
                };
            }
        }
    });

    return reportedError ? undefined : response;
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
