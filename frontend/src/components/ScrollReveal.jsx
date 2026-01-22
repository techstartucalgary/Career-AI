import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    withDelay,
    useDerivedValue,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useScrollAnimation } from '../contexts/ScrollAnimationContext';
import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScrollReveal = ({ children, style, delay = 0 }) => {
    const scrollY = useScrollAnimation();
    const [layoutY, setLayoutY] = useState(0);
    const [hasLayout, setHasLayout] = useState(false);

    const onLayout = (event) => {
        // Only set layout once to avoid re-renders if layout doesn't drastically change
        // or if we want to support dynamic layout, we can update it.
        // For simple reveal, getting initial Y relative to parent view is usually enough
        // IF the parent view is the scroll content container.
        const { y } = event.nativeEvent.layout;
        setLayoutY(y);
        setHasLayout(true);
    };

    const opacity = useDerivedValue(() => {
        if (!hasLayout) return 0;
        // Calculate when the element enters the viewport
        // effectiveY is approx layoutY. 
        // We want to start fading in when (scrollY + SCREEN_HEIGHT) > (layoutY + offset)

        // Simplification: interpolate based on scrollY
        const triggerPoint = layoutY - SCREEN_HEIGHT * 0.85; // Trigger when element is 15% up from bottom

        return interpolate(
            scrollY.value,
            [triggerPoint - 100, triggerPoint],
            [0, 1],
            Extrapolation.CLAMP
        );
    }, [hasLayout, layoutY]);

    const translateY = useDerivedValue(() => {
        if (!hasLayout) return 50;
        const triggerPoint = layoutY - SCREEN_HEIGHT * 0.85;

        return interpolate(
            scrollY.value,
            [triggerPoint - 100, triggerPoint],
            [50, 0],
            Extrapolation.CLAMP
        );
    }, [hasLayout, layoutY]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withDelay(delay, withTiming(opacity.value, { duration: 500 })),
            transform: [
                {
                    translateY: withDelay(delay, withTiming(translateY.value, { duration: 500 }))
                }
            ],
        };
    });

    return (
        <Animated.View style={[style, animatedStyle]} onLayout={onLayout}>
            {children}
        </Animated.View>
    );
};

export default ScrollReveal;
