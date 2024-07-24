/*
 * Copyright (c) Eric Traut
 * Wrapper interface around the monaco editor component. This class
 * handles language server interactions, the display of errors, etc.
 */

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    CompletionItem,
    CompletionItemKind,
    Diagnostic,
    DiagnosticSeverity,
    InsertReplaceEdit,
    Range,
    TextDocumentEdit,
} from 'vscode-languageserver-types';
import { LspClient } from './LspClient';

loader
    .init()
    .then((monaco) => {
        monaco.languages.registerHoverProvider('python', {
            provideHover: handleHoverRequest,
        });
        monaco.languages.registerSignatureHelpProvider('python', {
            provideSignatureHelp: handleSignatureHelpRequest,
            signatureHelpTriggerCharacters: ['(', ','],
        });
        monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: handleProvideCompletionRequest,
            resolveCompletionItem: handleResolveCompletionRequest,
            triggerCharacters: ['.', '[', '"', "'"],
        });
        monaco.languages.registerRenameProvider('python', {
            provideRenameEdits: handleRenameRequest,
        });
    })
    .catch((error) => console.error('An error occurred during initialization of Monaco: ', error));

const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    fixedOverflowWidgets: true,
    tabCompletion: 'on',
    hover: { enabled: true },
    scrollBeyondLastLine: false,
    autoClosingOvertype: 'always',
    autoSurround: 'quotes',
    autoIndent: 'full',
    // The default settings prefer "Menlo", but "Monaco" looks better
    // for our purposes. Swap the order so Monaco is used if available.
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    showUnused: true,
    wordBasedSuggestions: false,
    overviewRulerLanes: 0,
    renderWhitespace: 'none',
    guides: {
        indentation: false,
    },
    renderLineHighlight: 'none',
};

interface RegisteredModel {
    model: monaco.editor.ITextModel;
    lspClient: LspClient;
}
const registeredModels: RegisteredModel[] = [];

export interface MonacoEditorProps {
    lspClient: LspClient;
    code: string;
    diagnostics: Diagnostic[];

    onUpdateCode: (code: string) => void;
}

export interface MonacoEditorRef {
    focus: () => void;
    selectRange: (range: Range) => void;
}

export const MonacoEditor = forwardRef(function MonacoEditor(
    props: MonacoEditorProps,
    ref: ForwardedRef<MonacoEditorRef>
) {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);

    function handleEditorDidMount(
        editor: monaco.editor.IStandaloneCodeEditor,
        monacoInstance: any
    ) {
        editorRef.current = editor;
        monacoRef.current = monacoInstance;

        editor.focus();
    }

    useImperativeHandle(ref, () => {
        return {
            focus: () => {
                const editor: monaco.editor.IStandaloneCodeEditor = editorRef.current;
                if (editor) {
                    editor.focus();
                }
            },
            selectRange: (range: Range) => {
                const editor: monaco.editor.IStandaloneCodeEditor = editorRef.current;
                if (editor) {
                    const monacoRange = convertRange(range);
                    editor.setSelection(monacoRange);
                    editor.revealLineInCenterIfOutsideViewport(monacoRange.startLineNumber);
                }
            },
        };
    });

    useEffect(() => {
        if (monacoRef?.current && editorRef?.current) {
            const model: monaco.editor.ITextModel = editorRef.current.getModel();
            setFileMarkers(monacoRef.current, model, props.diagnostics);

            // Register the editor and the LSP Client so they can be accessed
            // by the hover provider, etc.
            registerModel(model, props.lspClient);
        }
    }, [props.diagnostics]);

    return (
        <View style={styles.container}>
            <View style={styles.editor}>
                <Editor
                    options={options}
                    language={'python'}
                    value={props.code}
                    theme="vs"
                    onChange={(value) => {
                        props.onUpdateCode(value);
                    }}
                    onMount={handleEditorDidMount}
                />
            </View>
        </View>
    );
});

function setFileMarkers(
    monacoInstance: any,
    model: monaco.editor.ITextModel,
    diagnostics: Diagnostic[]
) {
    const markers: monaco.editor.IMarkerData[] = [];

    diagnostics.forEach((diag) => {
        const markerData: monaco.editor.IMarkerData = {
            ...convertRange(diag.range),
            severity: convertSeverity(diag.severity),
            message: diag.message,
        };

        if (diag.tags) {
            markerData.tags = diag.tags;
        }
        markers.push(markerData);
    });

    monacoInstance.editor.setModelMarkers(model, 'pyright', markers);
}

function convertSeverity(severity: DiagnosticSeverity): monaco.MarkerSeverity {
    switch (severity) {
        case DiagnosticSeverity.Error:
        default:
            return monaco.MarkerSeverity.Error;

        case DiagnosticSeverity.Warning:
            return monaco.MarkerSeverity.Warning;

        case DiagnosticSeverity.Information:
            return monaco.MarkerSeverity.Info;

        case DiagnosticSeverity.Hint:
            return monaco.MarkerSeverity.Hint;
    }
}

function convertRange(range: Range): monaco.IRange {
    return {
        startLineNumber: range.start.line + 1,
        startColumn: range.start.character + 1,
        endLineNumber: range.end.line + 1,
        endColumn: range.end.character + 1,
    };
}

async function handleHoverRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position
): Promise<monaco.languages.Hover> {
    const lspClient = getLspClientForModel(model);
    if (!lspClient) {
        return null;
    }

    try {
        const hoverInfo = await lspClient.getHoverForPosition(model.getValue(), {
            line: position.lineNumber - 1,
            character: position.column - 1,
        });

        return {
            contents: [
                {
                    value: hoverInfo.contents.value,
                },
            ],
            range: convertRange(hoverInfo.range),
        };
    } catch (err) {
        return null;
    }
}

async function handleRenameRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    newName: string
): Promise<monaco.languages.WorkspaceEdit> {
    const lspClient = getLspClientForModel(model);
    if (!lspClient) {
        return null;
    }

    try {
        const renameEdits = await lspClient.getRenameEditsForPosition(
            model.getValue(),
            {
                line: position.lineNumber - 1,
                character: position.column - 1,
            },
            newName
        );

        const edits: monaco.languages.IWorkspaceTextEdit[] = [];

        if (renameEdits?.documentChanges) {
            for (const docChange of renameEdits.documentChanges) {
                if (TextDocumentEdit.is(docChange)) {
                    for (const textEdit of docChange.edits) {
                        edits.push({
                            resource: model.uri,
                            versionId: undefined,
                            textEdit: {
                                range: convertRange(textEdit.range),
                                text: textEdit.newText,
                            },
                        });
                    }
                }
            }
        }

        return { edits };
    } catch (err) {
        return null;
    }
}

async function handleSignatureHelpRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position
): Promise<monaco.languages.SignatureHelpResult> {
    const lspClient = getLspClientForModel(model);
    if (!lspClient) {
        return null;
    }

    try {
        const sigInfo = await lspClient.getSignatureHelpForPosition(model.getValue(), {
            line: position.lineNumber - 1,
            character: position.column - 1,
        });

        return {
            value: {
                signatures: sigInfo.signatures.map((sig) => {
                    return {
                        label: sig.label,
                        documentation: sig.documentation,
                        parameters: sig.parameters,
                        activeParameter: sig.activeParameter,
                    };
                }),
                activeSignature: sigInfo.activeSignature,
                activeParameter: sigInfo.activeParameter,
            },
            dispose: () => {},
        };
    } catch (err) {
        return null;
    }
}

async function handleProvideCompletionRequest(
    model: monaco.editor.ITextModel,
    position: monaco.Position
): Promise<monaco.languages.CompletionList> {
    const lspClient = getLspClientForModel(model);
    if (!lspClient) {
        return null;
    }

    try {
        const completionInfo = await lspClient.getCompletionForPosition(model.getValue(), {
            line: position.lineNumber - 1,
            character: position.column - 1,
        });

        return {
            suggestions: completionInfo.items.map((item) => {
                return convertCompletionItem(item, model);
            }),
            incomplete: completionInfo.isIncomplete,
            dispose: () => {},
        };
    } catch (err) {
        return null;
    }
}

async function handleResolveCompletionRequest(
    item: monaco.languages.CompletionItem
): Promise<monaco.languages.CompletionItem> {
    const model = (item as any).model as monaco.editor.ITextModel | undefined;
    const original = (item as any).__original as CompletionItem | undefined;
    if (!model || !original) {
        return null;
    }

    const lspClient = getLspClientForModel(model);
    if (!lspClient) {
        return null;
    }

    try {
        const result = await lspClient.resolveCompletionItem(original);
        return convertCompletionItem(result);
    } catch (err) {
        return null;
    }
}

function convertCompletionItem(
    item: CompletionItem,
    model?: monaco.editor.ITextModel
): monaco.languages.CompletionItem {
    const converted: monaco.languages.CompletionItem = {
        label: item.label,
        kind: convertCompletionItemKind(item.kind),
        tags: item.tags,
        detail: item.detail,
        documentation: item.documentation,
        sortText: item.sortText,
        filterText: item.filterText,
        preselect: item.preselect,
        insertText: item.label,
        range: undefined,
    };

    if (item.textEdit) {
        converted.insertText = item.textEdit.newText;
        if (InsertReplaceEdit.is(item.textEdit)) {
            converted.range = {
                insert: convertRange(item.textEdit.insert),
                replace: convertRange(item.textEdit.replace),
            };
        } else {
            converted.range = convertRange(item.textEdit.range);
        }
    }

    if (item.additionalTextEdits) {
        converted.additionalTextEdits = item.additionalTextEdits.map((edit) => {
            return {
                range: convertRange(edit.range),
                text: edit.newText,
            };
        });
    }

    // Stash a few additional pieces of information.
    (converted as any).__original = item;
    if (model) {
        (converted as any).model = model;
    }

    return converted;
}

function convertCompletionItemKind(
    itemKind: CompletionItemKind
): monaco.languages.CompletionItemKind {
    switch (itemKind) {
        case CompletionItemKind.Constant:
            return monaco.languages.CompletionItemKind.Constant;

        case CompletionItemKind.Variable:
            return monaco.languages.CompletionItemKind.Variable;

        case CompletionItemKind.Function:
            return monaco.languages.CompletionItemKind.Function;

        case CompletionItemKind.Field:
            return monaco.languages.CompletionItemKind.Field;

        case CompletionItemKind.Keyword:
            return monaco.languages.CompletionItemKind.Keyword;

        default:
            return monaco.languages.CompletionItemKind.Reference;
    }
}

// Register an instantiated text model (which backs a monaco editor
// instance and its associated LSP client. This is a bit of a hack,
// but it's required to support the various providers (e.g. hover).
function registerModel(model: monaco.editor.ITextModel, lspClient: LspClient) {
    if (registeredModels.find((m) => m.model === model)) {
        return;
    }

    registeredModels.push({ model, lspClient });
}

function getLspClientForModel(model: monaco.editor.ITextModel): LspClient | undefined {
    return registeredModels.find((m) => m.model === model)?.lspClient;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 4,
    },
    editor: {
        position: 'absolute',
        height: '100%',
        width: '100%',
    },
});
