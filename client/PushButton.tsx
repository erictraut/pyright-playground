/*
 * Copyright (c) Eric Traut
 * A button that displays an icon and handles press and hover events.
 */

import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useHover } from './HoverHook';

interface PushButtonProps {
    label: string;
    disabled?: boolean;
    title?: string;
    backgroundStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle;
    hoverBackgroundStyle?: ViewStyle | ViewStyle[];
    hoverTextStyle?: TextStyle;
    onPress: () => void;
}

export default function PushButton(props: PushButtonProps) {
    const [hoverRef, isHovered] = useHover();

    let effectiveBackgroundStyle: (ViewStyle | ViewStyle[] | undefined)[] = [
        styles.defaultBackground,
        props.backgroundStyle,
    ];
    let effectiveTextStyle: (TextStyle | undefined)[] = [props.textStyle];

    if (props.disabled) {
        effectiveBackgroundStyle.push(styles.disabledBackground);
        effectiveTextStyle.push(styles.disabledText);
    } else if (isHovered) {
        effectiveBackgroundStyle.push(styles.defaultHoverBackground, props.hoverBackgroundStyle);
        effectiveTextStyle.push(props.hoverTextStyle);
    }

    return (
        <div title={props.title}>
            <Pressable
                ref={hoverRef}
                onPress={props.onPress}
                disabled={props.disabled}
                style={[styles.baseBackground, effectiveBackgroundStyle]}
            >
                <Text
                    style={[styles.baseText, effectiveTextStyle]}
                    selectable={false}
                    numberOfLines={1}
                >
                    {props.label}
                </Text>
            </Pressable>
        </div>
    );
}

const styles = StyleSheet.create({
    baseBackground: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#669',
    },
    defaultBackground: {
        backgroundColor: '#f8f8ff',
    },
    defaultHoverBackground: {
        backgroundColor: '#fff',
    },
    disabledBackground: {
        backgroundColor: 'transparent',
        borderColor: '#ccc',
    },
    disabledText: {
        color: '#ccc',
    },
    baseText: {
        //fontWeight: '600',
        color: '#333',
    },
});
