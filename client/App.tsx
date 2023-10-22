/**
 * App.tsx
 * Copyright: Eric Traut 2023
 *
 * Main UI for Pyright Playground web app.
 */

import { StyleSheet, View } from 'react-native';
import { MonacoEditor } from './MonacoEditor';
import PlaygroundFooter from './PlaygroundFooter';
import PlaygroundHeader from './PlaygroundHeader';

export default function App() {
    return (
        <View style={styles.container}>
            <PlaygroundHeader />
            <MonacoEditor />
            <PlaygroundFooter />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
});
