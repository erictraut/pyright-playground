/*
 * Copyright (c) Eric Traut
 * Provides rendering of (and interaction with) a menu of options.
 */

import Icon from '@expo/vector-icons/SimpleLineIcons';
import React, { ForwardedRef, forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
    MenuOption,
    MenuOptions,
    MenuTrigger,
    Menu as RNMenu,
    renderers,
} from 'react-native-popup-menu';
import { useHover } from './HoverHook';

export const panelItemIconColor = '#0070f5';
export const panelTextColor = '#222';
export const focusedMenuItemBackgroundColor = '#eee';

export interface MenuProps extends React.PropsWithChildren {
    name: string;
    onOpen?: () => void;
    isPopup?: boolean;
}

export interface MenuRef {
    open: () => void;
    close: () => void;
}

export const Menu = forwardRef(function Menu(
    { name, children, onOpen, isPopup }: MenuProps,
    ref: ForwardedRef<MenuRef>
) {
    const menuRef = useRef<RNMenu>(null);

    useImperativeHandle(ref, () => {
        return {
            open: () => {
                menuRef.current?.open();
            },
            close: () => {
                menuRef.current?.close();
            },
        };
    });

    return (
        <RNMenu
            key={name}
            name={name}
            ref={menuRef}
            renderer={renderers.Popover}
            onOpen={onOpen}
            rendererProps={{ anchorStyle: { width: 0, height: 0, backgroundColor: 'transparent' } }}
        >
            <MenuTrigger />
            <MenuOptions
                customStyles={
                    isPopup
                        ? {
                              optionsContainer: {
                                  backgroundColor: 'transparent',
                                  shadowOpacity: 0,
                              },
                          }
                        : undefined
                }
            >
                <View style={styles.menuContainer}>{children}</View>
            </MenuOptions>
        </RNMenu>
    );
});

export interface MenuItemProps {
    label: string;
    iconName?: string;
    disabled?: boolean;
    focused?: boolean;
    onSelect?: () => void;
}

export function MenuItem({ label, disabled, onSelect, focused, iconName }: MenuItemProps) {
    const [hoverRef, isHovered] = useHover();

    let optionalIcon: JSX.Element | undefined;
    if (iconName) {
        optionalIcon = (
            <View style={styles.iconContainer}>
                <Icon name={iconName as any} size={14} color={panelItemIconColor} />
            </View>
        );
    }

    return (
        <MenuOption onSelect={onSelect} customStyles={{ optionWrapper: { padding: 0 } }}>
            <View
                style={[
                    styles.container,
                    focused || isHovered ? styles.focused : undefined,
                    disabled ? styles.disabled : undefined,
                ]}
                ref={hoverRef}
            >
                {optionalIcon}
                <Text style={styles.labelText} numberOfLines={1}>
                    {label}
                </Text>
            </View>
        </MenuOption>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 2,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 4,
        cursor: 'pointer',
    },
    disabled: {
        cursor: 'default',
        opacity: 0.5,
    },
    iconContainer: {
        marginLeft: 2,
        marginRight: 4,
    },
    labelText: {
        padding: 4,
        fontSize: 13,
        fontColor: panelTextColor,
    },
    focused: {
        backgroundColor: focusedMenuItemBackgroundColor,
    },
    menuContainer: {
        margin: 4,
    },
});
