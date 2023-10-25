/*
 * Copyright (c) Eric Traut
 * Handles the state associated with a remote language server session.
 */

import {
    Definition,
    Diagnostic,
    Position,
    Range,
    SignatureHelp,
} from 'vscode-languageserver-types';
import { endpointDelete, endpointGet, endpointPost } from './EndpointUtils';
import { PlaygroundSettings } from './PlaygroundSettings';

export interface HoverInfo {
    contents: {
        kind: string;
        value: string;
    };
    range: Range;
}

export interface ServerStatus {
    pyrightVersions: string[];
}

// Number of attempts to create a new session before giving up.
const maxErrorCount = 4;

let appServerApiAddressPrefix = 'https://pyright-playground.azurewebsites.net/api/';

// TODO - this is for local debugging in the browser. Remove for
// React Native code.
const currentUrl = new URL(window.location.href);
if (currentUrl.hostname === 'localhost') {
    appServerApiAddressPrefix = 'http://localhost:3000/api/';
}

export class LspSession {
    private _sessionId: string | undefined;
    private _settings: PlaygroundSettings | undefined;

    updateSettings(settings: PlaygroundSettings) {
        this._settings = settings;

        // Force the current session to close so we can
        // create a new one with the updated settings.
        this._closeSession();
    }

    static async getPyrightServiceStatus(): Promise<ServerStatus> {
        const endpoint = appServerApiAddressPrefix + `status`;
        return endpointGet(endpoint, {})
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw data;
                }
                return { pyrightVersions: data.pyrightVersions };
            })
            .catch((err) => {
                throw err;
            });
    }

    async getDiagnostics(code: string): Promise<Diagnostic[]> {
        return this._doWithSession<Diagnostic[]>(async (sessionId) => {
            const endpoint = appServerApiAddressPrefix + `session/${sessionId}/diagnostics`;
            return endpointPost(endpoint, {}, JSON.stringify({ code }))
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw data;
                    }
                    return data.diagnostics;
                })
                .catch((err) => {
                    throw err;
                });
        });
    }

    async getHoverForPosition(code: string, position: Position): Promise<HoverInfo | undefined> {
        return this._doWithSession<HoverInfo>(async (sessionId) => {
            const endpoint = appServerApiAddressPrefix + `session/${sessionId}/hover`;
            return endpointPost(endpoint, {}, JSON.stringify({ code, position }))
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw data;
                    }
                    return data.hover;
                })
                .catch((err) => {
                    throw err;
                });
        });
    }

    async getSignatureHelpForPosition(
        code: string,
        position: Position
    ): Promise<SignatureHelp | undefined> {
        return this._doWithSession<SignatureHelp>(async (sessionId) => {
            const endpoint = appServerApiAddressPrefix + `session/${sessionId}/signature`;
            return endpointPost(endpoint, {}, JSON.stringify({ code, position }))
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw data;
                    }
                    return data.signatureHelp;
                })
                .catch((err) => {
                    throw err;
                });
        });
    }

    async getDefinitionOrDefinitionForPosition(
        code: string,
        position: Position,
        isDefinition: boolean
    ): Promise<Definition | undefined> {
        return this._doWithSession<Definition>(async (sessionId) => {
            const endpoint =
                appServerApiAddressPrefix +
                `session/${sessionId}/${isDefinition ? 'definition' : 'declaration'}`;
            return endpointPost(endpoint, {}, JSON.stringify({ code, position }))
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw data;
                    }
                    return isDefinition ? data.definition : data.declaration;
                })
                .catch((err) => {
                    throw err;
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
                throw new Error('Could not connect to service');
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

        const sessionOptions: any = {};
        if (this._settings) {
            if (this._settings.pyrightVersion) {
                sessionOptions.pyrightVersion = this._settings.pyrightVersion;
            }

            if (this._settings.pythonVersion) {
                sessionOptions.pythonVersion = this._settings.pythonVersion;
            }

            if (this._settings.strictMode) {
                sessionOptions.typeCheckingMode = 'strict';
            }

            sessionOptions.configOverrides = { ...this._settings.configOverrides };
            sessionOptions.locale = this._settings.locale ?? navigator.language;
        }

        const endpoint = appServerApiAddressPrefix + `session`;
        const sessionId = await endpointPost(endpoint, {}, JSON.stringify(sessionOptions)).then(
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

    private async _closeSession(): Promise<void> {
        const sessionId = this._sessionId;
        if (!sessionId) {
            return;
        }

        // Immediately discard the old session ID.
        this._sessionId = undefined;

        const endpoint = appServerApiAddressPrefix + `session/${sessionId}`;
        await endpointDelete(endpoint, {});
    }
}
