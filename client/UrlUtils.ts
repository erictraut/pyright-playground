/*
 * Copyright (c) Eric Traut
 * Utility routines for reading and updating the URL in the browser.
 */

import * as lzString from 'lz-string';
import { TypeCheckingMode, PlaygroundState } from './PlaygroundSettings';
import { configSettingsMap } from './PyrightConfigSettings';

export function updateUrlFromState(state: PlaygroundState): string {
    const { code, settings } = state;
    const url = new URL(window.location.href);

    // Delete all of the existing query parameters.
    url.searchParams.forEach((_, key) => {
        url.searchParams.delete(key);
    });

    url.search = '';

    if (settings) {
        if (settings.pyrightVersion) {
            url.searchParams.set('pyrightVersion', settings.pyrightVersion);
        }

        if (settings.pythonVersion) {
            url.searchParams.set('pythonVersion', settings.pythonVersion);
        }

        if (settings.pythonPlatform) {
            url.searchParams.set('pythonPlatform', settings.pythonPlatform);
        }

        if (settings.typeCheckingMode) {
            url.searchParams.set('typeCheckingMode', settings.typeCheckingMode);
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
    }

    history.replaceState(null, null, url.toString());

    // Replace the domain name with the canonical one before
    // returning the shareable URL.
    url.host = 'basedpyright.com';
    url.protocol = 'https';
    url.port = '';
    return url.toString();
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
            typeCheckingMode: 'all'
        },
    };

    url.searchParams.forEach((value, key) => {
        switch (key) {
            case 'typeCheckingMode': {
                if (Boolean(value)) {
                    state.settings.typeCheckingMode = value as TypeCheckingMode;
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
