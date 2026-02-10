import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './CoverLetterJobPostingPage.styles';
import './JobPages.css';
import { generateCoverLetter, downloadPDFFromBase64 } from '../services/aiService';
import PDFViewer from '../components/PDFViewer';

const CoverLetterJobPostingPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTags, setSelectedTags] = useState(['Student', 'AI', 'Software Development', 'Calgary']);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState('');
  const [progress, setProgress] = useState(0);

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success' || !result.canceled) {
        const uri = result.uri ?? result.assets?.[0]?.uri ?? result.assets?.[0]?.fileCopyUri;
        const name = result.name ?? result.assets?.[0]?.name;
        setSelectedFile({ uri, name });
      }
    } catch (error) {
      setError('Error picking document: ' + error.message);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!selectedFile) {
      setError('Please upload your resume');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressStep('Starting...');
    
    try {
      const result = await generateCoverLetter(selectedFile, jobDescription, (data) => {
        setProgressStep(data.step);
        setProgress(data.progress);
      });
      setGeneratedCoverLetter(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressStep('');
    }
  };

  const handleDownloadPDF = () => {
    if (generatedCoverLetter?.pdf_base64) {
      downloadPDFFromBase64(generatedCoverLetter.pdf_base64, 'cover_letter.pdf');
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={['#0A0A0F', '#12101A', '#0A0A0F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <View style={styles.headerBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>AI Cover Letter Generator</Text>
              </View>
              <Text style={styles.headerTitle}>
                Generate Cover Letter from Job Posting
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

              {/* Your Resume Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Resume</Text>
                <Pressable
                  style={[
                    styles.uploadButton,
                    hoveredButton === 'upload' && styles.uploadButtonHover
                  ]}
                  onPress={pickDocument}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('upload')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <View style={styles.uploadIcon}>
                    <View style={styles.uploadIconArrow} />
                  </View>
                  <Text style={styles.uploadButtonText}>
                    {selectedFile ? selectedFile.name : 'Upload Resume (PDF, DOC, DOCX)'}
                  </Text>
                </Pressable>
                {selectedFile && (
                  <Text style={styles.selectedFileText}>Selected: {selectedFile.name}</Text>
                )}
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Generate Cover Letter Button */}
              <Pressable
                style={[
                  styles.generateButton,
                  hoveredButton === 'generate' && styles.generateButtonHover,
                  isLoading && styles.generateButtonDisabled
                ]}
                onPress={handleGenerateCoverLetter}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('generate')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Cover Letter</Text>
                )}
              </Pressable>
            </View>

            {/* Right Panel - Cover Letter Preview */}
            <View style={styles.rightPanel}>
              <View style={styles.previewArea}>
                {isLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={[styles.previewText, { marginTop: 16, fontWeight: '600' }]}>{progressStep}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.previewText, { marginTop: 8, fontSize: 14 }]}>{progress}%</Text>
                  </>
                ) : generatedCoverLetter && generatedCoverLetter.pdf_base64 ? (
                  <PDFViewer pdfBase64={generatedCoverLetter.pdf_base64} />
                ) : (
                  <>
                    <View style={styles.previewIcon}>
                      <View style={styles.documentIcon} />
                    </View>
                    <Text style={styles.previewText}>Your tailored cover letter will appear here</Text>
                  </>
                )}
              </View>

              {generatedCoverLetter && (
                <Pressable
                  style={[
                    styles.downloadButton,
                    hoveredButton === 'download' && styles.downloadButtonHover,
                  ]}
                  onPress={handleDownloadPDF}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('download')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </Pressable>
              )}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default CoverLetterJobPostingPage;

