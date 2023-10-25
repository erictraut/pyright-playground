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
        displayName: 'Browser Default',
        code: '',
    },
    {
        displayName: 'Chinese (Simplified) - 中文（简体）',
        code: 'zh-cn',
    },
    {
        displayName: 'Chinese (Traditional) - 中文（繁體）',
        code: 'zh-tw',
    },
    {
        displayName: 'Czech - čeština',
        code: 'cs',
    },
    {
        displayName: 'English',
        code: 'en',
    },
    {
        displayName: 'English (US)',
        code: 'en-us',
    },
    {
        displayName: 'French - français',
        code: 'fr',
    },
    {
        displayName: 'German - Deutsch',
        code: 'de',
    },
    {
        displayName: 'Italian - italiano',
        code: 'it',
    },
    {
        displayName: 'Japanese - 日本語',
        code: 'ja',
    },
    {
        displayName: 'Korean - 한국어',
        code: 'ko',
    },
    {
        displayName: 'Polish - polski',
        code: 'pl',
    },
    {
        displayName: 'Spanish - español',
        code: 'es',
    },
    {
        displayName: 'Portuguese (Brazil)',
        code: 'pt-br',
    },
    {
        displayName: 'Russian - русский',
        code: 'ru',
    },
    {
        displayName: 'Turkish - Türkçe',
        code: 'tr',
    },
];

export function getLocaleDisplayName(code: string | undefined) {
    return supportedLocales.find((local) => local.code === code)?.displayName ?? '';
}
