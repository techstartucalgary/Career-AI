import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './HomePage.styles';

const HomePage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['Recommended For You', 'All Jobs', 'Applied Jobs'];

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
              placeholderTextColor="#6B7280"
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

          {/* Quick Actions Section */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <Pressable 
                style={styles.actionCard}
                onPress={() => router.push('/jobs')}
              >
                <Text style={styles.actionCardTitle}>Browse Jobs</Text>
                <Text style={styles.actionCardDesc}>Find opportunities that match your skills</Text>
              </Pressable>
              <Pressable 
                style={styles.actionCard}
                onPress={() => router.push('/resume')}
              >
                <Text style={styles.actionCardTitle}>Resume Builder</Text>
                <Text style={styles.actionCardDesc}>Create or optimize your resume</Text>
              </Pressable>
              <Pressable 
                style={styles.actionCard}
                onPress={() => router.push('/cover-letter')}
              >
                <Text style={styles.actionCardTitle}>Cover Letters</Text>
                <Text style={styles.actionCardDesc}>Generate personalized cover letters</Text>
              </Pressable>
              <Pressable 
                style={styles.actionCard}
                onPress={() => router.push('/interview')}
              >
                <Text style={styles.actionCardTitle}>Interview Prep</Text>
                <Text style={styles.actionCardDesc}>Practice with AI-powered questions</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
