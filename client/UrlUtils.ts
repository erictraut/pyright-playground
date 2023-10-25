/*
 * Copyright (c) Eric Traut
 * Utility routines for reading and updating the URL in the browser.
 */

import { PlaygroundSettings, PlaygroundState } from './PlaygroundSettings';
import * as lzString from 'lz-string';
import { configSettingsMap } from './PyrightConfigSettings';

export function updateUrlFromState(state: PlaygroundState) {
    const { code, settings } = state;
    const url = new URL(window.location.href);

    // Delete all of the existing query parameters.
    url.searchParams.forEach((_, key) => {
        url.searchParams.delete(key);
    });

    if (settings.pyrightVersion) {
        url.searchParams.set('pyrightVersion', settings.pyrightVersion);
    }

    if (settings.pythonVersion) {
        url.searchParams.set('pythonVersion', settings.pythonVersion);
    }

    if (settings.pythonPlatform) {
        url.searchParams.set('pythonPlatform', settings.pythonPlatform);
    }

    if (settings.strictMode) {
        url.searchParams.set('strict', 'true');
    }

    if (settings.locale) {
        url.searchParams.set('locale', settings.locale);
    }

    Object.keys(settings.configOverrides).forEach((key) => {
        const value = settings.configOverrides[key];
        url.searchParams.set(key, value.toString());
    });

    if (code) {
        // Use compression for the code.
        const encodedCode = lzString.compressToEncodedURIComponent(code);
        url.searchParams.set('code', encodedCode);
    }

    history.replaceState(null, null, url.toString());
}

export function getStateFromUrl(): PlaygroundState | undefined {
    const url = new URL(window.location.href);

    const compressedCode = url.searchParams.get('code');
    if (!compressedCode) {
        return undefined;
    }
    const code = lzString.decompressFromEncodedURIComponent(compressedCode);
    if (!code) {
        return undefined;
    }

    const state: PlaygroundState = {
        code,
        settings: {
            configOverrides: {},
        },
    };

    url.searchParams.forEach((value, key) => {
        switch (key) {
            case 'strict': {
                if (Boolean(value)) {
                    state.settings.strictMode = true;
                }
                break;
            }

            case 'pyrightVersion': {
                state.settings.pyrightVersion = value;
                break;
            }

            case 'pythonVersion': {
                state.settings.pythonVersion = value;
                break;
            }

            case 'pythonPlatform': {
                state.settings.pythonPlatform = value;
                break;
            }

            case 'locale': {
                state.settings.locale = value;
                break;
            }

            default: {
                if (configSettingsMap.has(key)) {
                    state.settings.configOverrides[key] = Boolean(value);
                }
            }
        }
    });

    return state;
}
