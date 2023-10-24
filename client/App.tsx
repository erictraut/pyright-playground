/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { LspClient } from './LspClient';
import { MonacoEditor } from './MonacoEditor';
import HeaderPanel from './HeaderPanel';
import { ProblemsPanel } from './ProblemsPanel';
import { MenuProvider } from 'react-native-popup-menu';
import { getLocalStorageItem, setLocalStorageItem } from './LocalStorageUtils';

const localStorageKeyName = 'playgroundState';

const lspClient = new LspClient();

export interface AppState {
    gotInitialState: boolean;
    code: string;
    diagnostics: Diagnostic[];
}

interface LocalStorageState {
    code: string;
}

export default function App() {
    const editorRef = useRef(null);
    const [appState, setAppState] = useState<AppState>({
        gotInitialState: false,
        code: '',
        diagnostics: [],
    });

    useEffect(() => {
        if (!appState.gotInitialState) {
            const initialState = getInitialStateFromLocalStorage();

            if (initialState.code !== '') {
                lspClient.updateCode(initialState.code);
            }

            setAppState((prevState) => {
                return {
                    ...prevState,
                    gotInitialState: true,
                    code: initialState.code,
                };
            });
        }
    }, [appState.gotInitialState]);

    lspClient.requestNotification({
        onDiagnostics: (diagnostics: Diagnostic[]) => {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    diagnostics,
                };
            });
        },
        onError: (message: string) => {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    diagnostics: [
                        {
                            message: `An error occurred when attempting to contact the pyright web service\n    ${message}`,
                            severity: DiagnosticSeverity.Error,
                            range: {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 0 },
                            },
                        },
                    ],
                };
            });
        },
    });

    return (
        <MenuProvider>
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

                        setStateToLocalStorage({ code });

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
        </MenuProvider>
    );
}

function getInitialStateFromLocalStorage(): LocalStorageState {
    const initialStateJson = getLocalStorageItem(localStorageKeyName);

    if (initialStateJson) {
        try {
            return JSON.parse(initialStateJson);
        } catch {
            // Fall through.
        }
    }

    return { code: '' };
}

function setStateToLocalStorage(state: LocalStorageState) {
    setLocalStorageItem(localStorageKeyName, JSON.stringify(state));
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
});
