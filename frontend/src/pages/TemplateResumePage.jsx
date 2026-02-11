import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './TemplateResumePage.styles';
import './JobPages.css';
import { tailorResume, downloadPDFFromBase64 } from '../services/aiService';
import PDFViewer from '../components/PDFViewer';

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
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [keywords, setKeywords] = useState([]);

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
        setTemplateMode('optimize');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleGenerateResume = async () => {
    if (templateMode === 'optimize') {
      if (!selectedFile?.uri) {
        setError('Upload your resume to optimize.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setGeneratedResume(null);
      setProgress(0);
      setProgressStep('Starting optimization...');
      
      // Extract keywords from job description
      const extractedKeywords = extractKeywords(DEFAULT_OPTIMIZATION_JOB_DESCRIPTION);
      setKeywords(extractedKeywords);

      try {
        const result = await tailorResume(
          selectedFile,
          DEFAULT_OPTIMIZATION_JOB_DESCRIPTION,
          {},
          (update) => {
            if (typeof update?.progress === 'number') {
              setProgress(update.progress);
            }
            if (update?.step) {
              setProgressStep(update.step);
            }
          }
        );
        setGeneratedResume(result);
      } catch (err) {
        setError(err?.message || 'Resume optimization failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // TODO: Implement resume generation logic
    console.log('Generating resume...');
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




