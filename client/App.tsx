/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Diagnostic } from 'vscode-languageserver-types';
import { LspClient } from './LspClient';
import { MonacoEditor } from './MonacoEditor';
import HeaderPanel from './HeaderPanel';
import { ProblemsPanel } from './ProblemsPanel';

const lspClient = new LspClient();

export interface AppState {
    code: string;
    diagnostics: Diagnostic[];
    clientError: string;
}

export default function App() {
    const editorRef = useRef(null);
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
            <HeaderPanel />
            <MonacoEditor
                ref={editorRef}
                lspClient={lspClient}
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
            <ProblemsPanel
                diagnostics={appState.diagnostics}
                onSelectRange={(range) => {
                    if (editorRef.current) {
                        editorRef.current.selectRange(range);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
});
