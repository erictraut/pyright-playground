/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MonacoEditor } from './MonacoEditor';
import PlaygroundFooter from './PlaygroundFooter';
import PlaygroundHeader from './PlaygroundHeader';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { LspClient } from './LspClient';

const lspClient = new LspClient();

export interface AppState {
    code: string;
    diagnostics: Diagnostic[];
    clientError: string;
}

export default function App() {
    const [appState, setAppState] = useState<AppState>({
        code: '',
        diagnostics: [],
        clientError: '',
    });

    lspClient.requestNotification({
        onDiagnostics: (diagnostics: Diagnostic[]) => {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    clientError: '',
                    diagnostics,
                };
            });
        },
        onError: (message: string) => {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    clientError: message,
                };
            });
        },
    });

    return (
        <View style={styles.container}>
            <PlaygroundHeader />
            <MonacoEditor
                code={appState.code}
                diagnostics={appState.diagnostics}
                onUpdateCode={(code: string) => {
                    // Tell the LSP client about the code change.
                    lspClient.updateCode(code);

                    setAppState((prevState) => {
                        return { ...prevState, code };
                    });
                }}
            />
            <PlaygroundFooter />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
});
