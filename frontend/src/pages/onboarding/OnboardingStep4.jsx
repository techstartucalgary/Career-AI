import React, { useState } from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import styles from './OnboardingStep4.styles';

const OnboardingStep4 = ({ formData, onNext, onBack }) => {
    const [localData, setLocalData] = useState({
        sex: formData.sex || '',
        gender: formData.gender || '',
        disability: formData.disability || '',
        race: formData.race || '',
    });
    const [focusedInput, setFocusedInput] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null);

    const handleChange = (field, value) => {
        setLocalData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onNext(localData);
    };

    // SelectField Component for dropdowns
    const SelectField = ({ value, onValueChange, options, placeholder, focused, onFocus, onBlur }) => {
        const [isOpen, setIsOpen] = useState(false);

        const handleToggle = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            setIsOpen((prev) => {
                const next = !prev;
                if (next) onFocus();
                else onBlur();
                return next;
            });
        };

        const handleSelect = (option) => {
            onValueChange(option);
            setIsOpen(false);
            onBlur();
        };

        const handleClose = (e) => {
            if (e) {
                e.stopPropagation();
            }
            setIsOpen(false);
            onBlur();
        };

        return (
            <View style={[styles.selectContainer, isOpen && styles.selectContainerOpen]}>
                <Pressable
                    style={[
                        styles.selectInput,
                        focused && styles.inputFocused,
                        isOpen && styles.selectInputOpen
                    ]}
                    onPress={handleToggle}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${placeholder}`}
                >
                    <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
                        {value || placeholder}
                    </Text>
                    <View style={styles.selectArrow}>
                        <View style={[styles.arrowTriangle, isOpen && styles.arrowTriangleUp]} />
                    </View>
                </Pressable>
                {isOpen && (
                    <>
                        <Pressable
                            style={styles.dropdownOverlay}
                            onPress={handleClose}
                        />
                        <View style={styles.selectOptionsContainer}>
                            <ScrollView
                                style={styles.selectOptionsScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                {options.map((option, index) => (
                                    <Pressable
                                        key={index}
                                        style={[
                                            styles.selectOption,
                                            value === option && styles.selectOptionSelected
                                        ]}
                                        onPress={() => handleSelect(option)}
                                    >
                                        <Text style={[
                                            styles.selectOptionText,
                                            value === option && styles.selectOptionTextSelected
                                        ]} numberOfLines={1}>
                                            {option || placeholder}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {formData.email && (
                <View style={styles.emailBadge}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeText}>{formData.email}</Text>
                </View>
            )}
            <View style={styles.header}>
                <Text style={styles.title}>Tell Us About Yourself</Text>
                <Text style={styles.subtitle}>
                    This information helps us provide better opportunities and is kept confidential
                </Text>
            </View>

            <View style={styles.formCard}>
                <View style={styles.formRow}>
                    {/* Left Column */}
                    <View style={styles.formColumn}>
                        <View style={[styles.inputGroup, focusedInput === 'sex' && styles.inputGroupOpen]}>
                            <Text style={styles.label}>Sex</Text>
                            <SelectField
                                value={localData.sex}
                                onValueChange={(value) => handleChange('sex', value)}
                                options={['', 'Male', 'Female', 'Intersex', 'Prefer not to say']}
                                placeholder="Select sex"
                                focused={focusedInput === 'sex'}
                                onFocus={() => setFocusedInput('sex')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

                        <View style={[styles.inputGroup, focusedInput === 'gender' && styles.inputGroupOpen]}>
                            <Text style={styles.label}>Gender</Text>
                            <SelectField
                                value={localData.gender}
                                onValueChange={(value) => handleChange('gender', value)}
                                options={['', 'Man', 'Woman', 'Non-binary', 'Genderqueer', 'Two-Spirit', 'Another gender', 'Prefer not to say']}
                                placeholder="Select gender"
                                focused={focusedInput === 'gender'}
                                onFocus={() => setFocusedInput('gender')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.formColumn}>
                        <View style={[styles.inputGroup, focusedInput === 'disability' && styles.inputGroupOpen]}>
                            <Text style={styles.label}>Disability Status</Text>
                            <SelectField
                                value={localData.disability}
                                onValueChange={(value) => handleChange('disability', value)}
                                options={['', 'Yes, I have a disability', 'No, I do not have a disability', 'Prefer not to say']}
                                placeholder="Select disability status"
                                focused={focusedInput === 'disability'}
                                onFocus={() => setFocusedInput('disability')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

                        <View style={[styles.inputGroup, focusedInput === 'race' && styles.inputGroupOpen]}>
                            <Text style={styles.label}>Race/Ethnicity</Text>
                            <SelectField
                                value={localData.race}
                                onValueChange={(value) => handleChange('race', value)}
                                options={['', 'American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander', 'White', 'Two or more races', 'Another race/ethnicity', 'Prefer not to say']}
                                placeholder="Select race/ethnicity"
                                focused={focusedInput === 'race'}
                                onFocus={() => setFocusedInput('race')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.navigation}>
                <Pressable
                    style={[
                        styles.backButton,
                        hoveredButton === 'back' && styles.backButtonHover
                    ]}
                    onPress={onBack}
                    onHoverIn={() => Platform.OS === 'web' && setHoveredButton('back')}
                    onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.saveButton,
                        hoveredButton === 'save' && styles.saveButtonHover
                    ]}
                    onPress={handleSave}
                    onHoverIn={() => Platform.OS === 'web' && setHoveredButton('save')}
                    onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <Text style={styles.saveButtonText}>Save and Continue</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default OnboardingStep4;
