import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import { THEME } from '../../src/styles/theme';
import styles from './InterviewVideoInstructionsPage.styles';
import withAuth from '../../src/components/withAuth';

const InterviewVideoInstructionsPage = () => {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState(null);

  const instructions = [
    'Test local camera and microphone',
    'When you press Start, the simulation will start off with a question',
    'It will listen to your response and continue with more questions related to the position',
    "Press Start Button when you're ready"
  ];

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={THEME.gradients.page}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroBackgroundCircle1} />
              <View style={styles.heroBackgroundCircle2} />
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Video Interview Simulation</Text>
                </View>
                <Text style={styles.heroTitle}>Instructions</Text>
                <Text style={styles.heroSubtitle}>
                  Get ready for your AI-powered video interview practice session
                </Text>
              </View>
            </View>

            {/* Instructions Card */}
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsList}>
                {instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.continueButton,
                  hoveredButton && styles.continueButtonHover
                ]}
                onPress={() => router.push('/interview-buddy/video-interview')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton(true)}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(false)}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <View style={styles.continueButtonArrow}>
                  <View style={styles.arrowLine} />
                  <View style={styles.arrowHead} />
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default withAuth(InterviewVideoInstructionsPage);
