import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './ResumePage.styles';

const ResumePage = () => {
  const router = useRouter();

  const options = [
    {
      id: 1,
      title: 'Generate from Job Posting using AI',
      description: 'Paste a job description and get a perfectly tailored resume',
      route: '/resume/job-posting'
    },
    {
      id: 2,
      title: 'Use a Template',
      description: 'Choose from professional templates and customize',
      route: '/resume/template'
    },
    {
      id: 3,
      title: 'Optimize your Current Resume',
      description: 'Edit your current resume with full control',
      route: '/resume/template'
    }
  ];

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.mainCard}>
            <Text style={styles.mainTitle}>How would you like to create your resume?</Text>
            
            <View style={styles.optionsContainer}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => router.push(option.route)}
                    >
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      </View>
  );
};

export default ResumePage;
