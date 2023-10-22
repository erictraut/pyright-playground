/**
 * PlaygroundHeader.tsx
 * Copyright: Eric Traut 2023
 *
 * Header bar with embedded controls for the playground.
 */

import { StyleSheet, Text, View } from 'react-native';

export default function PlaygroundHeader() {
    return (
        <View style={styles.container}>
            <Text style={styles.titleText}>Pyright Playground</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: -1,
        padding: 12,
        alignSelf: 'stretch',
        justifyContent: 'center',
        backgroundColor: '#336',
        height: 48,
    },
    titleText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
