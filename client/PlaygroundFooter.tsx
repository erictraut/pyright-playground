/*
 * Copyright (c) Eric Traut
 * Footer panel for playground web app.
 */

import { StyleSheet, View } from 'react-native';

export default function PlaygroundFooter() {
    return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
    container: {
        flex: -1,
        height: 40,
        backgroundColor: '#336',
        flexDirection: 'row',
        alignSelf: 'stretch',
    },
});
