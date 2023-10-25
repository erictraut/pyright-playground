/*
 * Copyright (c) Eric Traut
 * An "about this app" panel.
 */

import { StyleSheet, Text, View } from 'react-native';
import TextWithLink from './TextWithLink';

export function AboutPanel() {
    return (
        <View style={styles.container}>
            <Text style={styles.headerText} selectable={false}>
                {'USING THE PLAYGROUND'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {
                    'Type or paste Python code into the text editor, and Pyright will report any errors it finds.'
                }
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {' '}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {'Copy the URL from your browser to share the playground with others.'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {' '}
            </Text>
            <TextWithLink
                style={styles.aboutTextLink}
                url={'https://github.com/erictraut/pyright-playground'}
            >
                {'Pyright Playground GitHub site'}
            </TextWithLink>
            <Text style={styles.aboutText} selectable={false}>
                {' '}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.headerText} selectable={false}>
                {'PYRIGHT'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {'Pyright is an open-source standards-based static type checker for Python.'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {' '}
            </Text>
            <TextWithLink
                style={styles.aboutTextLink}
                url={'https://microsoft.github.io/pyright/#/'}
            >
                {'Pyright documentation'}
            </TextWithLink>
            <TextWithLink style={styles.aboutTextLink} url={'https://github.com/Microsoft/pyright'}>
                {'Pyright GitHub site'}
            </TextWithLink>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    headerText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    aboutTextLink: {
        marginLeft: 16,
        marginRight: 8,
        fontSize: 13,
        lineHeight: 24,
    },
    aboutText: {
        marginLeft: 16,
        marginRight: 8,
        fontSize: 13,
        color: '#333',
    },
    divider: {
        height: 1,
        borderTopWidth: 1,
        borderColor: '#eee',
        borderStyle: 'solid',
        marginBottom: 12,
    },
});
