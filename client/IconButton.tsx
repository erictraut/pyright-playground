/*
 * Copyright (c) Eric Traut
 * A button that displays an icon and handles press and hover events.
 */

import { IconDefinition } from '@ant-design/icons-svg/lib/types';
import { GestureResponderEvent, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useHover } from './HoverHook';
import { SvgIcon } from './SvgIcon';

interface IconButtonProps {
    iconDefinition: IconDefinition;
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

export default function IconButton(props: IconButtonProps) {
    const [hoverRef, isHovered] = useHover();

    let effectiveColor: string | undefined;
    if (props.disabled) {
        effectiveColor = props.disableColor ?? '#ccc';
    } else if (isHovered) {
        effectiveColor = props.hoverColor ?? props.color;
    } else {
        effectiveColor = props.color;
    }

    return (
        <div title={props.title}>
            <Pressable
                ref={hoverRef}
                onPress={props.onPress}
                disabled={props.disabled}
                style={[
                    styles.defaultBackgroundStyle,
                    props.disabled ? styles.disabled : undefined,
                    props.backgroundStyle,
                    isHovered ? props.hoverBackgroundStyle : undefined,
                ]}
            >
                <SvgIcon
                    iconDefinition={props.iconDefinition}
                    iconSize={props.iconSize}
                    color={effectiveColor}
                />
            </Pressable>
        </div>
    );
}

const styles = StyleSheet.create({
    defaultBackgroundStyle: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    disabled: {
        opacity: 1,
        cursor: 'default',
    },
});
