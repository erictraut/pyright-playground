/*
 * Copyright (c) Eric Traut
 * A panel that displays settings for the app.
 */

import { StyleSheet, Text, View } from 'react-native';
import { SettingsCheckbox } from './SettingsCheckBox';
import { PlaygroundSettings } from './PlaygroundSettings';
import {
    PyrightConfigSetting,
    configSettings,
    configSettingsAlphabetized,
} from './PyrightConfigSettings';
import PushButton from './PushButton';
import IconButton from './IconButton';
import { CheckmarkMenu, CheckmarkMenuItem } from './CheckmarkMenu';
import { useRef } from 'react';
import { Menu, MenuItemProps, MenuRef } from './Menu';
import { getLocaleDisplayName, supportedLocales } from './Locales';

export interface SettingsPanelProps {
    settings: PlaygroundSettings;
    latestPyrightVersion?: string;
    supportedPyrightVersions?: string[];
    onUpdateSettings: (settings: PlaygroundSettings) => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
    const configOptionsMenuRef = useRef<MenuRef>(null);
    const pyrightVersionMenuRef = useRef<MenuRef>(null);
    const pythonVersionMenuRef = useRef<MenuRef>(null);
    const pythonPlatformMenuRef = useRef<MenuRef>(null);
    const localMenuRef = useRef<MenuRef>(null);

    return (
        <View style={styles.container}>
            <SettingsHeader headerText={'CONFIGURATION OPTIONS'} />
            <SettingsCheckbox
                key={'strict'}
                label={'Strict Mode'}
                title={'Enable set of strict type checking options'}
                disabled={false}
                value={!!props.settings.strictMode}
                onChange={() => {
                    props.onUpdateSettings({
                        ...props.settings,
                        strictMode: !props.settings.strictMode,
                    });
                }}
            />
            {/* {configSettingsAlphabetized.map((setting) => {
                const isEnabled = !!props.settings.configOverrides[setting.name];
                return (
                    <SettingsCheckbox
                        key={setting.name}
                        label={setting.name}
                        title={setting.description}
                        disabled={setting.isEnabledInStrict && props.settings.strictMode}
                        value={
                            isEnabled || (setting.isEnabledInStrict && props.settings.strictMode)
                        }
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
            })} */}

            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {getConfigOptionsSummary(props.settings)}
                </Text>
                <IconButton
                    iconName="downcircleo"
                    iconSize={16}
                    color="#669"
                    hoverColor="#336"
                    onPress={() => {
                        configOptionsMenuRef.current?.open();
                    }}
                />
                <Menu name={'configOptions'} ref={configOptionsMenuRef}>
                    <CheckmarkMenu
                        items={configSettingsAlphabetized.map((item) => {
                            return getConfigOptionMenuItem(props.settings, item);
                        })}
                        onSelect={(item) => {
                            props.onUpdateSettings(toggleConfigOption(props.settings, item.label));
                        }}
                    />
                </Menu>
            </View>

            <SettingsDivider />
            <SettingsHeader headerText={'PYRIGHT VERSION'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pyrightVersion ||
                        (props.latestPyrightVersion
                            ? `Latest (${props.latestPyrightVersion})`
                            : 'Latest')}
                </Text>
                <IconButton
                    iconName="downcircleo"
                    iconSize={16}
                    color="#669"
                    hoverColor="#336"
                    onPress={() => {
                        pyrightVersionMenuRef.current?.open();
                    }}
                />
                <Menu name={'pyrightVersion'} ref={pyrightVersionMenuRef}>
                    <CheckmarkMenu
                        items={['Latest', ...(props.supportedPyrightVersions ?? [])].map((item) => {
                            return {
                                label: item,
                                checked: item === (props.settings.pyrightVersion ?? 'Latest'),
                            };
                        })}
                        onSelect={(item, index) => {
                            props.onUpdateSettings({
                                ...props.settings,
                                pyrightVersion: index > 0 ? item.label : undefined,
                            });
                        }}
                    />
                </Menu>
            </View>

            <SettingsDivider />
            <SettingsHeader headerText={'PYTHON VERSION'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pythonVersion || 'Default (3.12)'}
                </Text>
                <IconButton
                    iconName="downcircleo"
                    iconSize={16}
                    color="#669"
                    hoverColor="#336"
                    onPress={() => {
                        pythonVersionMenuRef.current?.open();
                    }}
                />
                <Menu name={'pythonVersion'} ref={pythonVersionMenuRef}>
                    <CheckmarkMenu
                        items={[
                            'Default',
                            '3.13',
                            '3.12',
                            '3.11',
                            '3.10',
                            '3.9',
                            '3.8',
                            '3.7',
                            '3.6',
                        ].map((item) => {
                            return {
                                label: item,
                                checked: item === (props.settings.pythonVersion ?? 'Default'),
                            };
                        })}
                        onSelect={(item, index) => {
                            props.onUpdateSettings({
                                ...props.settings,
                                pythonVersion: index > 0 ? item.label : undefined,
                            });
                        }}
                    />
                </Menu>
            </View>

            <SettingsDivider />
            <SettingsHeader headerText={'PYTHON PLATFORM'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pythonPlatform || 'Default (All)'}
                </Text>
                <IconButton
                    iconName="downcircleo"
                    iconSize={16}
                    color="#669"
                    hoverColor="#336"
                    onPress={() => {
                        pythonPlatformMenuRef.current?.open();
                    }}
                />
                <Menu name={'pythonPlatform'} ref={pythonPlatformMenuRef}>
                    <CheckmarkMenu
                        items={['All', 'Linux', 'Darwin', 'Windows'].map((item) => {
                            return {
                                label: item,
                                checked: item === (props.settings.pythonPlatform ?? 'All'),
                            };
                        })}
                        onSelect={(item, index) => {
                            props.onUpdateSettings({
                                ...props.settings,
                                pythonPlatform: index > 0 ? item.label : undefined,
                            });
                        }}
                    />
                </Menu>
            </View>

            <SettingsDivider />
            <SettingsHeader headerText={'LOCALE'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {getLocaleDisplayName(props.settings.locale) || 'Default'}
                </Text>
                <IconButton
                    iconName="downcircleo"
                    iconSize={16}
                    color="#669"
                    hoverColor="#336"
                    onPress={() => {
                        localMenuRef.current?.open();
                    }}
                />
                <Menu name={'locale'} ref={localMenuRef}>
                    <CheckmarkMenu
                        items={supportedLocales.map((locale) => {
                            return {
                                label: locale.displayName,
                                checked: locale.code === (props.settings.locale ?? ''),
                            };
                        })}
                        onSelect={(item, index) => {
                            props.onUpdateSettings({
                                ...props.settings,
                                locale: index > 0 ? supportedLocales[index].code : undefined,
                            });
                        }}
                    />
                </Menu>
            </View>

            <SettingsDivider />
            <View style={styles.resetButtonContainer}>
                <PushButton
                    label={'Restore Defaults'}
                    title={'Reset all settings to their default values'}
                    disabled={areSettingsDefault(props.settings)}
                    onPress={() => {
                        props.onUpdateSettings({
                            configOverrides: {},
                        });
                    }}
                />
            </View>
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

function areSettingsDefault(settings: PlaygroundSettings): boolean {
    return (
        Object.keys(settings.configOverrides).length === 0 &&
        !settings.strictMode &&
        settings.pyrightVersion === undefined &&
        settings.pythonVersion === undefined &&
        settings.pythonPlatform === undefined &&
        settings.locale === undefined
    );
}

function getConfigOptionsSummary(settings: PlaygroundSettings): string {
    // TODO - need to implement
    return 'Default';
}

function getConfigOptionMenuItem(
    settings: PlaygroundSettings,
    config: PyrightConfigSetting
): CheckmarkMenuItem {
    const isEnabled = settings.configOverrides[config.name] ?? config.isEnabledInBasic;

    return {
        label: config.name,
        checked: isEnabled || (config.isEnabledInStrict && settings.strictMode),
        disabled: config.isEnabledInStrict && settings.strictMode,
        title: config.description,
    };
}

function toggleConfigOption(settings: PlaygroundSettings, optionName: string): PlaygroundSettings {
    const configOverrides = { ...settings.configOverrides };
    const configInfo = configSettings.find((s) => s.name === optionName);
    const isEnabledByDefault = configInfo?.isEnabledInBasic;
    const isEnabled = configOverrides[optionName] ?? isEnabledByDefault;

    if (isEnabledByDefault === !isEnabled) {
        // If the new value matches the default value, delete it
        // to restore the default.
        delete configOverrides[optionName];
    } else {
        configOverrides[optionName] = !isEnabled;
    }

    return { ...settings, configOverrides };
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
        fontSize: 13,
        color: '#666',
    },
    resetButtonContainer: {
        alignSelf: 'center',
        marginTop: 4,
        marginHorizontal: 8,
    },
    selectionContainer: {
        height: 24,
        paddingTop: 6,
        paddingBottom: 2,
        paddingHorizontal: 16,
        alignItems: 'center',
        flexDirection: 'row',
    },
    selectedOptionText: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
});
