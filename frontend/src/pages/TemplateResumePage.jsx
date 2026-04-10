import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './TemplateResumePage.styles';
import './JobPages.css';
import { tailorResume, generateFromTemplate, downloadPDFFromBase64 } from '../services/aiService';
import PDFViewer from '../components/PDFViewer';
import { getGithubStatus, openGithubConnect, fetchGithubContext } from '../services/githubService';
import { API_BASE_URL, apiFetch, getAuthToken, getUserProfile } from '../services/api';

const DEFAULT_OPTIMIZATION_JOB_DESCRIPTION =
  'General ATS-ready resume evaluation for software roles. Focus on relevant technical skills, measurable impact, and role-aligned experience. Include programming languages, frameworks, databases, cloud, CI/CD, and project outcomes.';


const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Highlight keywords in text
const highlightKeywords = (text, keywords, styles) => {
  const sourceText = typeof text === 'string' ? text : String(text || '');
  if (!sourceText) return <Text style={styles.entryBullet} />;
  if (!keywords || keywords.length === 0) return <Text style={styles.entryBullet}>{sourceText}</Text>;

  const normalizedKeywords = Array.from(
    new Set(
      keywords
        .filter(Boolean)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)
    )
  ).sort((a, b) => b.length - a.length);

  if (normalizedKeywords.length === 0) {
    return <Text style={styles.entryBullet}>{sourceText}</Text>;
  }

  const alternation = normalizedKeywords.map(escapeRegex).join('|');
  const regex = new RegExp(`(^|[^A-Za-z0-9])(${alternation})(?=$|[^A-Za-z0-9])`, 'gi');
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(sourceText)) !== null) {
    const fullMatchStart = match.index;
    const prefix = match[1] || '';
    const keyword = match[2] || '';
    const keywordStart = fullMatchStart + prefix.length;

    if (fullMatchStart > lastIndex) {
      parts.push(sourceText.slice(lastIndex, fullMatchStart));
    }

    if (prefix) {
      parts.push(prefix);
    }

    parts.push(
      <Text key={`kw-${keywordStart}-${keyword.toLowerCase()}`} style={[styles.entryBullet, styles.bulletHighlighted]}>
        {keyword}
      </Text>
    );

    lastIndex = keywordStart + keyword.length;

    if (regex.lastIndex === match.index) {
      regex.lastIndex += 1;
    }
  }

  if (lastIndex < sourceText.length) {
    parts.push(sourceText.slice(lastIndex));
  }

  return <Text style={styles.entryBullet}>{parts}</Text>;
};

const TemplateResumePage = () => {
  const { mode } = useLocalSearchParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [defaultResumeFile, setDefaultResumeFile] = useState(null);
  const [resumeSource, setResumeSource] = useState('profile');
  const [templateFile, setTemplateFile] = useState(null); // optional file for template mode
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [keywords, setKeywords] = useState([]);

  // GitHub integration state
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState(null);
  const [useGithub, setUseGithub] = useState(true);
  const [githubFetching, setGithubFetching] = useState(false);
  const [profileResumeFile, setProfileResumeFile] = useState(null);
  const [profileResumeLoading, setProfileResumeLoading] = useState(true);
  const [savingProfileResume, setSavingProfileResume] = useState(false);
  const [saveProfileResumeMessage, setSaveProfileResumeMessage] = useState('');
  const [saveProfileResumeError, setSaveProfileResumeError] = useState('');


  useEffect(() => {
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
          setDefaultResumeFile(file);
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

  const pickDocument = async (forTemplateMode = false) => {
    // Use native HTML file input for web (works reliably with Vite)
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        const cleanup = () => {
          document.body.removeChild(input);
        };
        
        input.addEventListener('change', (e) => {
          const pickedFile = e.target.files?.[0];
          if (pickedFile) {
            const uri = URL.createObjectURL(pickedFile);
            const file = { uri, name: pickedFile.name, mimeType: pickedFile.type };
            if (forTemplateMode) {
              setTemplateFile(file);
              setResumeSource('upload');
            } else {
              setSelectedFile(file);
              setTemplateMode('optimize');
              setResumeSource('upload');
            }
          }
          cleanup();
          resolve();
        });
        
        // Handle cancel (user closes dialog without selecting)
        input.addEventListener('cancel', () => {
          cleanup();
          resolve();
        });
        
        input.click();
      });
    }

    // Fallback to expo-document-picker for native platforms
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.canceled === false && result.assets?.[0]) {
        const asset = result.assets[0];
        const file = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType };
        if (forTemplateMode) {
          setTemplateFile(file);
          setResumeSource('upload');
        } else {
          setSelectedFile(file);
          setTemplateMode('optimize');
          setResumeSource('upload');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const getActiveResumeUpload = () => {
    const uploadFile = templateMode === 'template' ? templateFile : selectedFile;
    if (resumeSource === 'upload') {
      return uploadFile || profileResumeFile || defaultResumeFile;
    }
    return profileResumeFile || defaultResumeFile;
  };

  const clearUploadedResume = () => {
    if (templateMode === 'template') {
      setTemplateFile(null);
    } else {
      setSelectedFile(null);
    }
    setResumeSource('profile');
  };

  const handleUploadSourcePress = async () => {
    const uploadFile = templateMode === 'template' ? templateFile : selectedFile;
    if (uploadFile) {
      if (resumeSource !== 'upload') {
        setResumeSource('upload');
        return;
      }
      await pickDocument(templateMode === 'template');
      return;
    }
    await pickDocument(templateMode === 'template');
  };

  const handleSaveUploadedResumeAsProfile = async () => {
    const uploadFile = templateMode === 'template' ? templateFile : selectedFile;
    if (!uploadFile) {
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

      const name = uploadFile.name || 'profile_resume.pdf';
      const type = uploadFile.mimeType || 'application/pdf';
      const formData = new FormData();

      if (uploadFile.fileDataBase64) {
        const byteCharacters = atob(uploadFile.fileDataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type });
        formData.append('resume_file', new File([blob], name, { type }));
      } else if (Platform.OS === 'web') {
        const response = await fetch(uploadFile.uri);
        const blob = await response.blob();
        formData.append('resume_file', new File([blob], name, { type }));
      } else {
        formData.append('resume_file', {
          uri: uploadFile.uri,
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

      const saved = { ...uploadFile, name: data?.data?.file_name || name };
      setProfileResumeFile(saved);
      setDefaultResumeFile(saved);
      setResumeSource('profile');
      setSaveProfileResumeMessage('Saved to profile resume.');
    } catch (error) {
      setSaveProfileResumeError(error?.message || 'Failed to save profile resume.');
    } finally {
      setSavingProfileResume(false);
    }
  };

  const handleGenerateResume = async () => {
    if (templateMode === 'template') {
      setIsLoading(true);
      setError(null);
      setGeneratedResume(null);
      setProgress(5);
      setProgressStep('Initializing...');
      try {
        const activeResume = getActiveResumeUpload();
        const useUploadedFile = resumeSource === 'upload' && !!activeResume;
        const result = await generateFromTemplate(selectedTemplate, (update) => {
          if (typeof update?.progress === 'number') setProgress(update.progress);
          if (update?.step) setProgressStep(update.step);
        }, useUploadedFile ? activeResume : null);
        setGeneratedResume(result);
        setKeywords(Array.isArray(result?.keywords) ? result.keywords.slice(0, 7) : []);
      } catch (err) {
        setError(err?.message || 'Resume generation failed. Make sure you have uploaded a resume to your account.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Optimize mode
    const activeResume = getActiveResumeUpload();
    if (!activeResume?.uri && !activeResume?.fileDataBase64) {
      setError('Add a resume source to optimize.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedResume(null);
    setProgress(0);
    setProgressStep('Starting optimization...');

    setKeywords([]);

    // Fetch GitHub context if connected and enabled
    let githubContext = null;
    if (githubConnected && useGithub) {
      setGithubFetching(true);
      setProgressStep('Importing GitHub projects...');
      try {
        githubContext = await fetchGithubContext();
      } catch (e) {
        console.warn('GitHub context fetch failed, continuing without it:', e);
      }
      setGithubFetching(false);
    }

    try {
      const result = await tailorResume(
        activeResume,
        DEFAULT_OPTIMIZATION_JOB_DESCRIPTION,
        {},
        (update) => {
          if (typeof update?.progress === 'number') setProgress(update.progress);
          if (update?.step) setProgressStep(update.step);
        },
        githubContext,
      );
      setGeneratedResume(result);
      setKeywords(Array.isArray(result?.keywords) ? result.keywords.slice(0, 7) : []);
    } catch (err) {
      setError(err?.message || 'Resume optimization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedResume?.pdf_base64) {
      return;
    }
    downloadPDFFromBase64(generatedResume.pdf_base64, 'optimized_resume.pdf');
  };

  const canDownload = !!generatedResume?.pdf_base64;

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
                <Text style={styles.badgeText}>
                  {templateMode === 'template' ? 'Resume Templates' : 'Resume Optimizer'}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                {templateMode === 'template'
                  ? 'Choose a Professional Template'
                  : 'Optimize Your Current Resume'}
              </Text>
              <Text style={styles.headerText}>
                {templateMode === 'template'
                  ? 'Select from our collection of professional templates and customize to your needs'
                  : 'Upload your resume and let AI enhance it for better ATS compatibility and impact'}
              </Text>
            </View>

            <View style={styles.panelsContainer}>
              {/* Left Panel - Input Section */}
              <View style={styles.leftPanel}>
                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                  <Pressable
                    style={[
                      styles.modeButton,
                      templateMode === 'template' && styles.modeButtonActive
                    ]}
                    onPress={() => setTemplateMode('template')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      templateMode === 'template' && styles.modeButtonTextActive
                    ]}>
                      Use Template
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modeButton,
                      templateMode === 'optimize' && styles.modeButtonActive
                    ]}
                    onPress={() => setTemplateMode('optimize')}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      templateMode === 'optimize' && styles.modeButtonTextActive
                    ]}>
                      Optimize Resume
                    </Text>
                  </Pressable>
                </View>

                {templateMode === 'template' ? (
                  <>
                    {/* Resume Source */}
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
                          hoveredButton === 'templateUpload' && styles.uploadButtonHover
                        ]}
                        onPress={handleUploadSourcePress}
                        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('templateUpload')}
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
                          {templateFile ? templateFile.name : 'Upload Resume (Optional)'}
                        </Text>
                      </Pressable>

                      {templateFile && (
                        <View style={styles.selectedFileRow}>
                          <Text style={styles.selectedFileText}>
                            {resumeSource === 'upload'
                              ? `Selected source: File upload (${templateFile.name})`
                              : `Selected source: Profile resume (${profileResumeFile?.name || defaultResumeFile?.name || 'No profile resume found'})`}
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
                      {!templateFile && (profileResumeFile || defaultResumeFile) && (
                        <Text style={styles.resumeFallbackText}>No upload selected, using profile resume.</Text>
                      )}
                      {!!saveProfileResumeMessage && <Text style={styles.saveProfileSuccess}>{saveProfileResumeMessage}</Text>}
                      {!!saveProfileResumeError && <Text style={styles.saveProfileError}>{saveProfileResumeError}</Text>}
                    </View>

                    {/* Template Selection */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Choose a Template</Text>
                      <View style={styles.templatesGrid}>
                        {[
                          { id: 'classic', label: 'Classic', desc: 'Clean Helvetica, ATS-optimised' },
                          { id: 'modern', label: 'Modern', desc: 'Serif font, left-aligned header' },
                          { id: 'compact', label: 'Compact', desc: 'Smaller type, fits more content' },
                        ].map((tmpl) => (
                          <Pressable
                            key={tmpl.id}
                            style={[
                              styles.templateCard,
                              selectedTemplate === tmpl.id && styles.templateCardSelected,
                              hoveredTemplate === tmpl.id && selectedTemplate !== tmpl.id && styles.templateCardHover,
                            ]}
                            onPress={() => setSelectedTemplate(tmpl.id)}
                            onHoverIn={() => Platform.OS === 'web' && setHoveredTemplate(tmpl.id)}
                            onHoverOut={() => Platform.OS === 'web' && setHoveredTemplate(null)}
                          >
                            <View
                              style={[
                                styles.templatePreview,
                                selectedTemplate === tmpl.id && { backgroundColor: 'rgba(167,139,250,0.08)' },
                              ]}
                            >
                              <View style={{ width: '80%', gap: 4 }}>
                                <View
                                  style={{
                                    height: tmpl.id === 'modern' ? 8 : 7,
                                    width: tmpl.id === 'modern' ? '60%' : '75%',
                                    alignSelf: tmpl.id === 'modern' ? 'flex-start' : 'center',
                                    backgroundColor: selectedTemplate === tmpl.id ? '#A78BFA' : 'rgba(255,255,255,0.3)',
                                    borderRadius: 2,
                                  }}
                                />
                                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 }} />
                                {[80, 65, 90, 70].map((w, i) => (
                                  <View
                                    key={i}
                                    style={{
                                      height: tmpl.id === 'compact' ? 4 : 5,
                                      width: `${w}%`,
                                      backgroundColor: 'rgba(255,255,255,0.15)',
                                      borderRadius: 2,
                                      marginBottom: tmpl.id === 'compact' ? 2 : 3,
                                    }}
                                  />
                                ))}
                              </View>
                            </View>
                            <Text style={[styles.templateName, selectedTemplate === tmpl.id && { color: '#A78BFA' }]}>
                              {tmpl.label}
                            </Text>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2 }}>
                              {tmpl.desc}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Resume Source */}
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
                              : `Selected source: Profile resume (${profileResumeFile?.name || defaultResumeFile?.name || 'No profile resume found'})`}
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
                      {!selectedFile && (profileResumeFile || defaultResumeFile) && (
                        <Text style={styles.resumeFallbackText}>No upload selected, using profile resume.</Text>
                      )}
                      {!!saveProfileResumeMessage && <Text style={styles.saveProfileSuccess}>{saveProfileResumeMessage}</Text>}
                      {!!saveProfileResumeError && <Text style={styles.saveProfileError}>{saveProfileResumeError}</Text>}
                    </View>
                  </>
                )}

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
                        ? 'Your GitHub projects will be used to enrich the resume.'
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
                  <Text style={styles.generateButtonText}>
                    {templateMode === 'template' ? 'Generate Resume' : 'Optimize Resume'}
                  </Text>
                </Pressable>
              </View>

              {/* Right Panel - Resume Preview */}
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
                  ) : generatedResume && generatedResume.pdf_base64 ? (
                    <>
                      <ScrollView style={styles.resumeContentScroll}>
                        <View style={styles.resumeContent}>
                          {/* Extract the actual resume data */}
                          {generatedResume && (generatedResume.resume_data || generatedResume.tailored_resume) && (
                            <>
                              {(() => {
                                const resumeData = generatedResume.resume_data || generatedResume.tailored_resume;
                                return (
                                  <>
                              {/* Header */}
                              {resumeData?.header && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeName}>{resumeData.header?.name}</Text>
                                  <Text style={styles.resumeContactInfo}>
                                    {[
                                      resumeData.header?.email,
                                      resumeData.header?.phone,
                                      resumeData.header?.linkedin,
                                      resumeData.header?.github,
                                      resumeData.header?.location
                                    ]
                                      .filter(Boolean)
                                      .join(' | ')}
                                  </Text>
                                </View>
                              )}

                              {/* Education - matches PDF order */}
                              {resumeData?.education?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>EDUCATION</Text>
                                  {resumeData.education.map((edu, idx) => (
                                    <View key={idx} style={styles.resumeEntry}>
                                      <View style={styles.entryHeader}>
                                        <Text style={styles.entryTitle}>{edu.degree}</Text>
                                        <Text style={styles.entryDate}>{edu.graduation_date}</Text>
                                      </View>
                                      <Text style={styles.entryCompany}>{edu.school}</Text>
                                      {edu.location && (
                                        <Text style={styles.entryLocation}>{edu.location}</Text>
                                      )}
                                      {edu.gpa && (
                                        <Text style={styles.entryLocation}>GPA: {edu.gpa}</Text>
                                      )}
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Experience */}
                              {resumeData?.experience?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>EXPERIENCE</Text>
                                  {resumeData.experience.map((exp, idx) => (
                                    <View key={idx} style={styles.resumeEntry}>
                                      <View style={styles.entryHeader}>
                                        <Text style={styles.entryTitle}>{exp.title}</Text>
                                        <Text style={styles.entryDate}>
                                          {exp.start_date && exp.end_date 
                                            ? `${exp.start_date} - ${exp.end_date}`
                                            : exp.duration || 'Present'}
                                        </Text>
                                      </View>
                                      <Text style={styles.entryCompany}>{exp.company}</Text>
                                      {exp.location && (
                                        <Text style={styles.entryLocation}>{exp.location}</Text>
                                      )}
                                      {exp.bullets && exp.bullets.map((bullet, bidx) => (
                                        <View key={bidx} style={{ flexDirection: 'row' }}>
                                          <Text style={[styles.entryBullet, { marginRight: 4 }]}>•</Text>
                                          {highlightKeywords(typeof bullet === 'string' ? bullet : bullet.text || bullet, keywords, styles)}
                                        </View>
                                      ))}
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Projects - matches PDF content */}
                              {resumeData?.projects?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>PROJECTS</Text>
                                  {resumeData.projects.map((project, idx) => (
                                    <View key={idx} style={styles.resumeEntry}>
                                      <View style={styles.entryHeader}>
                                        <Text style={styles.entryTitle}>{project.name}</Text>
                                        <Text style={styles.entryDate}>{project.dates || ''}</Text>
                                      </View>
                                      {(project.technologies || []).length > 0 && (
                                        <Text style={styles.entryCompany}>{project.technologies.join(' | ')}</Text>
                                      )}
                                      {project.bullets && project.bullets.map((bullet, bidx) => (
                                        <View key={bidx} style={{ flexDirection: 'row' }}>
                                          <Text style={[styles.entryBullet, { marginRight: 4 }]}>•</Text>
                                          {highlightKeywords(typeof bullet === 'string' ? bullet : bullet.text || bullet, keywords, styles)}
                                        </View>
                                      ))}
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Skills */}
                              {resumeData?.skills && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>SKILLS</Text>
                                  <Text style={styles.resumeSkills}>
                                    {Array.isArray(resumeData.skills)
                                      ? resumeData.skills.map(s => s.name || s).join(' • ')
                                      : [
                                          ...(resumeData.skills.languages || []),
                                          ...(resumeData.skills.frameworks || []),
                                          ...(resumeData.skills.tools || []),
                                          ...(resumeData.skills.other || []),
                                        ].join(' • ')}
                                  </Text>
                                </View>
                              )}
                                  </>
                                );
                              })()}
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
                      <Text style={styles.previewText}>Your optimized resume will appear here</Text>
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
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default TemplateResumePage;




