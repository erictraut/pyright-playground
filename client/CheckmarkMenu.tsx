/*
 * Copyright (c) Eric Traut
 * A menu that displays a checkmark next to items.
 */

import * as icons from '@ant-design/icons-svg';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MenuItem } from './Menu';
import { createRef, useEffect, useState } from 'react';

export interface CheckmarkMenuProps {
    items: CheckmarkMenuItem[];
    onSelect: (item: CheckmarkMenuItem, index: number) => void;
    includeSearchBox?: boolean;
    fixedSize?: { width: number; height: number };
    onDismiss?: () => void;
}

export interface CheckmarkMenuItem {
    label: string;
    checked: boolean;
    title?: string;
    disabled?: boolean;
}

interface CheckmarkMenuState {
    searchFilter: string;
}

export function CheckmarkMenu(props: CheckmarkMenuProps) {
    const [state, setState] = useState<CheckmarkMenuState>({
        searchFilter: '',
    });
    const textInputRef = createRef<TextInput>();

    const searchFilter = state.searchFilter.toLowerCase().trim();
    const filteredItems = props.items.filter((item) => {
        return !searchFilter || item.label.toLowerCase().includes(searchFilter);
    });

    // We need to defer the focus until after the menu has been
    // rendered, measured, and placed in its final position.
    useEffect(() => {
        if (textInputRef.current) {
            setTimeout(() => {
                if (textInputRef.current) {
                    textInputRef.current.focus();
                }
            }, 100);
        }
    }, [textInputRef]);

    return (
        <View style={styles.contentContainer}>
            {props.includeSearchBox ? (
                <View style={styles.searchBoxContainer}>
                    <TextInput
                        ref={textInputRef}
                        style={styles.searchBox}
                        value={state.searchFilter}
                        placeholder={'Search'}
                        placeholderTextColor={'#ccc'}
                        onChangeText={(newValue) => {
                            setState((prevState) => {
                                return { ...prevState, searchFilter: newValue };
                            });
                        }}
                        onKeyPress={(event) => {
                            if (event.nativeEvent.key === 'Escape') {
                                if (props.onDismiss) {
                                    props.onDismiss();
                                }
                            }
                        }}
                        spellCheck={false}
                    />
                </View>
            ) : undefined}

            <ScrollView
                style={[styles.container, props.fixedSize ? { ...props.fixedSize } : undefined]}
            >
                {filteredItems.map((item, index) => {
                    return (
                        <MenuItem
                            key={index}
                            iconDefinition={item.checked ? icons.CheckOutlined : undefined}
                            label={item.label}
                            labelFilterText={searchFilter}
                            onSelect={() => props.onSelect(item, index)}
                            title={item.title}
                            disabled={item.disabled}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        minWidth: 100,
        maxHeight: 300,
    },
    contentContainer: {},
    searchBoxContainer: {
        paddingHorizontal: 4,
        paddingTop: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        borderStyle: 'solid',
    },
    searchBox: {
        fontSize: 13,
        padding: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'solid',
        backgroundColor: '#fff',
    },
});
