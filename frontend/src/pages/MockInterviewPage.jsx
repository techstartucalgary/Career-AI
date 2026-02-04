import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './MockInterviewPage.styles';
import { THEME } from '../styles/theme';

const MockInterviewPage = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Technical');

  const categories = ['Technical', 'Behavioral', 'Leadership', 'General'];
  
  const mockQuestions = {
    Technical: [
      'Tell me about a challenging technical problem you solved.',
      'How do you stay updated with the latest technologies?',
      'Describe your experience with version control systems.',
    ],
    Behavioral: [
      'Tell me about a time you worked under pressure.',
      'Describe a situation where you had to work with a difficult team member.',
      'Give an example of how you handled a mistake you made.',
    ],
    Leadership: [
      'Describe a time when you had to lead a team.',
      'How do you motivate team members?',
      'Tell me about a difficult decision you had to make as a leader.',
    ],
    General: [
      'Why are you interested in this position?',
      'Where do you see yourself in 5 years?',
      'What are your greatest strengths and weaknesses?',
    ],
  };

  const questions = mockQuestions[selectedCategory] || mockQuestions.Technical;

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestion(0);
    setUserAnswer('');
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
    } else {
      // Interview complete
      setInterviewStarted(false);
      setCurrentQuestion(0);
      setUserAnswer('');
    }
  };

  const handleSubmitAnswer = () => {
    // TODO: Implement AI feedback logic
    handleNextQuestion();
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient 
        colors={THEME.gradients.page}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {!interviewStarted ? (
              <>
                <View style={styles.headerSection}>
                  <View style={styles.headerVisual}>
                    <View style={styles.headerCircle1} />
                    <View style={styles.headerCircle2} />
                  </View>
                  <View style={styles.headerBadge}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeText}>AI Interview Preparation</Text>
                  </View>
                  <Text style={styles.title}>AI Interview Prep</Text>
                  <Text style={styles.subtitle}>
                    Practice with AI-powered interview questions tailored to your role
                  </Text>
                </View>

                <View style={styles.categorySection}>
                  <Text style={styles.sectionTitle}>Select Question Category</Text>
                  <View style={styles.categoryGrid}>
                    {categories.map((category) => (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryCard,
                          selectedCategory === category && styles.categoryCardActive,
                          hoveredButton === category && styles.categoryCardHover
                        ]}
                        onPress={() => setSelectedCategory(category)}
                        onHoverIn={() => Platform.OS === 'web' && setHoveredButton(category)}
                        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                      >
                        <View style={styles.categoryIcon}>
                          <View style={styles.categoryIconCircle} />
                          <View style={styles.categoryIconLine} />
                        </View>
                        <Text style={[
                          styles.categoryText,
                          selectedCategory === category && styles.categoryTextActive
                        ]}>
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <View style={styles.infoIconCircle} />
                    <View style={styles.infoIconLine1} />
                    <View style={styles.infoIconLine2} />
                  </View>
                  <Text style={styles.infoTitle}>How it works</Text>
                  <Text style={styles.infoText}>
                    • Answer interview questions naturally{'\n'}
                    • Receive AI-powered feedback on your responses{'\n'}
                    • Practice until you're confident
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.startButton,
                    hoveredButton === 'start' && styles.startButtonHover
                  ]}
                  onPress={handleStartInterview}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredButton('start')}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                  <Text style={styles.startButtonText}>Start Practice Interview</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.interviewHeader}>
                  <Text style={styles.interviewTitle}>Question {currentQuestion + 1} of {questions.length}</Text>
                  <Text style={styles.categoryBadge}>{selectedCategory}</Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionIcon}>
                    <View style={styles.questionIconCircle} />
                    <View style={styles.questionIconLine1} />
                    <View style={styles.questionIconLine2} />
                  </View>
                  <Text style={styles.questionText}>
                    {questions[currentQuestion]}
                  </Text>
                </View>

                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>Your Answer</Text>
                  <TextInput
                    style={styles.answerInput}
                    placeholder="Type your answer here..."
                    placeholderTextColor="#8B7AB8"
                    value={userAnswer}
                    onChangeText={setUserAnswer}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      hoveredButton === 'skip' && styles.secondaryButtonHover
                    ]}
                    onPress={handleNextQuestion}
                    onHoverIn={() => Platform.OS === 'web' && setHoveredButton('skip')}
                    onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {currentQuestion < questions.length - 1 ? 'Skip Question' : 'Finish Interview'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.primaryButton,
                      !userAnswer && styles.primaryButtonDisabled,
                      hoveredButton === 'submit' && styles.primaryButtonHover
                    ]}
                    onPress={handleSubmitAnswer}
                    disabled={!userAnswer}
                    onHoverIn={() => Platform.OS === 'web' && setHoveredButton('submit')}
                    onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
                  >
                    <Text style={styles.primaryButtonText}>
                      {currentQuestion < questions.length - 1 ? 'Submit & Next' : 'Submit & Finish'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default MockInterviewPage;
