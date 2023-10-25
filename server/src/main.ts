/*
 * Copyright (c) Eric Traut
 * Main entry point for the app server.
 */

import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import express from 'express';
import * as path from 'path';
import routes from './routes';
import { logger, configureRemoteLogging } from './logging';

try {
    // Load environment variables from ".env" file.
    dotenv.config();

    configureRemoteLogging(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

    startService();
} catch (err) {
    logger.error(`Uncaught exception: ${err}`);
    throw err;
}

function startService() {
    const root = './';
    const apiPort = process.env.PORT || 3000;
    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/api', routes);

    app.use(express.static(path.join(root, 'dist/webapp')));
    app.get('*', (req, res) => {
        res.sendFile('dist/webapp/index.html', { root });
    });

    app.listen(apiPort, () => {
        logger.info(`API running on port ${apiPort}`);
    });
}
