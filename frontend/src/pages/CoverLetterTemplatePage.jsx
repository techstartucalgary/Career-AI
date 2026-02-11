import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './CoverLetterTemplatePage.styles';
import './JobPages.css';
import { generateCoverLetter, downloadPDFFromBase64 } from '../services/aiService';
import PDFViewer from '../components/PDFViewer';

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
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);
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

  const handleGenerateCoverLetter = async () => {
    if (templateMode === 'optimize') {
      if (!selectedFile?.uri) {
        setError('Upload your cover letter to optimize.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setGeneratedCoverLetter(null);
      setProgress(0);
      setProgressStep('Starting optimization...');
      
      // Extract keywords from job description
      const extractedKeywords = extractKeywords(DEFAULT_OPTIMIZATION_JOB_DESCRIPTION);
      setKeywords(extractedKeywords);

      try {
        const result = await generateCoverLetter(
          selectedFile,
          DEFAULT_OPTIMIZATION_JOB_DESCRIPTION,
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
    // TODO: Implement cover letter generation logic
    console.log('Generating cover letter...');
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
                    {/* Upload Cover Letter Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Upload Your Cover Letter</Text>
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
                          {selectedFile ? 'Change File' : 'Upload Cover Letter'}
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

