/*
 * Copyright (c) Eric Traut
 * Panel that displays a list of diagnostics.
 */

import Icon from '@expo/vector-icons/AntDesign';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver-types';
import { useHover } from './HoverHook';

export interface ProblemsPanelProps {
    diagnostics: Diagnostic[];
    onSelectRange: (range: Range) => void;
}

export function ProblemsPanel(props: ProblemsPanelProps) {
    // We don't display hints in the problems panel.
    const filteredDiagnostics = props.diagnostics.filter(
        (diag) => diag.severity !== DiagnosticSeverity.Hint
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.problemText} selectable={false}>
                    Problems
                </Text>
                <View style={styles.problemCountBubble}>
                    <Text style={styles.problemCountText} selectable={false}>
                        {filteredDiagnostics.length.toString()}
                    </Text>
                </View>
            </View>
            <ScrollView>
                {filteredDiagnostics.map((diag, index) => {
                    return (
                        <ProblemItem
                            key={index}
                            diagnostic={diag}
                            onSelectRange={props.onSelectRange}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}

function ProblemItem(props: { diagnostic: Diagnostic; onSelectRange: (range: Range) => void }) {
    const [hoverRef, isHovered] = useHover();

    return (
        <Pressable
            ref={hoverRef}
            style={[
                styles.diagnosticContainer,
                isHovered ? styles.problemContainerHover : undefined,
            ]}
            onPress={() => {
                props.onSelectRange(props.diagnostic.range);
            }}
        >
            <View style={styles.diagnosticIconContainer}>
                <ProblemIcon severity={props.diagnostic.severity} />
            </View>
            <div title={props.diagnostic.message}>
                <View style={styles.diagnosticTextContainer}>
                    <Text style={styles.diagnosticText}>
                        <Text>{props.diagnostic.message}</Text>
                        {props.diagnostic.code ? (
                            <Text
                                style={styles.diagnosticSourceText}
                            >{`  (${props.diagnostic.code})`}</Text>
                        ) : undefined}
                    </Text>
                </View>
            </div>
        </Pressable>
    );
}

function ProblemIcon(props: { severity: DiagnosticSeverity }) {
    let iconName: string;
    let iconColor: string;

    if (props.severity === DiagnosticSeverity.Warning) {
        iconName = 'warning';
        iconColor = '#b89500';
    } else if (props.severity === DiagnosticSeverity.Information) {
        iconName = 'infocirlceo';
        iconColor = 'blue';
    } else {
        iconName = 'closecircleo';
        iconColor = '#e51400';
    }

    return <Icon name={iconName as any} size={14} color={iconColor} />;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        height: 200,
        borderTopColor: '#ccc',
        borderTopWidth: 1,
        borderStyle: 'solid',
    },
    header: {
        height: 32,
        paddingHorizontal: 8,
        backgroundColor: '#336',
        flexDirection: 'row',
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    problemText: {
        marginBottom: 2,
        fontSize: 13,
        color: '#fff',
    },
    problemCountText: {
        fontSize: 9,
        color: 'black',
    },
    problemCountBubble: {
        marginLeft: 6,
        paddingHorizontal: 5,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    diagnosticContainer: {
        padding: 4,
        flexDirection: 'row',
    },
    problemContainerHover: {
        backgroundColor: '#eee',
    },
    diagnosticIconContainer: {
        marginRight: 8,
    },
    diagnosticTextContainer: {},
    diagnosticText: {
        fontSize: 13,
        lineHeight: 16,
    },
    diagnosticSourceText: {
        color: '#aaa',
    },
});
