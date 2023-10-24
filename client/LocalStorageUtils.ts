/*
 * Copyright (c) Eric Traut
 * Utility functions for working with local storage.
 */

const localStorageKeyName = 'playgroundState';

export interface LocalStorageState {
    code: string;
}

export function getInitialStateFromLocalStorage(): LocalStorageState {
    const initialStateJson = getLocalStorageItem(localStorageKeyName);

    if (initialStateJson) {
        try {
            return JSON.parse(initialStateJson);
        } catch {
            // Fall through.
        }
    }

    return { code: '' };
}

export function setStateToLocalStorage(state: LocalStorageState) {
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
