/*
 * Copyright (c) Eric Traut
 * Header bar with embedded controls for the playground.
 */

import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import IconButton from './IconButton';
import { useRef } from 'react';
import { Menu, MenuRef } from './Menu';
import TextWithLink from './TextWithLink';

const headerIconButtonSize = 20;

export default function HeaderPanel() {
    const [assets, error] = useAssets([require('./assets/pyright_bw.png')]);
    const aboutBoxPopup = useRef<MenuRef>(null);
    const settingsPopup = useRef<MenuRef>(null);
    const linkPopup = useRef<MenuRef>(null);

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
                {/* <IconButton
                    iconName="link"
                    iconSize={headerIconButtonSize}
                    color={'#fff'}
                    title={'Copy link to clipboard'}
                    onPress={() => {
                        // TODO - need to implement copy.
                        linkPopup.current?.open();
                    }}
                /> */}
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
                    <Text style={styles.aboutTextBold} selectable={false}>
                        {'Welcome to Pyright Playground'}
                    </Text>
                    <Text style={styles.aboutText} selectable={false}>
                        {' '}
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
                        {
                            'Pyright is an open-source standards-based static type checker for Python.'
                        }
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
                    <TextWithLink
                        style={styles.aboutTextLink}
                        url={'https://github.com/Microsoft/pyright'}
                    >
                        {'Pyright GitHub site'}
                    </TextWithLink>
                    <TextWithLink
                        style={styles.aboutTextLink}
                        url={'https://github.com/erictraut/pyright-playground'}
                    >
                        {'Pyright Playground GitHub site'}
                    </TextWithLink>
                </View>
            </Menu>
            <Menu ref={settingsPopup} name={'settingsBox'} isPopup={true}>
                <View style={[styles.popupContainer, styles.settingsBox]}>
                    <Text style={styles.aboutText}>{'Settings are currently unimplemented.'}</Text>
                </View>
            </Menu>
            <Menu ref={linkPopup} name={'copyLink'} isPopup={true}>
                <View style={[styles.popupContainer, styles.settingsBox]}>
                    <Text style={styles.aboutText}>
                        {'A permalink has been copied to your clipboard.'}
                    </Text>
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
        padding: 16,
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
    aboutTextLink: {
        fontSize: 14,
        color: 'blue',
        lineHeight: 20,
    },
    aboutText: {
        fontSize: 14,
    },
});
