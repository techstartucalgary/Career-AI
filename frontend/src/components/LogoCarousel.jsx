import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import amdLogo from '../assets/AMD-Logo.png';
import awsLogo from '../assets/aws.png';
import googleLogo from '../assets/google.png';
import mcLogo from '../assets/mc.png';

const LOGO_SIZE = 100;
const LOGO_MARGIN = 40;
const ITEM_WIDTH = LOGO_SIZE + LOGO_MARGIN * 2;

const logos = [
    { id: 'amd', source: amdLogo },
    { id: 'aws', source: awsLogo },
    { id: 'google', source: googleLogo },
    { id: 'mc', source: mcLogo },
];

// Duplicate logos for seamless infinite scroll
const duplicatedLogos = [...logos, ...logos, ...logos];

const LogoCarousel = () => {
    const translateX = useSharedValue(0);
    const totalWidth = logos.length * ITEM_WIDTH;

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(-totalWidth, {
                duration: 12000,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.track, animatedStyle]}>
                {duplicatedLogos.map((logo, index) => (
                    <View key={`${logo.id}-${index}`} style={styles.logoWrapper}>
                        <Image source={logo.source} style={styles.logo} />
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 800,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    track: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoWrapper: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        marginHorizontal: LOGO_MARGIN,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        resizeMode: 'contain',
    },
});

export default LogoCarousel;
