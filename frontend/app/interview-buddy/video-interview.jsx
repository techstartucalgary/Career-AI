import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import { THEME } from '../../src/styles/theme';
import styles from './VideoInterviewPage.styles';
import { startInterview, startInterviewWithJobAndResume, sendInterviewResponse, analyzePostureFrame, getLiveFeedback } from '../../src/services/interviewService';
import withAuth from '../../src/components/withAuth';

// Web video component
const WebVideo = ({ videoRef, style }) => {
  if (Platform.OS !== 'web') return null;
  
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={style}
    />
  );
};

// Helper function to start recording
const startRecording = (mediaRecorderRef, audioChunksRef, setIsRecording) => {
  if (Platform.OS !== 'web') return;
  
  // Get the current streamRef from component context
  const stream = window._currentStream;
  if (!stream) {
    console.error('❌ No media stream available');
    return;
  }
  
  // Check if stream has audio tracks
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    console.error('❌ No audio tracks in stream');
    alert('Microphone access required for voice recording');
    return;
  }
  
  console.log(`🎤 Audio tracks available: ${audioTracks.length}`);
  
  // Create audio-only stream for recording
  const audioStream = new MediaStream(audioTracks);
  
  audioChunksRef.current = [];
  
  // Try different MIME types in order of preference
  let mimeType = '';
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    ''
  ];
  
  for (const type of types) {
    try {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        console.log(`Using MIME type: ${mimeType || 'default'}`);
        break;
      }
    } catch (e) {
      console.warn(`Failed to check MIME type ${type}:`, e);
    }
  }
  
  try {
    const options = mimeType ? { mimeType } : {};
    const mediaRecorder = new MediaRecorder(audioStream, options);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      setIsRecording(false);
    };
    
    mediaRecorder.start(1000); // Collect data every second
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    console.log('✓ Recording started');
  } catch (error) {
    console.error('❌ Failed to start MediaRecorder:', error);
    alert('Failed to start recording: ' + error.message);
  }
};
// Helper function to stop recording
const stopRecording = (mediaRecorderRef, audioChunksRef, setIsRecording, setRecordedBlob) => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log(`✓ Recording stopped: ${blob.size} bytes, type: ${blob.type}`);
      setRecordedBlob(blob);
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  } else {
    console.warn('⚠️ No active recording to stop');
  }
};

const VideoInterviewPage = () => {
  const router = useRouter();
  const [screen, setScreen] = useState('preview'); // 'preview', 'loading', 'interview'
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState({
    questions: false,
    company: false,
    profile: false,
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewerText, setInterviewerText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [interviewStatus, setInterviewStatus] = useState('not_started');
  const [maxQuestions, setMaxQuestions] = useState(null);
  const [postureFeedback, setPostureFeedback] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postureAvailable, setPostureAvailable] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [showJobInput, setShowJobInput] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [postureAnimating, setPostureAnimating] = useState(false);
  const feedbackTimeoutRef = useRef(null);
  const lastPostureTipRef = useRef('');

  // Helper function to add punctuation to transcript
  const addPunctuation = (text) => {
    if (!text) return text;
    
    // Capitalize first letter
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Add periods after common ending patterns
    result = result
      // Add period at end if missing
      .replace(/([a-zA-Z])\s*$/g, '$1.')
      // Capitalize after periods
      .replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase())
      // Handle question words
      .replace(/\b(what|where|when|why|how|who|which|can|could|would|should|is|are|do|does|did)\b([^.?]*?)(?=[.\s]*$)/gi, 
        (match, qWord, rest) => qWord + rest + '?')
      // Remove duplicate punctuation
      .replace(/([.?!])+/g, '$1')
      // Fix spacing
      .replace(/\s+/g, ' ')
      .trim();
    
    return result;
  };

  const interviewQuestions = [
    'Tell me about yourself and why you are interested in this position.',
    'What relevant experience do you have for this role?',
    'How do you handle working under pressure?',
    'Describe a challenging project you worked on and how you overcame obstacles.',
    'Where do you see yourself in 5 years?',
  ];
  const totalQuestions = maxQuestions || interviewQuestions.length;

  const playTtsAudio = (audioBase64) => {
    if (Platform.OS !== 'web' || !audioBase64) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play().catch(() => setIsSpeaking(false));
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const refreshDevices = async () => {
    if (Platform.OS !== 'web') return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
    } catch (err) {
      console.error('Error listing devices:', err);
    }
  };

  const startMediaStream = async () => {
    if (Platform.OS !== 'web') {
      setCameraReady(true);
      return;
    }

    try {
      // Audio constraints with voice isolation (noise suppression)
      const audioConstraints = {
        ...(selectedMicrophone?.deviceId ? { deviceId: { exact: selectedMicrophone.deviceId } } : {}),
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      
      const constraints = {
        video: selectedCamera?.deviceId ? { deviceId: { exact: selectedCamera.deviceId } } : true,
        audio: audioConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = stream;
      window._currentStream = stream; // Store for recording
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      await refreshDevices();
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraReady(true); // Still allow proceeding with placeholder
    }
  };

  const pickNextDevice = (devices, currentId) => {
    if (!devices.length) return null;
    const index = devices.findIndex((d) => d.deviceId === currentId);
    const nextIndex = index >= 0 ? (index + 1) % devices.length : 0;
    return devices[nextIndex];
  };

  // Initialize camera preview
  useEffect(() => {
    if (screen === 'preview' || screen === 'interview') {
      startMediaStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [screen, selectedCamera, selectedMicrophone]);

  // Inject CSS keyframes for feedback pulse animation
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'feedback-pulse-animation';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes feedbackPulse {
            0%, 100% { box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 8px 40px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.15); }
          }
          @keyframes feedbackPulseGreen {
            0%, 100% { box-shadow: 0 6px 30px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 8px 40px rgba(34, 197, 94, 0.6), inset 0 1px 0 rgba(255,255,255,0.15); }
          }
          @keyframes feedbackPulseYellow {
            0%, 100% { box-shadow: 0 6px 30px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 8px 40px rgba(251, 191, 36, 0.6), inset 0 1px 0 rgba(255,255,255,0.15); }
          }
          @keyframes posturePulse {
            0% { transform: scale(1); box-shadow: 0 4px 16px rgba(167, 139, 250, 0.15); }
            50% { transform: scale(1.01); box-shadow: 0 8px 28px rgba(167, 139, 250, 0.4); }
            100% { transform: scale(1); box-shadow: 0 4px 16px rgba(167, 139, 250, 0.15); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Handle loading screen animation
  useEffect(() => {
    if (screen === 'loading') {
      const timers = [];
      
      timers.push(setTimeout(() => {
        setLoadingTasks(prev => ({ ...prev, questions: true }));
      }, 1000));

      timers.push(setTimeout(() => {
        setLoadingTasks(prev => ({ ...prev, company: true }));
      }, 2000));

      timers.push(setTimeout(() => {
        setLoadingTasks(prev => ({ ...prev, profile: true }));
      }, 3000));

      timers.push(setTimeout(() => {
        setScreen('interview');
      }, 4000));

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== 'interview' || Platform.OS !== 'web' || !cameraReady) return;
    let active = true;

    const intervalId = setInterval(async () => {
      if (!postureAvailable) return;
      if (!videoRef.current) return;
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.6);

      try {
        const data = await analyzePostureFrame(sessionId, imageBase64);
        if (active) {
          const newFeedback = data.feedback || null;
          setPostureFeedback(newFeedback);
          // Trigger animation if tip changed
          const newTip = newFeedback?.tips?.[0] || '';
          if (newTip && newTip !== lastPostureTipRef.current) {
            lastPostureTipRef.current = newTip;
            setPostureAnimating(true);
            setTimeout(() => setPostureAnimating(false), 1500);
          }
        }
      } catch (err) {
        if (active) {
          const message = String(err.message || '');
          if (
            message.includes('Not Implemented') ||
            message.includes('dependencies are missing') ||
            message.includes('missing the solutions API')
          ) {
            setPostureAvailable(false);
          }
          setPostureFeedback({ error: err.message });
        }
      }
    }, 2500);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [screen, cameraReady, sessionId, postureAvailable]);

  // Start always-on speech recognition
  const startSpeechRecognition = () => {
    if (Platform.OS !== 'web') return;
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }
    
    // Stop existing recognition if any
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add punctuation to final results
          final += addPunctuation(transcript) + ' ';
        } else {
          interim += transcript;
        }
      }
      
      if (final) {
        setLiveTranscript(prev => {
          const newTranscript = prev + final;
          // Also update userAnswer in real-time
          setUserAnswer(newTranscript.trim());
          return newTranscript;
        });
      }
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event) => {
      // "no-speech" is normal - happens when user pauses speaking
      if (event.error === 'no-speech') {
        // Silently ignore - this is expected
        return;
      } else if (event.error === 'aborted') {
        // Don't restart if aborted intentionally
        return;
      } else {
        console.warn('Speech recognition error:', event.error);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if still in interview mode
      if (screen === 'interview' && !isSpeaking) {
        setTimeout(() => {
          if (screen === 'interview' && speechRecognitionRef.current) {
            try {
              recognition.start();
              // Silent restart - no console log needed
            } catch (e) {
              // Ignore restart errors
            }
          }
        }, 100);
      }
    };
    
    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsListening(true);
      console.log('✓ Always-on speech recognition started');
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
    }
  };
  
  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
  };
  
  // Start/stop recognition based on screen and speaking state
  useEffect(() => {
    if (screen === 'interview' && cameraReady && !isSpeaking) {
      // Small delay to let audio settle
      const timer = setTimeout(() => {
        startSpeechRecognition();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stopSpeechRecognition();
    }
    
    return () => {
      stopSpeechRecognition();
    };
  }, [screen, cameraReady, isSpeaking]);

  const handleStartRecording = () => {
    // Reset transcripts
    setLiveTranscript('');
    setInterimTranscript('');
    setUserAnswer('');
    
    // Start audio recording
    startRecording(mediaRecorderRef, audioChunksRef, setIsRecording);
  };

  const handleStopRecording = async () => {
    stopRecording(mediaRecorderRef, audioChunksRef, setIsRecording, setRecordedBlob);
  };
  
  // Clear transcript for new question
  const clearTranscript = () => {
    setLiveTranscript('');
    setInterimTranscript('');
    setUserAnswer('');
    setLiveFeedback(null);
  };
  
  // Fetch live feedback when answer changes
  useEffect(() => {
    if (!userAnswer || userAnswer.length < 10 || !sessionId) {
      return;
    }
    
    // Debounce feedback requests
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    
    feedbackTimeoutRef.current = setTimeout(async () => {
      try {
        const question = interviewerText || interviewQuestions[currentQuestion] || '';
        const feedback = await getLiveFeedback(sessionId, question, userAnswer);
        if (feedback && feedback.tips && feedback.tips.length > 0) {
          setLiveFeedback(feedback);
        }
      } catch (err) {
        // Silently fail - feedback is optional
        console.log('Feedback error:', err);
      }
    }, 800); // Wait 0.8s after user stops speaking
    
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [userAnswer, sessionId]);

  const handleSubmitAudio = async () => {
    if (!recordedBlob) {
      console.log('❌ No recorded blob');
      return;
    }
    
    console.log(`📝 Submitting audio: ${recordedBlob.size} bytes, type: ${recordedBlob.type}`);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Determine file extension based on MIME type
      let filename = 'audio.webm';
      if (recordedBlob.type.includes('ogg')) {
        filename = 'audio.ogg';
      } else if (recordedBlob.type.includes('mp4')) {
        filename = 'audio.mp4';
      } else if (recordedBlob.type.includes('webm')) {
        filename = 'audio.webm';
      }
      
      formData.append('file', recordedBlob, filename);
      
      console.log('📤 Sending to /api/speech/transcribe...');
      const response = await fetch(`http://localhost:8000/api/speech/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      console.log(`📥 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ Transcription failed: ${errorText}`);
        setIsSubmitting(false);
        return;
      }
      
      const data = await response.json();
      console.log(`✓ Transcription result: '${data.transcript}'`);
      
      const transcript = data.transcript || '';
      
      if (!transcript.trim()) {
        console.warn('⚠️ Empty transcript received');
        setIsSubmitting(false);
        return;
      }
      
      setUserAnswer(transcript);
      setRecordedBlob(null);
      
      // Auto-submit the answer after transcription
      console.log('📤 Auto-submitting transcribed answer...');
      setTimeout(() => {
        handleSubmitAnswer(transcript);
      }, 500);
    } catch (err) {
      console.error('❌ Audio submission error:', err);
      setRecordedBlob(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }
    if (!resumeFile && !resume.trim()) {
      alert('Please upload your resume');
      return;
    }
    
    // Parse resume FIRST before showing loading screen
    let resumeText = resume;
    if (resumeFile && !resume.trim()) {
      setIsParsingResume(true);
      try {
        const formData = new FormData();
        formData.append('file', resumeFile);
        const response = await fetch('http://localhost:8000/api/interview/parse-resume', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          resumeText = data.resume_text || '';
          setResume(resumeText);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to parse resume');
        }
      } catch (err) {
        console.error('Resume parsing error:', err);
        alert('Error parsing resume: ' + err.message);
        setIsParsingResume(false);
        return;
      }
      setIsParsingResume(false);
    }
    
    // Verify we have resume text before proceeding
    if (!resumeText.trim()) {
      alert('Could not parse resume. Please try again or paste your resume as text.');
      return;
    }
    
    // NOW show loading screen and start interview
    setScreen('loading');
    setLoadingTasks({ questions: false, company: false, profile: false });
    
    try {
      const data = await startInterviewWithJobAndResume(jobDescription, resumeText);
      setSessionId(data.session_id);
      setInterviewerText(data.interviewer_text || '');
      setInterviewStatus(data.status || 'in_progress');
      setCurrentQuestion(Math.max(0, data.question_count || 0));
      setMaxQuestions(data.max_questions || null);
      setLoadingTasks({ questions: true, company: true, profile: true });
      setScreen('interview');
      playTtsAudio(data.audio_base64);
      setShowJobInput(false);
    } catch (err) {
      console.error('Failed to start interview:', err);
      setScreen('preview');
      alert('Failed to start interview: ' + err.message);
    }
  };

  const handleSelectMicrophone = () => {
    if (Platform.OS !== 'web') {
      setSelectedMicrophone('Default Microphone');
      return;
    }

    const pick = async () => {
      if (!audioDevices.length) {
        await refreshDevices();
      }
      const next = pickNextDevice(audioDevices, selectedMicrophone?.deviceId);
      if (next) {
        setSelectedMicrophone({ deviceId: next.deviceId, label: next.label || 'Microphone' });
      }
    };

    pick();
  };

  const handleSelectCamera = () => {
    if (Platform.OS !== 'web') {
      setSelectedCamera('Default Camera');
      return;
    }

    const pick = async () => {
      if (!videoDevices.length) {
        await refreshDevices();
      }
      const next = pickNextDevice(videoDevices, selectedCamera?.deviceId);
      if (next) {
        setSelectedCamera({ deviceId: next.deviceId, label: next.label || 'Camera' });
      }
    };

    pick();
  };

  const handleNextQuestion = () => {
    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
    }
  };

  const handleSubmitAnswer = async (answerText = null) => {
    const answer = answerText || userAnswer.trim();
    if (!answer || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (sessionId) {
        const data = await sendInterviewResponse(sessionId, answer);
        setInterviewerText(data.interviewer_text || '');
        setInterviewStatus(data.status || 'in_progress');
        setCurrentQuestion(Math.max(0, data.question_count || 0));
        setMaxQuestions(data.max_questions || maxQuestions);
        playTtsAudio(data.audio_base64);
      } else {
        handleNextQuestion();
      }
      setUserAnswer('');
      clearTranscript();  // Clear transcript after submitting
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (isSubmitting) return;
    clearTranscript();  // Clear transcript when skipping
    if (sessionId) {
      setIsSubmitting(true);
      try {
        const data = await sendInterviewResponse(sessionId, 'skip');
        setInterviewerText(data.interviewer_text || '');
        setInterviewStatus(data.status || 'in_progress');
        setCurrentQuestion(Math.max(0, data.question_count || 0));
        setMaxQuestions(data.max_questions || maxQuestions);
        playTtsAudio(data.audio_base64);
      } catch (err) {
        console.error('Failed to skip question:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleNextQuestion();
    }
  };

  // Preview Screen
  if (screen === 'preview') {
    return (
      <View style={styles.container}>
        <Header />
        <LinearGradient
          colors={THEME.gradients.page}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.setupContainer}>
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Interview Setup</Text>
              <Text style={styles.setupSubtitle}>Enter your details to begin the mock interview</Text>
              
              <View style={styles.jobInputGroup}>
                <Text style={styles.jobInputLabel}>Job Description</Text>
                <TextInput
                  style={styles.jobInputText}
                  placeholder="Paste the job description here..."
                  placeholderTextColor="#8B7AB8"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                  multiline
                />
              </View>

              <View style={styles.jobInputGroup}>
                <Text style={styles.jobInputLabel}>Your Resume</Text>
                {Platform.OS === 'web' ? (
                  <label style={styles.fileUploadLabel}>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setResumeFile(file);
                          setResume(''); // Clear any previously parsed text
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <View style={styles.fileUploadButton}>
                      <Text style={styles.fileUploadButtonText}>
                        {resumeFile ? `✓ ${resumeFile.name}` : '📄 Upload Resume (PDF/DOCX)'}
                      </Text>
                    </View>
                  </label>
                ) : (
                  <TextInput
                    style={styles.jobInputText}
                    placeholder="Paste your resume here..."
                    placeholderTextColor="#8B7AB8"
                    value={resume}
                    onChangeText={setResume}
                    multiline
                  />
                )}
              </View>

              <Pressable
                style={[
                  styles.startInterviewButton,
                  (!jobDescription.trim() || (!resumeFile && !resume.trim())) && styles.startInterviewButtonDisabled,
                  isParsingResume && styles.startInterviewButtonDisabled
                ]}
                onPress={handleStart}
                disabled={!jobDescription.trim() || (!resumeFile && !resume.trim()) || isParsingResume}
              >
                {isParsingResume ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.startInterviewButtonText}>Parsing Resume...</Text>
                  </>
                ) : (
                  <Text style={styles.startInterviewButtonText}>Start Interview</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  // Loading Screen
  if (screen === 'loading') {
    return (
      <View style={styles.container}>
        <Header />
        <LinearGradient
          colors={THEME.gradients.page}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingTitle}>Let's Get Started</Text>
              
              <View style={styles.loadingList}>
                <View style={styles.loadingItem}>
                  <View style={[
                    styles.loadingCheckmark,
                    loadingTasks.questions && styles.loadingCheckmarkActive
                  ]}>
                    {loadingTasks.questions ? (
                      <View style={styles.checkmarkIcon}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color="#A78BFA" />
                    )}
                  </View>
                  <Text style={styles.loadingItemText}>
                    Generating job specific questions
                  </Text>
                </View>

                <View style={styles.loadingItem}>
                  <View style={[
                    styles.loadingCheckmark,
                    loadingTasks.company && styles.loadingCheckmarkActive
                  ]}>
                    {loadingTasks.company ? (
                      <View style={styles.checkmarkIcon}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color="#A78BFA" />
                    )}
                  </View>
                  <Text style={styles.loadingItemText}>
                    Loading company profile
                  </Text>
                </View>

                <View style={styles.loadingItem}>
                  <View style={[
                    styles.loadingCheckmark,
                    loadingTasks.profile && styles.loadingCheckmarkActive
                  ]}>
                    {loadingTasks.profile ? (
                      <View style={styles.checkmarkIcon}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color="#A78BFA" />
                    )}
                  </View>
                  <Text style={styles.loadingItemText}>
                    Generating your interview profile
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Interview Screen
  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={THEME.gradients.page}
        style={styles.gradient}
      >
        <View style={styles.interviewContainer}>
          {/* Left Side - Video Feed */}
          <View style={styles.videoFeedContainer}>
            <View style={styles.videoFeed}>
              {Platform.OS === 'web' && cameraReady ? (
                <View style={[
                  styles.videoWrapper, 
                  isRecording && styles.videoWrapperRecording
                ]}>
                  <WebVideo
                    videoRef={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 16,
                    }}
                  />
                </View>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <View style={styles.placeholderIcon}>
                    <View style={styles.placeholderHead} />
                    <View style={styles.placeholderBody} />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Right Side - Questions and Feedback */}
          <ScrollView style={styles.questionsScroll} contentContainerStyle={styles.questionsContainer}>
            <View style={styles.questionHeader}>
              <View style={styles.orbPanel}>
                <View style={[styles.orb, isSpeaking && styles.orbActive]} />
                <View style={styles.orbTextWrapper}>
                  <Text style={styles.orbLabel}>AI Interviewer</Text>
                  <Text style={styles.orbStatus}>
                    {isSpeaking ? 'Speaking...' : 'Listening'}
                  </Text>
                  <View style={styles.speakingIndicator}>
                    <View style={[styles.speakingDot, isSpeaking && styles.speakingDotActive]} />
                    <Text style={styles.speakingText}>
                      {isSpeaking ? 'Speaking' : 'Listening'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                  Question {Math.min(currentQuestion + 1, totalQuestions)} of {totalQuestions}
                </Text>
              </View>
            </View>

            <View style={styles.questionCard}>
              <View style={[
                styles.questionBorder,
                isSpeaking && styles.questionBorderActive
              ]} />
              <View style={styles.questionIcon}>
                <View style={styles.questionIconCircle} />
                <View style={styles.questionIconLine1} />
                <View style={styles.questionIconLine2} />
              </View>
              <Text style={styles.questionText}>
                {interviewerText || interviewQuestions[currentQuestion]}
              </Text>
            </View>

            <View style={[styles.postureCard, postureAnimating && styles.postureCardActive]}>
              <Text style={styles.postureTitle}>💡 Live Posture Feedback</Text>
              {postureFeedback?.error ? (
                <Text style={styles.postureMessage}>Posture analysis unavailable</Text>
              ) : postureFeedback?.tips?.length ? (
                postureFeedback.tips.slice(0, 2).map((tip, index) => (
                  <Text key={`${tip}-${index}`} style={styles.postureMessage}>• {tip}</Text>
                ))
              ) : (
                <Text style={styles.postureMessage}>Tracking posture...</Text>
              )}
            </View>

            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your Response</Text>
              
              {/* Always-on Live Transcription Box */}
              <View style={[styles.liveTranscriptionBox, !isListening && styles.liveTranscriptionBoxInactive]}>
                <View style={styles.liveTranscriptionHeader}>
                  <View style={[styles.liveIndicator, isListening && styles.liveIndicatorActive]} />
                  <Text style={styles.liveTranscriptionLabel}>
                    {isSpeaking ? 'AI Speaking...' : isListening ? 'Listening' : 'Paused'}
                  </Text>
                  {userAnswer && (
                    <Pressable 
                      style={styles.clearButton}
                      onPress={clearTranscript}
                    >
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.liveTranscriptionText}>
                  {liveTranscript || userAnswer}
                  <Text style={styles.interimText}>{interimTranscript}</Text>
                  {!liveTranscript && !userAnswer && !interimTranscript && (
                    <Text style={styles.listeningText}>
                      {isSpeaking ? 'Waiting for AI to finish...' : 'Start speaking your answer...'}
                    </Text>
                  )}
                </Text>
              </View>
              
              {/* Live Feedback Box - Always visible when there's feedback */}
              {liveFeedback && liveFeedback.tips && liveFeedback.tips.length > 0 && (
                <View style={[styles.liveFeedbackBox,
                  liveFeedback.sentiment === 'positive' && styles.liveFeedbackPositive,
                  liveFeedback.sentiment === 'needs_work' && styles.liveFeedbackNeedsWork
                ]}>
                  <View style={styles.liveFeedbackHeader}>
                    <Text style={styles.liveFeedbackTitle}>💡 Tips</Text>
                    {liveFeedback.score !== undefined && (
                      <Text style={[styles.liveFeedbackScore,
                        liveFeedback.score >= 70 && styles.scoreGood,
                        liveFeedback.score < 50 && styles.scoreNeedsWork
                      ]}>
                        {liveFeedback.score}%
                      </Text>
                    )}
                  </View>
                  {liveFeedback.tips.map((tip, index) => (
                    <Text key={index} style={styles.liveFeedbackTip}>• {tip}</Text>
                  ))}
                </View>
              )}
              
              {/* Action Buttons */}
              <View style={styles.answerControls}>
                <Pressable
                  style={[
                    styles.answerButton,
                    styles.skipButton,
                    isSubmitting && styles.answerButtonDisabled,
                    hoveredButton === 'skip' && styles.answerButtonHover
                  ]}
                  onPress={handleSkipQuestion}
                  disabled={isSubmitting}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('skip')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.skipButtonText}>
                    {currentQuestion < totalQuestions - 1 ? 'Skip' : 'Finish'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.answerButton,
                    styles.submitButton,
                    (!userAnswer.trim() || isSubmitting) && styles.submitButtonDisabled,
                    hoveredButton === 'submit' && styles.submitButtonHover
                  ]}
                  onPress={() => handleSubmitAnswer()}
                  disabled={!userAnswer.trim() || isSubmitting}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('submit')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Sending...' : currentQuestion < totalQuestions - 1 ? 'Next Question' : 'Complete Interview'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
};

export default withAuth(VideoInterviewPage);

