import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './ProfilePage.styles';

export default function ProfilePage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [location, setLocation] = useState('San Francisco, CA');
  const [bio, setBio] = useState('Passionate software developer with 5+ years of experience in building web applications.');

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient 
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']} 
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>My Profile</Text>
                <Text style={styles.subtitle}>Manage your personal information</Text>
              </View>
            </View>

            {/* Profile Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
              </View>
              <Text style={styles.avatarName}>{name}</Text>
              <Text style={styles.avatarRole}>Professional User</Text>
            </View>

            {/* Info Cards */}
            <View style={styles.cardsContainer}>
              {/* Personal Information Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Bio Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>About Me</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Stats Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile Stats</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>23</Text>
                    <Text style={styles.statLabel}>Applications</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>5</Text>
                    <Text style={styles.statLabel}>Interviews</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>87%</Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed
              ]}
            >
              <LinearGradient
                colors={['#A78BFA', '#8B7AB8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
