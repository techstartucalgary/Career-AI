import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import { THEME } from '../../src/styles/theme';
import styles from './InterviewBuddyPage.styles';

const InterviewBuddyPage = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  const options = [
    {
      id: 1,
      title: 'Top 10 Questions',
      description: 'Enter a job posting, and we will generate the top 10 asked interview questions and the best answers',
      route: '/interview',
      icon: 'questions'
    },
    {
      id: 2,
      title: 'Video Simulation',
      description: 'Practice online interviews with AI-powered video simulation',
      route: '/interview-buddy/video-instructions',
      icon: 'video'
    }
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
                  <Text style={styles.badgeText}>AI-Powered Interview Prep</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Interview Buddy
                </Text>
                <Text style={styles.heroSubtitle}>
                  Master your interviews with AI-powered practice questions and video simulations
                </Text>
              </View>
            </View>

            {/* Options Grid */}
            <View style={styles.optionsGrid}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionCard,
                    hoveredCard === option.id && styles.optionCardHover
                  ]}
                  onPress={() => router.push(option.route)}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredCard(option.id)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredCard(null)}
                >
                  <View style={styles.optionIconContainer}>
                    {option.icon === 'questions' && (
                      <>
                        <View style={styles.iconDocument} />
                        <View style={styles.iconQuestionMark} />
                      </>
                    )}
                    {option.icon === 'video' && (
                      <>
                        <View style={styles.iconVideo} />
                        <View style={styles.iconPlayButton} />
                      </>
                    )}
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default InterviewBuddyPage;
