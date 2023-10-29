/*
 * Copyright (c) Eric Traut
 * A simple check box (toggle) control used in the settings panel.
 */

import * as icons from '@ant-design/icons-svg';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useHover } from './HoverHook';
import { SvgIcon } from './SvgIcon';

export interface SettingsCheckboxProps {
    label: string;
    title: string;
    value: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}

export function SettingsCheckbox(props: SettingsCheckboxProps) {
    const [hoverRef, isHovered] = useHover();

    return (
        <Pressable
            key={props.label}
            ref={hoverRef}
            style={styles.container}
            onPress={() => {
                props.onChange(!props.value);
            }}
            disabled={props.disabled}
        >
            <View
                style={[
                    styles.checkbox,
                    props.disabled ? styles.checkboxDisabled : undefined,
                    !props.disabled && isHovered ? styles.checkboxHover : undefined,
                ]}
            >
                {props.value ? (
                    <SvgIcon
                        iconDefinition={icons.CheckOutlined}
                        iconSize={12}
                        color={props.disabled ? '#aaa' : '#669'}
                    />
                ) : undefined}
            </View>
            <div title={props.title}>
                <Text
                    style={[
                        styles.checkboxText,
                        props.disabled ? styles.checkboxTextDisabled : undefined,
                    ]}
                    selectable={false}
                >
                    {props.label}
                </Text>
            </div>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 16,
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    checkbox: {
        width: 16,
        height: 16,
        paddingVertical: 1,
        paddingHorizontal: 1,
        borderColor: '#333',
        borderWidth: 1,
        borderStyle: 'solid',
    },
    checkboxDisabled: {
        borderColor: '#aaa',
    },
    checkboxHover: {
        backgroundColor: '#fff',
    },
    checkboxText: {
        flex: -1,
        marginLeft: 8,
        fontSize: 13,
        color: '#333',
    },
    checkboxTextDisabled: {
        color: '#ccc',
    },
});
