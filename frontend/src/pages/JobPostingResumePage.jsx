import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './JobPostingResumePage.styles';

const JobPostingResumePage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Student', 'AI', 'Software Development', 'Calgary']);

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleGenerateResume = () => {
    // TODO: Implement resume generation logic
    console.log('Generating resume...');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download logic
    console.log('Downloading PDF...');
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.headerText}>
            Search for a job posting or paste the job description below
          </Text>

          <View style={styles.panelsContainer}>
            {/* Left Panel - Input Section */}
            <View style={styles.leftPanel}>
              {/* Job Posting Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Job Posting</Text>
                
                <View style={styles.searchBar}>
                  <View style={styles.searchIcon}>
                    <View style={styles.searchIconCircle} />
                    <View style={styles.searchIconLine} />
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search role or keyword"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {selectedTags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <Pressable
                          style={styles.tagClose}
                          onPress={() => removeTag(tag)}
                        >
                          <View style={styles.tagCloseLine1} />
                          <View style={styles.tagCloseLine2} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Enter Job Description Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Enter Job Description</Text>
                <TextInput
                  style={styles.jobDescriptionInput}
                  placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications"
                  placeholderTextColor="#9CA3AF"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Generate Resume Button */}
              <Pressable
                style={styles.generateButton}
                onPress={handleGenerateResume}
              >
                <Text style={styles.generateButtonText}>Generate Resume</Text>
              </Pressable>
            </View>

            {/* Right Panel - Resume Preview */}
            <View style={styles.rightPanel}>
              <View style={styles.previewArea}>
                <View style={styles.previewIcon}>
                  <View style={styles.documentIcon} />
                </View>
                <Text style={styles.previewText}>Your tailored resume will appear here</Text>
              </View>

              <Pressable
                style={styles.downloadButton}
                onPress={handleDownloadPDF}
              >
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default JobPostingResumePage;




