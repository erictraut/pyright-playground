/*
 * Copyright (c) Eric Traut
 * An "about this app" panel.
 */

import { StyleSheet, Text, View } from 'react-native';
import TextWithLink from './TextWithLink';

export function AboutPanel() {
    return (
        <View style={styles.container}>
            <Text style={styles.aboutText} selectable={false}>
                {
                    'Type or paste Python code into the text editor, and Pyright will report any errors it finds.'
                }
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {' '}
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
            <TextWithLink
                style={styles.aboutTextLink}
                url={'https://github.com/erictraut/pyright-playground'}
            >
                {'Pyright Playground GitHub site'}
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
    aboutTextLink: {
        fontSize: 14,
        color: 'blue',
        lineHeight: 24,
    },
    aboutText: {
        fontSize: 14,
        color: '#333',
    },
});
