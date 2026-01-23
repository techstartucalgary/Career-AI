import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './LandingPage.styles';
import './LandingPage.css';

// Floating UI Card Component
const FloatingCard = ({ children, style, delay = 0, duration = 3000 }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      delay,
      useNativeDriver: true,
    }).start();

    // Float animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -12,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );

    setTimeout(() => floatAnimation.start(), delay);

    return () => floatAnimation.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
};

// Animated section wrapper
const AnimatedSection = ({ children, animation = 'fadeUp', delay = 0, style }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  const getAnimationClass = () => {
    if (Platform.OS !== 'web') return '';
    let baseClass = 'animate-on-scroll';
    if (animation === 'fadeLeft') baseClass += ' from-left';
    if (animation === 'fadeRight') baseClass += ' from-right';
    if (animation === 'scale') baseClass += ' scale';
    if (isVisible) baseClass += ' visible';
    return baseClass;
  };

  return (
    <View ref={ref} style={[style, { transitionDelay: `${delay}s` }]} className={getAnimationClass()}>
      {children}
    </View>
  );
};

// Mini Resume Card UI
const MiniResumeCard = ({ style }) => (
  <View style={[styles.miniCard, style]}>
    <View style={styles.miniCardHeader}>
      <View style={styles.miniAvatar} />
      <View style={styles.miniHeaderLines}>
        <View style={[styles.miniLine, { width: 80, height: 8 }]} />
        <View style={[styles.miniLine, { width: 60, height: 6, opacity: 0.5 }]} />
      </View>
    </View>
    <View style={styles.miniCardBody}>
      <View style={[styles.miniLine, { width: '100%' }]} />
      <View style={[styles.miniLine, { width: '85%' }]} />
      <View style={[styles.miniLine, { width: '70%' }]} />
    </View>
    <View style={styles.miniCardTags}>
      <View style={styles.miniTag} />
      <View style={styles.miniTag} />
      <View style={styles.miniTag} />
    </View>
  </View>
);

// Mini Job Card UI
const MiniJobCard = ({ style, highlighted }) => (
  <View style={[styles.miniJobCard, highlighted && styles.miniJobCardHighlighted, style]}>
    <View style={styles.jobCardTop}>
      <View style={[styles.companyLogo, highlighted && styles.companyLogoHighlighted]} />
      <View style={styles.jobCardInfo}>
        <View style={[styles.miniLine, { width: 90, height: 7 }]} />
        <View style={[styles.miniLine, { width: 60, height: 5, opacity: 0.5 }]} />
      </View>
      {highlighted && <View style={styles.matchBadge}><Text style={styles.matchText}>92%</Text></View>}
    </View>
    <View style={styles.jobCardTags}>
      <View style={[styles.jobTag, highlighted && styles.jobTagHighlighted]} />
      <View style={[styles.jobTag, highlighted && styles.jobTagHighlighted]} />
    </View>
  </View>
);

// Mini Chat Bubble
const MiniChatBubble = ({ isAI, style, lines = 2 }) => (
  <View style={[styles.chatBubble, isAI ? styles.chatBubbleAI : styles.chatBubbleUser, style]}>
    {isAI && <View style={styles.aiIndicator}><Text style={styles.aiIndicatorText}>AI</Text></View>}
    <View style={styles.chatLines}>
      {Array(lines).fill(0).map((_, i) => (
        <View key={i} style={[styles.chatLine, { width: `${100 - i * 15}%` }]} />
      ))}
    </View>
  </View>
);

// Animated Progress Ring
const ProgressRing = ({ progress = 75, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      {Platform.OS === 'web' ? (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#A78BFA"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-ring-circle"
          />
        </svg>
      ) : (
        <View style={styles.progressRingFallback} />
      )}
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );
};

// Feature Card with UI Recreation
const FeatureShowcaseCard = ({ children, label, title, description, isHovered, onHoverIn, onHoverOut }) => (
  <Pressable onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.featureCardWrapper}>
    <View style={[styles.featureCard, isHovered && styles.featureCardHovered]}>
      <View style={styles.featureCardGlow} />
      <View style={styles.featureCardContent}>
        <View style={styles.featureCardLeft}>
          <Text style={styles.featureLabel}>{label}</Text>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <View style={styles.featureCardRight}>
          <View style={[styles.featureUIContainer, isHovered && styles.featureUIContainerHovered]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  </Pressable>
);

const LandingPage = () => {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-rotate steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      number: 1,
      title: 'Add your resume',
      description: 'Drop in your existing resume or paste your LinkedIn.',
    },
    {
      number: 2,
      title: 'Find jobs that fit',
      description: 'We show match scores and what gaps to address.',
    },
    {
      number: 3,
      title: 'Apply in one click',
      description: 'Tailored resume and cover letter for each job.',
    },
  ];

  return (
    <ScrollView style={styles.homepage} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        {/* Animated Background */}
        <View style={styles.heroBackground}>
          <LinearGradient
            colors={['#0A0A0F', '#12101A', '#0A0A0F']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.gridLines} />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />
          <View style={styles.glowOrb3} />
        </View>

        {/* Floating UI Elements */}
        <View style={styles.floatingElements}>
          <FloatingCard style={styles.floatingCard1} delay={200} duration={3500}>
            <MiniResumeCard />
          </FloatingCard>

          <FloatingCard style={styles.floatingCard2} delay={400} duration={4000}>
            <MiniJobCard highlighted />
          </FloatingCard>

          <FloatingCard style={styles.floatingCard3} delay={600} duration={3200}>
            <View style={styles.miniStatsCard}>
              <ProgressRing progress={92} size={50} />
              <Text style={styles.miniStatsLabel}>Match Score</Text>
            </View>
          </FloatingCard>

          <FloatingCard style={styles.floatingCard4} delay={800} duration={3800}>
            <View style={styles.miniNotification}>
              <View style={styles.notificationIcon} />
              <View style={styles.notificationContent}>
                <View style={[styles.miniLine, { width: 70, height: 6 }]} />
                <View style={[styles.miniLine, { width: 50, height: 5, opacity: 0.5 }]} />
              </View>
            </View>
          </FloatingCard>
        </View>

        {/* Hero Content */}
        <View style={styles.heroContent}>
          <View style={styles.heroBadge} className="hero-badge-animate">
            <View style={styles.badgePulse} />
            <Text style={styles.badgeText}>Beta · Free while we grow</Text>
          </View>

          <Text style={styles.heroTitle} className="hero-title-animate">
            Apply to jobs{'\n'}
            <Text style={styles.heroTitleGradient}>without the busywork</Text>
          </Text>

          <Text style={styles.heroSubtitle} className="hero-subtitle-animate">
            Upload your resume once. Get tailored applications, cover letters,{'\n'}
            and interview prep for every job you actually want.
          </Text>

          <View style={styles.heroButtons} className="hero-buttons-animate">
            <Pressable
              style={[styles.primaryButton, hoveredButton === 'primary' && styles.primaryButtonHover]}
              onPress={() => router.push('/authentication')}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('primary')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <View style={styles.buttonShine} />
              <Text style={styles.primaryButtonText}>Start applying</Text>
              <View style={styles.buttonArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, hoveredButton === 'secondary' && styles.secondaryButtonHover]}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('secondary')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <Text style={styles.secondaryButtonText}>See how it works</Text>
            </Pressable>
          </View>

          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.stackAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }]}>
                  <LinearGradient
                    colors={['#A78BFA', '#6366F1']}
                    style={styles.avatarGradient}
                  />
                </View>
              ))}
            </View>
            <Text style={styles.socialProofText}>
              <Text style={styles.socialProofHighlight}>400+ job seekers</Text> in beta
            </Text>
          </View>
        </View>

        {/* Scroll Indicator */}
        <View style={styles.scrollIndicator}>
          <View style={styles.scrollLine} />
        </View>
      </View>

      {/* Problem Section */}
      <View style={styles.problemSection}>
        <View style={styles.container}>
          <AnimatedSection>
            <View style={styles.problemCard}>
              <View style={styles.problemCardInner}>
                <Text style={styles.problemLabel}>THE PROBLEM</Text>
                <Text style={styles.problemTitle}>Applying to jobs is broken</Text>
                <View style={styles.problemStats}>
                  <View style={styles.problemStat}>
                    <Text style={styles.problemStatNumber}>45</Text>
                    <Text style={styles.problemStatLabel}>minutes per{'\n'}application</Text>
                  </View>
                  <View style={styles.problemStatDivider} />
                  <View style={styles.problemStat}>
                    <Text style={styles.problemStatNumber}>80%</Text>
                    <Text style={styles.problemStatLabel}>repetitive{'\n'}tasks</Text>
                  </View>
                  <View style={styles.problemStatDivider} />
                  <View style={styles.problemStat}>
                    <Text style={styles.problemStatNumber}>12+</Text>
                    <Text style={styles.problemStatLabel}>form fields{'\n'}every time</Text>
                  </View>
                </View>
                <Text style={styles.problemDescription}>
                  You find a job you like. Then you spend 45 minutes rewriting your resume,
                  drafting a cover letter, and filling out the same form fields you filled out yesterday.
                </Text>
              </View>
            </View>
          </AnimatedSection>
        </View>
      </View>

      {/* How It Works - Interactive Steps */}
      <View style={styles.stepsSection}>
        <View style={styles.container}>
          <AnimatedSection>
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            <Text style={styles.sectionTitle}>Three steps. No learning curve.</Text>
          </AnimatedSection>

          <View style={styles.stepsContainer}>
            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
              {steps.map((step, index) => (
                <Pressable
                  key={index}
                  onPress={() => setActiveStep(index)}
                  onHoverIn={() => Platform.OS === 'web' && setHoveredCard(index)}
                  onHoverOut={() => Platform.OS === 'web' && setHoveredCard(null)}
                >
                  <View style={[
                    styles.stepIndicator,
                    activeStep === index && styles.stepIndicatorActive,
                    hoveredCard === index && styles.stepIndicatorHovered
                  ]}>
                    <View style={[styles.stepNumber, activeStep === index && styles.stepNumberActive]}>
                      <Text style={styles.stepNumberText}>{step.number}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={[styles.stepTitle, activeStep === index && styles.stepTitleActive]}>
                        {step.title}
                      </Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                    {activeStep === index && <View style={styles.stepProgressBar} />}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Step Preview */}
            <AnimatedSection style={styles.stepPreview}>
              <View style={styles.stepPreviewCard}>
                <View style={styles.previewWindow}>
                  <View style={styles.windowHeader}>
                    <View style={styles.windowDots}>
                      <View style={[styles.windowDot, { backgroundColor: '#FF5F56' }]} />
                      <View style={[styles.windowDot, { backgroundColor: '#FFBD2E' }]} />
                      <View style={[styles.windowDot, { backgroundColor: '#27CA3F' }]} />
                    </View>
                    <View style={styles.windowTitle}>
                      <View style={[styles.miniLine, { width: 100, height: 6 }]} />
                    </View>
                  </View>

                  {activeStep === 0 && (
                    <View style={styles.uploadPreview}>
                      <View style={styles.uploadZone}>
                        <View style={styles.uploadIcon}>
                          <Text style={styles.uploadIconText}>↑</Text>
                        </View>
                        <Text style={styles.uploadText}>Drop your resume</Text>
                        <Text style={styles.uploadSubtext}>PDF, DOCX up to 10MB</Text>
                      </View>
                      <View style={styles.uploadProgress}>
                        <View style={styles.uploadProgressFill} />
                      </View>
                    </View>
                  )}

                  {activeStep === 1 && (
                    <View style={styles.matchPreview}>
                      <View style={styles.matchHeader}>
                        <View style={styles.searchBar}>
                          <Text style={styles.searchIcon}>⌕</Text>
                          <View style={[styles.miniLine, { width: 120, height: 6 }]} />
                        </View>
                      </View>
                      <View style={styles.matchResults}>
                        <MiniJobCard highlighted style={{ marginBottom: 8 }} />
                        <MiniJobCard style={{ opacity: 0.6 }} />
                      </View>
                    </View>
                  )}

                  {activeStep === 2 && (
                    <View style={styles.applyPreview}>
                      <View style={styles.applyHeader}>
                        <View style={styles.applyTabs}>
                          <View style={[styles.applyTab, styles.applyTabActive]}>
                            <Text style={styles.applyTabText}>Resume</Text>
                          </View>
                          <View style={styles.applyTab}>
                            <Text style={styles.applyTabTextInactive}>Cover Letter</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.applyContent}>
                        <MiniResumeCard style={{ transform: [{ scale: 0.9 }] }} />
                        <Pressable style={styles.applyButton}>
                          <Text style={styles.applyButtonText}>Apply Now</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </AnimatedSection>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.container}>
          <AnimatedSection>
            <Text style={styles.sectionLabel}>FEATURES</Text>
            <Text style={styles.sectionTitle}>Everything you need to apply faster</Text>
          </AnimatedSection>

          {/* Feature 1: Auto-Apply */}
          <AnimatedSection delay={0.1}>
            <FeatureShowcaseCard
              label="FOR HIGH-VOLUME APPLICANTS"
              title="Set criteria. Let it run."
              description="Define your target roles, salary range, and locations. The system applies to matching jobs automatically. You review and approve before anything sends."
              isHovered={hoveredFeature === 'auto'}
              onHoverIn={() => Platform.OS === 'web' && setHoveredFeature('auto')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredFeature(null)}
            >
              <View style={styles.autoApplyUI}>
                <View style={styles.criteriaPanel}>
                  <Text style={styles.criteriaPanelTitle}>Job Criteria</Text>
                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Role</Text>
                    <View style={styles.criteriaValue}>
                      <Text style={styles.criteriaValueText}>Product Designer</Text>
                    </View>
                  </View>
                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Salary</Text>
                    <View style={styles.criteriaValue}>
                      <Text style={styles.criteriaValueText}>$120k - $180k</Text>
                    </View>
                  </View>
                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Location</Text>
                    <View style={styles.criteriaValue}>
                      <Text style={styles.criteriaValueText}>Remote, SF, NYC</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.queuePanel}>
                  <View style={styles.queueHeader}>
                    <Text style={styles.queueTitle}>Application Queue</Text>
                    <View style={styles.queueBadge}>
                      <Text style={styles.queueBadgeText}>3 pending</Text>
                    </View>
                  </View>
                  <View style={styles.queueItems}>
                    {[{ company: 'Stripe', status: 'ready' }, { company: 'Linear', status: 'ready' }, { company: 'Vercel', status: 'sent' }].map((item, i) => (
                      <View key={i} style={styles.queueItem}>
                        <View style={styles.queueItemLogo} />
                        <Text style={styles.queueItemCompany}>{item.company}</Text>
                        <View style={[styles.queueItemStatus, item.status === 'sent' && styles.queueItemStatusSent]}>
                          <Text style={styles.queueItemStatusText}>{item.status === 'sent' ? '✓' : '○'}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </FeatureShowcaseCard>
          </AnimatedSection>

          {/* Feature 2: Resume Tailoring */}
          <AnimatedSection delay={0.2}>
            <FeatureShowcaseCard
              label="STOP REWRITING FROM SCRATCH"
              title="One resume, tailored to each job"
              description="Paste a job description. We reorder your bullet points, adjust keywords, and surface the experience that matters most. You keep your voice."
              isHovered={hoveredFeature === 'resume'}
              onHoverIn={() => Platform.OS === 'web' && setHoveredFeature('resume')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredFeature(null)}
            >
              <View style={styles.resumeTailorUI}>
                <View style={styles.resumeCompare}>
                  <View style={styles.resumeOriginal}>
                    <Text style={styles.resumeCompareLabel}>Original</Text>
                    <View style={styles.resumeDoc}>
                      <View style={[styles.miniLine, { width: '60%', backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                      <View style={styles.resumeDocSection}>
                        <View style={[styles.miniLine, { width: '100%' }]} />
                        <View style={[styles.miniLine, { width: '90%' }]} />
                        <View style={[styles.miniLine, { width: '80%' }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.resumeArrow}>
                    <Text style={styles.resumeArrowText}>→</Text>
                  </View>
                  <View style={styles.resumeTailored}>
                    <Text style={styles.resumeCompareLabel}>Tailored</Text>
                    <View style={[styles.resumeDoc, styles.resumeDocHighlighted]}>
                      <View style={[styles.miniLine, { width: '60%', backgroundColor: '#A78BFA' }]} />
                      <View style={styles.resumeDocSection}>
                        <View style={[styles.highlightedLine, { width: '100%' }]} />
                        <View style={[styles.miniLine, { width: '85%' }]} />
                        <View style={[styles.highlightedLine, { width: '95%' }]} />
                      </View>
                      <View style={styles.keywordBadges}>
                        <View style={styles.keywordBadge}><Text style={styles.keywordText}>+React</Text></View>
                        <View style={styles.keywordBadge}><Text style={styles.keywordText}>+Figma</Text></View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.matchScorePanel}>
                  <ProgressRing progress={94} size={70} strokeWidth={5} />
                  <View style={styles.matchScoreInfo}>
                    <Text style={styles.matchScoreTitle}>ATS Match Score</Text>
                    <Text style={styles.matchScoreDesc}>+23% from original</Text>
                  </View>
                </View>
              </View>
            </FeatureShowcaseCard>
          </AnimatedSection>

          {/* Feature 3: Cover Letters */}
          <AnimatedSection delay={0.3}>
            <FeatureShowcaseCard
              label="FIRST DRAFTS IN SECONDS"
              title="Cover letters that don't sound like templates"
              description="We pull context from your resume and the job posting to draft a letter that connects the two. Most people spend 5 minutes reviewing instead of 30 writing."
              isHovered={hoveredFeature === 'cover'}
              onHoverIn={() => Platform.OS === 'web' && setHoveredFeature('cover')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredFeature(null)}
            >
              <View style={styles.coverLetterUI}>
                <View style={styles.letterDoc}>
                  <View style={styles.letterHeader}>
                    <View style={[styles.miniLine, { width: 100, height: 8, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <View style={[styles.miniLine, { width: 80, height: 6, marginTop: 4, opacity: 0.5 }]} />
                  </View>
                  <View style={styles.letterBody}>
                    <Text style={styles.letterGreeting}>Dear Hiring Manager,</Text>
                    <View style={styles.letterParagraph}>
                      <View style={[styles.letterLine, styles.letterLineTyping]} />
                      <View style={[styles.letterLine, { width: '95%' }]} />
                      <View style={[styles.letterLine, { width: '88%' }]} />
                      <View style={[styles.letterLine, { width: '92%' }]} />
                    </View>
                    <View style={[styles.letterParagraph, { opacity: 0.7 }]}>
                      <View style={[styles.letterLine, { width: '100%' }]} />
                      <View style={[styles.letterLine, { width: '85%' }]} />
                    </View>
                  </View>
                  <View style={styles.letterFooter}>
                    <View style={styles.letterSignature}>
                      <View style={[styles.miniLine, { width: 60, height: 6 }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.letterActions}>
                  <View style={styles.letterAction}>
                    <Text style={styles.letterActionIcon}>✎</Text>
                    <Text style={styles.letterActionText}>Edit</Text>
                  </View>
                  <View style={[styles.letterAction, styles.letterActionPrimary]}>
                    <Text style={styles.letterActionIcon}>↓</Text>
                    <Text style={styles.letterActionText}>Download</Text>
                  </View>
                </View>
              </View>
            </FeatureShowcaseCard>
          </AnimatedSection>

          {/* Feature 4: Interview Prep */}
          <AnimatedSection delay={0.4}>
            <FeatureShowcaseCard
              label="BEFORE THE CALL"
              title="Practice answers for that specific role"
              description="We generate likely questions based on the job description. Practice out loud, get feedback. Not a mock interview—just a way to think through answers."
              isHovered={hoveredFeature === 'interview'}
              onHoverIn={() => Platform.OS === 'web' && setHoveredFeature('interview')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredFeature(null)}
            >
              <View style={styles.interviewUI}>
                <View style={styles.questionPanel}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>Q3</Text>
                  </View>
                  <Text style={styles.questionText}>Tell me about a time you had to make a difficult product decision with incomplete data.</Text>
                </View>
                <View style={styles.answerPanel}>
                  <View style={styles.answerHeader}>
                    <View style={styles.answerRecording}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                    <Text style={styles.answerTimer}>1:24</Text>
                  </View>
                  <View style={styles.answerWaveform}>
                    {Array(20).fill(0).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: Math.random() * 30 + 10 }
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.feedbackHint}>
                  <Text style={styles.feedbackHintIcon}>💡</Text>
                  <Text style={styles.feedbackHintText}>Tip: Use the STAR method for behavioral questions</Text>
                </View>
              </View>
            </FeatureShowcaseCard>
          </AnimatedSection>
        </View>
      </View>

      {/* Final CTA */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBackground}>
          <View style={styles.ctaGlow1} />
          <View style={styles.ctaGlow2} />
        </View>
        <View style={styles.container}>
          <AnimatedSection>
            <Text style={styles.ctaTitle}>Stop rewriting the same resume</Text>
            <Text style={styles.ctaSubtitle}>Upload once. Apply to jobs that actually fit.</Text>

            <Pressable
              style={[styles.ctaButton, hoveredButton === 'cta' && styles.ctaButtonHover]}
              onPress={() => router.push('/authentication')}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('cta')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <LinearGradient
                colors={['#A78BFA', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Get started</Text>
                <Text style={styles.ctaButtonArrow}>→</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.ctaNote}>Free to use. No credit card required.</Text>
          </AnimatedSection>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Career AI</Text>
      </View>
    </ScrollView>
  );
};

export default LandingPage;
