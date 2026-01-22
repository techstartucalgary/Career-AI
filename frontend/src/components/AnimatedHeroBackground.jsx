import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useAnimatedStyle,
    Easing,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AuroraBeam = ({ colors, initialX, initialY, rotation, duration, delay, scaleRange = [1, 1.5] }) => {
    const translateX = useSharedValue(initialX);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.6);

    useEffect(() => {
        translateX.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(initialX + 100, { duration: duration, easing: Easing.inOut(Easing.quad) }),
                    withTiming(initialX - 100, { duration: duration, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        );

        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(scaleRange[1], { duration: duration * 1.5, easing: Easing.inOut(Easing.quad) }),
                    withTiming(scaleRange[0], { duration: duration * 1.5, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        );

        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.8, { duration: duration * 0.8, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0.4, { duration: duration * 0.8, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        )
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: initialY },
                { rotate: `${rotation}deg` },
                { scale: scale.value }
            ],
            opacity: opacity.value
        };
    });

    return (
        <Animated.View style={[styles.beam, animatedStyle]}>
            <LinearGradient
                colors={colors}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
};

const AnimatedHeroBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Dark base background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1F1C2F' }]} />

            <View style={styles.beamsContainer}>
                {/* Beam 1: Purple/Blue */}
                <AuroraBeam
                    colors={['rgba(139, 122, 184, 0)', '#8B7AB8', 'rgba(139, 122, 184, 0)']}
                    initialX={-width * 0.2}
                    initialY={-height * 0.2}
                    rotation={-45}
                    duration={4000}
                    delay={0}
                    scaleRange={[1.2, 1.8]}
                />

                {/* Beam 2: Violet */}
                <AuroraBeam
                    colors={['rgba(167, 139, 250, 0)', '#A78BFA', 'rgba(167, 139, 250, 0)']}
                    initialX={width * 0.2}
                    initialY={-height * 0.1}
                    rotation={45}
                    duration={5000}
                    delay={500}
                    scaleRange={[1.5, 2]}
                />

                {/* Beam 3: Darker Purple Accent */}
                <AuroraBeam
                    colors={['rgba(76, 29, 149, 0)', '#6D28D9', 'rgba(76, 29, 149, 0)']}
                    initialX={0}
                    initialY={height * 0.2}
                    rotation={-30}
                    duration={6000}
                    delay={1000}
                />
            </View>

            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Vignette / Overlay to dim edges */}
            <LinearGradient
                colors={['rgba(31, 28, 47, 0.3)', 'rgba(31, 28, 47, 0.7)']}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    beam: {
        position: 'absolute',
        width: width * 1.5,
        height: 400,
        borderRadius: 200,
    },
    beamsContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default AnimatedHeroBackground;
