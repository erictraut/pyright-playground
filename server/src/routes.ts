/*
 * Copyright (c) Eric Traut
 * Defines endpoint routes supported by this app server.
 */

import cors from 'cors';
import express from 'express';
import { getDiagnostics, createSession, closeSession } from './service';

const router = express.Router();
export default router;

router.use(cors());

router.post('/session', (req, res) => {
    createSession(req, res);
});

router.delete('/session/:sid', (req, res) => {
    closeSession(req, res);
});

router.post('/session/:sid/diagnostics', (req, res) => {
    getDiagnostics(req, res);
});
