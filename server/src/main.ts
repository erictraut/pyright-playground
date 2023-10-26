/*
 * Copyright (c) Eric Traut
 * Main entry point for the app server.
 */

import * as appInsight from 'applicationinsights';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import express from 'express';
import * as path from 'path';
import routes from './routes';
import { logger } from './logging';

try {
    // Load environment variables from ".env" file.
    dotenv.config();

    const appInsightsKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (appInsightsKey) {
        appInsight
            .setup(appInsightsKey)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true, true)
            .setSendLiveMetrics(false)
            .setDistributedTracingMode(appInsight.DistributedTracingModes.AI)
            .start();
    }

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
