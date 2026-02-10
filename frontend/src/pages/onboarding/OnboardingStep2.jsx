import React, { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '../../services/api';
import styles from './OnboardingStep2.styles';

const OnboardingStep2 = ({ formData, onNext, onBack }) => {
  const [resumeFile, setResumeFile] = useState(formData.resumeFileName || '');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errors, setErrors] = useState({});

  // Parse resume and extract data
  const extractResumeData = async (file) => {
    setIsExtracting(true);
    setErrors({});
    
    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      const resumePart = file.file
        ? file.file
        : {
            uri: file.uri,
            name: file.name || 'resume.pdf',
            type: file.mimeType || 'application/pdf',
          };
      const resumeName = resumePart?.name || file.name || 'resume.pdf';
      formDataObj.append('resume_file', resumePart, resumeName);
      
      // Call backend parsing endpoint
      const response = await fetch('http://localhost:8000/resume/parse', {
        method: 'POST',
        body: formDataObj,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('career_ai_token')}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse resume');
      }
      
      setIsExtracting(false);
      return data.data || {};
    } catch (error) {
      setErrors({ resume: error.message || 'Error parsing resume' });
      setIsExtracting(false);
      return null;
    }
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
        
        // Extract data from resume by calling backend
        const extractedData = await extractResumeData(file);
        
        if (extractedData) {
          onNext({ 
            resume: file, 
            resumeFileName: file.name,
            extractedData: extractedData
          });
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setErrors({ resume: 'Error selecting file' });
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setResumeFile('');
    setErrors({});
    onNext({ resume: null, resumeFileName: '', extractedData: null });
  };

  const handleContinue = () => {
    if (!resumeFile) {
      setErrors({ resume: 'Resume is required' });
      return;
    }
    onNext({});
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.textSection}>
          <Text style={styles.title}>
            Attach Your Resume{'\n'}
            & We'll Get Started
          </Text>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.requiredLabel}>Resume*</Text>
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
      {!!errors.resume && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.resume}</Text>
        </View>
      )}

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

