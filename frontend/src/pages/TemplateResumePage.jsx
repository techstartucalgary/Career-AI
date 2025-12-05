import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Header from '../components/Header';
import styles from './TemplateResumePage.styles';

const TemplateResumePage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateMode, setTemplateMode] = useState('template'); // 'template' or 'optimize'

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

  const handleGenerateResume = () => {
    // TODO: Implement resume generation logic
    console.log('Generating resume...');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download logic
    console.log('Downloading PDF...');
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.headerText}>
            {templateMode === 'template' 
              ? 'Choose a template or upload your existing resume to optimize'
              : 'Optimize your current resume'}
          </Text>

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
                          style={styles.templateCard}
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
                      style={styles.uploadButton}
                      onPress={pickDocument}
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
                style={styles.generateButton}
                onPress={handleGenerateResume}
              >
                <Text style={styles.generateButtonText}>
                  {templateMode === 'template' ? 'Generate Resume' : 'Optimize Resume'}
                </Text>
              </Pressable>
            </View>

            {/* Right Panel - Resume Preview */}
            <View style={styles.rightPanel}>
              <View style={styles.previewArea}>
                <View style={styles.previewIcon}>
                  <View style={styles.documentIcon} />
                </View>
                <Text style={styles.previewText}>Your resume will appear here</Text>
              </View>

              <Pressable
                style={styles.downloadButton}
                onPress={handleDownloadPDF}
              >
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TemplateResumePage;




