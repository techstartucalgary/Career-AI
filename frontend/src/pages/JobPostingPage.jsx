import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import styles from './JobPostingPage.styles';

const JobPostingPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // mock job data, in real app, this would come from whatever API we use based on id
  const jobData = {
    title: 'Student, AI, Software Development & Data Science, Calgary (January 2026)',
    posted: '1 Week Ago',
    about: [
      'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career.',
      'Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI technologies. We are seeking a student interested in exploring how Cenovus leverages state-of-the-art generative AI to empower teams and drive innovation in data solutions.'
    ],
    responsibilities: [
      'Design and development of data solutions with a focus on generative AI technologies',
      'Integrating generative AI models and applications to address business challenges and automate insights',
      'Direct engagement with team members and stakeholders in the ownership of...'
    ]
  };

  const handleSave = () => {
    console.log('Job saved');
  };

  return (
    <View style={styles.container}>
      {/* top navigation bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.navRight}>
          <Pressable style={styles.iconButton}>
            <Text style={styles.bookmarkIcon}>🔖</Text>
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Text style={styles.menuIcon}>⋮</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* job summary section */}
          <View style={styles.summarySection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <View style={styles.logoShape1} />
                <View style={styles.logoShape2} />
                <View style={styles.logoShape3} />
              </View>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.jobTitle}>{jobData.title}</Text>
              <Text style={styles.postedTime}>{jobData.posted}</Text>
              <Text style={styles.sectionHeading}>About</Text>
            </View>
          </View>

          {/* about section */}
          <View style={styles.contentSection}>
            {jobData.about.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* what you'll do section */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeading}>What You'll Do</Text>
            {jobData.responsibilities.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* bottom spacing for save button */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* save button */}
      <View style={styles.saveButtonContainer}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default JobPostingPage;

