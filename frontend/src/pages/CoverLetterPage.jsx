import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './CoverLetterPage.styles';

const CoverLetterPage = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  const options = [
    {
      id: 1,
      title: 'Generate from Job Posting using AI',
      description: 'Paste a job description and get a perfectly tailored cover letter',
      route: '/cover-letter/job-posting',
      icon: 'ai'
    },
    {
      id: 2,
      title: 'Use Template or Optimize Current Cover Letter',
      description: 'Choose from professional templates or upload and enhance your existing cover letter',
      route: '/cover-letter/template',
      icon: 'template-optimize'
    }
  ];

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient 
        colors={['#1F1C2F', '#2D1B3D']} 
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <View style={styles.headerVisual}>
                <View style={styles.headerCircle1} />
                <View style={styles.headerCircle2} />
              </View>
              <View style={styles.headerBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>AI Cover Letter Builder</Text>
              </View>
              <Text style={styles.mainTitle}>How would you like to create your cover letter?</Text>
              <Text style={styles.subtitle}>
                Choose the option that best fits your needs
              </Text>
            </View>
            
            <View style={styles.optionsContainer}>
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
                  <View style={styles.optionIcon}>
                    {option.icon === 'ai' && (
                      <>
                        <View style={styles.iconStar} />
                      </>
                    )}
                    {option.icon === 'template-optimize' && (
                      <>
                        <View style={styles.iconDocument} />
                        <View style={styles.iconDocumentFold} />
                        <View style={styles.iconGear} />
                        <View style={styles.iconGearInner} />
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

export default CoverLetterPage;
