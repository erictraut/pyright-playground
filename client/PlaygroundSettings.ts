/*
 * Copyright (c) Eric Traut
 * Interface that defines the settings for the pyright playground.
 */

export type TypeCheckingMode = 'standard' | 'strict' | 'all'

export interface PlaygroundSettings {
    typeCheckingMode: TypeCheckingMode;
    configOverrides: { [name: string]: boolean };
    pyrightVersion?: string;
    pythonVersion?: string;
    pythonPlatform?: string;
    locale?: string;
}

export interface PlaygroundState {
    code: string;
    settings: PlaygroundSettings;
}
