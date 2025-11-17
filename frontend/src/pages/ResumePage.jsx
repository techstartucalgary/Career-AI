import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get('window');

export const ResumeBuilder = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  // Make viewer taller so the iframe shows more of the document
  const viewerHeight = Platform.OS === 'web'
    ? Math.max(700, Math.floor(height * 0.75))
    : Math.max(520, Math.floor(height * 0.6));

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });
      
      // Normalize result across platforms (some return { uri, name }, others return { assets: [...] })
      if (result.type === 'success' || !result.canceled) {
        const uri = result.uri ?? result.assets?.[0]?.uri ?? result.assets?.[0]?.fileCopyUri;
        const name = result.name ?? result.assets?.[0]?.name;
        setSelectedFile({ uri, name });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleProcessResume = () => {
    Alert.alert('Process Resume', 'AI processing will be implemented here');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Resume Builder</Text>
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickDocument}
        >
          <Text style={styles.uploadButtonText}>
            {selectedFile ? 'Change File' : 'Upload Resume'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <Text style={styles.fileName}>
            Selected: {selectedFile.name || selectedFile.uri}
          </Text>
        )}

        <View style={styles.previewContainer}>
          {/* Left Box - Original Resume */}
          <View style={styles.leftBox}>
            <Text style={styles.boxTitle}>Original Resume</Text>
            <View style={[styles.pdfViewer, { height: viewerHeight }]}>
              {selectedFile ? (
                // Web: render an iframe preview. Native: show a button to open in native viewer.
                Platform.OS === 'web' ? (
                  <iframe
                    src={selectedFile.uri}
                    title="resume-preview"
                    style={{ width: '100%', height: '100%', border: 0 }}
                  />
                ) : (
                  <View style={styles.pdfPlaceholder}>
                    <Text style={styles.placeholderText}>Preview Unavailable</Text>
                    <Text style={styles.placeholderSubtext}>
                      Tap below to open the file in your device's viewer
                    </Text>
                    <TouchableOpacity
                      style={[styles.actionButton, { marginTop: 12 }]}
                      onPress={async () => {
                        try {
                          await Linking.openURL(selectedFile.uri);
                        } catch (err) {
                          Alert.alert('Open File', 'Could not open file: ' + err.message);
                        }
                      }}
                    >
                      <Text style={styles.actionButtonText}>Open File</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No file uploaded yet
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, !selectedFile && styles.disabledButton]}
              onPress={handleProcessResume}
              disabled={!selectedFile}
            >
              <Text style={styles.actionButtonText}>
                Generate AI Resume
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Box - AI Generated Resume */}
          <View style={styles.rightBox}>
            <Text style={styles.boxTitle}>AI-Enhanced Resume</Text>
            <View style={[styles.outputViewer, { height: viewerHeight + 60 }]}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  AI-generated resume will appear here
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  leftBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pdfViewer: {
    height: 400,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
    overflow: 'hidden',
  },
  outputViewer: {
    height: 460,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#34C759',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ResumeBuilder;