import React, { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import styles from './OnboardingStep2.styles';

const OnboardingStep2 = ({ formData, onNext, onBack }) => {
  const [resumeFile, setResumeFile] = useState(formData.resumeFileName || '');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Simulate resume data extraction
  const extractResumeData = async (file) => {
    setIsExtracting(true);
    // In a real implementation, this would call an API to extract data from the resume
    // For now, we'll simulate with a delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data - in production, this would come from an AI/parsing service
    const mockExtractedData = {
      firstName: 'John', // Would be extracted from resume
      lastName: 'Doe',
      phone: '(555) 123-4567',
      linkedin: 'www.linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      location: 'Calgary, AB, Canada',
    };
    
    setIsExtracting(false);
    return mockExtractedData;
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeFile(file.name);
        
        // Extract data from resume
        const extractedData = await extractResumeData(file);
        
        onNext({ 
          resume: file, 
          resumeFileName: file.name,
          extractedData: extractedData
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile('');
    onNext({ resume: null, resumeFileName: '', extractedData: null });
  };

  const handleContinue = () => {
    if (resumeFile) {
      onNext({});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Left Side - Text */}
        <View style={styles.textSection}>
          <Text style={styles.title}>
            Attach Your Resume{'\n'}
            & We'll Get Started
          </Text>
        </View>

        {/* Right Side - Upload Area */}
        <View style={styles.uploadSection}>
          <View style={styles.uploadCard}>
            {isExtracting ? (
              <View style={styles.extractingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
                <Text style={styles.extractingText}>
                  Extracting information from your resume...
                </Text>
              </View>
            ) : !resumeFile ? (
              <Pressable
                style={[
                  styles.uploadArea,
                  isDragging && styles.uploadAreaDragging
                ]}
                onPress={handleFilePick}
                onHoverIn={() => Platform.OS === 'web' && setIsDragging(true)}
                onHoverOut={() => Platform.OS === 'web' && setIsDragging(false)}
              >
                <View style={styles.uploadIcon}>
                  <View style={styles.cloudIcon}>
                    <View style={styles.cloudCircle1} />
                    <View style={styles.cloudCircle2} />
                    <View style={styles.cloudCircle3} />
                  </View>
                  <View style={styles.uploadArrow}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </View>
                <Text style={styles.uploadText}>
                  Drag and Drop or Click Here to Search
                </Text>
              </Pressable>
            ) : (
              <View style={styles.fileDisplay}>
                <View style={styles.fileInfo}>
                  <View style={styles.fileIcon}>
                    <View style={styles.documentIcon} />
                  </View>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {resumeFile}
                  </Text>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={handleRemoveFile}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <Pressable
          style={[
            styles.backButton,
            hoveredButton === 'back' && styles.backButtonHover
          ]}
          onPress={onBack}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('back')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Pressable
          style={[
            styles.continueButton,
            !resumeFile && styles.continueButtonDisabled,
            hoveredButton === 'continue' && styles.continueButtonHover
          ]}
          onPress={handleContinue}
          disabled={!resumeFile}
          onHoverIn={() => Platform.OS === 'web' && resumeFile && setHoveredButton('continue')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingStep2;

