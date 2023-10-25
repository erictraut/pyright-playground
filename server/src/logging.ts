/*
 * Copyright (c) Eric Traut
 * Provides logging APIs that can output to both the local console
 * and app insights in the cloud.
 */

import * as winston from 'winston';
const AzureApplicationInsightsLogger = require('winston-azure-application-insights');

// By default, create a console logger transport.
export const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});

export function configureRemoteLogging(appInsightsKey: string | undefined) {
    // Add an app insights transport if configured.
    if (appInsightsKey) {
        logger.add(
            new AzureApplicationInsightsLogger({
                key: appInsightsKey,
            })
        );
    }
}
