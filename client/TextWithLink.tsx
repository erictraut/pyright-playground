/*
 * Copyright (c) Eric Traut
 * View that displays text as a link that opens a URL.
 */

import { Linking, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

interface TextWithLinkProps extends React.PropsWithChildren {
    style?: StyleProp<TextStyle>;
    url: string;
}

export default function TextWithLink({ children, style, url }: TextWithLinkProps) {
    return (
        <Text style={style ?? styles.default} onPress={() => Linking.openURL(url)}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    default: {
        color: 'blue',
    },
});
