import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import { THEME } from '../../src/styles/theme';
import styles from './InterviewBuddyPage.styles';
import withAuth from '../../src/components/withAuth';

const QuestionsIcon = () => (
  <>
    {Platform.OS === 'web' ? (
      <svg width={52} height={52} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="10" width="26" height="32" rx="6" stroke="#A78BFA" strokeWidth="2.5" />
        <path d="M16 20h12" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 26h8" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M33 20c3 0 5 2 5 4.5 0 3.5-3.5 4-4.6 6.2-.3.7-.4 1.2-.4 1.8" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="33" cy="36.5" r="1.5" fill="#A78BFA" />
      </svg>
    ) : (
      <>
        <View style={styles.iconDocument} />
        <View style={styles.iconQuestionMark} />
      </>
    )}
  </>
);

const VideoIcon = () => (
  <>
    {Platform.OS === 'web' ? (
      <svg width={52} height={52} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8.5" y="15" width="24" height="18" rx="5" stroke="#A78BFA" strokeWidth="2.5" />
        <path d="M33 21.5L42 17.5V30.5L33 26.5" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.5 21.5V26.5L25.5 24L20.5 21.5Z" fill="#A78BFA" />
      </svg>
    ) : (
      <>
        <View style={styles.iconVideo} />
        <View style={styles.iconPlayButton} />
      </>
    )}
  </>
);

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
                    {option.icon === 'questions' && <QuestionsIcon />}
                    {option.icon === 'video' && <VideoIcon />}
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

export default withAuth(InterviewBuddyPage);
