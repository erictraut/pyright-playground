/*
 * Copyright (c) Eric Traut
 * Wrapper interface around the monaco editor component. This class
 * handles language server interactions, the display of errors, etc.
 */

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver-types';

loader
    .init()
    .then((monaco) => {
        monaco.languages.registerHoverProvider('python', {
            provideHover: (model, position) => {
                const wordInfo = model.getWordAtPosition(position);

                return {
                    range: new monaco.Range(
                        position.lineNumber,
                        position.lineNumber,
                        wordInfo.startColumn,
                        wordInfo.endColumn
                    ),
                    contents: [{ value: wordInfo.word }],
                };
            },
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
};

export interface MonacoEditorProps {
    code: string;
    diagnostics: Diagnostic[];
    onUpdateCode: (code: string) => void;
}

export function MonacoEditor(props: MonacoEditorProps) {
    const editorRef = useRef(null);
    function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
        editorRef.current = editor;
    }

    useEffect(() => {
        if (editorRef?.current) {
            setFileMarkers(editorRef.current, props.diagnostics);
        }
    }, [props.diagnostics]);

    return (
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
    );
}

function setFileMarkers(editor: monaco.editor.IStandaloneCodeEditor, diagnostics: Diagnostic[]) {
    const markers: monaco.editor.IMarkerData[] = [];

    diagnostics.forEach((diag) => {
        const markerData: monaco.editor.IMarkerData = {
            ...convertRange(diag.range),
            severity: convertSeverity(diag.severity),
            message: diag.message,
            source: 'pyright',
        };

        if (diag.tags) {
            markerData.tags = diag.tags;
        }
        markers.push(markerData);
    });

    monaco.editor.setModelMarkers(editor.getModel(), 'pyright', markers);
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

const styles = StyleSheet.create({
    editor: {
        flex: 1,
        marginVertical: 4,
        width: '100%',
    },
});
