import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './JobsExplorePage.styles';

const JobsExplorePage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['Recommended For You', 'All Jobs', 'Applied Jobs'];

  // mock job data
  const jobs = [
    {
      id: 1,
      company: 'Cenovus',
      title: 'Student Data Analyst Summer, 2026',
      location: 'Calgary, AB',
      rate: '$28.25/hr',
      types: ['Full-time', 'Hybrid', 'Internship'],
      description: 'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career. Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI.........',
      posted: 'Posted 2 days ago',
    },
    {
      id: 2,
      company: 'Cenovus',
      title: 'Student Data Analyst Summer, 2026',
      location: 'Calgary, AB',
      rate: '$28.25/hr',
      types: ['Full-time', 'Hybrid', 'Internship'],
      description: 'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career. Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI.........',
      posted: 'Posted 2 days ago',
    },
    {
      id: 3,
      company: 'Cenovus',
      title: 'Student Data Analyst Summer, 2026',
      location: 'Calgary, AB',
      rate: '$28.25/hr',
      types: ['Full-time', 'Hybrid', 'Internship'],
      description: 'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career. Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI.........',
      posted: 'Posted 2 days ago',
    },
  ];

  const handleJobPress = (jobId) => {
    router.push(`/job/${jobId}`);
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Filter Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && styles.tabActive
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                {tab === 'Applied Jobs' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                <Text style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive
                ]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Hero Title */}
          <Text style={styles.heroTitle}>Find Your Dream Career With AI</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <View style={styles.searchIcon}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconLine} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Job Title or Keyword"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.searchFilters}>
              <Pressable style={styles.filterChip}>
                <Text style={styles.filterChipText}>Location</Text>
              </Pressable>
              <Pressable style={styles.filterChip}>
                <Text style={styles.filterChipText}>Work Arrangement</Text>
                <View style={styles.filterArrowIcon}>
                  <View style={styles.filterArrowUp} />
                  <View style={styles.filterArrowDown} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Tailored Section */}
          <View style={styles.tailoredSection}>
            <View style={styles.tailoredIcon}>
              <View style={styles.tailoredCircle}>
                <View style={styles.tailoredStar} />
              </View>
            </View>
            <Text style={styles.tailoredText}>
              Based on your resume, we found 5 jobs that match your skills and preferences
            </Text>
          </View>

          {/* Job Listings */}
          <View style={styles.jobsList}>
            {jobs.map((job) => (
              <Pressable
                key={job.id}
                style={styles.jobCard}
                onPress={() => handleJobPress(job.id)}
              >
                <View style={styles.jobCardHeader}>
                  <View style={styles.companyLogo}>
                    <Text style={styles.companyLogoText}>{job.company}</Text>
                  </View>
                  <Pressable style={styles.bookmarkButton}>
                    <View style={styles.bookmarkIcon}>
                      <View style={styles.bookmarkShape} />
                    </View>
                  </Pressable>
                </View>
                
                <Text style={styles.jobCardTitle}>{job.title}</Text>
                <Text style={styles.jobCardCompany}>{job.company}</Text>
                <Text style={styles.jobCardLocation}>{job.location}</Text>
                <Text style={styles.jobCardRate}>{job.rate}</Text>
                
                <View style={styles.jobTypes}>
                  {job.types.map((type, index) => (
                    <View key={index} style={styles.jobTypeTag}>
                      <Text style={styles.jobTypeText}>{type}</Text>
                    </View>
                  ))}
                </View>
                
                <Text style={styles.jobCardDescription} numberOfLines={3}>
                  {job.description}
                </Text>
                
                <View style={styles.jobCardFooter}>
                  <Text style={styles.jobCardPosted}>{job.posted}</Text>
                  <Pressable style={styles.moreButton}>
                    <View style={styles.moreButtonArrow}>
                      <View style={styles.moreButtonLine} />
                      <View style={styles.moreButtonHead} />
                    </View>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default JobsExplorePage;
