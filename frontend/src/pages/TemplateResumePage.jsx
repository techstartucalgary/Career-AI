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

const DEFAULT_OPTIMIZATION_JOB_DESCRIPTION =
  'General ATS-ready resume evaluation for software roles. Focus on relevant technical skills, measurable impact, and role-aligned experience. Include programming languages, frameworks, databases, cloud, CI/CD, and project outcomes.';

// Extract keywords from job description for highlighting
const extractKeywords = (jobDescription) => {
  if (!jobDescription) return [];
  
  // Common keywords to look for
  const commonKeywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'database', 'api', 'rest', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'ci/cd', 'testing', 'automation', 'design', 'architecture', 'system', 'data', 'analytics', 'machine', 'learning', 'ai', 'ml', 'web', 'mobile', 'backend', 'frontend', 'fullstack', 'devops', 'cloud', 'microservices'];
  
  const lowerDesc = jobDescription.toLowerCase();
  return commonKeywords.filter(keyword => lowerDesc.includes(keyword));
};

// Highlight keywords in text
const highlightKeywords = (text, keywords, styles) => {
  if (!keywords || keywords.length === 0) return <Text style={styles.entryBullet}>{text}</Text>;
  
  let parts = [text];
  keywords.forEach(keyword => {
    const newParts = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const regex = new RegExp(`(${keyword})`, 'gi');
        const split = part.split(regex);
        split.forEach((segment, idx) => {
          if (regex.test(segment)) {
            newParts.push(
              <Text key={`${keyword}-${idx}`} style={[styles.entryBullet, styles.bulletHighlighted]}>
                {segment}
              </Text>
            );
          } else if (segment) {
            newParts.push(segment);
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return (
    <Text style={styles.entryBullet}>
      {parts.map((part, idx) => 
        typeof part === 'string' ? part : part
      )}
    </Text>
  );
};

const TemplateResumePage = () => {
  const { mode } = useLocalSearchParams();
  const [selectedFile, setSelectedFile] = useState(null);
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

  useEffect(() => {
    getGithubStatus().then(({ connected, username }) => {
      setGithubConnected(connected);
      setGithubUsername(username);
    });
  }, []);

  const pickDocument = async (forTemplateMode = false) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.type === 'success' || !result.canceled) {
        const uri = result.uri ?? result.assets?.[0]?.uri ?? result.assets?.[0]?.fileCopyUri;
        const name = result.name ?? result.assets?.[0]?.name;
        const mimeType = result.mimeType ?? result.assets?.[0]?.mimeType;
        const file = { uri, name, mimeType };
        if (forTemplateMode) {
          setTemplateFile(file);
        } else {
          setSelectedFile(file);
          setTemplateMode('optimize');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleGenerateResume = async () => {
    if (templateMode === 'template') {
      setIsLoading(true);
      setError(null);
      setGeneratedResume(null);
      setProgress(15);
      setProgressStep('Loading your saved resume...');
      try {
        const result = await generateFromTemplate(selectedTemplate, (update) => {
          if (typeof update?.progress === 'number') setProgress(update.progress);
          if (update?.step) setProgressStep(update.step);
        }, templateFile);
        setGeneratedResume(result);
      } catch (err) {
        setError(err?.message || 'Resume generation failed. Make sure you have uploaded a resume to your account.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Optimize mode
    if (!selectedFile?.uri) {
      setError('Upload your resume to optimize.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedResume(null);
    setProgress(0);
    setProgressStep('Starting optimization...');

    const extractedKeywords = extractKeywords(DEFAULT_OPTIMIZATION_JOB_DESCRIPTION);
    setKeywords(extractedKeywords);

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
        selectedFile,
        DEFAULT_OPTIMIZATION_JOB_DESCRIPTION,
        {},
        (update) => {
          if (typeof update?.progress === 'number') setProgress(update.progress);
          if (update?.step) setProgressStep(update.step);
        },
        githubContext,
      );
      setGeneratedResume(result);
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
                    {/* Template Selection */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Choose a Template</Text>
                      <Text style={[styles.fileName, { marginBottom: 12, marginTop: 0 }]}>
                        Uses your saved account resume, or upload one below.
                      </Text>
                      <Pressable
                        style={[
                          styles.uploadButton,
                          { marginBottom: 8 },
                          hoveredButton === 'templateUpload' && styles.uploadButtonHover
                        ]}
                        onPress={() => pickDocument(true)}
                        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('templateUpload')}
                        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                      >
                        <Text style={styles.uploadButtonText}>
                          {templateFile ? 'Change File' : 'Upload Resume (optional)'}
                        </Text>
                      </Pressable>
                      {templateFile && (
                        <Text style={[styles.fileName, { marginBottom: 12 }]}>
                          {templateFile.name}
                        </Text>
                      )}
                      <View style={styles.templatesGrid}>
                        {[
                          { id: 'classic', label: 'Classic', desc: 'Clean Helvetica, ATS-optimised' },
                          { id: 'modern',  label: 'Modern',  desc: 'Serif font, left-aligned header' },
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
                            <View style={[
                              styles.templatePreview,
                              selectedTemplate === tmpl.id && { backgroundColor: 'rgba(167,139,250,0.08)' }
                            ]}>
                              {/* Mini resume preview */}
                              <View style={{ width: '80%', gap: 4 }}>
                                <View style={{
                                  height: tmpl.id === 'modern' ? 8 : 7,
                                  width: tmpl.id === 'modern' ? '60%' : '75%',
                                  alignSelf: tmpl.id === 'modern' ? 'flex-start' : 'center',
                                  backgroundColor: selectedTemplate === tmpl.id ? '#A78BFA' : 'rgba(255,255,255,0.3)',
                                  borderRadius: 2,
                                }} />
                                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 }} />
                                {[80, 65, 90, 70].map((w, i) => (
                                  <View key={i} style={{
                                    height: tmpl.id === 'compact' ? 4 : 5,
                                    width: `${w}%`,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    borderRadius: 2,
                                    marginBottom: tmpl.id === 'compact' ? 2 : 3,
                                  }} />
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
                    {/* Upload Resume Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Upload Your Resume</Text>
                      <Pressable
                        style={[
                          styles.uploadButton,
                          hoveredButton === 'upload' && styles.uploadButtonHover
                        ]}
                        onPress={pickDocument}
                        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('upload')}
                        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                      >
                        <Text style={styles.uploadButtonText}>
                          {selectedFile ? 'Change File' : 'Upload Resume'}
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
                              {/* Header */}
                              {(generatedResume.resume_data?.header || generatedResume.tailored_resume?.header) && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeName}>{(generatedResume.resume_data?.header || generatedResume.tailored_resume?.header)?.name}</Text>
                                  <Text style={styles.resumeContactInfo}>
                                    {[
                                      generatedResume.resume_data?.header?.email || generatedResume.tailored_resume?.header?.email,
                                      generatedResume.resume_data?.header?.phone || generatedResume.tailored_resume?.header?.phone,
                                      generatedResume.resume_data?.header?.location || generatedResume.tailored_resume?.header?.location
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </Text>
                                </View>
                              )}

                              {/* Experience */}
                              {(generatedResume.resume_data?.experience || generatedResume.tailored_resume?.experience)?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>EXPERIENCE</Text>
                                  {(generatedResume.resume_data?.experience || generatedResume.tailored_resume?.experience)?.map((exp, idx) => (
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

                              {/* Education */}
                              {(generatedResume.resume_data?.education || generatedResume.tailored_resume?.education)?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>EDUCATION</Text>
                                  {(generatedResume.resume_data?.education || generatedResume.tailored_resume?.education)?.map((edu, idx) => (
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

                              {/* Skills */}
                              {(generatedResume.resume_data?.skills || generatedResume.tailored_resume?.skills)?.length > 0 && (
                                <View style={styles.resumeSection}>
                                  <Text style={styles.resumeSectionTitle}>SKILLS</Text>
                                  <Text style={styles.resumeSkills}>
                                    {(generatedResume.resume_data?.skills || generatedResume.tailored_resume?.skills)?.map(s => s.name || s).join(' • ')}
                                  </Text>
                                </View>
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




