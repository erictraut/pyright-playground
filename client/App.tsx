/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MonacoEditor } from './MonacoEditor';
import PlaygroundFooter from './PlaygroundFooter';
import PlaygroundHeader from './PlaygroundHeader';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { LspClient } from './LspClient';
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
        <Pressable style={styles.container}>
            <PlaygroundHeader />
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
            <PlaygroundFooter />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
});
