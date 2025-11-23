import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import './Header.css'; // keep for web fallback during migration
import styles from './Header.styles';

const Header = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.push('/')} style={styles.logo}>
            <Text style={styles.logoText}>Vexera</Text>
          </Pressable>
          
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push('/')}>
              <Text style={styles.navLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => {}}>
              <Text style={styles.navLink}>Jobs</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/resume')}>
              <Text style={styles.navLink}>Resume Builder</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/cover-letter')}>
              <Text style={styles.navLink}>Cover Letter Builder</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/interview')}>
              <Text style={styles.navLink}>Mock Interview</Text>
            </Pressable>
            <Pressable onPress={() => {}}>
              <Text style={styles.navLink}>About</Text>
            </Pressable>
          </View>
          
          <View style={styles.buttonGroup}>
            <Pressable onPress={() => router.push('/authentication')} style={styles.button}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/authentication')} style={[styles.button, styles.buttonPrimary]}>
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;