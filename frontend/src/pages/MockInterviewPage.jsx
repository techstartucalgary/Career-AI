import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './MockInterviewPage.styles';
import { THEME } from '../styles/theme';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { getQuickFeedback, getFullReview } from '../services/interviewService';

const scoreColor = (score) =>
  score >= 70 ? '#4ADE80' : score >= 50 ? '#FACC15' : '#F87171';

const scoreLabel = (score) =>
  score >= 90 ? 'Exceptional' : score >= 70 ? 'Strong' : score >= 50 ? 'Fair' : score >= 30 ? 'Needs Work' : 'Keep Going';

const QuickFeedbackCard = ({ feedback, isLast, onNext, hoveredButton, setHoveredButton }) => {
  const color = scoreColor(feedback.score);

  return (
    <View style={styles.qfCard}>
      <LinearGradient
        colors={['rgba(167,139,250,0.06)', 'rgba(99,102,241,0.03)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.qfGradient}
      >
        <View style={styles.qfInner}>
          <View style={styles.qfScoreWrap}>
            <Text style={[styles.qfScore, { color }]}>{feedback.score}</Text>
            <View style={[styles.qfScoreBar, { backgroundColor: color }]} />
          </View>
          <View style={styles.qfContent}>
            <Text style={styles.qfText}>{feedback.feedback}</Text>
            {feedback.tip ? (
              <View style={styles.qfTipWrap}>
                <View style={styles.qfTipDot} />
                <Text style={styles.qfTip}>{feedback.tip}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>
      <Pressable
        style={[
          styles.primaryButton,
          hoveredButton === 'nextAfterFeedback' && styles.primaryButtonHover,
        ]}
        onPress={onNext}
        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('nextAfterFeedback')}
        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
      >
        <Text style={styles.primaryButtonText}>
          {isLast ? 'View Results' : 'Next Question'}
        </Text>
      </Pressable>
    </View>
  );
};

const ResultsSummary = ({
  reviewData,
  questions,
  answers,
  category,
  isLoading,
  onPracticeAgain,
  hoveredButton,
  setHoveredButton,
}) => {
  if (isLoading) {
    return (
      <View style={styles.rvContainer}>
        <View style={styles.rvLoadingCard}>
          <LinearGradient
            colors={['rgba(167,139,250,0.08)', 'transparent']}
            style={styles.rvLoadingGradient}
          >
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.rvLoadingTitle}>Building your report</Text>
            <Text style={styles.rvLoadingSubtitle}>Reviewing all answers together...</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (!reviewData) return null;

  const overallColor = scoreColor(reviewData.overall_score);

  return (
    <View style={styles.rvContainer}>
      {/* Hero score section */}
      <View style={styles.rvHero}>
        <Text style={styles.rvEyebrow}>{category} Interview</Text>
        <View style={styles.rvScoreRow}>
          <Text style={[styles.rvBigScore, { color: overallColor }]}>
            {reviewData.overall_score}
          </Text>
          <View style={styles.rvScoreMeta}>
            <Text style={[styles.rvScoreWord, { color: overallColor }]}>
              {scoreLabel(reviewData.overall_score)}
            </Text>
            <Text style={styles.rvScoreOutOf}>out of 100</Text>
          </View>
        </View>
        {reviewData.overall_summary ? (
          <Text style={styles.rvSummary}>{reviewData.overall_summary}</Text>
        ) : null}
      </View>

      {/* Per-question breakdown */}
      <View style={styles.rvDivider} />
      <Text style={styles.rvSectionLabel}>Question Breakdown</Text>

      {questions.map((q, idx) => {
        const fb = reviewData.questions?.[idx];
        const answer = answers[idx];

        if (!fb) {
          return (
            <View key={idx} style={styles.rvCard}>
              <View style={styles.rvCardTop}>
                <View style={styles.rvCardNum}>
                  <Text style={styles.rvCardNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.rvCardSkipPill}>
                  <Text style={styles.rvCardSkipText}>Skipped</Text>
                </View>
              </View>
              <Text style={styles.rvCardQuestion}>{q}</Text>
            </View>
          );
        }

        const color = scoreColor(fb.score);

        return (
          <View key={idx} style={styles.rvCard}>
            <LinearGradient
              colors={[color + '08', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.rvCardGradient}
            />
            <View style={styles.rvCardTop}>
              <View style={styles.rvCardNum}>
                <Text style={styles.rvCardNumText}>{idx + 1}</Text>
              </View>
              <View style={[styles.rvCardScorePill, { backgroundColor: color + '18' }]}>
                <View style={[styles.rvCardScoreDot, { backgroundColor: color }]} />
                <Text style={[styles.rvCardScoreVal, { color }]}>{fb.score}</Text>
              </View>
            </View>

            <Text style={styles.rvCardQuestion}>{q}</Text>

            {answer ? (
              <View style={styles.rvYourAnswer}>
                <View style={styles.rvYourAnswerBar} />
                <Text style={styles.rvYourAnswerText}>{answer}</Text>
              </View>
            ) : null}

            {fb.detailed_feedback ? (
              <Text style={styles.rvDetailedText}>{fb.detailed_feedback}</Text>
            ) : null}

            <View style={styles.rvColumns}>
              {fb.strengths?.length > 0 && (
                <View style={styles.rvCol}>
                  <Text style={styles.rvColLabel}>What worked</Text>
                  {fb.strengths.map((s, i) => (
                    <View key={i} style={styles.rvBulletRow}>
                      <View style={[styles.rvBulletDot, { backgroundColor: '#4ADE80' }]} />
                      <Text style={styles.rvBulletText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
              {fb.improvements?.length > 0 && (
                <View style={styles.rvCol}>
                  <Text style={styles.rvColLabel}>To improve</Text>
                  {fb.improvements.map((s, i) => (
                    <View key={i} style={styles.rvBulletRow}>
                      <View style={[styles.rvBulletDot, { backgroundColor: '#FACC15' }]} />
                      <Text style={styles.rvBulletText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {fb.sample_answer ? (
              <View style={styles.rvSample}>
                <Text style={styles.rvSampleLabel}>Suggested approach</Text>
                <Text style={styles.rvSampleText}>{fb.sample_answer}</Text>
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={styles.rvActions}>
        <Pressable
          style={[
            styles.startButton,
            hoveredButton === 'practiceAgain' && styles.startButtonHover,
          ]}
          onPress={onPracticeAgain}
          onHoverIn={() => Platform.OS === 'web' && setHoveredButton('practiceAgain')}
          onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        >
          <Text style={styles.startButtonText}>Practice Again</Text>
        </Pressable>
      </View>
    </View>
  );
};

const MockInterviewPage = () => {
  const { isWideLayout } = useBreakpoints();
  const scrollRef = useRef(null);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Technical');

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);

  const [allAnswers, setAllAnswers] = useState([]);

  const [showResults, setShowResults] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);

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

  const scrollToTop = () => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: true });
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestion(0);
    setUserAnswer('');
    setAllAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setShowFeedback(false);
    setCurrentFeedback(null);
    setReviewData(null);
  };

  const finishInterview = async (finalAnswers) => {
    setInterviewStarted(false);
    setShowResults(true);
    setIsLoadingReview(true);
    scrollToTop();

    const responses = questions.map((q, i) => ({
      question: q,
      answer: finalAnswers[i] || '',
    }));

    try {
      const review = await getFullReview(selectedCategory, responses);
      setReviewData(review);
    } catch (err) {
      console.error('Full review failed:', err);
      setReviewData({
        overall_score: 0,
        overall_summary: 'Could not reach the AI service. Please try again.',
        questions: [],
      });
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
      scrollToTop();
    } else {
      finishInterview(allAnswers);
    }
  };

  const handleSubmitAnswer = async () => {
    setIsEvaluating(true);
    scrollToTop();

    const updatedAnswers = [...allAnswers];
    updatedAnswers[currentQuestion] = userAnswer;
    setAllAnswers(updatedAnswers);

    try {
      const feedback = await getQuickFeedback(
        questions[currentQuestion],
        userAnswer,
        selectedCategory,
      );
      setCurrentFeedback(feedback);
      setShowFeedback(true);
    } catch (err) {
      console.error('Quick feedback failed:', err);
      setCurrentFeedback({
        score: 0,
        feedback: 'Could not reach the AI service.',
        tip: 'Check your connection and try again.',
      });
      setShowFeedback(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextAfterFeedback = () => {
    setShowFeedback(false);
    setCurrentFeedback(null);
    setUserAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      scrollToTop();
    } else {
      finishInterview(allAnswers);
    }
  };

  const handlePracticeAgain = () => {
    setShowResults(false);
    setInterviewStarted(false);
    setCurrentQuestion(0);
    setUserAnswer('');
    setAllAnswers([]);
    setCurrentFeedback(null);
    setShowFeedback(false);
    setReviewData(null);
    scrollToTop();
  };

  const renderIntro = () => (
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
                hoveredButton === category && styles.categoryCardHover,
              ]}
              onPress={() => setSelectedCategory(category)}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton(category)}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <View style={styles.categoryIcon}>
                <View style={styles.categoryIconCircle} />
                <View style={styles.categoryIconLine} />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
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
          • Get a quick score and tip after each answer{'\n'}
          • Receive a detailed AI review at the end
        </Text>
      </View>

      <Pressable
        style={[styles.startButton, hoveredButton === 'start' && styles.startButtonHover]}
        onPress={handleStartInterview}
        onHoverIn={() => Platform.OS === 'web' && setHoveredButton('start')}
        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
      >
        <Text style={styles.startButtonText}>Start Practice Interview</Text>
      </Pressable>
    </>
  );

  const renderQuestion = () => (
    <>
      <View style={styles.interviewHeader}>
        <Text style={styles.interviewTitle}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
        <Text style={styles.categoryBadge}>{selectedCategory}</Text>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionIcon}>
          <View style={styles.questionIconCircle} />
          <View style={styles.questionIconLine1} />
          <View style={styles.questionIconLine2} />
        </View>
        <Text style={styles.questionText}>{questions[currentQuestion]}</Text>
      </View>

      {isEvaluating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Evaluating your answer...</Text>
        </View>
      ) : showFeedback && currentFeedback ? (
        <QuickFeedbackCard
          feedback={currentFeedback}
          isLast={currentQuestion >= questions.length - 1}
          onNext={handleNextAfterFeedback}
          hoveredButton={hoveredButton}
          setHoveredButton={setHoveredButton}
        />
      ) : (
        <>
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
                hoveredButton === 'skip' && styles.secondaryButtonHover,
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
                hoveredButton === 'submit' && styles.primaryButtonHover,
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
    </>
  );

  const renderBody = () => {
    if (showResults) {
      return (
        <ResultsSummary
          reviewData={reviewData}
          questions={questions}
          answers={allAnswers}
          category={selectedCategory}
          isLoading={isLoadingReview}
          onPracticeAgain={handlePracticeAgain}
          hoveredButton={hoveredButton}
          setHoveredButton={setHoveredButton}
        />
      );
    }
    if (interviewStarted) return renderQuestion();
    return renderIntro();
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient colors={THEME.gradients.page} style={styles.gradient}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.content, !isWideLayout && { paddingHorizontal: 16, paddingTop: 28 }]}
          >
            {renderBody()}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default MockInterviewPage;
