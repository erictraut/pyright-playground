/*
 * Copyright (c) Eric Traut
 * A panel that displays settings for the app.
 */

import * as icons from '@ant-design/icons-svg';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckmarkMenu, CheckmarkMenuItem } from './CheckmarkMenu';
import IconButton from './IconButton';
import { getLocaleDisplayName, supportedLocales } from './Locales';
import { Menu, MenuRef } from './Menu';
import { PlaygroundSettings } from './PlaygroundSettings';
import PushButton from './PushButton';
import {
    PyrightConfigSetting,
    configSettings,
    configSettingsAlphabetized,
} from './PyrightConfigSettings';
import { SettingsCheckbox } from './SettingsCheckBox';

interface ConfigOptionWithValue {
    name: string;
    value: boolean;
}

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
    const localeMenuRef = useRef<MenuRef>(null);
    const configOverrides = getNonDefaultConfigOptions(props.settings);

    return (
        <View style={styles.container}>
            <SettingsHeader headerText={'Configuration Options'} />
            <SettingsCheckbox
                key={'strict'}
                label={'Strict'}
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

            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {configOverrides.length === 0 ? 'Default' : 'Custom'}
                </Text>
                <MenuButton
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
                        includeSearchBox={true}
                        fixedSize={{ width: 300, height: 400 }}
                        onDismiss={() => {
                            configOptionsMenuRef.current?.close();
                        }}
                    />
                </Menu>
            </View>
            <View style={styles.overridesContainer}>
                {configOverrides.map((config) => {
                    return (
                        <ConfigOverride
                            key={config.name}
                            config={config}
                            onRemove={() => {
                                const configOverrides = { ...props.settings.configOverrides };
                                delete configOverrides[config.name];

                                props.onUpdateSettings({
                                    ...props.settings,
                                    configOverrides,
                                });
                            }}
                        />
                    );
                })}
            </View>

            <SettingsDivider />
            <SettingsHeader headerText={'Pyright Version'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pyrightVersion ||
                        (props.latestPyrightVersion
                            ? `Latest (${props.latestPyrightVersion})`
                            : 'Latest')}
                </Text>
                <MenuButton
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
            <SettingsHeader headerText={'Python Version'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pythonVersion || 'Default (3.12)'}
                </Text>
                <MenuButton
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
            <SettingsHeader headerText={'Python Platform'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {props.settings.pythonPlatform || 'Default (All)'}
                </Text>
                <MenuButton
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
            <SettingsHeader headerText={'Language'} />
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedOptionText} selectable={false}>
                    {getLocaleDisplayName(props.settings.locale) || 'Browser Default'}
                </Text>
                <MenuButton
                    onPress={() => {
                        localeMenuRef.current?.open();
                    }}
                />
                <Menu name={'locale'} ref={localeMenuRef}>
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

function MenuButton(props: { onPress: () => void }) {
    return (
        <IconButton
            iconDefinition={icons.DownCircleOutlined}
            iconSize={18}
            color="#669"
            hoverColor="#336"
            onPress={props.onPress}
        />
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

interface ConfigOverrideProps {
    config: ConfigOptionWithValue;
    onRemove: () => void;
}

function ConfigOverride(props: ConfigOverrideProps) {
    const text = `${props.config.name}=${props.config.value.toString()}`;

    return (
        <View style={styles.configOverrideContainer}>
            <Text style={styles.configOverrideText} selectable={false} numberOfLines={1}>
                {text}
            </Text>
            <View style={{ marginTop: -4 }}>
                <IconButton
                    iconDefinition={icons.CloseOutlined}
                    iconSize={12}
                    color="#666"
                    hoverColor="#333"
                    onPress={props.onRemove}
                />
            </View>
        </View>
    );
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

function getNonDefaultConfigOptions(settings: PlaygroundSettings): ConfigOptionWithValue[] {
    const overrides: ConfigOptionWithValue[] = [];

    configSettingsAlphabetized.forEach((configInfo) => {
        // If strict mode is in effect, don't consider overrides if the
        // config option is always on in strict mode.
        if (settings.strictMode && configInfo.isEnabledInStrict) {
            return;
        }

        const defaultValue = configInfo.isEnabledInBasic;
        const overrideValue = settings.configOverrides[configInfo.name] ?? defaultValue;

        if (defaultValue !== overrideValue) {
            overrides.push({ name: configInfo.name, value: overrideValue });
        }
    });

    return overrides;
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
        fontSize: 14,
        color: '#666',
        fontVariant: ['small-caps'],
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
    overridesContainer: {
        flexDirection: 'column',
        marginTop: 4,
    },
    configOverrideContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    configOverrideText: {
        flex: -1,
        fontSize: 12,
        color: '#333',
    },
});
