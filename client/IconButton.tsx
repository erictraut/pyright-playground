/*
 * Copyright (c) Eric Traut
 * A button that displays an icon and handles press and hover events.
 */

import Icon from '@expo/vector-icons/AntDesign';
import {
    View,
    Pressable,
    StyleProp,
    StyleSheet,
    ViewStyle,
    GestureResponderEvent,
} from 'react-native';
import { useHover } from './HoverHook';

interface IconButtonProps {
    iconName: string;
    iconSize: number;
    disabled?: boolean;
    title?: string;
    color?: string;
    hoverColor?: string;
    disableColor?: string;
    backgroundStyle?: StyleProp<ViewStyle>;
    hoverBackgroundStyle?: StyleProp<ViewStyle>;
    onPress: (event: GestureResponderEvent) => void;
}

export default function IconButton({
    iconName,
    iconSize,
    disabled,
    color,
    hoverColor,
    disableColor,
    backgroundStyle,
    hoverBackgroundStyle,
    onPress,
}: IconButtonProps) {
    const [hoverRef, isHovered] = useHover();

    let effectiveColor: string | undefined;
    if (disabled) {
        effectiveColor = disableColor ?? '#ccc';
    } else if (isHovered) {
        effectiveColor = hoverColor ?? color;
    } else {
        effectiveColor = color;
    }

    return (
        <Pressable
            ref={hoverRef}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.defaultBackgroundStyle,
                disabled ? styles.disabled : undefined,
                backgroundStyle,
                isHovered ? hoverBackgroundStyle : undefined,
            ]}
        >
            <View style={styles.container}>
                <Icon name={iconName as any} size={iconSize} color={effectiveColor} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    defaultBackgroundStyle: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    container: {},
    disabled: {
        opacity: 1,
        cursor: 'default',
    },
});
