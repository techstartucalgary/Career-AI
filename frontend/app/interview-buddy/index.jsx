import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
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
      description: 'Lets practice online interviews with AI-powered video simulation',
      route: '/interview-buddy/video-instructions',
      icon: 'video'
    }
  ];

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']}
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
                  <Pressable
                    style={[
                      styles.optionButton,
                      hoveredButton === option.id && styles.optionButtonHover
                    ]}
                    onHoverIn={() => Platform.OS === 'web' && setHoveredButton(option.id)}
                    onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                  >
                    <Text style={styles.optionButtonText}>
                      {option.id === 1 ? 'Go to Questions' : 'Go to Video Simulation'}
                    </Text>
                    <View style={styles.optionButtonArrow}>
                      <View style={styles.arrowLine} />
                      <View style={styles.arrowHead} />
                    </View>
                  </Pressable>
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
