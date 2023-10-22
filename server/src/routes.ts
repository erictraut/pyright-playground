/*
 * Copyright (c) Eric Traut
 * Defines endpoint routes supported by this app server.
 */

import cors, { CorsOptions } from 'cors';
import express from 'express';
import { getDiagnostics } from './service';

const router = express.Router();
export default router;

// Configure CORS middleware.
// TODO - need to add proper configuration for CORS
const corsOptions: CorsOptions = {
    origin: '*',
};


router.use(cors(corsOptions));

router.post('/diagnostics', (req, res) => {
    getDiagnostics(req, res);
});

