import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './CoverLetterTemplatePage.styles';
import './JobPages.css';

const CoverLetterTemplatePage = () => {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateMode, setTemplateMode] = useState(mode === 'optimize' ? 'optimize' : 'template'); // 'template' or 'optimize'
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

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
        setTemplateMode('optimize');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleGenerateCoverLetter = () => {
    // TODO: Implement cover letter generation logic
    console.log('Generating cover letter...');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download logic
    console.log('Downloading PDF...');
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
                  <View style={styles.previewIcon}>
                    <View style={styles.documentIcon} />
                  </View>
                  <Text style={styles.previewText}>Your cover letter will appear here</Text>
                </View>

                <Pressable
                  style={[
                    styles.downloadButton,
                    hoveredButton === 'download' && styles.downloadButtonHover
                  ]}
                  onPress={handleDownloadPDF}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('download')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default CoverLetterTemplatePage;

