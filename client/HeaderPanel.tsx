/*
 * Copyright (c) Eric Traut
 * Header bar with embedded controls for the playground.
 */

import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import IconButton from './IconButton';
import { useRef, useState } from 'react';
import { Menu, MenuRef } from './Menu';

const headerIconButtonSize = 20;

export default function HeaderPanel() {
    const [assets, error] = useAssets([require('./assets/pyright_bw.png')]);
    const aboutBoxPopup = useRef<MenuRef>(null);
    const settingsPopup = useRef<MenuRef>(null);

    let image = null;
    if (!error && assets) {
        image = <Image style={styles.pyrightIcon} source={assets[0]} />;
    }

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => {
                    Linking.openURL('https://github.com/microsoft/pyright');
                }}
            >
                {image}
            </Pressable>
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
                        settingsPopup.current?.open();
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
                        aboutBoxPopup.current?.open();
                    }}
                />
            </View>
            <Menu ref={aboutBoxPopup} name={'aboutBox'} isPopup={true}>
                <View style={[styles.popupContainer, styles.aboutBox]}>
                    <Text style={styles.aboutText}>
                        {'Type or paste Python code into the text editor, and Pyright (a static ' +
                            'type checker for Python) will report any errors it finds.'}
                    </Text>
                </View>
            </Menu>
            <Menu ref={settingsPopup} name={'settingsBox'} isPopup={true}>
                <View style={[styles.popupContainer, styles.settingsBox]}>
                    <Text style={styles.aboutText}>{'Settings are currently unimplemented.'}</Text>
                </View>
            </Menu>
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
    popupContainer: {
        backgroundColor: 'white',
        flex: 0,
        borderRadius: 4,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ccc',
        padding: 8,
    },
    aboutBox: {
        minWidth: 300,
        maxWidth: 400,
    },
    settingsBox: {
        minWidth: 300,
        maxWidth: 600,
    },
    aboutTextBold: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    aboutText: {
        fontSize: 14,
    },
});
