/*
 * Copyright (c) Eric Traut
 * A list of supported locales (localized languages) supported by pyright.
 */

export interface LocalInfo {
    displayName: string;
    code: string;
}

export const supportedLocales: LocalInfo[] = [
    {
        displayName: 'Default',
        code: '',
    },
    {
        displayName: 'Czech',
        code: 'cs',
    },
    {
        displayName: 'German',
        code: 'de',
    },
    {
        displayName: 'English (US)',
        code: 'en-us',
    },
    {
        displayName: 'English',
        code: 'en',
    },
    {
        displayName: 'Spanish',
        code: 'es',
    },
    {
        displayName: 'French',
        code: 'fr',
    },
    {
        displayName: 'Italian',
        code: 'it',
    },
    {
        displayName: 'Japanese',
        code: 'ja',
    },
    {
        displayName: 'Korean',
        code: 'ko',
    },
    {
        displayName: 'Polish',
        code: 'pl',
    },
    {
        displayName: 'Portuguese (Brazil)',
        code: 'pt-br',
    },
    {
        displayName: 'Russian',
        code: 'ru',
    },
    {
        displayName: 'Turkish',
        code: 'tr',
    },
    {
        displayName: 'Chinese',
        code: 'zh-cn',
    },
    {
        displayName: 'Chinese (Taiwan)',
        code: 'zh-tw',
    },
];

export function getLocaleDisplayName(code: string | undefined) {
    return supportedLocales.find((local) => local.code === code)?.displayName ?? '';
}
