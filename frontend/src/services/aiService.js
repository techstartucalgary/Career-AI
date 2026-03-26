import { getAuthToken } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to convert file URI to Blob for web
const uriToBlob = async (uri) => {
  const response = await fetch(uri);
  return await response.blob();
};

export const analyzeResume = async (resumeFile, jobDescription) => {
  const formData = new FormData();
  
  // Convert file to blob for web compatibility
  const fileBlob = await uriToBlob(resumeFile.uri);
  const fileType = resumeFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  formData.append('resume_file', fileBlob, resumeFile.name);
  formData.append('job_description', jobDescription);

  const response = await fetch(`${API_URL}/api/resume/analyze`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to analyze resume: ${errorText}`);
  }
  return response.json();
};

export const tailorResume = async (resumeFile, jobDescription, userAnswers = {}, onProgress) => {
  const formData = new FormData();
  
  // Convert file to blob for web compatibility
  const fileBlob = await uriToBlob(resumeFile.uri);
  const fileType = resumeFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  formData.append('resume_file', fileBlob, resumeFile.name);
  formData.append('job_description', jobDescription);
  formData.append('user_answers', JSON.stringify(userAnswers));

  const response = await fetch(`${API_URL}/api/resume/tailor`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to tailor resume: ${errorText}`);
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.step && onProgress) {
          onProgress(data);
        }
        
        if (data.success) {
          result = data;
        }
      }
    }
  }

  console.log('Resume result:', result);
  return result;
};

export const generateCoverLetter = async (resumeFile, jobDescription, onProgress, templateId = 'classic') => {
  const formData = new FormData();

  const fileBlob = await uriToBlob(resumeFile.uri);
  formData.append('resume_file', fileBlob, resumeFile.name);
  formData.append('job_description', jobDescription);
  formData.append('template_id', templateId);

  const response = await fetch(`${API_URL}/api/cover-letter/generate`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate cover letter: ${errorText}`);
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.step && onProgress) {
          onProgress(data);
        }
        
        if (data.success) {
          result = data;
        }
      }
    }
  }

  return result;
};

export const generateFromTemplate = async (templateId = 'classic', onProgress, resumeFile = null) => {
  const token = getAuthToken();
  if (!token) throw new Error('You must be logged in to use this feature.');

  const formData = new FormData();
  formData.append('template_id', templateId);

  if (resumeFile) {
    const fileBlob = await uriToBlob(resumeFile.uri);
    formData.append('resume_file', fileBlob, resumeFile.name);
  }

  if (onProgress) onProgress({ progress: 15, step: 'Loading resume...' });

  const response = await fetch(`${API_URL}/api/resume/generate-from-template`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate resume from template.');
  }

  if (onProgress) onProgress({ progress: 90, step: 'Generating PDF...' });
  const result = await response.json();
  if (onProgress) onProgress({ progress: 100, step: 'Done!' });
  return result;
};

// Helper function to convert base64 PDF to blob and download
export const downloadPDFFromBase64 = (base64String, filename = 'document.pdf') => {
  const binary = atob(base64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadPDF = (pdfPath) => {
  const filename = pdfPath.split('/').pop();
  window.open(`${API_URL}/api/download/${filename}`, '_blank');
};
