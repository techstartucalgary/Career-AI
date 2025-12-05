import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../components/Header';
import styles from './JobPostingPage.styles';

const JobPostingPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const jobData = {
    title: 'Student, AI, Software Development & Data Science, Calgary (January 2026)',
    about: [
      'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career.',
      'Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI technologies. We are seeking a student interested in exploring how Cenovus leverages state-of-the-art generative AI to empower teams and drive innovation in data solutions.'
    ],
    responsibilities: [
      'Design and development of data solutions with a focus on generative AI technologies',
      'Integrating generative AI models and applications to address business challenges and automate insights',
      'Direct engagement with team members and stakeholders in the ownership of generative AI-driven data solutions',
      'Managing personal workload and communications with stakeholders'
    ],
    qualifications: [
      'Our ideal candidate will have the following minimum qualifications:',
      'Currently enrolled in a relevant program',
      'Strong interest in AI and data science',
      'Excellent communication skills'
    ]
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.contentContainer}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <View style={styles.backArrow}>
              <View style={styles.backArrowLine} />
              <View style={styles.backArrowHead} />
            </View>
          </Pressable>
          
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Apply Now</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/interview')}
            >
              <Text style={styles.actionButtonText}>Interview Prep</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/cover-letter')}
            >
              <Text style={styles.actionButtonText}>Generate Cover Letter</Text>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/resume')}
            >
              <Text style={styles.actionButtonText}>Generate Resume</Text>
            </Pressable>
          </View>
        </View>

        {/* Right Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Job Header with Title and Bookmark */}
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{jobData.title}</Text>
              <Pressable style={styles.bookmarkButton}>
                <View style={styles.bookmarkIcon}>
                  <View style={styles.bookmarkShape} />
                </View>
              </Pressable>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              {jobData.about.map((paragraph, index) => (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>

            {/* What You'll Do Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>What You'll Do</Text>
              {jobData.responsibilities.map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Who You Are Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Who You Are</Text>
              {jobData.qualifications.map((item, index) => {
                if (index === 0) {
                  return (
                    <Text key={index} style={styles.sectionSubtext}>
                      {item}
                    </Text>
                  );
                }
                return (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default JobPostingPage;
