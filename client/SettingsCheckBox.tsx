/*
 * Copyright (c) Eric Traut
 * A simple check box (toggle) control used in the settings panel.
 */

import Icon from '@expo/vector-icons/AntDesign';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useHover } from './HoverHook';

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
                    <Icon
                        name={'check'}
                        size={14}
                        color={props.disabled ? '#aaa' : isHovered ? '#000' : '#333'}
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
        paddingHorizontal: 8,
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    checkbox: {
        width: 16,
        height: 16,
        borderColor: '#333',
        borderWidth: 1,
        borderStyle: 'solid',
    },
    checkboxDisabled: {
        borderColor: '#aaa',
    },
    checkboxHover: {
        borderColor: '#000',
    },
    checkboxText: {
        flex: -1,
        marginLeft: 8,
        fontSize: 12,
        color: '#333',
    },
    checkboxTextDisabled: {
        color: '#ccc',
    },
});
