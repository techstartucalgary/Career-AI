import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import AnimatedHeroBackground from '../components/AnimatedHeroBackground';
import ScrollReveal from '../components/ScrollReveal';
import LogoCarousel from '../components/LogoCarousel';
import { ScrollAnimationProvider } from '../contexts/ScrollAnimationContext';
import styles from './LandingPage.styles';

const LandingPage = () => {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBox, setHoveredBox] = useState(null);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const steps = [
    {
      number: 1,
      title: 'Upload Your Resume',
      description: 'Share your existing resume or create one from scratch with our templates'
    },
    {
      number: 2,
      title: 'Get Matched',
      description: 'Our AI analyzes your skills and finds the perfect job opportunities for you'
    },
    {
      number: 3,
      title: 'Apply with Confidence',
      description: 'Use AI-generated resumes, cover letters, and interview prep, to land your next job'
    }
  ];

  return (
    <ScrollAnimationProvider value={scrollY}>
      <Animated.ScrollView
        style={styles.homepage}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <AnimatedHeroBackground />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>AI-Powered Career Platform</Text>
            </View>
            <Text style={styles.heroTitle}>
              Find Your Dream Career
              <Text style={styles.heroTitleAccent}> With AI</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Upload your resume and get tailored job matches, and AI-written cover letters and resumes in seconds
            </Text>
            <View style={styles.heroButtons}>
              <Pressable
                style={[
                  styles.primaryButton,
                  hoveredButton === 'primary' && styles.primaryButtonHover
                ]}
                onPress={() => router.push('/authentication')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('primary')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.primaryButtonText}>Get Started For Free</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryButton,
                  hoveredButton === 'secondary' && styles.secondaryButtonHover
                ]}
                onPress={() => router.push('/authentication')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('secondary')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.secondaryButtonText}>Log In</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Skip the Stress Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Text style={styles.sectionTitle}>Skip the Stress, Land the Job</Text>
              </View>
              <View style={styles.splitRight}>
                <Text style={styles.sectionText}>
                  Let our AI take over the heavy lifting of your job search. Optimized resumes, personalized cover letters, and intelligent job matching — everything you need to secure your next role with confidence.
                </Text>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* How it Works Section */}
        <ScrollReveal style={styles.section} delay={100}>
          <View style={styles.container}>
            <Text style={styles.centeredTitle}>How it Works</Text>
            <Text style={styles.centeredSubtitle}>Get started in just 3 simple steps</Text>
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <Pressable
                  key={index}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredCard(index)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredCard(null)}
                >
                  <View
                    style={[
                      styles.stepCard,
                      hoveredCard === index && styles.stepCardHover
                    ]}
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        hoveredCard === index && styles.stepCircleHover
                      ]}
                    >
                      <Text style={styles.stepNumber}>{step.number}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollReveal>

        {/* Company Logos Section */}
        <ScrollReveal style={styles.logoSection} delay={200}>
          <Text style={styles.logoTitle}>Find jobs at companies like:</Text>
          <LogoCarousel />
        </ScrollReveal>

        {/* AI Career Companion Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Pressable
                  onHoverIn={() => Platform.OS === 'web' && setHoveredBox(`companion`)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredBox(null)}
                >
                  <View
                    style={[
                      styles.placeholderBox,
                      hoveredBox === 'companion' && styles.placeholderBoxHover
                    ]}
                  >
                    <View style={styles.placeholderIcon}>
                      <View style={styles.iconHead} />
                      <View style={styles.iconBubble} />
                    </View>
                  </View>
                </Pressable>
              </View>
              <View style={styles.splitRight}>
                <Text style={styles.sectionTitle}>AI Career Companion</Text>
                <Text style={styles.sectionText}>
                  Let our AI be your personalized job hunter. While you eat, sleep, and play, AI Career Companion will be:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Finding jobs that match your skills</Text>
                  <Text style={styles.bulletPoint}>• Applying to jobs fit for you</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* AI Resume Generator Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Text style={styles.sectionTitle}>AI Resume Generator</Text>
                <Text style={styles.sectionText}>
                  For each job application, our AI will generate a new resume in seconds that will:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletPoint}>• Match the job description perfectly</Text>
                  <Text style={styles.bulletPoint}>• Optimize your existing resume for better fit</Text>
                  <Text style={styles.bulletPoint}>• Pass applicant tracking systems</Text>
                  <Text style={styles.bulletPoint}>• Land you an interview</Text>
                </View>
                <Pressable
                  style={[
                    styles.inlineButton,
                    hoveredButton === 'resume' && styles.inlineButtonHover
                  ]}
                  onPress={() => router.push('/resume')}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('resume')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.inlineButtonText}>Start tailoring resumes now</Text>
                  <View style={styles.inlineButtonArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
              <View style={styles.splitRight}>
                <Pressable
                  onHoverIn={() => Platform.OS === 'web' && setHoveredBox('resume')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredBox(null)}
                >
                  <View
                    style={[
                      styles.placeholderBox,
                      hoveredBox === 'resume' && styles.placeholderBoxHover
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* AI Cover Letter Generator Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Pressable
                  onHoverIn={() => Platform.OS === 'web' && setHoveredBox('cover-letter')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredBox(null)}
                >
                  <View
                    style={[
                      styles.placeholderBox,
                      hoveredBox === 'cover-letter' && styles.placeholderBoxHover
                    ]}
                  />
                </Pressable>
              </View>
              <View style={styles.splitRight}>
                <Text style={styles.sectionTitle}>AI Cover Letter Generator</Text>
                <Text style={styles.sectionText}>
                  Create personalized cover letters that stand out. Our AI ensures each letter is tailored to the specific job and company.
                </Text>
                <Pressable
                  style={[
                    styles.inlineButton,
                    hoveredButton === 'cover-letter' && styles.inlineButtonHover
                  ]}
                  onPress={() => router.push('/cover-letter')}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('cover-letter')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.inlineButtonText}>Generate cover letters</Text>
                  <View style={styles.inlineButtonArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* AI Interview Prep Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Text style={styles.sectionTitle}>AI Interview Prep</Text>
                <Text style={styles.sectionText}>
                  Practice with AI-powered interview questions tailored to your role. Get feedback and improve your answers before the real interview.
                </Text>
                <Pressable
                  style={[
                    styles.inlineButton,
                    hoveredButton === 'interview' && styles.inlineButtonHover
                  ]}
                  onPress={() => router.push('/interview')}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('interview')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.inlineButtonText}>Start practicing</Text>
                  <View style={styles.inlineButtonArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
              <View style={styles.splitRight}>
                <Pressable
                  onHoverIn={() => Platform.OS === 'web' && setHoveredBox('resume')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredBox(null)}
                >
                  <View
                    style={[
                      styles.placeholderBox,
                      hoveredBox === 'resume' && styles.placeholderBoxHover
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* Resume Scoring and Optimization Section */}
        <ScrollReveal style={styles.section}>
          <View style={styles.container}>
            <View style={styles.splitSection}>
              <View style={styles.splitLeft}>
                <Pressable
                  onHoverIn={() => Platform.OS === 'web' && setHoveredBox('scoring')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredBox(null)}
                >
                  <View
                    style={[
                      styles.placeholderBox,
                      hoveredBox === 'scoring' && styles.placeholderBoxHover
                    ]}
                  />
                </Pressable>
              </View>
              <View style={styles.splitRight}>
                <Text style={styles.sectionTitle}>Resume Scoring and Optimization</Text>
                <Text style={styles.sectionText}>
                  Get instant feedback on your resume with our AI scoring system. Learn what to improve and how to make your resume ATS-friendly.
                </Text>
                <Pressable
                  style={[
                    styles.inlineButton,
                    hoveredButton === 'resume' && styles.inlineButtonHover
                  ]}
                  onPress={() => router.push('/resume')}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('resume')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.inlineButtonText}>Score your resume</Text>
                  <View style={styles.inlineButtonArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollReveal>

        {/* Final CTA Section */}
        <LinearGradient
          colors={['#8B7AB8', '#A78BFA']}
          style={styles.finalCtaSection}
        >
          <View style={styles.container}>
            <Text style={styles.finalCtaTitle}>Ready to Transform Your Job Search?</Text>
            <Text style={styles.finalCtaSubtitle}>Change The Way You Apply with AI</Text>
            <Pressable
              style={[
                styles.finalCtaButton,
                hoveredButton === 'finalCta' && styles.finalCtaButtonHover
              ]}
              onPress={() => router.push('/authentication')}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('finalCta')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <Text style={styles.finalCtaButtonText}>Start Your Journey</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.ScrollView>
    </ScrollAnimationProvider>
  );
};

export default LandingPage;
