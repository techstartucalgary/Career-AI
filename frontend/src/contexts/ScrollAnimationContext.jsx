import React, { createContext, useContext } from 'react';
import { useSharedValue } from 'react-native-reanimated';

const ScrollAnimationContext = createContext(null);

export const ScrollAnimationProvider = ({ value, children }) => {
    return (
        <ScrollAnimationContext.Provider value={value}>
            {children}
        </ScrollAnimationContext.Provider>
    );
};

export const useScrollAnimation = () => {
    const context = useContext(ScrollAnimationContext);
    if (!context) {
        throw new Error('useScrollAnimation must be used within a ScrollAnimationProvider');
    }
    return context;
};
