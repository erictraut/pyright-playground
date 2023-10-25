/*
 * Copyright (c) Eric Traut
 * Utility functions for working with local storage.
 */

import { PlaygroundState } from './PlaygroundSettings';

const localStorageKeyName = 'playgroundState';

export function getInitialStateFromLocalStorage(): PlaygroundState {
    const initialStateJson = getLocalStorageItem(localStorageKeyName);

    if (initialStateJson) {
        try {
            const result = JSON.parse(initialStateJson);
            if (result.code !== undefined && result.settings !== undefined) {
                return result;
            }
        } catch {
            // Fall through.
        }
    }

    return { code: '', settings: { configOverrides: {} } };
}

export function setStateToLocalStorage(state: PlaygroundState) {
    setLocalStorageItem(localStorageKeyName, JSON.stringify(state));
}

function getLocalStorageItem(key: string): string | undefined {
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

function setLocalStorageItem(key: string, value: string | undefined) {
    try {
        if (value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch {}
}
