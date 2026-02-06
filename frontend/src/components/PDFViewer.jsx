import React from 'react';
import { View, StyleSheet } from 'react-native';

const PDFViewer = ({ pdfBase64 }) => {
  // Convert base64 to blob URL
  const pdfBlobUrl = React.useMemo(() => {
    if (!pdfBase64) return null;
    
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [pdfBase64]);

  if (!pdfBlobUrl) {
    return null;
  }

  return (
    <View style={styles.container}>
      <iframe
        src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        style={styles.iframe}
        title="PDF Viewer"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
});

export default PDFViewer;
