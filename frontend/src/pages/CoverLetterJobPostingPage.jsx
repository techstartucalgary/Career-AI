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
import { API_BASE_URL, apiFetch, getAuthToken, getUserProfile } from '../services/api';
import { getGithubStatus, openGithubConnect, fetchGithubContext } from '../services/githubService';
import { useBreakpoints } from '../hooks/useBreakpoints';

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

  if (file?.fileDataBase64) {
    const byteCharacters = atob(file.fileDataBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });
    formData.append('document_file', new File([blob], name, { type }));
  } else if (Platform.OS === 'web') {
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
  const { isDesktop } = useBreakpoints();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeSource, setResumeSource] = useState('profile');
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
  const [profileResumeFile, setProfileResumeFile] = useState(null);
  const [profileResumeLoading, setProfileResumeLoading] = useState(true);
  const [savingProfileResume, setSavingProfileResume] = useState(false);
  const [saveProfileResumeMessage, setSaveProfileResumeMessage] = useState('');
  const [saveProfileResumeError, setSaveProfileResumeError] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  // GitHub integration state
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState(null);
  const [useGithub, setUseGithub] = useState(true);
  const [githubFetching, setGithubFetching] = useState(false);

  React.useEffect(() => {
    getGithubStatus().then(({ connected, username }) => {
      setGithubConnected(connected);
      setGithubUsername(username);
    });

    const loadDefaultResume = async () => {
      try {
        setProfileResumeLoading(true);
        const response = await getUserProfile();
        const resumeData = response?.data?.resume;
        if (resumeData?.file_data) {
          const file = {
            name: resumeData.file_name || 'default_resume.pdf',
            mimeType: 'application/pdf',
            fileDataBase64: resumeData.file_data,
            uri: `data:application/pdf;base64,${resumeData.file_data}`,
          };
          setProfileResumeFile(file);
          setResumeSource('profile');
        }
      } catch (err) {
        console.log('Default resume unavailable:', err?.message || err);
      } finally {
        setProfileResumeLoading(false);
      }
    };

    loadDefaultResume();
  }, []);

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
        setResumeSource('upload');
      }
    } catch (error) {
      setError('Error picking document: ' + error.message);
    }
  };

  const clearUploadedResume = () => {
    setSelectedFile(null);
    setResumeSource('profile');
  };

  const handleSaveUploadedResumeAsProfile = async () => {
    if (!selectedFile) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSaveProfileResumeError('Please sign in to save your profile resume.');
      return;
    }

    try {
      setSavingProfileResume(true);
      setSaveProfileResumeError('');
      setSaveProfileResumeMessage('');

      const name = selectedFile.name || 'profile_resume.pdf';
      const type = selectedFile.mimeType || 'application/pdf';
      const formData = new FormData();

      if (selectedFile.fileDataBase64) {
        const byteCharacters = atob(selectedFile.fileDataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type });
        formData.append('resume_file', new File([blob], name, { type }));
      } else if (Platform.OS === 'web') {
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        formData.append('resume_file', new File([blob], name, { type }));
      } else {
        formData.append('resume_file', {
          uri: selectedFile.uri,
          name,
          type,
        });
      }

      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.detail || 'Failed to save profile resume.');
      }

      const saved = {
        ...selectedFile,
        name: data?.data?.file_name || name,
      };
      setProfileResumeFile(saved);
      setResumeSource('profile');
      setSaveProfileResumeMessage('Saved to profile resume.');
    } catch (error) {
      setSaveProfileResumeError(error?.message || 'Failed to save profile resume.');
    } finally {
      setSavingProfileResume(false);
    }
  };

  const handleUploadSourcePress = async () => {
    if (selectedFile) {
      if (resumeSource !== 'upload') {
        setResumeSource('upload');
        return;
      }
      await pickDocument();
      return;
    }

    await pickDocument();
  };

  const calculateAtsScoreForFile = async (resumeFile) => {
    if (!resumeFile?.uri && !resumeFile?.fileDataBase64) {
      setAtsError('Add a resume source to calculate ATS score.');
      return null;
    }
    if (!jobDescription.trim()) {
      setAtsError('Paste a job description to calculate ATS score.');
      return null;
    }

    try {
      const formData = await buildAtsFormData(resumeFile, jobDescription);

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
    const activeResumeFile = resumeSource === 'upload'
      ? selectedFile
      : profileResumeFile;

    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!activeResumeFile) {
      setError('Upload a resume or use your profile resume to continue.');
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
        generateCoverLetter(activeResumeFile, jobDescription, (data) => {
          setProgressStep(data.step);
          setProgress(data.progress);
        }, selectedTemplate),
        calculateAtsScoreForFile(activeResumeFile),
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

            <View style={[styles.panelsContainer, { flexDirection: isDesktop ? 'row' : 'column' }]}>
              {/* Left Panel - Input Section */}
              <View style={[styles.leftPanel, { minHeight: isDesktop ? 600 : 400 }]}>
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
                    {resumeSource === 'upload' && selectedFile && (
                      <Pressable
                        style={[styles.saveUploadButton, savingProfileResume && styles.saveUploadButtonDisabled]}
                        onPress={handleSaveUploadedResumeAsProfile}
                        disabled={savingProfileResume}
                      >
                        <Text style={styles.saveUploadButtonText}>
                          {savingProfileResume ? 'Saving...' : 'Make Profile Resume'}
                        </Text>
                      </Pressable>
                    )}
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

              {/* Resume Upload Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resume Upload</Text>
                <Pressable
                  style={[
                    styles.resumeSourceCard,
                    resumeSource === 'profile' && styles.resumeSourceCardActive,
                  ]}
                  onPress={() => setResumeSource('profile')}
                >
                  <View style={styles.resumeSourceHeader}>
                    <Text style={styles.resumeSourceTitle}>Profile Resume</Text>
                    {resumeSource === 'profile' && <Text style={styles.resumeSourceBadge}>SELECTED</Text>}
                  </View>
                  <Text style={styles.resumeSourceMeta}>
                    {profileResumeLoading
                      ? 'Checking profile...'
                      : profileResumeFile?.name || 'No profile resume found'}
                  </Text>
                </Pressable>

                <View style={styles.resumeSourceDividerRow}>
                  <View style={styles.resumeSourceDividerLine} />
                  <Text style={styles.resumeSourceDividerText}>OR</Text>
                  <View style={styles.resumeSourceDividerLine} />
                </View>

                <Pressable
                  style={[
                    styles.uploadButton,
                    resumeSource === 'upload' && styles.uploadButtonActive,
                    hoveredButton === 'upload' && styles.uploadButtonHover
                  ]}
                  onPress={handleUploadSourcePress}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('upload')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <View style={styles.uploadIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} style={{ color: '#A78BFA' }}>
                        <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 9L12 4L17 9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 16.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <Text style={styles.uploadIconFallback}>↑</Text>
                    )}
                  </View>
                  <Text style={styles.uploadButtonText}>
                    {selectedFile ? selectedFile.name : 'Upload Resume (Optional)'}
                  </Text>
                </Pressable>
                {selectedFile && (
                  <View style={styles.selectedFileRow}>
                    <Text style={styles.selectedFileText}>
                      {resumeSource === 'upload'
                        ? `Selected source: File upload (${selectedFile.name})`
                        : `Selected source: Profile resume (${profileResumeFile?.name || 'No profile resume found'})`}
                    </Text>
                    <View style={styles.selectedFileActions}>
                      <Pressable style={styles.clearUploadButton} onPress={clearUploadedResume}>
                        <Text style={styles.clearUploadButtonText}>Remove Upload</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.saveUploadButton, savingProfileResume && styles.saveUploadButtonDisabled]}
                        onPress={handleSaveUploadedResumeAsProfile}
                        disabled={savingProfileResume}
                      >
                        <Text style={styles.saveUploadButtonText}>
                          {savingProfileResume ? 'Saving...' : 'Make Profile Resume'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
                {!selectedFile && profileResumeFile && (
                  <Text style={styles.resumeFallbackText}>No upload selected, using profile resume.</Text>
                )}
                {!!saveProfileResumeMessage && <Text style={styles.saveProfileSuccess}>{saveProfileResumeMessage}</Text>}
                {!!saveProfileResumeError && <Text style={styles.saveProfileError}>{saveProfileResumeError}</Text>}
              </View>

              {/* Cover Letter Template Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cover Letter Style</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { id: 'classic', label: 'Classic', desc: 'Helvetica, clean' },
                    { id: 'modern',  label: 'Modern',  desc: 'Serif, formal' },
                    { id: 'compact', label: 'Compact', desc: 'Concise layout' },
                  ].map((tmpl) => (
                    <Pressable
                      key={tmpl.id}
                      onPress={() => setSelectedTemplate(tmpl.id)}
                      onHoverIn={() => Platform.OS === 'web' && setHoveredTemplate(tmpl.id)}
                      onHoverOut={() => Platform.OS === 'web' && setHoveredTemplate(null)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        borderColor: selectedTemplate === tmpl.id ? '#A78BFA' : 'rgba(255,255,255,0.1)',
                        backgroundColor: selectedTemplate === tmpl.id ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
                        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}),
                      }}
                    >
                      <Text style={{ color: selectedTemplate === tmpl.id ? '#A78BFA' : 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 }}>
                        {tmpl.label}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                        {tmpl.desc}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* GitHub Integration */}
              <View style={{
                borderWidth: 1,
                borderColor: githubConnected ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                backgroundColor: githubConnected ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {Platform.OS === 'web' && (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill={githubConnected ? '#A78BFA' : '#9CA3AF'}>
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    <Text style={{ color: githubConnected ? '#A78BFA' : '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                      {githubConnected ? `@${githubUsername}` : 'GitHub Projects'}
                    </Text>
                    {githubConnected && (
                      <View style={{ backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '700' }}>CONNECTED</Text>
                      </View>
                    )}
                  </View>

                  {githubConnected ? (
                    <Pressable
                      onPress={() => setUseGithub(!useGithub)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Text style={{ color: '#9CA3AF', fontSize: 11 }}>{useGithub ? 'On' : 'Off'}</Text>
                      <View style={{
                        width: 36, height: 20, borderRadius: 10,
                        backgroundColor: useGithub ? '#A78BFA' : 'rgba(255,255,255,0.15)',
                        justifyContent: 'center', paddingHorizontal: 2,
                      }}>
                        <View style={{
                          width: 16, height: 16, borderRadius: 8,
                          backgroundColor: '#fff',
                          alignSelf: useGithub ? 'flex-end' : 'flex-start',
                        }} />
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={openGithubConnect}
                      style={{
                        backgroundColor: 'rgba(167,139,250,0.15)',
                        borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)',
                        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>Connect GitHub</Text>
                    </Pressable>
                  )}
                </View>

                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 8 }}>
                  {githubConnected
                    ? useGithub
                      ? 'Your GitHub projects will be used to enrich your cover letter.'
                      : 'GitHub data will not be included this time.'
                    : 'Connect to let AI pull in your real projects & skills.'}
                </Text>

                {githubFetching && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                    <Text style={{ color: '#A78BFA', fontSize: 11 }}>Importing GitHub projects...</Text>
                  </View>
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
            <View style={[styles.rightPanel, { minHeight: isDesktop ? 600 : 400 }]}>
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

              <View style={[styles.actionRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
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
                      <Text style={styles.atsScoreTitle}>ATS Score</Text>
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

                <View style={styles.atsScorePanel}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                    <ProgressRing progress={0} size={70} strokeWidth={5} color="#A78BFA" />
                    <View style={styles.atsScoreInfo}>
                      <Text style={styles.atsScoreTitle}>Match Score</Text>
                      <Text style={styles.atsScoreDesc}>---</Text>
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

