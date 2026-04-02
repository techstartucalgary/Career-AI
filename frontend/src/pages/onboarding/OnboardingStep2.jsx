import React, { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import styles from './OnboardingStep2.styles';

const OnboardingStep2 = ({ formData, onNext, onBack }) => {
  const [resumeFile, setResumeFile] = useState(formData.resumeFileName || '');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errors, setErrors] = useState({});

  const extractResumeData = async (file) => {
    setIsExtracting(true);
    setErrors({});

    try {
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

      return data.data || {};
    } catch (error) {
      setErrors({ resume: error.message || 'Error parsing resume' });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeFile(file.name);

        const extractedData = await extractResumeData(file);

        if (extractedData) {
          onNext({
            resume: file,
            resumeFileName: file.name,
            extractedData,
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
    setErrors({});
    onNext({});
  };

  return (
    <View style={styles.container}>
      {formData.email && (
        <View style={styles.emailBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{formData.email}</Text>
        </View>
      )}

      <View style={styles.contentRow}>
        <View style={styles.textSection}>
          <Text style={styles.title}>
            Attach Your Resume{'\n'}
            & We'll Get Started
          </Text>
        </View>

        <View style={styles.uploadSection}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadCardHeader}>
              {/* <Text style={styles.uploadCardTitle}>Resume upload</Text> */}
              <Text style={styles.uploadCardSubtitle}>
                Upload a PDF, DOC, or DOCX and we’ll prefill what we can.
              </Text>
            </View>

            {isExtracting ? (
              <View style={styles.extractingContainer}>
                <ActivityIndicator size="large" color="#A78BFA" />
                <Text style={styles.extractingText}>
                  Extracting information from your resume...
                </Text>
              </View>
            ) : !resumeFile ? (
              <>
                <Pressable
                  style={[
                    styles.uploadArea,
                    isDragging && styles.uploadAreaDragging,
                  ]}
                  onPress={handleFilePick}
                  onHoverIn={() => Platform.OS === 'web' && setIsDragging(true)}
                  onHoverOut={() => Platform.OS === 'web' && setIsDragging(false)}
                >
                  <View style={styles.uploadIcon}>
                    {Platform.OS === 'web' ? (
                      <svg
                        width={44}
                        height={44}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        style={{ color: '#A78BFA' }}
                      >
                        <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 9L12 4L17 9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 16.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <Text style={styles.uploadIconFallback}>↑</Text>
                    )}
                  </View>
                  <Text style={styles.uploadText}>
                    Drag and drop or click to upload
                  </Text>
                </Pressable>
                <Text style={styles.uploadHint}>
                  or continue and fill out information yourself
                </Text>
              </>
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
                <Pressable style={styles.removeButton} onPress={handleRemoveFile}>
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
            hoveredButton === 'back' && styles.backButtonHover,
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
            hoveredButton === 'continue' && styles.continueButtonHover,
          ]}
          onPress={handleContinue}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('continue')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingStep2;
