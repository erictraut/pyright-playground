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
    let effectiveTextStyle: (TextStyle | undefined)[] = [styles.defaultText, props.textStyle];

    if (props.disabled) {
        effectiveBackgroundStyle.push(styles.disabledBackground);
        effectiveTextStyle.push(styles.disabledText);
    } else if (isHovered) {
        effectiveBackgroundStyle.push(styles.defaultHoverBackground, props.hoverBackgroundStyle);
        effectiveTextStyle.push(styles.defaultHoverText, props.hoverTextStyle);
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
        borderRadius: 8,
    },
    defaultHoverBackground: {
        backgroundColor: '#336',
    },
    defaultBackground: {
        backgroundColor: '#669',
    },
    disabledBackground: {
        backgroundColor: '#C0C0D3',
    },
    disabledText: {
        color: '#eee',
    },
    baseText: {
        fontWeight: '600',
        color: 'white',
    },
    defaultHoverText: {},
    defaultText: {},
});
