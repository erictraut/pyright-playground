/*
 * Copyright (c) Eric Traut
 * Header bar with embedded controls for the playground.
 */

import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import IconButton from './IconButton';

const headerIconButtonSize = 20;

export default function HeaderPanel() {
    const [assets, error] = useAssets([require('./assets/pyright_bw.png')]);

    let image = null;
    if (!error && assets) {
        image = <Image style={styles.pyrightIcon} source={assets[0]} />;
    }

    return (
        <View style={styles.container}>
            {image}
            <Text style={styles.titleText} selectable={false}>
                Pyright Playground
            </Text>
            <View style={styles.controlsPanel}>
                <IconButton
                    iconName="setting"
                    iconSize={headerIconButtonSize}
                    color={'#fff'}
                    title={'Playground settings'}
                    onPress={() => {
                        // TODO
                    }}
                />
                <IconButton
                    iconName="github"
                    iconSize={headerIconButtonSize}
                    color={'#fff'}
                    title={'Go to GitHub repository'}
                    onPress={() => {
                        Linking.openURL('https://github.com/erictraut/pyright-playground');
                    }}
                />
                <IconButton
                    iconName="questioncircle"
                    iconSize={headerIconButtonSize}
                    color={'#fff'}
                    title={'About Pyright Playground'}
                    onPress={() => {
                        // TODO
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: -1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingBottom: 2,
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: '#336',
        height: 42,
    },
    pyrightIcon: {
        height: 24,
        width: 24,
        marginRight: 8,
    },
    titleText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    controlsPanel: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
