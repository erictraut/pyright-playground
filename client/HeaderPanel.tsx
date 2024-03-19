/*
 * Copyright (c) Eric Traut
 * Header bar with embedded controls for the playground.
 */

import * as icons from '@ant-design/icons-svg';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import IconButton from './IconButton';
import { RightPanelType } from './RightPanel';

const headerIconButtonSize = 20;

export interface HeaderPanelProps {
    isRightPanelDisplayed: boolean;
    rightPanelType: RightPanelType;
    onShowRightPanel: (rightPanelType?: RightPanelType) => void;
}

export function HeaderPanel(props: HeaderPanelProps) {
    const [assets, error] = useAssets([require('./assets/pyright_bw.png')]);

    let image = null;
    if (!error && assets) {
        image = <Image style={styles.pyrightIcon} source={assets[0]} />;
    } else {
        image = <View style={styles.pyrightIcon} />;
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
                BasedPyright Playground
            </Text>
            <View style={styles.controlsPanel}>
                <IconButton
                    iconDefinition={icons.SettingOutlined}
                    iconSize={headerIconButtonSize}
                    disabled={
                        props.isRightPanelDisplayed &&
                        props.rightPanelType === RightPanelType.Settings
                    }
                    color={'#fff'}
                    hoverColor={'#eee'}
                    disableColor={'#669'}
                    title={'Playground settings'}
                    onPress={() => {
                        props.onShowRightPanel(RightPanelType.Settings);
                    }}
                />
                <IconButton
                    iconDefinition={icons.QuestionCircleOutlined}
                    iconSize={headerIconButtonSize}
                    disabled={
                        props.isRightPanelDisplayed && props.rightPanelType === RightPanelType.About
                    }
                    color={'#fff'}
                    hoverColor={'#eee'}
                    disableColor={'#669'}
                    title={'About BasedPyright Playground'}
                    onPress={() => {
                        props.onShowRightPanel(RightPanelType.About);
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
        fontVariant: ['small-caps'],
    },
    controlsPanel: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
