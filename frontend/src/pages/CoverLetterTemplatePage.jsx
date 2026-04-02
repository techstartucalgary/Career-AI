import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './CoverLetterTemplatePage.styles';
import './JobPages.css';
import { generateCoverLetter, downloadPDFFromBase64 } from '../services/aiService';
import PDFViewer from '../components/PDFViewer';
import { API_BASE_URL, apiFetch, getAuthToken } from '../services/api';

const DEFAULT_OPTIMIZATION_JOB_DESCRIPTION =
  'General ATS-ready cover letter for software roles. Emphasize relevant technical skills, measurable impact, and role-aligned experience. Highlight programming languages, frameworks, databases, cloud, CI/CD, and project outcomes.';

// Extract keywords from job description for highlighting
const extractKeywords = (jobDescription) => {
  if (!jobDescription) return [];
  
  // Common keywords to look for
  const commonKeywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'database', 'api', 'rest', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'ci/cd', 'testing', 'automation', 'design', 'architecture', 'system', 'data', 'analytics', 'machine', 'learning', 'ai', 'ml', 'web', 'mobile', 'backend', 'frontend', 'fullstack', 'devops', 'cloud', 'microservices'];
  
  const lowerDesc = jobDescription.toLowerCase();
  return commonKeywords.filter(keyword => lowerDesc.includes(keyword));
};

const CoverLetterTemplatePage = () => {
  const { mode } = useLocalSearchParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateResumeFile, setTemplateResumeFile] = useState(null);
  const [profileResumeFile, setProfileResumeFile] = useState(null);
  const [profileResumeLoading, setProfileResumeLoading] = useState(true);
  const [resumeSource, setResumeSource] = useState('profile');
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [templateJobDescription, setTemplateJobDescription] = useState('');
  const [optimizeJobDescription, setOptimizeJobDescription] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [savingUploadProfileResume, setSavingUploadProfileResume] = useState(false);
  const [saveUploadProfileResumeMessage, setSaveUploadProfileResumeMessage] = useState('');
  const [saveUploadProfileResumeError, setSaveUploadProfileResumeError] = useState('');

  React.useEffect(() => {
    const loadProfileResume = async () => {
      try {
        setProfileResumeLoading(true);
        const response = await apiFetch('/profile');
        const resumeData = response?.data?.resume;
        if (resumeData?.file_data) {
          setProfileResumeFile({
            name: resumeData.file_name || 'profile_resume.pdf',
            mimeType: 'application/pdf',
            fileDataBase64: resumeData.file_data,
            uri: `data:application/pdf;base64,${resumeData.file_data}`,
          });
          setResumeSource('profile');
        }
      } catch (err) {
        console.log('Profile resume unavailable:', err?.message || err);
      } finally {
        setProfileResumeLoading(false);
      }
    };

    loadProfileResume();
  }, []);

  const pickDocument = async (forTemplateResume = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.type === 'success' || !result.canceled) {
        const uri = result.uri ?? result.assets?.[0]?.uri ?? result.assets?.[0]?.fileCopyUri;
        const name = result.name ?? result.assets?.[0]?.name;
        const mimeType = result.mimeType ?? result.assets?.[0]?.mimeType;
        if (forTemplateResume) {
          setTemplateResumeFile({ uri, name, mimeType });
          setResumeSource('upload');
        } else {
          setSelectedFile({ uri, name, mimeType });
          setTemplateMode('optimize');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const getActiveTemplateResume = () => {
    if (resumeSource === 'upload') {
      return templateResumeFile || profileResumeFile;
    }
    return profileResumeFile || templateResumeFile;
  };

  const clearUploadedResume = () => {
    setTemplateResumeFile(null);
    setResumeSource('profile');
  };

  const handleTemplateUploadSourcePress = async () => {
    if (templateResumeFile) {
      if (resumeSource !== 'upload') {
        setResumeSource('upload');
        return;
      }
      await pickDocument(true);
      return;
    }
    await pickDocument(true);
  };

  const handleSaveUploadedResumeAsProfile = async () => {
    if (!templateResumeFile) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSaveUploadProfileResumeError('Please sign in to save your profile resume.');
      return;
    }

    try {
      setSavingUploadProfileResume(true);
      setSaveUploadProfileResumeError('');
      setSaveUploadProfileResumeMessage('');

      const name = templateResumeFile.name || 'profile_resume.pdf';
      const type = templateResumeFile.mimeType || 'application/pdf';
      const formData = new FormData();

      if (templateResumeFile.fileDataBase64) {
        const byteCharacters = atob(templateResumeFile.fileDataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type });
        formData.append('resume_file', new File([blob], name, { type }));
      } else if (Platform.OS === 'web') {
        const response = await fetch(templateResumeFile.uri);
        const blob = await response.blob();
        formData.append('resume_file', new File([blob], name, { type }));
      } else {
        formData.append('resume_file', {
          uri: templateResumeFile.uri,
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

      setProfileResumeFile({ ...templateResumeFile, name: data?.data?.file_name || name });
      setResumeSource('profile');
      setSaveUploadProfileResumeMessage('Saved to profile resume.');
    } catch (error) {
      setSaveUploadProfileResumeError(error?.message || 'Failed to save profile resume.');
    } finally {
      setSavingUploadProfileResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (templateMode === 'optimize') {
      if (!selectedFile?.uri) {
        setError('Upload your cover letter here to optimize.');
        return;
      }
      if (!optimizeJobDescription.trim()) {
        setError('Please enter a job description.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setGeneratedCoverLetter(null);
      setProgress(0);
      setProgressStep('Starting optimization...');
      
      // Extract keywords from job description
      const extractedKeywords = extractKeywords(optimizeJobDescription);
      setKeywords(extractedKeywords);

      try {
        const result = await generateCoverLetter(
          selectedFile,
          optimizeJobDescription,
          (update) => {
            if (typeof update?.progress === 'number') {
              setProgress(update.progress);
            }
            if (update?.step) {
              setProgressStep(update.step);
            }
          }
        );
        setGeneratedCoverLetter(result);
      } catch (err) {
        setError(err?.message || 'Cover letter optimization failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const activeResume = getActiveTemplateResume();
    if (!templateJobDescription.trim()) {
      setError('Please enter a job description.');
      return;
    }
    if (!activeResume?.uri && !activeResume?.fileDataBase64) {
      setError('Add a resume source to generate your cover letter.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCoverLetter(null);
    setProgress(0);
    setProgressStep('Starting generation...');

    const extractedKeywords = extractKeywords(templateJobDescription);
    setKeywords(extractedKeywords);

    try {
      const result = await generateCoverLetter(
        activeResume,
        templateJobDescription,
        (update) => {
          if (typeof update?.progress === 'number') {
            setProgress(update.progress);
          }
          if (update?.step) {
            setProgressStep(update.step);
          }
        }
      );
      setGeneratedCoverLetter(result);
    } catch (err) {
      setError(err?.message || 'Cover letter generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedCoverLetter?.pdf_base64) {
      return;
    }
    downloadPDFFromBase64(generatedCoverLetter.pdf_base64, 'optimized_cover_letter.pdf');
  };

  const canDownload = !!generatedCoverLetter?.pdf_base64;

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
                  {templateMode === 'template' ? 'Cover Letter Templates' : 'Cover Letter Optimizer'}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                {templateMode === 'template'
                  ? 'Choose a Professional Template'
                  : 'Optimize Your Current Cover Letter'}
              </Text>
              <Text style={styles.headerText}>
                {templateMode === 'template'
                  ? 'Select from our collection of professional templates and customize to your needs'
                  : 'Upload your cover letter and let AI enhance it for better impact and personalization'}
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
                      Optimize Cover Letter
                    </Text>
                  </Pressable>
                </View>

                {templateMode === 'template' ? (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Enter Job Description</Text>
                      <TextInput
                        style={styles.jobDescriptionInput}
                        placeholder="Paste the full job description here"
                        placeholderTextColor="#9CA3AF"
                        value={templateJobDescription}
                        onChangeText={setTemplateJobDescription}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>

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
                          hoveredButton === 'templateResumeUpload' && styles.uploadButtonHover
                        ]}
                        onPress={handleTemplateUploadSourcePress}
                        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('templateResumeUpload')}
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
                          {templateResumeFile ? templateResumeFile.name : 'Upload Resume (Optional)'}
                        </Text>
                      </Pressable>

                      {templateResumeFile && (
                        <View style={styles.selectedFileRow}>
                          <Text style={styles.selectedFileText}>
                            {resumeSource === 'upload'
                              ? `Selected source: File upload (${templateResumeFile.name})`
                              : `Selected source: Profile resume (${profileResumeFile?.name || 'No profile resume found'})`}
                          </Text>
                          <View style={styles.selectedFileActions}>
                            <Pressable style={styles.clearUploadButton} onPress={clearUploadedResume}>
                              <Text style={styles.clearUploadButtonText}>Remove Upload</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.saveUploadButton, savingUploadProfileResume && styles.saveUploadButtonDisabled]}
                              onPress={handleSaveUploadedResumeAsProfile}
                              disabled={savingUploadProfileResume}
                            >
                              <Text style={styles.saveUploadButtonText}>
                                {savingUploadProfileResume ? 'Saving...' : 'Make Profile Resume'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                      {!templateResumeFile && profileResumeFile && (
                        <Text style={styles.resumeFallbackText}>No upload selected, using profile resume.</Text>
                      )}
                      {!!saveUploadProfileResumeMessage && <Text style={styles.saveProfileSuccess}>{saveUploadProfileResumeMessage}</Text>}
                      {!!saveUploadProfileResumeError && <Text style={styles.saveProfileError}>{saveUploadProfileResumeError}</Text>}
                    </View>

                    {/* Template Selection */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Choose a Template</Text>
                      <View style={styles.templatesGrid}>
                        {['Professional', 'Modern', 'Creative', 'Minimalist'].map((template, index) => (
                          <Pressable
                            key={index}
                            style={[
                              styles.templateCard,
                              hoveredTemplate === index && styles.templateCardHover
                            ]}
                            onHoverIn={() => Platform.OS === 'web' && setHoveredTemplate(index)}
                            onHoverOut={() => Platform.OS === 'web' && setHoveredTemplate(null)}
                          >
                            <View style={styles.templatePreview}>
                              <View style={styles.templateIcon}>
                                <View style={styles.documentIcon} />
                              </View>
                            </View>
                            <Text style={styles.templateName}>{template}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Enter Job Description</Text>
                      <TextInput
                        style={styles.jobDescriptionInput}
                        placeholder="Paste the full job description here"
                        placeholderTextColor="#9CA3AF"
                        value={optimizeJobDescription}
                        onChangeText={setOptimizeJobDescription}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Upload Cover Letter Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Upload Cover Letter</Text>
                      <Pressable
                        style={[
                          styles.uploadButton,
                          hoveredButton === 'upload' && styles.uploadButtonHover
                        ]}
                        onPress={() => pickDocument(false)}
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
                          {selectedFile ? selectedFile.name : 'Upload Cover Letter (Required)'}
                        </Text>
                      </Pressable>
                      {selectedFile && (
                        <Text style={styles.fileName}>
                          Selected: {selectedFile.name || selectedFile.uri}
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {/* Generate Cover Letter Button */}
                <Pressable
                  style={[
                    styles.generateButton,
                    hoveredButton === 'generate' && styles.generateButtonHover
                  ]}
                  onPress={handleGenerateCoverLetter}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('generate')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.generateButtonText}>
                    {templateMode === 'template' ? 'Generate Cover Letter' : 'Optimize Cover Letter'}
                  </Text>
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
                      <Text style={styles.previewText}>Your optimized cover letter will appear here</Text>
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

export default CoverLetterTemplatePage;

