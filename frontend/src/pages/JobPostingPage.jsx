import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../components/Header';
import styles from './JobPostingPage.styles';
import './JobPages.css';
import { cacheJobs, fetchJobById, getCachedJob } from '../services/api';

const toParagraphs = (description) => {
  const text = String(description || '').trim();
  if (!text) return ['Description not available for this posting yet.'];

  const chunks = text
    .split(/\n{2,}|\r\n\r\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length > 0) return chunks.slice(0, 6);

  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
};

const sentenceBullets = (text, fallback) => {
  const lines = String(text || '')
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .slice(0, 5);

  return lines.length > 0 ? lines : fallback;
};

const normalizeForView = (job) => ({
  id: String(job?.id || ''),
  source: String(job?.source || 'linkedin'),
  company: String(job?.company || 'Company'),
  title: String(job?.title || 'Untitled role'),
  location: String(job?.location || 'Location not listed'),
  type: String(job?.employment_type || (Array.isArray(job?.types) ? job.types[0] : '') || 'Not specified'),
  salary: String(job?.salary || job?.rate || 'Compensation not listed'),
  matchScore: Number(job?.match_score || job?.matchScore || 82),
  applyUrl: job?.apply_url || job?.applyUrl || null,
  about: toParagraphs(job?.description),
  responsibilities: sentenceBullets(job?.description, [
    'Review responsibilities directly in the original posting.',
    'Assess role scope, tools, and collaboration expectations.',
    'Use Interview Prep to tailor your practice to this role.',
  ]),
  qualifications: [
    'Review required and preferred qualifications in the source posting.',
    ...sentenceBullets(job?.description, [
      'Focus your resume on measurable impact relevant to this role.',
      'Match your experience to the role requirements before applying.',
    ]).slice(0, 3),
  ],
});

const JobPostingPage = () => {
  const router = useRouter();
  const { id, source } = useLocalSearchParams();
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState('');

  const jobId = String(id || '').trim();
  const jobSource = String(source || 'linkedin').toLowerCase();

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      if (!jobId) {
        if (isMounted) {
          setJobError('Missing job ID.');
          setLoadingJob(false);
        }
        return;
      }

      setLoadingJob(true);
      setJobError('');

      const cached = getCachedJob(jobId, jobSource);
      if (cached && isMounted) {
        setJobData(normalizeForView(cached));
      }

      try {
        const liveJob = await fetchJobById(jobId, jobSource);
        cacheJobs([liveJob]);
        if (isMounted) {
          setJobData(normalizeForView(liveJob));
        }
      } catch (error) {
        if (!cached && isMounted) {
          setJobError(error?.message || 'Unable to load this job right now.');
        }
      } finally {
        if (isMounted) {
          setLoadingJob(false);
        }
      }
    };

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId, jobSource]);

  const canApply = useMemo(() => Boolean(jobData?.applyUrl), [jobData]);

  const handleApply = async () => {
    if (!jobData?.applyUrl) return;
    try {
      await Linking.openURL(jobData.applyUrl);
    } catch (_e) {
      setJobError('Unable to open the application link for this job.');
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient
        colors={['#0A0A0F', '#12101A', '#0A0A0F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          {/* Left Sidebar */}
          <View style={styles.sidebar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backButton,
                hoveredButton === 'back' && styles.backButtonHover
              ]}
              onHoverIn={() => Platform.OS === 'web' && setHoveredButton('back')}
              onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
            >
              <View style={styles.backArrow}>
                <View style={styles.backArrowLine} />
                <View style={styles.backArrowHead} />
              </View>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={styles.actionButtons}>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.primaryActionButton,
                  hoveredButton === 'apply' && styles.actionButtonHover
                ]}
                onPress={handleApply}
                disabled={!canApply}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('apply')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.applyIcon} />
                </View>
                <Text style={styles.actionButtonText}>{canApply ? 'Apply Now' : 'Apply Link Unavailable'}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'interview' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/interview')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('interview')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.interviewIcon} />
                </View>
                <Text style={styles.actionButtonText}>Interview Prep</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'cover-letter' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/cover-letter')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('cover-letter')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.letterIcon} />
                </View>
                <Text style={styles.actionButtonText}>Generate Cover Letter</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  hoveredButton === 'resume' && styles.actionButtonHover
                ]}
                onPress={() => router.push('/resume')}
                onHoverIn={() => Platform.OS === 'web' && setHoveredButton('resume')}
                onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
              >
                <View style={styles.actionButtonIcon}>
                  <View style={styles.resumeIcon} />
                </View>
                <Text style={styles.actionButtonText}>Generate Resume</Text>
              </Pressable>
            </View>
          </View>

          {/* Right Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentWrapper}>
              {loadingJob && (
                <View style={styles.loadingCard}>
                  <Text style={styles.loadingText}>Loading full job details...</Text>
                </View>
              )}

              {!loadingJob && jobError ? (
                <View style={styles.loadingCard}>
                  <Text style={styles.errorText}>{jobError}</Text>
                </View>
              ) : null}

              {!loadingJob && !jobError && !jobData ? (
                <View style={styles.loadingCard}>
                  <Text style={styles.loadingText}>No job details available.</Text>
                </View>
              ) : null}

              {jobData ? (
                <>
              {/* Job Header */}
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderLeft}>
                  <View style={styles.companyLogo}>
                    <Text style={styles.companyLogoText}>
                      {jobData.company.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.jobHeaderContent}>
                    <View style={styles.jobHeaderTop}>
                      <Text style={styles.companyName}>{jobData.company}</Text>
                      <View style={styles.matchBadge}>
                          <Text style={styles.matchScore}>{Math.round(jobData.matchScore)}%</Text>
                        <Text style={styles.matchLabel}>Match</Text>
                      </View>
                    </View>
                    <Text style={styles.jobTitle}>{jobData.title}</Text>
                    <View style={styles.jobMeta}>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.locationIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.location}</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.typeIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.type}</Text>
                      </View>
                      <View style={styles.jobMetaItem}>
                        <View style={styles.metaIcon}>
                          <View style={styles.moneyIcon} />
                        </View>
                        <Text style={styles.metaText}>{jobData.salary}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={styles.bookmarkButton}
                  onPress={() => setIsBookmarked(!isBookmarked)}
                >
                  <View style={[
                    styles.bookmarkIcon,
                    isBookmarked && styles.bookmarkIconActive
                  ]}>
                    <View style={styles.bookmarkShape} />
                  </View>
                </Pressable>
              </View>

              {/* About Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.aboutIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>About This Role</Text>
                </View>
                {jobData.about.map((paragraph, index) => (
                  <Text key={index} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>

              {/* What You'll Do Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.responsibilitiesIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>What You'll Do</Text>
                </View>
                {jobData.responsibilities.map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={styles.bullet}>
                      <View style={styles.bulletDot} />
                    </View>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Who You Are Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <View style={styles.qualificationsIcon} />
                  </View>
                  <Text style={styles.sectionHeading}>Who You Are</Text>
                </View>
                {jobData.qualifications.map((item, index) => {
                  if (index === 0) {
                    return (
                      <Text key={index} style={styles.sectionSubtext}>
                        {item}
                      </Text>
                    );
                  }
                  return (
                    <View key={index} style={styles.bulletItem}>
                      <View style={styles.bullet}>
                        <View style={styles.bulletDot} />
                      </View>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  );
                })}
              </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
};

export default JobPostingPage;
