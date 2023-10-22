/*
 * Copyright (c) Eric Traut
 * Implements primary API endpoints for the seb service.
 */

import { Request, Response } from 'express';
import { installPyright } from './sessionManager';

interface CodeWithOptions {
    code: string;
    pythonVersion?: string;
    pyrightVersion?: string;
}

// Given some Python code and associated options, returns
// a list of diagnostics.
export function getDiagnostics(req: Request, res: Response) {
    const parsedRequest = validateCodeWithOptions(req, res);
    if (!parsedRequest) {
        return;
    }

    installPyright(parsedRequest.pyrightVersion).then(() => {
        res.status(200).json({
            diagnostics: [
                {
                    message: 'This is a test',
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 0 },
                    },
                    severity: 1,
                    source: 'pyright',
                },
            ],
        });
    }).catch(err => {
        res.status(500).json({ message: err || 'An internal error occurred' });
    });
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

    const pyrightVersion = req.body.pyrightVersion;
    if (pyrightVersion !== undefined && typeof pyrightVersion !== 'string') {
        res.status(400).json({ message: 'Invalid pyrightVersion' });
        return undefined;
    }

    // TODO - validate other options

    return { code, pyrightVersion };
}

