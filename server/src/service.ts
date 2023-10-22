/*
 * Copyright (c) Eric Traut
 * Implements primary API endpoints for the seb service.
 */

import { Request, Response } from 'express';

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
        return
    }

    res.status(200).json({
        diagnostics: [
            {
                message: 'This is a test',
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                },
                severity: 1,
                source: 'pyright'
            }
        ]
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

    // TODO - validate other options

    return { code };
}