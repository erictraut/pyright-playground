/*
 * Copyright (c) Eric Traut
 * Acts as a simple language server protocol (LSP) client that exchanges
 * information with a language server.
 */

import { ChildProcess } from 'node:child_process';
import {
    IPCMessageReader,
    IPCMessageWriter,
    MessageConnection,
    NotificationType,
    RequestType,
    createMessageConnection,
} from 'vscode-jsonrpc/node';
import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    CompletionRequest,
    CompletionResolveRequest,
    ConfigurationParams,
    Diagnostic,
    DiagnosticTag,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidOpenTextDocumentParams,
    Hover,
    HoverParams,
    HoverRequest,
    InitializeParams,
    InitializeRequest,
    LogMessageParams,
    Position,
    PublishDiagnosticsParams,
    SignatureHelp,
    SignatureHelpParams,
    SignatureHelpRequest,
} from 'vscode-languageserver';
import { SessionOptions } from './session';
import { logger } from './logging';

interface DiagnosticRequest {
    callback: (diags: Diagnostic[], error?: Error) => void;
}

const documentUri = 'file:///Untitled.py';

export class LspClient {
    private _connection: MessageConnection;
    private _documentVersion = 1;
    private _documentText = '';
    private _documentDiags: PublishDiagnosticsParams | undefined;
    private _pendingDiagRequests = new Map<number, DiagnosticRequest[]>();

    constructor(langServer: ChildProcess) {
        langServer.stderr?.on('data', (data) => LspClient._logServerData(data));
        langServer.stdout?.on('data', (data) => LspClient._logServerData(data));

        this._connection = createMessageConnection(
            new IPCMessageReader(langServer),
            new IPCMessageWriter(langServer)
        );

        this._connection.listen();
    }

    public async initialize(projectPath: string, sessionOptions?: SessionOptions) {
        // Initialize the server.
        const init: InitializeParams = {
            rootUri: `file://${projectPath}`,
            rootPath: projectPath,
            processId: 1,
            capabilities: {
                textDocument: {
                    publishDiagnostics: {
                        tagSupport: {
                            valueSet: [DiagnosticTag.Unnecessary, DiagnosticTag.Deprecated],
                        },
                        versionSupport: true,
                    },
                    hover: {
                        contentFormat: ['markdown', 'plaintext'],
                    },
                    signatureHelp: {},
                },
            },
        };

        if (sessionOptions?.locale) {
            init.locale = sessionOptions.locale;
        }

        await this._connection.sendRequest(InitializeRequest.type, init);

        // Update the settings.
        await this._connection.sendNotification(
            new NotificationType<DidChangeConfigurationParams>('workspace/didChangeConfiguration'),
            {
                settings: {},
            }
        );

        // Simulate an "open file" event.
        await this._connection.sendNotification(
            new NotificationType<DidOpenTextDocumentParams>('textDocument/didOpen'),
            {
                textDocument: {
                    uri: documentUri,
                    languageId: 'python',
                    version: this._documentVersion,
                    text: this._documentText,
                },
            }
        );

        // Receive diagnostics from the language server.
        this._connection.onNotification(
            new NotificationType<PublishDiagnosticsParams>('textDocument/publishDiagnostics'),
            (diagInfo) => {
                const diagVersion = diagInfo.version ?? -1;

                logger.info(`Received diagnostics for version: ${diagVersion}`);

                // Update the cached diagnostics.
                if (
                    this._documentDiags === undefined ||
                    this._documentDiags.version! < diagVersion
                ) {
                    this._documentDiags = diagInfo;
                }

                // Resolve any pending diagnostic requests.
                const pendingRequests = this._pendingDiagRequests.get(diagVersion) ?? [];
                this._pendingDiagRequests.delete(diagVersion);

                for (const request of pendingRequests) {
                    request.callback(diagInfo.diagnostics);
                }
            }
        );

        // Log messages received by the language server for debugging purposes.
        this._connection.onNotification(
            new NotificationType<LogMessageParams>('window/logMessage'),
            (info) => {
                logger.info(`Language server log message: ${info.message}`);
            }
        );

        // Handle requests for configurations.
        this._connection.onRequest(
            new RequestType<ConfigurationParams, any, any>('workspace/configuration'),
            (params) => {
                logger.info(`Language server config request: ${JSON.stringify(params)}}`);
                return [];
            }
        );
    }

    async getDiagnostics(code: string): Promise<Diagnostic[]> {
        const codeChanged = this._documentText !== code;

        // If the code hasn't changed since the last time we received
        // a code update, return the cached diagnostics.
        if (!codeChanged && this._documentDiags) {
            return this._documentDiags.diagnostics;
        }

        // The diagnostics will come back asynchronously, so
        // return a promise.
        return new Promise<Diagnostic[]>(async (resolve, reject) => {
            let documentVersion = this._documentVersion;

            if (codeChanged) {
                documentVersion = await this.updateTextDocument(code);
            }

            // Queue a request for diagnostics.
            let requestList = this._pendingDiagRequests.get(documentVersion);
            if (!requestList) {
                requestList = [];
                this._pendingDiagRequests.set(documentVersion, requestList);
            }

            requestList.push({
                callback: (diagnostics, err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    logger.info(`Diagnostic callback ${JSON.stringify(diagnostics)}}`);
                    resolve(diagnostics);
                },
            });
        });
    }

    async getHoverInfo(code: string, position: Position): Promise<Hover | null> {
        let documentVersion = this._documentVersion;
        if (this._documentText !== code) {
            documentVersion = await this.updateTextDocument(code);
        }

        const params: HoverParams = {
            textDocument: {
                uri: documentUri,
            },
            position,
        };

        const result = await this._connection
            .sendRequest(HoverRequest.type, params)
            .catch((err) => {
                // Don't return an error. Just return null (no info).
                return null;
            });

        return result;
    }

    async getSignatureHelp(code: string, position: Position): Promise<SignatureHelp | null> {
        let documentVersion = this._documentVersion;
        if (this._documentText !== code) {
            documentVersion = await this.updateTextDocument(code);
        }

        const params: SignatureHelpParams = {
            textDocument: {
                uri: documentUri,
            },
            position,
        };

        const result = await this._connection
            .sendRequest(SignatureHelpRequest.type, params)
            .catch((err) => {
                // Don't return an error. Just return null (no info).
                return null;
            });

        return result;
    }

    async getCompletion(
        code: string,
        position: Position
    ): Promise<CompletionList | CompletionItem[] | null> {
        let documentVersion = this._documentVersion;
        if (this._documentText !== code) {
            documentVersion = await this.updateTextDocument(code);
        }

        const params: CompletionParams = {
            textDocument: {
                uri: documentUri,
            },
            position,
        };

        const result = await this._connection
            .sendRequest(CompletionRequest.type, params)
            .catch((err) => {
                // Don't return an error. Just return null (no info).
                return null;
            });

        return result;
    }

    async resolveCompletion(completionItem: CompletionItem): Promise<CompletionItem | null> {
        const result = await this._connection
            .sendRequest(CompletionResolveRequest.type, completionItem)
            .catch((err) => {
                // Don't return an error. Just return null (no info).
                return null;
            });

        return result;
    }

    // Sends a new version of the text document to the language server.
    // It bumps the document version and returns the new version number.
    private async updateTextDocument(code: string): Promise<number> {
        let documentVersion = ++this._documentVersion;
        this._documentText = code;

        logger.info(`Updating text document to version ${documentVersion}`);

        // Send the updated text to the language server.
        return this._connection
            .sendNotification(
                new NotificationType<DidChangeTextDocumentParams>('textDocument/didChange'),
                {
                    textDocument: {
                        uri: documentUri,
                        version: documentVersion,
                    },
                    contentChanges: [
                        {
                            text: code,
                        },
                    ],
                }
            )
            .then(() => {
                logger.info(`Successfully sent text document to language server`);
                return documentVersion;
            })
            .catch((err) => {
                logger.error(`Error sending text document to language server: ${err}`);
                throw err;
            });
    }

    // Cancels all pending requests.
    cancelRequests() {
        this._pendingDiagRequests.forEach((requestList) => {
            requestList.forEach((request) => {
                request.callback([], new Error('Request canceled'));
            });
        });

        this._pendingDiagRequests.clear();
    }

    private static _logServerData(data: any) {
        logger.info(
            `Logged from basedpyright language server: ${
                typeof data === 'string' ? data : data.toString('utf8')
            }`
        );
    }
}
