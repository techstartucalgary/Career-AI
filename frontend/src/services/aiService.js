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

export const generateCoverLetter = async (resumeFile, jobDescription, onProgress) => {
  const formData = new FormData();
  
  // Convert file to blob for web compatibility
  const fileBlob = await uriToBlob(resumeFile.uri);
  const fileType = resumeFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  formData.append('resume_file', fileBlob, resumeFile.name);
  formData.append('job_description', jobDescription);

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
