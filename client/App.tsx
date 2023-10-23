/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MonacoEditor } from './MonacoEditor';
import PlaygroundFooter from './PlaygroundFooter';
import PlaygroundHeader from './PlaygroundHeader';
import { LspSession } from './LspSession';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';

const lspSession = new LspSession();

export interface AppState {
    code: string;
    diagnostics: Diagnostic[];
}

export default function App() {
    const [appState, setAppState] = useState<AppState>({
        code: '',
        diagnostics: [],
    });

    return (
        <View style={styles.container}>
            <PlaygroundHeader />
            <MonacoEditor
                code={appState.code}
                diagnostics={appState.diagnostics}
                onUpdateCode={(code: string) => {
                    setAppState((prevState) => {
                        return {
                            ...prevState,
                            code,
                            diagnostics: [
                                {
                                    range: {
                                        start: { line: 0, character: 0 },
                                        end: { line: 0, character: 1 },
                                    },
                                    message: 'Hello world',
                                    severity: DiagnosticSeverity.Error,
                                },
                            ],
                        };
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
