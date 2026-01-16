import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './JobPostingResumePage.styles';

const JobPostingResumePage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Student', 'AI', 'Software Development', 'Calgary']);
  const [hoveredButton, setHoveredButton] = useState(null);

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
      <LinearGradient 
        colors={['#1F1C2F', '#2D1B3D']} 
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <View style={styles.headerBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>AI Resume Generator</Text>
              </View>
              <Text style={styles.headerTitle}>
                Generate Resume from Job Posting
              </Text>
              <Text style={styles.headerText}>
                Search for a job posting or paste the job description below
              </Text>
            </View>

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
                style={[
                  styles.generateButton,
                  hoveredButton === 'generate' && styles.generateButtonHover
                ]}
                onPress={handleGenerateResume}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('generate')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
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
                style={[
                  styles.downloadButton,
                  hoveredButton === 'download' && styles.downloadButtonHover
                ]}
                onPress={handleDownloadPDF}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('download')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default JobPostingResumePage;




