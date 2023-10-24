/*
 * Copyright (c) Eric Traut
 * Utility functions for working with local storage.
 */

export function getLocalStorageItem(key: string): string | undefined {
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

export function setLocalStorageItem(key: string, value: string | undefined) {
    try {
        if (value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch {}
}
