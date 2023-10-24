/*
 * Copyright (c) Eric Traut
 * Collapsible panel that appears on the right side of the window.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import IconButton from './IconButton';
import { AboutPanel } from './AboutPanel';

export enum RightPanelType {
    None,
    About,
    Settings,
    Share,
}

export interface RightPanelProps {
    rightPanelDisplayed: RightPanelType;
    onShowRightPanel: (rightPanelToDisplay: RightPanelType) => void;
}
const rightPanelWidth = 350;

export function RightPanel({ rightPanelDisplayed, onShowRightPanel }: RightPanelProps) {
    let panelContents: JSX.Element | undefined;
    let headerTitle = '';

    switch (rightPanelDisplayed) {
        case RightPanelType.About:
            panelContents = <AboutPanel />;
            headerTitle = 'Using Pyright Playground';
            break;

        case RightPanelType.Settings:
            panelContents = <View />;
            headerTitle = 'Playground Settings';
            break;

        case RightPanelType.Share:
            headerTitle = 'Share Link';
            panelContents = <View />;
            break;
    }

    // Animate the appearance or disappearance of the right panel.
    const widthAnimation = useRef(new Animated.Value(panelContents ? rightPanelWidth : 0)).current;

    useEffect(() => {
        Animated.timing(widthAnimation, {
            toValue: panelContents ? rightPanelWidth : 0,
            duration: 250,
            useNativeDriver: false,
            easing: Easing.ease,
        }).start();
    }, [widthAnimation, rightPanelDisplayed]);

    return (
        <Animated.View style={[styles.animatedContainer, { width: widthAnimation }]}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitleText} selectable={false}>
                        {headerTitle}
                    </Text>
                    <View style={styles.headerControlsContainer}>
                        <IconButton
                            iconName="close"
                            iconSize={14}
                            color={'#333'}
                            hoverColor={'#000'}
                            title={'Close panel'}
                            onPress={() => {
                                onShowRightPanel(RightPanelType.None);
                            }}
                        />
                    </View>
                </View>
                <View style={styles.contentContainer}>{panelContents}</View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    animatedContainer: {
        position: 'relative',
    },
    container: {
        flex: 1,
        width: rightPanelWidth,
        alignSelf: 'stretch',
        backgroundColor: '#f8f8ff',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
    headerContainer: {
        flexDirection: 'row',
        height: 36,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ddd',
        paddingHorizontal: 8,
    },
    headerTitleText: {
        color: '#333',
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerControlsContainer: {
        flex: 1,
        paddingTop: 2,
        alignItems: 'flex-end',
    },
});
