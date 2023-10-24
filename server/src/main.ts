/*
 * Copyright (c) Eric Traut
 * Main entry point for the app server.
 */

console.log(`Got to main 1`);

import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import routes from './routes';

console.log(`Got to main 2`);

try {
    // Load environment variables from ".env" file.
    dotenv.config();

    startService();
} catch (err) {
    console.error(`Uncaught exception: ${err}`);
    throw err;
}

function startService() {
    console.log(`Got to startService`);
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
    console.log(`Got to startService 2`);

    const server = process.env.USE_UNSECURE_WEB_SOCKET
        ? http.createServer(app)
        : https.createServer(app);
    server.listen(apiPort, () => {
        console.log(`API running on port ${apiPort}`);
    });

    console.log(`Got to startService 3`);
}
