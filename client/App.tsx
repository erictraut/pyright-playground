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
import { PlaygroundSettings } from './PlaygroundSettings';
import { LspSession } from './LspSession';

const lspClient = new LspClient();

export interface AppState {
    gotInitialState: boolean;
    code: string;
    diagnostics: Diagnostic[];

    settings: PlaygroundSettings;
    latestPyrightVersion?: string;
    supportedPyrightVersions?: string[];

    isRightPanelDisplayed: boolean;
    rightPanelType: RightPanelType;
}

export default function App() {
    const editorRef = useRef(null);
    const [appState, setAppState] = useState<AppState>({
        gotInitialState: false,
        code: '',
        settings: {
            configOverrides: {},
        },
        diagnostics: [],
        isRightPanelDisplayed: true,
        rightPanelType: RightPanelType.Settings,
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
                    settings: initialState.settings,
                };
            });
        }
    }, [appState.gotInitialState]);

    // Request the latest version of pyright
    useEffect(() => {
        LspSession.getPyrightServiceStatus()
            .then((status) => {
                const pyrightVersions = status.pyrightVersions;

                setAppState((prevState) => {
                    return {
                        ...prevState,
                        latestPyrightVersion:
                            pyrightVersions.length > 0 ? pyrightVersions[0] : undefined,
                        supportedPyrightVersions: pyrightVersions,
                    };
                });
            })
            .catch((err) => {
                // Ignore errors here.
            });
    });

    useEffect(() => {
        setStateToLocalStorage({ code: appState.code, settings: appState.settings });
    }, [appState.code, appState.settings]);

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

    function onShowRightPanel(rightPanelType?: RightPanelType) {
        setAppState((prevState) => {
            return {
                ...prevState,
                rightPanelType: rightPanelType ?? prevState.rightPanelType,
                isRightPanelDisplayed: rightPanelType !== undefined,
            };
        });
    }

    return (
        <MenuProvider>
            <View style={styles.container}>
                <HeaderPanel
                    isRightPanelDisplayed={appState.isRightPanelDisplayed}
                    rightPanelType={appState.rightPanelType}
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

                            setAppState((prevState) => {
                                return { ...prevState, code };
                            });
                        }}
                    />
                    <RightPanel
                        isRightPanelDisplayed={appState.isRightPanelDisplayed}
                        rightPanelType={appState.rightPanelType}
                        onShowRightPanel={onShowRightPanel}
                        settings={appState.settings}
                        latestPyrightVersion={appState.latestPyrightVersion}
                        supportedPyrightVersions={appState.supportedPyrightVersions}
                        onUpdateSettings={(settings: PlaygroundSettings) => {
                            setAppState((prevState) => {
                                return { ...prevState, settings };
                            });
                        }}
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
    },
    middlePanelContainer: {
        flex: 1,
        flexDirection: 'row',
    },
});
