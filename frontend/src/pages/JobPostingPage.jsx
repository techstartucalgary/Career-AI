import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../components/Header';
import styles from './JobPostingPage.styles';
import './JobPages.css';

const JobPostingPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const jobData = {
    company: 'Cenovus',
    title: 'Student, AI, Software Development & Data Science, Calgary (January 2026)',
    location: 'Calgary, AB',
    type: 'Full-time',
    salary: '$28.25/hr',
    matchScore: 95,
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
      <LinearGradient
        colors={['#0A0A0F', '#12101A', '#0A0A0F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          {/* Left Sidebar */}
          <View style={styles.sidebar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backButton,
                hoveredButton === 'back' && styles.backButtonHover
              ]}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('back')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <View style={styles.backArrow}>
                <View style={styles.backArrowLine} />
                <View style={styles.backArrowHead} />
              </View>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={styles.actionButtons}>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.primaryActionButton,
                  hoveredButton === 'apply' && styles.actionButtonHover
                ]}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('apply')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.applyIcon} />
                </View>
                <Text style={styles.actionButtonText}>Apply Now</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'interview' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/interview')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('interview')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.interviewIcon} />
                </View>
                <Text style={styles.actionButtonText}>Interview Prep</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'cover-letter' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/cover-letter')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('cover-letter')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.letterIcon} />
                </View>
                <Text style={styles.actionButtonText}>Generate Cover Letter</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'resume' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/resume')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('resume')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.resumeIcon} />
                </View>
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
              {/* Job Header */}
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderLeft}>
                  <View style={styles.companyLogo}>
                    <Text style={styles.companyLogoText}>
                      {jobData.company.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.jobHeaderContent}>
                    <View style={styles.jobHeaderTop}>
                      <Text style={styles.companyName}>{jobData.company}</Text>
                      <View style={styles.matchBadge}>
                        <Text style={styles.matchScore}>{jobData.matchScore}%</Text>
                        <Text style={styles.matchLabel}>Match</Text>
                      </View>
                    </View>
                    <Text style={styles.jobTitle}>{jobData.title}</Text>
                    <View style={styles.jobMeta}>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.locationIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.location}</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.typeIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.type}</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.moneyIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.salary}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.bookmarkButton}
                  onPress={() => setIsBookmarked(!isBookmarked)}
                >
                  <View style={[
                    styles.bookmarkIcon,
                    isBookmarked && styles.bookmarkIconActive
                  ]}>
                    <View style={styles.bookmarkShape} />
                  </View>
                </Pressable>
              </View>

              {/* About Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.aboutIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>About This Role</Text>
                </View>
                {jobData.about.map((paragraph, index) => (
                  <Text key={index} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>

              {/* What You'll Do Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.responsibilitiesIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>What You'll Do</Text>
                </View>
                {jobData.responsibilities.map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={styles.bullet}>
                      <View style={styles.bulletDot} />
                    </View>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Who You Are Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.qualificationsIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>Who You Are</Text>
                </View>
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
                      <View style={styles.bullet}>
                        <View style={styles.bulletDot} />
                      </View>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
};

export default JobPostingPage;
