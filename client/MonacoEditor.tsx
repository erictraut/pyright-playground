/**
 * MonacoEditor.tsx
 * Copyright: Eric Traut 2023
 *
 * Wrapper interface around the monaco editor component. This class
 * handles language server interactions, the display of errors, etc.
 */

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { FC, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

export const MonacoEditor: FC = () => {
    const monacoEl = useRef(null);

    const options: monaco.editor.IStandaloneEditorConstructionOptions = {
        selectOnLineNumbers: true,
        minimap: {
            enabled: false,
        },
        fixedOverflowWidgets: true,
        tabCompletion: 'on',
        hover: {
            enabled: true,
        },
        scrollBeyondLastLine: false,
        autoClosingOvertype: 'always',
        autoSurround: 'quotes',
        autoIndent: 'full',
        // The default settings prefer "Menlo", but "Monaco" looks better
        // for our purposes. Swap the order so Monaco is used if available.
        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        showUnused: true,
        wordBasedSuggestions: false,
        theme: 'vs',
    };

    return (
        <View style={styles.editor} ref={monacoEl}>
            <Editor options={options} defaultLanguage={'python'} />
        </View>
    );
};

const styles = StyleSheet.create({
    editor: {
        flex: 1,
        marginVertical: 4,
        width: '100%',
    },
});
