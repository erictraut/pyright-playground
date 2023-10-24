/*
 * Copyright (c) Eric Traut
 * A panel that displays settings for the app.
 */

import { StyleSheet, Text, View } from 'react-native';
import { SettingsCheckbox } from './SettingsCheckBox';
import { PlaygroundSettings } from './PlaygroundSettings';
import { configSettings } from './PyrightConfigSettings';

export interface SettingsPanelProps {
    settings: PlaygroundSettings;
    onUpdateSettings: (settings: PlaygroundSettings) => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
    return (
        <View style={styles.container}>
            <SettingsHeader headerText={'CONFIGURATION OPTIONS'} />
            <SettingsCheckbox
                key={'strict'}
                label={'strict'}
                title={'Enable set of stricter type checking options'}
                disabled={false}
                value={!!props.settings.strictMode}
                onChange={() => {
                    props.onUpdateSettings({
                        ...props.settings,
                        strictMode: !props.settings.strictMode,
                    });
                }}
            />
            {configSettings.map((setting) => {
                const isEnabled = !!props.settings.configOverrides[setting.name];
                return (
                    <SettingsCheckbox
                        key={setting.name}
                        label={setting.name}
                        title={setting.description}
                        disabled={false}
                        value={isEnabled}
                        onChange={() => {
                            props.onUpdateSettings({
                                ...props.settings,
                                configOverrides: {
                                    ...props.settings.configOverrides,
                                    [setting.name]: !isEnabled,
                                },
                            });
                        }}
                    />
                );
            })}
            <SettingsDivider />
            <SettingsHeader headerText={'PYRIGHT VERSION'} />
            <ComingSoon />
            <SettingsDivider />
            <SettingsHeader headerText={'PYTHON VERSION'} />
            <ComingSoon />
            <SettingsDivider />
            <SettingsHeader headerText={'PYTHON PLATFORM'} />
            <ComingSoon />
            <SettingsDivider />
            <SettingsHeader headerText={'LANGUAGE'} />
            <ComingSoon />
        </View>
    );
}

function SettingsHeader(props: { headerText: string }) {
    return (
        <View style={styles.headerTextBox}>
            <Text style={styles.headerText} selectable={false}>
                {props.headerText}
            </Text>
        </View>
    );
}

function SettingsDivider() {
    return <View style={styles.divider} />;
}

function ComingSoon() {
    return (
        <Text style={styles.comingSoonText} selectable={false}>
            Coming soon
        </Text>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    divider: {
        height: 1,
        borderTopWidth: 1,
        borderColor: '#eee',
        borderStyle: 'solid',
        marginVertical: 8,
    },
    headerTextBox: {
        marginBottom: 4,
    },
    headerText: {
        fontSize: 12,
        color: '#666',
    },
    comingSoonText: {
        fontSize: 12,
        margin: 8,
        color: '#aaa',
    },
});
