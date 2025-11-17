import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import './HomePage.css'; // keep for web fallback during migration
import styles from './HomePage.styles';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    console.log('Searching for:', searchQuery, 'in', location);
  };

  const features = [
    { icon: '🎯', title: 'AI Job Matching', desc: 'Smart algorithms match you with perfect opportunities' },
    { icon: '📄', title: 'Resume Optimizer', desc: 'AI-powered resume analysis and improvement tips' },
    { icon: '🚀', title: 'Career Insights', desc: 'Personalized career path recommendations' },
    { icon: '💼', title: 'Interview Prep', desc: 'Practice with AI-driven interview questions' }
  ];

  return (
    <ScrollView style={styles.homepage}>
      <Header />
      
      {/* hero section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        <View style={styles.container}>
          <Text style={styles.heroTitle}>Find Your Dream Career with AI</Text>
          <Text style={styles.heroSubtitle}>
            Leverage artificial intelligence to discover opportunities perfectly matched to your skills and aspirations.
          </Text>
          
          <View style={styles.searchBar}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Job title or keyword"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#6c757d"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Location"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#6c757d"
              />
              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search Jobs</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* features section */}
      <View style={styles.featuresSection}>
        <View style={styles.container}>
          <Text style={styles.featuresTitle}>Why Choose Career AI?</Text>
          <View style={styles.featuresRow}>
            {features.map((feature, idx) => (
              <View key={idx} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* stats section */}
      <View style={styles.statsSection}>
        <View style={styles.container}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10k+</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5k+</Text>
              <Text style={styles.statLabel}>Success Stories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Partner Companies</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA section */}
      <View style={styles.ctaSection}>
        <View style={styles.container}>
          <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of professionals who found their dream careers
          </Text>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started Free</Text>
          </Pressable>
        </View>
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <View style={styles.container}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerTitle}>Career AI</Text>
              <Text style={styles.footerText}>Your AI-powered career companion</Text>
            </View>
            <View>
              <Text style={styles.footerCopyright}>&copy; 2025 Career AI. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
