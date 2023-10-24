/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import HeaderPanel from './HeaderPanel';
import { getInitialStateFromLocalStorage, setStateToLocalStorage } from './LocalStorageUtils';
import { LspClient } from './LspClient';
import { MonacoEditor } from './MonacoEditor';
import { ProblemsPanel } from './ProblemsPanel';
import { RightPanel, RightPanelType } from './RightPanel';

const lspClient = new LspClient();

export interface AppState {
    gotInitialState: boolean;
    code: string;
    diagnostics: Diagnostic[];
    rightPanelToDisplay: RightPanelType;
}

export default function App() {
    const editorRef = useRef(null);
    const [appState, setAppState] = useState<AppState>({
        gotInitialState: false,
        code: '',
        diagnostics: [],
        rightPanelToDisplay: RightPanelType.About,
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

    function onShowRightPanel(rightPanelToDisplay: RightPanelType) {
        setAppState((prevState) => {
            return { ...prevState, rightPanelToDisplay };
        });
    }

    return (
        <MenuProvider>
            <View style={styles.container}>
                <HeaderPanel
                    rightPanelDisplayed={appState.rightPanelToDisplay}
                    onShowRightPanel={onShowRightPanel}
                />
                <View style={styles.middlePanelContainer}>
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
                    <RightPanel
                        rightPanelDisplayed={appState.rightPanelToDisplay}
                        onShowRightPanel={onShowRightPanel}
                    />
                </View>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
    middlePanelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'stretch',
    },
    rightPanelContainer: {
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
});
