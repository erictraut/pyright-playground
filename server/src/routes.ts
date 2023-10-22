/*
 * Copyright (c) Eric Traut
 * Defines endpoint routes supported by this app server.
 */

import cors, { CorsOptions } from 'cors';
import express from 'express';
import { getDiagnostics, createSession, closeSession } from './service';

const router = express.Router();
export default router;

// Configure CORS middleware.
// TODO - need to add proper configuration for CORS
const corsOptions: CorsOptions = {
    origin: '*',
};


router.use(cors(corsOptions));

router.post('/session', (req, res) => {
    createSession(req, res);
});

router.delete('/session/:sid', (req, res) => {
    closeSession(req, res);
});

router.get('/session/:sid/diagnostics', (req, res) => {
    getDiagnostics(req, res);
});

