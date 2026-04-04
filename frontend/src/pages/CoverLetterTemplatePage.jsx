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
import { API_BASE_URL, apiFetch, fetchJobById, fetchLinkedInJobs, getAuthToken, getUserProfile } from '../services/api';
import { getGithubStatus, openGithubConnect, fetchGithubContext } from '../services/githubService';

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

const toJobArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.jobs)) return value.jobs;
  if (Array.isArray(value?.value)) return value.value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.jobs)) return value.data.jobs;
  return [];
};

const normalizeSearchJob = (job, index = 0) => ({
  id: String(job?.id || job?.job_id || job?.job_urn || `job-${index}`),
  source: String(job?.source || 'linkedin').toLowerCase(),
  title: String(job?.title || job?.job_title || 'Untitled role'),
  company: String(job?.company || job?.company_name || 'Company'),
  location: String(job?.location || job?.job_location || 'Location not listed'),
  compensation: String(job?.salary || job?.rate || job?.compensation || job?.base_pay || 'Compensation not listed'),
  description: String(job?.description || job?.job_description || job?.snippet || '').trim(),
});

const CoverLetterTemplatePage = () => {
  const params = useLocalSearchParams();
  const { mode } = params;
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateResumeFile, setTemplateResumeFile] = useState(null);
  const [defaultResumeFile, setDefaultResumeFile] = useState(null);
  const [defaultResumeLoading, setDefaultResumeLoading] = useState(true);
  const [resumeSource, setResumeSource] = useState('default');
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [searchQuery, setSearchQuery] = useState('');
  const [jobSearchResults, setJobSearchResults] = useState([]);
  const [selectedJobResultId, setSelectedJobResultId] = useState('');
  const [selectedJobPosting, setSelectedJobPosting] = useState(null);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [jobSearchError, setJobSearchError] = useState('');
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
  const [savingUploadDefaultResume, setSavingUploadDefaultResume] = useState(false);
  const [saveUploadDefaultResumeMessage, setSaveUploadDefaultResumeMessage] = useState('');
  const [saveUploadDefaultResumeError, setSaveUploadDefaultResumeError] = useState('');

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
        setDefaultResumeLoading(true);
        const response = await getUserProfile();
        const resumeData = response?.data?.resume;
        if (resumeData?.file_data) {
          setDefaultResumeFile({
            name: resumeData.file_name || 'default_resume.pdf',
            mimeType: 'application/pdf',
            fileDataBase64: resumeData.file_data,
            uri: `data:application/pdf;base64,${resumeData.file_data}`,
          });
          setResumeSource('default');
        }
      } catch (err) {
        console.log('Default resume unavailable:', err?.message || err);
      } finally {
        setDefaultResumeLoading(false);
      }
    };

    loadDefaultResume();
  }, []);

  React.useEffect(() => {
    const routeDescription = String(params?.jobDescription || '').trim();
    if (routeDescription) {
      const routeJob = {
        id: String(params?.jobId || 'route-job'),
        source: String(params?.source || 'linkedin').toLowerCase(),
        title: String(params?.jobTitle || 'Selected job'),
        company: String(params?.company || 'Company'),
        location: String(params?.location || 'Location not listed'),
        compensation: 'Compensation not listed',
        description: routeDescription,
      };
      setSelectedJobPosting(routeJob);
      setSelectedJobResultId(routeJob.id);
    }
  }, [params?.jobDescription]);

  React.useEffect(() => {
    let isMounted = true;
    const routeJobId = String(params?.jobId || '').trim();
    const routeSource = String(params?.source || 'linkedin').trim();

    if (!routeJobId) return undefined;

    const loadRouteJob = async () => {
      try {
        const job = await fetchJobById(routeJobId, routeSource || 'linkedin');
        if (!isMounted) return;
        const normalized = normalizeSearchJob(job, 0);
        setJobSearchResults([]);
        setSelectedJobResultId(normalized.id);
        setSelectedJobPosting(normalized);
        setSearchQuery('');
      } catch (_error) {
        if (isMounted) {
          setJobSearchError('Could not fetch selected job details. You can still paste the description manually.');
        }
      }
    };

    loadRouteJob();

    return () => {
      isMounted = false;
    };
  }, [params?.jobId, params?.source]);

  const handleSearchJobs = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setJobSearchError('Enter a role or keyword to search job postings.');
      setJobSearchResults([]);
      return;
    }

    setSearchingJobs(true);
    setJobSearchError('');

    try {
      const response = await fetchLinkedInJobs({
        keywords: [query],
        location: '',
        page: 1,
        limit: 8,
        includeDetails: true,
      });

      const jobs = toJobArray(response)
        .map((job, index) => normalizeSearchJob(job, index))
        .filter((job) => Boolean(job.description));

      setJobSearchResults(jobs);
      if (!jobs.length) {
        setJobSearchError('No matching jobs were found for that keyword.');
      }
    } catch (_error) {
      setJobSearchResults([]);
      setJobSearchError('Unable to search jobs right now. Please try again.');
    } finally {
      setSearchingJobs(false);
    }
  };

  const handleSelectJobResult = (job) => {
    setSelectedJobResultId(job.id);
    setSelectedJobPosting(job);
    setJobSearchResults([]);
    setSearchQuery('');
    setJobSearchError('');
  };

  React.useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setJobSearchResults([]);
      setJobSearchError('');
      return undefined;
    }

    const timer = setTimeout(() => {
      handleSearchJobs();
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      return templateResumeFile || defaultResumeFile;
    }
    return defaultResumeFile || templateResumeFile;
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

  const handleSaveUploadedResumeAsDefault = async () => {
    if (!templateResumeFile) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSaveUploadDefaultResumeError('Please sign in to save your default resume.');
      return;
    }

    try {
      setSavingUploadDefaultResume(true);
      setSaveUploadDefaultResumeError('');
      setSaveUploadDefaultResumeMessage('');

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
        throw new Error(data?.message || data?.detail || 'Failed to save default resume.');
      }

      setDefaultResumeFile({ ...templateResumeFile, name: data?.data?.file_name || name });
      setResumeSource('default');
      setSaveUploadDefaultResumeMessage('Saved to default resume.');
    } catch (error) {
      setSaveUploadDefaultResumeError(error?.message || 'Failed to save default resume.');
    } finally {
      setSavingUploadDefaultResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    const activeTemplateJobDescription = selectedJobResultId ? (selectedJobPosting?.description || '') : templateJobDescription;
    const activeOptimizeJobDescription = selectedJobResultId ? (selectedJobPosting?.description || '') : optimizeJobDescription;

    if (templateMode === 'optimize') {
      if (!selectedFile?.uri) {
        setError('Upload your cover letter here to optimize.');
        return;
      }
      if (!activeOptimizeJobDescription.trim()) {
        setError('Please enter a job description.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setGeneratedCoverLetter(null);
      setProgress(0);
      setProgressStep('Starting optimization...');
      
      // Extract keywords from job description
      const extractedKeywords = extractKeywords(activeOptimizeJobDescription);
      setKeywords(extractedKeywords);

      try {
        const result = await generateCoverLetter(
          selectedFile,
          activeOptimizeJobDescription,
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
    if (!activeTemplateJobDescription.trim()) {
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

    const extractedKeywords = extractKeywords(activeTemplateJobDescription);
    setKeywords(extractedKeywords);

    try {
      const result = await generateCoverLetter(
        activeResume,
        activeTemplateJobDescription,
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
  const selectedJobPostingActive = Boolean(selectedJobResultId);
  const templateManualSelected = !selectedJobResultId && templateJobDescription.trim().length > 0;
  const optimizeManualSelected = !selectedJobResultId && optimizeJobDescription.trim().length > 0;

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
                      <Text style={styles.sectionTitle}>Job Posting</Text>
                      <View style={[styles.searchBar, { marginBottom: 10 }]}>
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

                      {searchingJobs && (
                        <Text style={{ color: '#C4B5FD', marginTop: 10, fontSize: 13 }}>Searching...</Text>
                      )}

                      {!!jobSearchError && (
                        <Text style={{ color: '#FCA5A5', marginTop: 10, fontSize: 13 }}>{jobSearchError}</Text>
                      )}

                      {jobSearchResults.length > 0 && (
                        <ScrollView
                          style={{ marginTop: 12, maxHeight: 240, backgroundColor: '#141421', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                          contentContainerStyle={{ gap: 8, padding: 12 }}
                          nestedScrollEnabled
                        >
                          {jobSearchResults.map((job) => (
                            <Pressable
                              key={job.id}
                              style={[
                                styles.resumeSourceCard,
                                { backgroundColor: '#1A1A28', borderColor: 'rgba(255,255,255,0.08)' },
                                selectedJobResultId === job.id && styles.resumeSourceCardActive,
                              ]}
                              onPress={() => handleSelectJobResult(job)}
                            >
                              <View style={styles.resumeSourceHeader}>
                                <Text style={styles.resumeSourceTitle}>{job.title}</Text>
                                {selectedJobResultId === job.id && (
                                  <Text style={styles.resumeSourceBadge}>SELECTED</Text>
                                )}
                              </View>
                              <Text style={styles.resumeSourceMeta}>{job.company}</Text>
                              <Text style={styles.resumeSourceMeta}>{job.compensation}</Text>
                              <Text style={styles.resumeSourceMeta}>{job.location}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}

                      {selectedJobPosting && (
                        <Pressable
                          style={[
                            styles.resumeSourceCard,
                            {
                              backgroundColor: selectedJobPostingActive ? '#1A1A28' : 'rgba(255,255,255,0.02)',
                              borderColor: selectedJobPostingActive ? 'rgba(167, 139, 250, 0.45)' : 'rgba(255,255,255,0.08)',
                            },
                          ]}
                          onPress={() => {
                            setSelectedJobResultId(String(selectedJobPosting.id || 'route-job'));
                            setJobSearchResults([]);
                            setJobSearchError('');
                          }}
                        >
                          <View style={styles.resumeSourceHeader}>
                            <Text style={styles.resumeSourceTitle}>{selectedJobPosting.title}</Text>
                            {selectedJobPostingActive && (
                              <Text style={styles.resumeSourceBadge}>SELECTED</Text>
                            )}
                          </View>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.company}</Text>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.compensation}</Text>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.location}</Text>
                        </Pressable>
                      )}

                      <View style={styles.resumeSourceDividerRow}>
                        <View style={styles.resumeSourceDividerLine} />
                        <Text style={styles.resumeSourceDividerText}>OR</Text>
                        <View style={styles.resumeSourceDividerLine} />
                      </View>

                      <TextInput
                        style={[
                          styles.jobDescriptionInput,
                          templateManualSelected && {
                            backgroundColor: 'rgba(167, 139, 250, 0.12)',
                            borderColor: '#A78BFA',
                            borderWidth: 1.5,
                          },
                        ]}
                        placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications"
                        placeholderTextColor="#9CA3AF"
                        value={templateJobDescription}
                        onChangeText={(text) => {
                          setTemplateJobDescription(text);
                          if (text.trim().length === 0) {
                            if (selectedJobPosting?.id) {
                              setSelectedJobResultId(String(selectedJobPosting.id));
                            }
                          } else if (selectedJobResultId) {
                            setSelectedJobResultId('');
                          }
                        }}
                        multiline
                        textAlignVertical="top"
                      />
                      {templateJobDescription.trim().length > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                          <Pressable
                            onPress={() => {
                              setTemplateJobDescription('');
                              if (selectedJobPosting?.id) {
                                setSelectedJobResultId(String(selectedJobPosting.id));
                              }
                            }}
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.22)',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700' }}>Clear</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Resume Upload</Text>
                      <Pressable
                        style={[
                          styles.resumeSourceCard,
                          resumeSource === 'default' && styles.resumeSourceCardActive,
                        ]}
                        onPress={() => setResumeSource('default')}
                      >
                        <View style={styles.resumeSourceHeader}>
                          <Text style={styles.resumeSourceTitle}>Default Resume</Text>
                          {resumeSource === 'default' && <Text style={styles.resumeSourceBadge}>SELECTED</Text>}
                        </View>
                        <Text style={styles.resumeSourceMeta}>
                          {defaultResumeLoading
                            ? 'Checking resume...'
                            : defaultResumeFile?.name || 'No default resume found'}
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
                              : `Selected source: Default resume (${defaultResumeFile?.name || 'No default resume found'})`}
                          </Text>
                          <View style={styles.selectedFileActions}>
                            <Pressable style={styles.clearUploadButton} onPress={clearUploadedResume}>
                              <Text style={styles.clearUploadButtonText}>Remove Upload</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.saveUploadButton, savingUploadDefaultResume && styles.saveUploadButtonDisabled]}
                              onPress={handleSaveUploadedResumeAsDefault}
                              disabled={savingUploadDefaultResume}
                            >
                              <Text style={styles.saveUploadButtonText}>
                                {savingUploadDefaultResume ? 'Saving...' : 'Make Default Resume'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                      {!templateResumeFile && defaultResumeFile && (
                        <Text style={styles.resumeFallbackText}>No upload selected, using default resume.</Text>
                      )}
                      {!!saveUploadDefaultResumeMessage && <Text style={styles.saveProfileSuccess}>{saveUploadDefaultResumeMessage}</Text>}
                      {!!saveUploadDefaultResumeError && <Text style={styles.saveProfileError}>{saveUploadDefaultResumeError}</Text>}
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
                      <Text style={styles.sectionTitle}>Job Posting</Text>
                      <View style={[styles.searchBar, { marginBottom: 10 }]}>
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

                      {searchingJobs && (
                        <Text style={{ color: '#C4B5FD', marginTop: 10, fontSize: 13 }}>Searching...</Text>
                      )}

                      {!!jobSearchError && (
                        <Text style={{ color: '#FCA5A5', marginTop: 10, fontSize: 13 }}>{jobSearchError}</Text>
                      )}

                      {jobSearchResults.length > 0 && (
                        <ScrollView
                          style={{ marginTop: 12, maxHeight: 240, backgroundColor: '#141421', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                          contentContainerStyle={{ gap: 8, padding: 12 }}
                          nestedScrollEnabled
                        >
                          {jobSearchResults.map((job) => (
                            <Pressable
                              key={job.id}
                              style={[
                                styles.resumeSourceCard,
                                { backgroundColor: '#1A1A28', borderColor: 'rgba(255,255,255,0.08)' },
                                selectedJobResultId === job.id && styles.resumeSourceCardActive,
                              ]}
                              onPress={() => handleSelectJobResult(job)}
                            >
                              <View style={styles.resumeSourceHeader}>
                                <Text style={styles.resumeSourceTitle}>{job.title}</Text>
                                {selectedJobResultId === job.id && (
                                  <Text style={styles.resumeSourceBadge}>SELECTED</Text>
                                )}
                              </View>
                              <Text style={styles.resumeSourceMeta}>{job.company}</Text>
                              <Text style={styles.resumeSourceMeta}>{job.compensation}</Text>
                              <Text style={styles.resumeSourceMeta}>{job.location}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}

                      {selectedJobPosting && (
                        <Pressable
                          style={[
                            styles.resumeSourceCard,
                            {
                              backgroundColor: selectedJobPostingActive ? '#1A1A28' : 'rgba(255,255,255,0.02)',
                              borderColor: selectedJobPostingActive ? 'rgba(167, 139, 250, 0.45)' : 'rgba(255,255,255,0.08)',
                            },
                          ]}
                          onPress={() => {
                            setSelectedJobResultId(String(selectedJobPosting.id || 'route-job'));
                            setJobSearchResults([]);
                            setJobSearchError('');
                          }}
                        >
                          <View style={styles.resumeSourceHeader}>
                            <Text style={styles.resumeSourceTitle}>{selectedJobPosting.title}</Text>
                            {selectedJobPostingActive && (
                              <Text style={styles.resumeSourceBadge}>SELECTED</Text>
                            )}
                          </View>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.company}</Text>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.compensation}</Text>
                          <Text style={styles.resumeSourceMeta}>{selectedJobPosting.location}</Text>
                        </Pressable>
                      )}

                      <View style={styles.resumeSourceDividerRow}>
                        <View style={styles.resumeSourceDividerLine} />
                        <Text style={styles.resumeSourceDividerText}>OR</Text>
                        <View style={styles.resumeSourceDividerLine} />
                      </View>

                      <TextInput
                        style={[
                          styles.jobDescriptionInput,
                          optimizeManualSelected && {
                            backgroundColor: 'rgba(167, 139, 250, 0.12)',
                            borderColor: '#A78BFA',
                            borderWidth: 1.5,
                          },
                        ]}
                        placeholder="Paste the full job description here. Include requirements, responsibilities, and qualifications"
                        placeholderTextColor="#9CA3AF"
                        value={optimizeJobDescription}
                        onChangeText={(text) => {
                          setOptimizeJobDescription(text);
                          if (text.trim().length === 0) {
                            if (selectedJobPosting?.id) {
                              setSelectedJobResultId(String(selectedJobPosting.id));
                            }
                          } else if (selectedJobResultId) {
                            setSelectedJobResultId('');
                          }
                        }}
                        multiline
                        textAlignVertical="top"
                      />
                      {optimizeJobDescription.trim().length > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                          <Pressable
                            onPress={() => {
                              setOptimizeJobDescription('');
                              if (selectedJobPosting?.id) {
                                setSelectedJobResultId(String(selectedJobPosting.id));
                              }
                            }}
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.22)',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '700' }}>Clear</Text>
                          </Pressable>
                        </View>
                      )}
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

