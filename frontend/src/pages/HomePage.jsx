import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './HomePage.styles';

const HomePage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Recommended For You');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedSearch, setFocusedSearch] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);

  const tabs = ['Recommended For You', 'All Jobs', 'Applied Jobs'];

  const stats = [
    { label: 'Jobs Matched', value: '1,247', icon: 'briefcase' },
    { label: 'Applications', value: '23', icon: 'document' },
    { label: 'Interviews', value: '5', icon: 'calendar' },
    { label: 'Success Rate', value: '87%', icon: 'star' },
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
            {/* Hero Section with Visual Elements */}
      <View style={styles.heroSection}>
              <View style={styles.heroVisualContainer}>
                <View style={styles.heroCircle1} />
                <View style={styles.heroCircle2} />
                <View style={styles.heroCircle3} />
              </View>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>AI-Powered Career Platform</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Find Your Dream Career
                  <Text style={styles.heroTitleAccent}> With AI</Text>
                </Text>
                <Text style={styles.heroDescription}>
                  Discover personalized opportunities, create standout applications, and land your next role faster than ever
                </Text>
              </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              {stats.map((stat, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.statCard,
                    hoveredStat === index && styles.statCardHover
                  ]}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredStat(index)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredStat(null)}
                >
                  <View style={styles.statIconContainer}>
                    <View style={styles.statIcon}>
                      {stat.icon === 'briefcase' && <View style={styles.statBriefcase} />}
                      {stat.icon === 'document' && <View style={styles.statDocument} />}
                      {stat.icon === 'calendar' && <View style={styles.statCalendar} />}
                      {stat.icon === 'star' && <View style={styles.statStar} />}
                    </View>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Filter Tabs with Modern Design */}
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

            {/* Enhanced Search Section */}
            <View style={styles.searchSection}>
              <View style={styles.searchWrapper}>
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
                    placeholder="Search for your dream job..."
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
                <View style={styles.searchHint}>
                  <Text style={styles.searchHintText}>
                    Try: "Software Engineer in San Francisco" or "Remote Marketing Manager"
                  </Text>
                </View>
        </View>
      </View>

            {/* Featured Opportunities Section */}
            <View style={styles.featuredSection}>
              <View style={styles.featuredHeader}>
                <Text style={styles.featuredTitle}>Featured Opportunities</Text>
                <Pressable style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <View style={styles.viewAllArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </Pressable>
              </View>
              <View style={styles.featuredGrid}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.featuredCard}>
                    <View style={styles.featuredCardHeader}>
                      <View style={styles.featuredCompanyLogo}>
                        <View style={styles.companyLogoCircle} />
          </View>
                      <View style={styles.featuredCardContent}>
                        <Text style={styles.featuredJobTitle}>Senior Product Designer</Text>
                        <Text style={styles.featuredCompanyName}>TechCorp Inc.</Text>
        </View>
                      <View style={styles.featuredBookmark}>
                        <View style={styles.bookmarkIcon} />
            </View>
          </View>
                    <View style={styles.featuredCardFooter}>
                      <View style={styles.featuredTag}>
                        <Text style={styles.featuredTagText}>Remote</Text>
        </View>
                      <View style={styles.featuredTag}>
                        <Text style={styles.featuredTagText}>$120k - $150k</Text>
      </View>
                      <Text style={styles.featuredTime}>2 days ago</Text>
        </View>
      </View>
                ))}
            </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      </View>
  );
};

export default HomePage;
