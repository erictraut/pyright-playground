/*
 * Copyright (c) Eric Traut
 * View that displays text as a link that opens a URL.
 */

import { Linking, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useHover } from './HoverHook';

interface TextWithLinkProps extends React.PropsWithChildren {
    style?: StyleProp<TextStyle>;
    url: string;
    useSameWindow?: boolean;
}

export default function TextWithLink(props: TextWithLinkProps) {
    const [hoverRef, isHovered] = useHover();

    return (
        <Text
            ref={hoverRef}
            style={[styles.default, props.style, isHovered ? styles.defaultHover : undefined]}
            onPress={(event) => {
                if (props.useSameWindow && !(event as any).metaKey) {
                    history.pushState(null, '', window.location.href);
                    window.location.replace(props.url);
                } else {
                    Linking.openURL(props.url);
                }
            }}
        >
            {props.children}
        </Text>
    );
}

const styles = StyleSheet.create({
    default: {
        color: '#558',
    },
    defaultHover: {
        color: '#333',
    },
});
