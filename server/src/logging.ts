/*
 * Copyright (c) Eric Traut
 * Provides logging APIs that can output to both the local console
 * and app insights in the cloud.
 */

import * as winston from 'winston';

// Create a simple console logger transport.
export const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});
