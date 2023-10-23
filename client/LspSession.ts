/*
 * Copyright (c) Eric Traut
 * Handles the state associated with a remote language server session.
 */

import { Diagnostic } from 'vscode-languageserver-types';
import { endpointGet, endpointPut } from './EndpointUtils';

// Number of attempts to create a new session before giving up.
const maxErrorCount = 4;

let appServerApiAddressPrefix = 'https://pyright-play.azurewebsites.net/';

// TODO - this is for local debugging in the browser. Remove for
// React Native code.
const currentUrl = new URL(window.location.href);
if (currentUrl.hostname === 'localhost') {
    appServerApiAddressPrefix = 'http://localhost:3000/';
}

export class LspSession {
    private _sessionId: string | undefined;

    async getDiagnostics(code: string): Promise<Diagnostic[]> {
        return this._doWithSession<Diagnostic[]>(async (sessionId) => {
            const endpoint = appServerApiAddressPrefix + `session/${sessionId}/diagnostics`;
            return endpointGet(endpoint, {}, JSON.stringify({ code })).then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw data;
                }
                return data.diagnostics;
            });
        });
    }

    // Establishes a session if necessary and calls the callback to perform some
    // work. If the session cannot be established or the call fails, an attempt
    // is made to retry the operation with exponential backoff.
    private async _doWithSession<T>(callback: (sessionId: string) => Promise<T>): Promise<T> {
        let errorCount = 0;
        let backoffDelay = 100;

        while (true) {
            if (errorCount > maxErrorCount) {
                throw new Error('Could not connect to Pyright language server');
            }

            try {
                const sessionId = await this._createSession();
                const result = await callback(sessionId);

                return result;
            } catch (err) {
                // Throw away the current session.
                this._sessionId = undefined;
                errorCount++;
            }

            await this._sleep(backoffDelay);

            // Exponentially back off.
            backoffDelay *= 2;
        }
    }

    private _sleep(sleepTimeInMs: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, sleepTimeInMs));
    }

    private async _createSession(): Promise<string> {
        // If there's already a valid session ID, use it.
        if (this._sessionId) {
            return Promise.resolve(this._sessionId);
        }

        const endpoint = appServerApiAddressPrefix + `session`;
        const sessionId = await endpointPut(endpoint, {}, JSON.stringify({})).then(
            async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw data;
                }
                return data.sessionId;
            }
        );

        this._sessionId = sessionId;
        return sessionId;
    }
}
