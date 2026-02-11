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
import { API_BASE_URL } from '../services/api';

const ProgressRing = ({ progress = 0, size = 60, strokeWidth = 4, color = '#A78BFA' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      {Platform.OS === 'web' ? (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <View style={styles.progressRingFallback} />
      )}
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

const formatApiError = (detail) => {
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(' ');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return detail || 'ATS scoring failed.';
};

const buildAtsFormData = async (file, jobDescription) => {
  const formData = new FormData();
  const name = file?.name || 'document.pdf';
  const type = file?.mimeType || 'application/pdf';

  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append('document_file', new File([blob], name, { type }));
  } else {
    formData.append('document_file', {
      uri: file.uri,
      name,
      type,
    });
  }

  formData.append('job_description', jobDescription);
  return formData;
};

const buildAtsFormDataFromBase64 = async (base64, filename, jobDescription) => {
  const formData = new FormData();
  const name = filename || 'document.pdf';
  const type = 'application/pdf';

  if (Platform.OS === 'web') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });
    formData.append('document_file', new File([blob], name, { type }));
  } else {
    formData.append('document_file', {
      uri: `data:${type};base64,${base64}`,
      name,
      type,
    });
  }

  formData.append('job_description', jobDescription);
  return formData;
};

// Extract keywords from job description for highlighting
const extractKeywords = (jobDescription) => {
  if (!jobDescription) return [];
  
  // Common keywords to look for
  const commonKeywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'database', 'api', 'rest', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'ci/cd', 'testing', 'automation', 'design', 'architecture', 'system', 'data', 'analytics', 'machine', 'learning', 'ai', 'ml', 'web', 'mobile', 'backend', 'frontend', 'fullstack', 'devops', 'cloud', 'microservices'];
  
  const lowerDesc = jobDescription.toLowerCase();
  return commonKeywords.filter(keyword => lowerDesc.includes(keyword));
};

const CoverLetterJobPostingPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTags, setSelectedTags] = useState(['Student', 'AI', 'Software Development', 'Calgary']);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredAts, setHoveredAts] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [originalAtsScore, setOriginalAtsScore] = useState(null);
  const [finalAtsScore, setFinalAtsScore] = useState(null);
  const [atsImprovement, setAtsImprovement] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [keywords, setKeywords] = useState([]);

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
        const mimeType = result.mimeType ?? result.assets?.[0]?.mimeType;
        setSelectedFile({ uri, name, mimeType });
      }
    } catch (error) {
      setError('Error picking document: ' + error.message);
    }
  };

  const calculateAtsScoreForFile = async () => {
    if (!selectedFile?.uri) {
      setAtsError('Upload your resume to calculate ATS score.');
      return null;
    }
    if (!jobDescription.trim()) {
      setAtsError('Paste a job description to calculate ATS score.');
      return null;
    }

    try {
      const formData = await buildAtsFormData(selectedFile, jobDescription);

      const response = await fetch(`${API_BASE_URL}/api/ats-score`, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(formatApiError(data?.detail || data?.message));
      }

      return data?.match_score ?? 0;
    } catch (error) {
      setAtsError(error?.message || 'ATS scoring failed.');
      return null;
    }
  };

  const calculateAtsScoreForBase64 = async (pdfBase64, filename) => {
    if (!pdfBase64 || !jobDescription.trim()) {
      return null;
    }

    try {
      const formData = await buildAtsFormDataFromBase64(pdfBase64, filename, jobDescription);

      const response = await fetch(`${API_BASE_URL}/api/ats-score`, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(formatApiError(data?.detail || data?.message));
      }

      return data?.match_score ?? 0;
    } catch (error) {
      setAtsError(error?.message || 'ATS scoring failed.');
      return null;
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
    
    // Extract keywords from job description
    const extractedKeywords = extractKeywords(jobDescription);
    setKeywords(extractedKeywords);
    
    try {
      setAtsLoading(true);
      setAtsError('');

      const [result, originalScore] = await Promise.all([
        generateCoverLetter(selectedFile, jobDescription, (data) => {
          setProgressStep(data.step);
          setProgress(data.progress);
        }),
        calculateAtsScoreForFile(),
      ]);

      setGeneratedCoverLetter(result);

      let finalScore = null;
      if (result?.pdf_base64) {
        finalScore = await calculateAtsScoreForBase64(result.pdf_base64, 'cover_letter.pdf');
      }

      if (originalScore !== null) {
        setOriginalAtsScore(originalScore);
      }
      if (finalScore !== null) {
        setFinalAtsScore(finalScore);
      }
      if (originalScore !== null && finalScore !== null) {
        setAtsImprovement(finalScore - originalScore);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressStep('');
      setAtsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedCoverLetter?.pdf_base64) {
      downloadPDFFromBase64(generatedCoverLetter.pdf_base64, 'cover_letter.pdf');
    }
  };

  const canDownload = Boolean(generatedCoverLetter?.pdf_base64);

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
                    <ActivityIndicator size="large" color="#A78BFA" />
                    <Text style={[styles.previewText, { marginTop: 16, fontWeight: '600' }]}>{progressStep}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.previewText, { marginTop: 8, fontSize: 14 }]}>{progress}%</Text>
                  </>
                ) : generatedCoverLetter && generatedCoverLetter.pdf_base64 ? (
                  <>
                    <ScrollView style={styles.resumeContentScroll}>
                      <View style={styles.coverLetterContent}>
                        {generatedCoverLetter.cover_letter && (
                          <>
                            <Text style={styles.coverLetterDate}>{new Date().toLocaleDateString()}</Text>
                            {generatedCoverLetter.cover_letter.full_text && (
                              <Text style={styles.coverLetterBody}>{generatedCoverLetter.cover_letter.full_text}</Text>
                            )}
                          </>
                        )}
                      </View>
                    </ScrollView>
                    <Pressable
                      style={[
                        styles.downloadButton,
                        !canDownload && styles.downloadButtonDisabled,
                        hoveredButton === 'download' && canDownload && styles.downloadButtonHover,
                      ]}
                      onPress={handleDownloadPDF}
                      onHoverIn={() => Platform.OS === 'web' && setHoveredButton('download')}
                      onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                      disabled={!canDownload}
                    >
                      {pdfGenerating ? (
                        <ActivityIndicator size={20} color="#fff" />
                      ) : Platform.OS === 'web' ? (
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: '#fff' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      ) : (
                        <Text style={styles.downloadButtonText}>↓</Text>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.placeholderContent}>
                      <View style={styles.placeholderLine} />
                      <View style={[styles.placeholderLine, { width: '85%' }]} />
                      <View style={[styles.placeholderLine, { marginTop: 24, width: '95%' }]} />
                      <View style={[styles.placeholderLine, { width: '90%' }]} />
                      <View style={[styles.placeholderLine, { width: '88%' }]} />
                      <View style={[styles.placeholderLine, { marginTop: 24, width: '92%' }]} />
                      <View style={[styles.placeholderLine, { width: '87%' }]} />
                    </View>
                    <Text style={styles.previewText}>Your tailored cover letter will appear here</Text>
                    <Pressable
                      style={[
                        styles.downloadButton,
                        styles.downloadButtonDisabled,
                      ]}
                      disabled={true}
                    >
                      {Platform.OS === 'web' ? (
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: '#fff' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      ) : (
                        <Text style={styles.downloadButtonText}>↓</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.actionRow}>
                <View 
                  style={[
                    styles.atsScorePanel,
                    hoveredAts && styles.atsScorePanelHover,
                  ]}
                  onMouseEnter={() => Platform.OS === 'web' && setHoveredAts(true)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoveredAts(false)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                    <ProgressRing progress={finalAtsScore ?? 0} size={70} strokeWidth={5} color="#A78BFA" />
                    <View style={styles.atsScoreInfo}>
                      <Text style={styles.atsScoreTitle}>ATS Match Score</Text>
                      {atsLoading && (
                        <Text style={styles.atsScoreDesc}>Analyzing ATS match...</Text>
                      )}
                      {!atsLoading && finalAtsScore === null && !atsError && (
                        <Text style={styles.atsScoreDesc}>Generate a cover letter to see your score</Text>
                      )}
                      {atsImprovement !== null && (
                        <Text style={styles.atsScoreMeta}>
                          {`${atsImprovement >= 0 ? '+' : ''}${atsImprovement.toFixed(1)}% vs original`}
                        </Text>
                      )}
                      {!!atsError && <Text style={styles.atsScoreError}>{atsError}</Text>}
                    </View>
                  </View>
                </View>
              </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default CoverLetterJobPostingPage;

