import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import styles from './VideoInterviewPage.styles';

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
  const [hoveredButton, setHoveredButton] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const interviewQuestions = [
    'Tell me about yourself and why you are interested in this position.',
    'What relevant experience do you have for this role?',
    'How do you handle working under pressure?',
    'Describe a challenging project you worked on and how you overcame obstacles.',
    'Where do you see yourself in 5 years?',
  ];

  // Initialize camera preview
  useEffect(() => {
    if (screen === 'preview' && Platform.OS === 'web') {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraReady(true);
          }
        })
        .catch((err) => {
          console.error('Error accessing camera:', err);
          setCameraReady(true); // Still allow proceeding with placeholder
        });
    } else if (screen === 'preview') {
      // For native, camera will be handled differently
      setCameraReady(true);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screen]);

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

  const handleStart = () => {
    setScreen('loading');
  };

  const handleSelectMicrophone = () => {
    // In a real implementation, this would show a device picker
    setSelectedMicrophone('Default Microphone');
  };

  const handleSelectCamera = () => {
    // In a real implementation, this would show a device picker
    setSelectedCamera('Default Camera');
  };

  const handleNextQuestion = () => {
    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
    }
  };

  const handleSubmitAnswer = () => {
    // TODO: Implement AI feedback logic
    handleNextQuestion();
  };

  // Preview Screen
  if (screen === 'preview') {
    return (
      <View style={styles.container}>
        <Header />
        <LinearGradient
          colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']}
          style={styles.gradient}
        >
          <View style={styles.previewContainer}>
            <View style={styles.videoPreviewArea}>
              {Platform.OS === 'web' && cameraReady ? (
                <View style={styles.videoWrapper}>
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

            <View style={styles.controlsBar}>
              <Pressable
                style={[
                  styles.controlButton,
                  styles.selectButton,
                  hoveredButton === 'mic' && styles.controlButtonHover
                ]}
                onPress={handleSelectMicrophone}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('mic')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.controlIcon}>
                  <View style={styles.micIcon} />
                </View>
                <Text style={styles.controlButtonText}>Select Microphone</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.controlButton,
                  styles.selectButton,
                  hoveredButton === 'camera' && styles.controlButtonHover
                ]}
                onPress={handleSelectCamera}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('camera')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.controlIcon}>
                  <View style={styles.cameraIcon} />
                </View>
                <Text style={styles.controlButtonText}>Select Camera</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.controlButton,
                  styles.startButton,
                  hoveredButton === 'start' && styles.startButtonHover
                ]}
                onPress={handleStart}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('start')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </Pressable>
            </View>
          </View>
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
          colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']}
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
        colors={['#1F1C2F', '#2D1B3D', '#1F1C2F']}
        style={styles.gradient}
      >
        <View style={styles.interviewContainer}>
          {/* Left Side - Video Feed */}
          <View style={styles.videoFeedContainer}>
            <View style={styles.videoFeed}>
              {Platform.OS === 'web' && cameraReady ? (
                <View style={styles.videoWrapper}>
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
          <View style={styles.questionsContainer}>
            <View style={styles.questionHeader}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                  Question {currentQuestion + 1} of {interviewQuestions.length}
                </Text>
              </View>
            </View>

            <View style={styles.questionCard}>
              <View style={styles.questionIcon}>
                <View style={styles.questionIconCircle} />
                <View style={styles.questionIconLine1} />
                <View style={styles.questionIconLine2} />
              </View>
              <Text style={styles.questionText}>
                {interviewQuestions[currentQuestion]}
              </Text>
            </View>

            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your Response</Text>
              <View style={styles.answerInputContainer}>
                <Text style={[
                  styles.answerInput,
                  userAnswer ? styles.answerInputActive : styles.answerInputPlaceholder
                ]}>
                  {userAnswer || 'Speak your answer...'}
                </Text>
              </View>
            </View>

            <View style={styles.interviewControls}>
              <Pressable
                style={[
                  styles.interviewButton,
                  styles.skipButton,
                  hoveredButton === 'skip' && styles.interviewButtonHover
                ]}
                onPress={handleNextQuestion}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('skip')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.skipButtonText}>
                  {currentQuestion < interviewQuestions.length - 1 ? 'Skip' : 'Finish'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.interviewButton,
                  styles.submitButton,
                  hoveredButton === 'submit' && styles.submitButtonHover
                ]}
                onPress={handleSubmitAnswer}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('submit')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <Text style={styles.submitButtonText}>
                  {currentQuestion < interviewQuestions.length - 1 ? 'Next Question' : 'Complete Interview'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default VideoInterviewPage;

