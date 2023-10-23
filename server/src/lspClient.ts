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
    ConfigurationParams,
    DiagnosticTag,
    DidChangeConfigurationParams,
    DidOpenTextDocumentParams,
    InitializeParams,
    InitializeRequest,
    LogMessageParams,
    PublishDiagnosticsParams,
} from 'vscode-languageserver';

export class LspClient {
    private _connection: MessageConnection;
    private _documentVersion = 1;
    private _documentText = '';

    constructor(langServer: ChildProcess) {
        langServer.stderr?.on('data', (data) => LspClient._handleDataLoggedByLanguageServer(data));
        langServer.stdout?.on('data', (data) => LspClient._handleDataLoggedByLanguageServer(data));

        this._connection = createMessageConnection(
            new IPCMessageReader(langServer),
            new IPCMessageWriter(langServer)
        );

        this._connection.listen();
    }

    public async initialize() {
        // Initialize the server.
        console.log('Sending initialization request to language server');
        const init: InitializeParams = {
            rootUri: 'file:///tmp',
            rootPath: '/tmp',
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
                },
            },
        };
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
                    uri: 'untitled:untitled.py',
                    languageId: 'python',
                    version: this._documentVersion,
                    text: this._documentText,
                },
            }
        );

        // Receive diagnostics from the language server.
        this._connection.onNotification(
            new NotificationType<PublishDiagnosticsParams>('textDocument/publishDiagnostics'),
            (diagnostics) => {
                console.log(
                    `Received diagnostics from language server: ${JSON.stringify(diagnostics)}`
                );
            }
        );

        // Log messages received by the language server for debugging purposes.
        this._connection.onNotification(
            new NotificationType<LogMessageParams>('window/logMessage'),
            (info) => {
                console.log(`Received log message: ${info.message}`);
            }
        );

        // Handle requests for configurations.
        this._connection.onRequest(
            new RequestType<ConfigurationParams, any, any>('workspace/configuration'),
            (params) => {
                console.log(`Received configuration param request: ${JSON.stringify(params)}}`);
                return [];
            }
        );
    }

    private static _handleDataLoggedByLanguageServer(data: any) {
        console.log(
            `Logged from pyright language server: ${
                typeof data === 'string' ? data : data.toString('utf8')
            }`
        );
    }
}
