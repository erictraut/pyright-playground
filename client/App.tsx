/*
 * Copyright (c) Eric Traut
 * Main UI for Pyright Playground web app.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { HeaderPanel } from './HeaderPanel';
import { getInitialStateFromLocalStorage, setStateToLocalStorage } from './LocalStorageUtils';
import { LspClient } from './LspClient';
import { LspSession } from './LspSession';
import { MonacoEditor } from './MonacoEditor';
import { PlaygroundSettings } from './PlaygroundSettings';
import { ProblemsPanel } from './ProblemsPanel';
import { RightPanel, RightPanelType } from './RightPanel';
import { getStateFromUrl, updateUrlFromState } from './UrlUtils';

const lspClient = new LspClient();

export interface AppState {
    gotInitialState: boolean;
    code: string;
    diagnostics: Diagnostic[];

    settings: PlaygroundSettings;
    requestedPyrightVersion: boolean;
    latestPyrightVersion?: string;
    supportedPyrightVersions?: string[];

    isRightPanelDisplayed: boolean;
    rightPanelType: RightPanelType;

    isProblemsPanelDisplayed: boolean;
    isWaitingForResponse: boolean;
}

const initialState = getStateFromUrl() ?? getInitialStateFromLocalStorage();

export default function App() {
    const editorRef = useRef(null);
    const [appState, setAppState] = useState<AppState>({
        gotInitialState: false,
        code: '',
        settings: {
            typeCheckingMode: 'all',
            configOverrides: {},
        },
        requestedPyrightVersion: false,
        diagnostics: [],
        isRightPanelDisplayed: true,
        rightPanelType: RightPanelType.About,
        isProblemsPanelDisplayed: initialState.code !== '',
        isWaitingForResponse: false,
    });

    useEffect(() => {
        if (!appState.gotInitialState) {
            if (initialState.code !== '') {
                lspClient.updateCode(initialState.code);
            }

            setAppState((prevState) => {
                return {
                    ...prevState,
                    gotInitialState: true,
                    code: initialState.code,
                    settings: initialState.settings,
                    isProblemsPanelDisplayed:
                        prevState.isProblemsPanelDisplayed || initialState.code !== '',
                };
            });
        }
    }, [appState.gotInitialState]);

    // Request general status, including supported versions of pyright
    // from the service.
    useEffect(() => {
        if (!appState.requestedPyrightVersion) {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    requestedPyrightVersion: true,
                };
            });

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
        }
    });

    const handleKeyPress = (event: KeyboardEvent) => {
        // Swallow command-s or ctrl-s to prevent browser save.
        if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);

        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    useEffect(() => {
        setStateToLocalStorage({ code: appState.code, settings: appState.settings });
        updateUrlFromState(appState);
    }, [appState.code, appState.settings]);

    useEffect(() => {
        lspClient.updateSettings(appState.settings);
    }, [appState.settings]);

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
        onWaitingForDiagnostics: (isWaiting) => {
            setAppState((prevState) => {
                return {
                    ...prevState,
                    isWaitingForResponse: isWaiting,
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
                                return { ...prevState, code, isProblemsPanelDisplayed: true };
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
                        code={appState.code}
                        getShareableUrl={() => {
                            return updateUrlFromState(appState);
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
                    expandProblems={appState.isProblemsPanelDisplayed}
                    displayActivityIndicator={appState.isWaitingForResponse}
                />
            </View>
        </MenuProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    middlePanelContainer: {
        flex: 1,
        flexDirection: 'row',
    },
});
