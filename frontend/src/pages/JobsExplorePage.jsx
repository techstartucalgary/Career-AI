import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './JobsExplorePage.styles';
import './JobPages.css';

const JobsExplorePage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Recommended For You');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedSearch, setFocusedSearch] = useState(false);
  const [hoveredJob, setHoveredJob] = useState(null);

  const tabs = ['Recommended For You', 'All Jobs', 'Applied Jobs'];

  const jobs = [
    {
      id: 1,
      company: 'Cenovus',
      title: 'Student Data Analyst Summer, 2026',
      location: 'Calgary, AB',
      rate: '$28.25/hr',
      types: ['Full-time', 'Hybrid', 'Internship'],
      description: 'Are you looking for an exciting student opportunity full of meaningful, diverse, and challenging assignments working alongside industry leading professionals? You will be part of a driven, and collaborative team completing important projects while receiving the mentorship, knowledge, and experience to develop the skills you need to build an exciting career. Our team is on a mission to further enable Canadian Thermal Development and Production teams by implementing advanced data and analytics solutions, with a strong focus on generative AI.',
      posted: '2 days ago',
      matchScore: 95,
    },
    {
      id: 2,
      company: 'TechCorp',
      title: 'Software Engineer Intern',
      location: 'Toronto, ON',
      rate: '$32.50/hr',
      types: ['Full-time', 'Remote', 'Internship'],
      description: 'Join our innovative team to build cutting-edge software solutions. Work on real-world projects, collaborate with experienced engineers, and grow your skills in a supportive environment.',
      posted: '1 day ago',
      matchScore: 88,
    },
    {
      id: 3,
      company: 'DataFlow Inc',
      title: 'Junior Data Scientist',
      location: 'Vancouver, BC',
      rate: '$35.00/hr',
      types: ['Full-time', 'Hybrid', 'Entry Level'],
      description: 'Exciting opportunity for a junior data scientist to work on machine learning projects and data analytics solutions. Perfect for recent graduates looking to start their career in data science.',
      posted: '3 days ago',
      matchScore: 92,
    },
  ];

  const handleJobPress = (jobId) => {
    router.push(`/job/${jobId}`);
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>AI-Powered Job Matching</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Discover Your Next
                  <Text style={styles.heroTitleAccent}> Opportunity</Text>
                </Text>
                <Text style={styles.heroDescription}>
                  Find jobs that match your skills, preferences, and career goals
                </Text>
              </View>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{jobs.length}+</Text>
                <Text style={styles.statLabel}>Jobs Found</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>92%</Text>
                <Text style={styles.statLabel}>Avg Match</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>Updated</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsSection}>
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
                      <View style={styles.checkmarkContainer}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                      </View>
                    )}
                    <Text style={[
                      styles.tabText,
                      selectedTab === tab && styles.tabTextActive
                    ]}>
                      {tab}
                    </Text>
                    {selectedTab === tab && (
                      <View style={styles.tabIndicator} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Enhanced Search Bar */}
            <View style={styles.searchSection}>
              <View style={[
                styles.searchBar,
                focusedSearch && styles.searchBarFocused
              ]}>
                <View style={styles.searchIconContainer}>
                  <View style={styles.searchIcon}>
                    <View style={styles.searchIconCircle} />
                    <View style={styles.searchIconLine} />
                  </View>
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search jobs, companies, or keywords..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setFocusedSearch(true)}
                  onBlur={() => setFocusedSearch(false)}
                />
                <View style={styles.searchDivider} />
                <View style={styles.searchFilters}>
                  <Pressable style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Location</Text>
                    <View style={styles.filterArrowIcon}>
                      <View style={styles.filterArrowUp} />
                      <View style={styles.filterArrowDown} />
                    </View>
                  </Pressable>
                  <Pressable style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Remote</Text>
                    <View style={styles.filterArrowIcon}>
                      <View style={styles.filterArrowUp} />
                      <View style={styles.filterArrowDown} />
                    </View>
                  </Pressable>
                  <Pressable style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Salary</Text>
                    <View style={styles.filterArrowIcon}>
                      <View style={styles.filterArrowUp} />
                      <View style={styles.filterArrowDown} />
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Tailored Section */}
            <View style={styles.tailoredSection}>
              <View style={styles.tailoredIconContainer}>
                <View style={styles.tailoredIcon}>
                  <View style={styles.tailoredCircle}>
                    <View style={styles.tailoredStar} />
                  </View>
                </View>
              </View>
              <View style={styles.tailoredContent}>
                <Text style={styles.tailoredTitle}>Tailored Just For You</Text>
                <Text style={styles.tailoredText}>
                  Based on your resume, we found {jobs.length} jobs that match your skills and preferences
                </Text>
              </View>
            </View>

            {/* Job Listings */}
            <View style={styles.jobsList}>
              {jobs.map((job) => (
                <Pressable
                  key={job.id}
                  style={[
                    styles.jobCard,
                    hoveredJob === job.id && styles.jobCardHover
                  ]}
                  onPress={() => handleJobPress(job.id)}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredJob(job.id)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredJob(null)}
                >
                  <View style={styles.jobCardHeader}>
                    <View style={styles.jobCardHeaderLeft}>
                      <View style={styles.companyLogo}>
                        <Text style={styles.companyLogoText}>
                          {job.company.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.jobCardHeaderContent}>
                        <Text style={styles.jobCardTitle}>{job.title}</Text>
                        <Text style={styles.jobCardCompany}>{job.company}</Text>
                      </View>
                    </View>
                    <View style={styles.jobCardHeaderRight}>
                      <View style={styles.matchBadge}>
                        <Text style={styles.matchScore}>{job.matchScore}%</Text>
                        <Text style={styles.matchLabel}>Match</Text>
                      </View>
                      <Pressable style={styles.bookmarkButton}>
                        <View style={styles.bookmarkIcon}>
                          <View style={styles.bookmarkShape} />
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.jobCardDetails}>
                    <View style={styles.jobDetailItem}>
                      <View style={styles.detailIcon}>
                        <View style={styles.locationIcon} />
                      </View>
                      <Text style={styles.jobCardLocation}>{job.location}</Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <View style={styles.detailIcon}>
                        <View style={styles.moneyIcon} />
                      </View>
                      <Text style={styles.jobCardRate}>{job.rate}</Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <View style={styles.detailIcon}>
                        <View style={styles.timeIcon} />
                      </View>
                      <Text style={styles.jobCardPosted}>Posted {job.posted}</Text>
                    </View>
                  </View>

                  <View style={styles.jobTypes}>
                    {job.types.map((type, index) => (
                      <View key={index} style={styles.jobTypeTag}>
                        <Text style={styles.jobTypeText}>{type}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.jobCardDescription} numberOfLines={2}>
                    {job.description}
                  </Text>

                  <View style={styles.jobCardFooter}>
                    <Pressable style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <View style={styles.viewDetailsArrow}>
                        <View style={styles.arrowLine} />
                        <View style={styles.arrowHead} />
                      </View>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default JobsExplorePage;
