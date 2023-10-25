/*
 * Copyright (c) Eric Traut
 * A menu that displays a checkmark next to items.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { MenuItem } from './Menu';

export interface CheckmarkMenuProps {
    items: CheckmarkMenuItem[];
    onSelect: (item: CheckmarkMenuItem, index: number) => void;
}

export interface CheckmarkMenuItem {
    label: string;
    checked: boolean;
    title?: string;
    disabled?: boolean;
}

export function CheckmarkMenu(props: CheckmarkMenuProps) {
    return (
        <ScrollView style={styles.container}>
            {props.items.map((item, index) => {
                return (
                    <MenuItem
                        key={index}
                        iconName={item.checked ? 'check' : undefined}
                        label={item.label}
                        onSelect={() => props.onSelect(item, index)}
                        title={item.title}
                        disabled={item.disabled}
                    />
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        minWidth: 100,
        maxHeight: 300,
    },
});
