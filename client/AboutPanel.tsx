/*
 * Copyright (c) Eric Traut
 * An "about this app" panel.
 */

import { StyleSheet, Text, View } from 'react-native';
import TextWithLink from './TextWithLink';
import IconButton from './IconButton';
import { useState } from 'react';

export interface AboutPanelProps {
    code: string;
    getShareableUrl: () => string;
}

export function AboutPanel(props: AboutPanelProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.headerText} selectable={false}>
                {'Using the Playground'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {
                    'Type or paste Python code into the text editor, and Pyright will report any errors it finds.'
                }
            </Text>
            <TextWithLink
                style={styles.aboutTextLink}
                url={'https://github.com/erictraut/pyright-playground'}
            >
                {'Pyright Playground GitHub site'}
            </TextWithLink>

            <View style={styles.divider} />
            <Text style={styles.headerText} selectable={false}>
                {'Sharing a Code Sample'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {'Copy a link or markdown to the clipboard.'}
            </Text>
            <CopyToClipboardButton
                label={'Shareable link'}
                title={'Copy shareable link to clipboard'}
                getTextToCopy={() => {
                    return props.getShareableUrl();
                }}
            />
            <CopyToClipboardButton
                label={'Markdown with link'}
                title={'Copy markdown to clipboard'}
                getTextToCopy={() => {
                    return `Code sample in [pyright playground](${props.getShareableUrl()})\n`;
                }}
            />
            <CopyToClipboardButton
                label={'Markdown with link and code'}
                title={'Copy markdown to clipboard'}
                getTextToCopy={() => {
                    return (
                        `Code sample in [pyright playground](${props.getShareableUrl()})\n\n` +
                        '```' +
                        `python\n${props.code}\n` +
                        '```\n'
                    );
                }}
            />

            <View style={styles.divider} />
            <Text style={styles.headerText} selectable={false}>
                {'Examples'}
            </Text>
            <TextWithLink
                style={styles.aboutTextLink}
                url={
                    '/?code=MQAgKgFglgziMEMC2AHANgU3lVaCeIKATlAHYAucARABIZpoD2IA6o0WgCZUB0AUH04YAZiAj0mAfQDu7LgAoAlAC4%2BIdYRIV5tCczYdOAQiqK%2BQA'
                }
                useSameWindow={true}
            >
                {'Hello World'}
            </TextWithLink>
            <TextWithLink
                style={styles.aboutTextLink}
                url={
                    '/?code=MQAgKgFglgziDGB7AJgUxDAhgWwA4Bt01tEA7GAFwCdMLU4JEB3ETEXKxCxJfBfTDDjxMpEACN0AVxipkAKFDcQaAGZRS6NpSpT4FKTT4UAnrlQA6cNDiwMibKgpRHcKqlWoq75CGWDFEAAiZD0Aaz8zDQBzIIt5eVVObEjcGJAXXEQqChAABU5uXgTQABEPDS12Qp5EPlVs1n5BOAoIWgwpXCycuDYggEcpTHgwoJBHNpR4%2BAEhEABlLp6KGABFYdGACgKuWvwASgAueRAzlQ8QIZGwrdl8VQOQAFoAPhAAOTJUE-O-kAsgISsxaIFK4V%2B5zUV02t3ujxe7y%2Bmkh-2qGgoWwA5NdRgBCLEHYFzOClRDRVEXVQSTBUOGoB5PN6fb6Uv4cDHY8S0sIEoklEAAQTB4RAiHEACtUPoJrR4BB6H4FdU9rx4gA3ACMR0Wy2yqw2NxAAF4Rdt%2BaBhWTomLJdLcshEIrSFwNQAmHVLbr69awk1g8lbIlAA'
                }
                useSameWindow={true}
            >
                {'Protocols'}
            </TextWithLink>
            <TextWithLink
                style={styles.aboutTextLink}
                url={
                    '/?code=MQAgKgFglgziMEMC2AHANgUxAEw0g9gHYwAuATgiRnBPgO4gn4gCuMWCIACghUgMooMAYxB0oJCCADCRYZQyEFIABRcAolxAA2AIwAmAJQA6AFCmAZmXxJGATxRRCAcxBRU%2BMiRlyFSqgA0MghoaAgARphBPHyCIkFgDhgAarzmWgC83LzIccIqAERcBYamAEogWYlCqWSFZSXmwmEwcGUYAI4s1CQAXCDGg%2BagACIYFk4cOCKelJ6MEJQgZJ0sUCtwklgTZKQgKDlIGFRkjMzhUwXtXT0FZrgWYhIQAPorN6QqFv3SIWGRGAA2rJCPIqP4gdduqRogBdIJlWGGEAAWgAfMFQhFMICuAjYb1TCBidNHk5CBg6gAqXjOGD9LjGWkwIJUqkAazozIZxk5zOR6JAZUJJNFy2OLDIhBAFhUUJ6KkMrOZrI5XLIdNKRJJKxIkul5Mp5gAAuJJG9Vj1TA9GAh2dQXk4SC9SHV3tC%2BkLLTCQAAPfpOoJ2fqugUYp0inUSqV%2B8wkO0Op0u8gqXRBAoAQRKxNAAHkANKmeP2mCOwjO12FABCBSCRhzIHUZGsZAAhKYgA'
                }
                useSameWindow={true}
            >
                {'ParamSpecs'}
            </TextWithLink>
            <TextWithLink
                style={styles.aboutTextLink}
                url={
                    '/?pythonVersion=3.12&code=MQAgKgFglgziMEMC2AHANgU3hA9gdzlzxABccQBXGLEiLABQFF6QA2ATgFYQBzDAOwwAnKAGM4MAJ78SCAB4goMoTgAmFURlWL%2BIepNo5dAZgB0ARgBMpgFA3RaBDDgAhJwGsMJANpgAugBcNiAhIKoYAGYgCKqqAPpQJBhIABTUaBEANIpJSAHgAJQgALQAfCAAckYYQaF1IKaNNkA'
                }
                useSameWindow={true}
            >
                {'Generics Syntax (Python 3.12)'}
            </TextWithLink>

            <View style={styles.divider} />
            <Text style={styles.headerText} selectable={false}>
                {'Pyright'}
            </Text>
            <Text style={styles.aboutText} selectable={false}>
                {'Pyright is an open-source standards-based static type checker for Python.'}
            </Text>
            <TextWithLink
                style={styles.aboutTextLink}
                url={'https://microsoft.github.io/pyright/#/'}
            >
                {'Pyright documentation'}
            </TextWithLink>
            <TextWithLink style={styles.aboutTextLink} url={'https://github.com/Microsoft/pyright'}>
                {'Pyright GitHub site'}
            </TextWithLink>
        </View>
    );
}

interface CopyToClipboardButtonProps {
    label: string;
    title: string;
    getTextToCopy: () => string;
}

interface CopyToClipboardButtonState {
    isCopied: boolean;
}

function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
    const [buttonState, setButtonState] = useState<CopyToClipboardButtonState>({ isCopied: false });

    return (
        <View style={styles.clipboardContainer}>
            <IconButton
                title={props.title}
                iconName={buttonState.isCopied ? 'check' : 'copy1'}
                iconSize={16}
                onPress={() => {
                    const textToCopy = props.getTextToCopy();

                    try {
                        navigator.clipboard.writeText(textToCopy);

                        setButtonState({ isCopied: true });

                        setTimeout(() => {
                            setButtonState({ isCopied: false });
                        }, 1000);
                    } catch {
                        // Ignore the error.
                    }
                }}
                color={buttonState.isCopied ? '#090' : '#666'}
                hoverColor={buttonState.isCopied ? '#090' : '#333'}
                backgroundStyle={styles.clipboardButtonBackground}
                hoverBackgroundStyle={styles.clipboardButtonBackgroundHover}
            />
            <Text style={styles.clipboardButtonText}>{props.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'stretch',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    headerText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontVariant: ['small-caps'],
    },
    aboutTextLink: {
        marginLeft: 16,
        marginRight: 8,
        fontSize: 13,
        marginBottom: 8,
    },
    aboutText: {
        marginLeft: 16,
        marginRight: 8,
        fontSize: 13,
        color: '#333',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        borderTopWidth: 1,
        borderColor: '#eee',
        borderStyle: 'solid',
        marginVertical: 8,
    },
    clipboardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 4,
    },
    clipboardButtonBackground: {
        height: 25,
        width: 25,
        paddingVertical: 3,
        paddingHorizontal: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderRadius: 4,
        borderStyle: 'solid',
        borderColor: '#999',
    },
    clipboardButtonBackgroundHover: {
        borderColor: '#666',
    },
    clipboardButtonText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#333',
        marginBottom: 2,
    },
});
