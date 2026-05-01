import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet, Dimensions } from 'react-native';
import {
  runShowcaseCycle,
  endShowcaseCycle,
  connectShowcaseStream,
  checkShowcaseProfile,
} from '../services/showcaseService';

const { width, height: windowHeight } = Dimensions.get('window');
const isDesktop = width > 992;

// ── Phase detection from event types ─────────────────────────
const PHASE_MAP = {
  agent_started: 'discovery',
  jobs_discovered: 'discovery',
  job_matched: 'matching',
  extraction_started: 'extraction',
  extraction_completed: 'extraction',
  tailoring_started: 'tailoring',
  tailoring_completed: 'tailoring',
  submission_started: 'filling',
  field_filled: 'filling',
  file_uploading: 'uploading',
  file_uploaded: 'filling',
  screenshot_captured: 'filling',
  submission_ready: 'ready',
  submission_completed: 'ready',
  submission_failed: 'error',
  agent_stopped: 'completed',
};

const PHASE_COLORS = {
  discovery: '#6366F1',
  matching: '#A78BFA',
  extraction: '#8B5CF6',
  tailoring: '#C4B5FD',
  filling: '#34D399',
  uploading: '#FBBF24',
  ready: '#34D399',
  completed: '#6B7280',
  error: '#EF4444',
};

const ShowcaseAgentView = () => {
  const [phase, setPhase] = useState('idle'); // idle | discovery | matching | ... | completed
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // Discovery state
  const [companies, setCompanies] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);

  // Matching state
  const [topMatch, setTopMatch] = useState(null);
  const [matchScore, setMatchScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Fill state
  const [screenshot, setScreenshot] = useState(null);
  const [filledCount, setFilledCount] = useState(0);
  const [totalFields, setTotalFields] = useState(0);
  const [lastFieldName, setLastFieldName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const lastEventTimeRef = useRef(Date.now());

  // Completed state
  const [stats, setStats] = useState(null);

  // Profile readiness
  const [profileScore, setProfileScore] = useState(null); // null = loading
  const [profileMissing, setProfileMissing] = useState([]);

  const feedRef = useRef(null);
  const cleanupRef = useRef(null);
  const scoreIntervalRef = useRef(null);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current && Platform.OS === 'web') {
      const el = feedRef.current;
      // Use a small delay so the DOM updates first
      requestAnimationFrame(() => {
        if (el.scrollTo) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [events]);

  // Check profile readiness on mount
  useEffect(() => {
    checkShowcaseProfile()
      .then((data) => {
        setProfileScore(data.readiness_score ?? 0);
        setProfileMissing(data.required_missing || []);
      })
      .catch(() => {
        // If endpoint fails, allow proceeding (don't block on network error)
        setProfileScore(100);
        setProfileMissing([]);
      });
  }, []);

  // Animate score counter
  useEffect(() => {
    if (matchScore > 0 && animatedScore < matchScore) {
      clearInterval(scoreIntervalRef.current);
      let current = 0;
      scoreIntervalRef.current = setInterval(() => {
        current += 1;
        if (current >= matchScore) {
          current = matchScore;
          clearInterval(scoreIntervalRef.current);
        }
        setAnimatedScore(current);
      }, 20);
    }
    return () => clearInterval(scoreIntervalRef.current);
  }, [matchScore]);

  const handleEvent = useCallback((event) => {
    const type = event.event_type || event.type || '';
    const newPhase = PHASE_MAP[type];
    if (newPhase) setPhase(newPhase);

    setEvents((prev) => [...prev, { ...event, _ts: new Date().toLocaleTimeString() }]);

    // Phase-specific state updates
    if (type === 'jobs_discovered') {
      const payload = event.payload || {};
      if (payload.company) {
        setCompanies((prev) => [...prev, payload.company]);
      }
      setTotalJobs((prev) => prev + (payload.count || 0));
    }

    if (type === 'job_matched') {
      const payload = event.payload || {};
      if (payload.fit_score) {
        setTopMatch({ title: payload.title, company: payload.company, url: payload.url });
        setMatchScore(Math.round(payload.fit_score));
      }
    }

    if (type === 'extraction_completed') {
      const payload = event.payload || {};
      setTotalFields(payload.total_fields || 0);
    }

    if (type === 'field_filled') {
      setFilledCount((prev) => prev + 1);
      const payload = event.payload || {};
      const fieldName = payload.field || event.title || '';
      setLastFieldName(fieldName);
      // Detect resume upload start/end
      if (/resume|cv/i.test(fieldName)) {
        setUploadingResume(false); // upload finished
      } else {
        setUploadingResume(false);
      }
    }

    if (type === 'file_uploading') {
      setUploadingResume(true);
    }

    if (type === 'screenshot_captured') {
      const payload = event.payload || {};
      if (payload.b64_screenshot) {
        setScreenshot(payload.b64_screenshot);
      }
    }

    if (type === 'submission_ready') {
      const payload = event.payload || {};
      if (payload.b64_screenshot) setScreenshot(payload.b64_screenshot);
    }

    if (type === 'agent_stopped') {
      const payload = event.payload || {};
      setStats(payload);
      setRunning(false);
    }

    if (type === 'submission_failed') {
      setError(event.description || 'An issue occurred');
    }
  }, []);

  const handleStart = async () => {
    // Reset state
    setPhase('discovery');
    setEvents([]);
    setError(null);
    setCompanies([]);
    setTotalJobs(0);
    setTopMatch(null);
    setMatchScore(0);
    setAnimatedScore(0);
    setScreenshot(null);
    setFilledCount(0);
    setTotalFields(0);
    setLastFieldName('');
    setStats(null);
    setRunning(true);

    // Connect SSE first, then trigger the cycle
    cleanupRef.current = connectShowcaseStream(handleEvent);

    try {
      await runShowcaseCycle();
    } catch (e) {
      setError(e.message || 'Failed to start showcase cycle');
      setRunning(false);
    }
  };

  const handleEnd = async () => {
    try {
      await endShowcaseCycle();
    } catch (e) {
      // ignore
    }
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = null;
    setRunning(false);
    setPhase('completed');
  };

  const handleReset = () => {
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = null;
    setPhase('idle');
    setEvents([]);
    setError(null);
    setCompanies([]);
    setTotalJobs(0);
    setTopMatch(null);
    setMatchScore(0);
    setAnimatedScore(0);
    setScreenshot(null);
    setFilledCount(0);
    setTotalFields(0);
    setLastFieldName('');
    setStats(null);
    setRunning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      clearInterval(scoreIntervalRef.current);
    };
  }, []);

  // ── Idle CTA ──────────────────────────────────────────────
  if (phase === 'idle') {
    const profileReady = profileScore === null ? false : profileScore >= 60;
    const loading = profileScore === null;

    return (
      <View style={s.container}>
        <View style={s.watermark}>
          <Text style={s.watermarkText}>SHOWCASE MODE -- submissions disabled</Text>
        </View>
        <View style={s.ctaContainer}>
          <Text style={s.ctaTitle}>Verexa Live Demo</Text>
          <Text style={s.ctaSubtitle}>
            Watch the autonomous agent discover jobs, match your profile, and fill a real application — in real time.
          </Text>

          {!loading && !profileReady && (
            <View style={s.readinessWarning}>
              <Text style={s.readinessTitle}>Profile Incomplete</Text>
              <Text style={s.readinessDesc}>
                Your profile needs more data before the demo can fill applications accurately.
                Missing: {profileMissing.join(', ') || 'required fields'}.
              </Text>
              <Text style={s.readinessScore}>Readiness: {profileScore}/100</Text>
            </View>
          )}

          <Pressable
            style={[s.ctaButton, (!profileReady || loading) && s.ctaButtonDisabled]}
            onPress={profileReady ? handleStart : undefined}
            disabled={!profileReady || loading}
          >
            <Text style={s.ctaButtonText}>
              {loading ? 'Checking profile...' : 'Find Jobs'}
            </Text>
          </Pressable>
        </View>
        <Text style={s.footer}>
          Demo runs against live job boards. Submit step is disabled.
        </Text>
      </View>
    );
  }

  // ── Running / Completed Layout ────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.watermark}>
        <Text style={s.watermarkText}>SHOWCASE MODE -- submissions disabled</Text>
      </View>

      <View style={s.splitContainer}>
        {/* Left Panel — Activity Feed */}
        <View style={s.leftPanel}>
          <Text style={s.panelTitle}>Live Activity</Text>
          <ScrollView
            ref={feedRef}
            style={s.feedScroll}
            showsVerticalScrollIndicator={false}
          >
            {events.map((evt, i) => {
              const type = evt.event_type || evt.type || '';
              const evtPhase = PHASE_MAP[type] || 'discovery';
              const dotColor = PHASE_COLORS[evtPhase] || '#6B7280';
              return (
                <View key={i} style={s.feedItem}>
                  <View style={[s.feedDot, { backgroundColor: dotColor }]} />
                  <View style={s.feedContent}>
                    <Text style={s.feedTitle}>{evt.title || type}</Text>
                    {evt.description ? (
                      <Text style={s.feedDesc}>{evt.description}</Text>
                    ) : null}
                    <Text style={s.feedTime}>{evt._ts}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Panel — Phase Visualization */}
        <View style={s.rightPanel}>
          {renderRightPane()}
        </View>
      </View>

      <Text style={s.footer}>
        Demo runs against live job boards. Submit step is disabled.
      </Text>
    </View>
  );

  function renderRightPane() {
    switch (phase) {
      case 'discovery':
        return renderDiscoveryPane();
      case 'matching':
        return renderMatchingPane();
      case 'extraction':
      case 'tailoring':
        return renderExtractionPane();
      case 'uploading':
        return renderUploadingPane();
      case 'filling':
        return renderFillingPane();
      case 'ready':
        return renderReadyPane();
      case 'completed':
        return renderCompletedPane();
      case 'error':
        return renderErrorPane();
      default:
        return null;
    }
  }

  // ── Discovery Pane ────────────────────────────────────────
  function renderDiscoveryPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>Searching Greenhouse Boards</Text>
        <Text style={s.bigNumber}>{totalJobs}</Text>
        <Text style={s.bigNumberLabel}>postings found</Text>
        <View style={s.companyList}>
          {companies.map((name, i) => (
            <View key={i} style={s.companyChip}>
              <Text style={s.companyChipText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Matching Pane ─────────────────────────────────────────
  function renderMatchingPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>Best Match</Text>
        {topMatch && (
          <>
            <Text style={s.matchCompany}>{topMatch.company}</Text>
            <Text style={s.matchTitle}>{topMatch.title}</Text>
          </>
        )}
        <View style={s.scoreBarContainer}>
          <View style={s.scoreBarTrack}>
            <View
              style={[
                s.scoreBarFill,
                {
                  width: `${animatedScore}%`,
                  ...(Platform.OS === 'web'
                    ? { transition: 'width 0.3s ease-out' }
                    : {}),
                },
              ]}
            />
          </View>
          <Text style={s.scoreNumber}>{animatedScore}%</Text>
        </View>
        <Text style={s.scoreLabel}>fit score</Text>
      </View>
    );
  }

  // ── Extraction / Tailoring Pane ───────────────────────────
  function renderExtractionPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>
          {phase === 'extraction' ? 'Extracting Form Fields' : 'Mapping Profile to Fields'}
        </Text>
        {totalFields > 0 && (
          <Text style={s.bigNumber}>{totalFields}</Text>
        )}
        <Text style={s.bigNumberLabel}>
          {totalFields > 0 ? 'fields detected' : 'Analyzing form...'}
        </Text>
      </View>
    );
  }

  // ── Upload Pane (resume upload takes ~2 min) ────────────
  function renderUploadingPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>Uploading Resume</Text>
        {screenshot ? (
          <View style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Form state"
              style={{
                width: '100%',
                maxHeight: '45vh',
                objectFit: 'contain',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: 0.6,
              }}
            />
            <View style={s.uploadOverlay}>
              <Text style={s.uploadSpinner}>&#8635;</Text>
              <Text style={s.uploadText}>
                Uploading resume to Greenhouse{'\n'}This can take up to 2 minutes
              </Text>
            </View>
          </View>
        ) : (
          <View style={s.uploadOverlay}>
            <Text style={s.uploadSpinner}>&#8635;</Text>
            <Text style={s.uploadText}>
              Uploading resume to Greenhouse{'\n'}This can take up to 2 minutes
            </Text>
          </View>
        )}
        <View style={s.fillProgressRow}>
          <View style={s.fillProgressBarTrack}>
            <View
              style={[
                s.fillProgressBarFill,
                {
                  backgroundColor: '#FBBF24',
                  width: totalFields > 0 ? `${(filledCount / totalFields) * 100}%` : '0%',
                  ...(Platform.OS === 'web' ? { transition: 'width 0.5s ease' } : {}),
                },
              ]}
            />
          </View>
          <Text style={s.fillProgressText}>
            Fields: {filledCount}/{totalFields}
          </Text>
        </View>
      </View>
    );
  }

  // ── Form Fill Pane ────────────────────────────────────────
  function renderFillingPane() {
    return (
      <View style={s.fillPane}>
        {screenshot ? (
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Live form fill"
            style={{
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        ) : (
          <View style={s.screenshotPlaceholder}>
            <Text style={s.placeholderText}>Waiting for browser...</Text>
          </View>
        )}
        <View style={s.fillProgressRow}>
          <View style={s.fillProgressBarTrack}>
            <View
              style={[
                s.fillProgressBarFill,
                {
                  width: totalFields > 0 ? `${(filledCount / totalFields) * 100}%` : '0%',
                  ...(Platform.OS === 'web' ? { transition: 'width 0.5s ease' } : {}),
                },
              ]}
            />
          </View>
          <Text style={s.fillProgressText}>
            Fields: {filledCount}/{totalFields}
          </Text>
        </View>
        {lastFieldName ? (
          <Text style={s.fillFieldLabel}>Filled: {lastFieldName}</Text>
        ) : null}
      </View>
    );
  }

  // ── Ready Pane ────────────────────────────────────────────
  function renderReadyPane() {
    return (
      <View style={s.fillPane}>
        {screenshot ? (
          <View style={s.readyScreenshotWrap}>
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Application ready"
              style={{
                width: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: 8,
                border: '2px solid #34D399',
              }}
            />
            <View style={s.readyOverlay}>
              <Text style={s.readyOverlayText}>Application Ready</Text>
            </View>
          </View>
        ) : null}

        <View style={s.readyActions}>
          <Pressable style={s.disabledSubmitButton} disabled>
            <Text style={s.disabledSubmitText}>Submit (disabled in showcase)</Text>
          </Pressable>
          <Pressable style={s.endDemoButton} onPress={handleEnd}>
            <Text style={s.endDemoText}>End Demo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Completed Pane ────────────────────────────────────────
  function renderCompletedPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>Demo Complete</Text>
        {stats && (
          <View style={s.statsCard}>
            <Text style={s.statRow}>
              Jobs found: {stats.jobs_found || 0}
            </Text>
            {stats.top_match && (
              <Text style={s.statRow}>
                Matched: {stats.top_match.title} at {stats.top_match.company}
              </Text>
            )}
            <Text style={s.statRow}>
              Fields filled: {stats.fields_filled || 0}/{stats.total_fields || 0}
              {stats.resume_skipped ? ' (resume skipped in demo mode)' : ''}
            </Text>
          </View>
        )}
        {error && (
          <Text style={s.errorText}>{error}</Text>
        )}
        <Pressable style={s.ctaButton} onPress={handleReset}>
          <Text style={s.ctaButtonText}>Run Again</Text>
        </Pressable>
      </View>
    );
  }

  // ── Error Pane ────────────────────────────────────────────
  function renderErrorPane() {
    return (
      <View style={s.paneCenter}>
        <Text style={s.paneLabel}>Issue Encountered</Text>
        <Text style={s.errorText}>{error || 'An unexpected error occurred'}</Text>
        {running ? (
          <Text style={s.bigNumberLabel}>The agent is trying the next match...</Text>
        ) : (
          <Pressable style={s.ctaButton} onPress={handleReset}>
            <Text style={s.ctaButtonText}>Try Again</Text>
          </Pressable>
        )}
      </View>
    );
  }
};

// ── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },

  // Watermark
  watermark: {
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
  },
  watermarkText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // CTA (idle)
  ctaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  ctaTitle: {
    fontSize: isDesktop ? 48 : 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -1,
  },
  ctaSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 26,
    marginBottom: 40,
  },
  ctaButton: {
    backgroundColor: '#A78BFA',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 14,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 24px rgba(167, 139, 250, 0.35)',
      },
    }),
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
        boxShadow: 'none',
      },
    }),
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Readiness warning
  readinessWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    maxWidth: 480,
    alignItems: 'center',
  },
  readinessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  readinessDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  readinessScore: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    paddingVertical: 12,
  },

  // Split layout
  splitContainer: {
    flex: 1,
    flexDirection: isDesktop ? 'row' : 'column',
  },

  // Left panel — feed
  leftPanel: {
    ...(isDesktop
      ? { flex: 0.4 }
      : { flexGrow: 0, flexShrink: 0, flexBasis: Math.round(windowHeight * 0.38) }),
    overflow: 'hidden',
    borderRightWidth: isDesktop ? 1 : 0,
    borderRightColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: isDesktop ? 0 : 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    padding: 20,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  feedScroll: {
    flex: 1,
  },
  feedItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    ...Platform.select({
      web: {
        animationName: 'fadeIn',
        animationDuration: '0.3s',
        animationFillMode: 'both',
      },
    }),
  },
  feedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  feedContent: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  feedDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },

  // Right panel
  rightPanel: {
    flex: 1,
    ...(isDesktop ? {} : { minHeight: Math.round(windowHeight * 0.5) }),
    padding: 24,
  },

  // Centered pane (discovery, matching, completed)
  paneCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  paneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },

  // Discovery
  bigNumber: {
    fontSize: isDesktop ? 72 : 48,
    fontWeight: '800',
    color: '#A78BFA',
    marginBottom: 4,
  },
  bigNumberLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
  },
  companyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 500,
  },
  companyChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    ...Platform.select({
      web: {
        animationName: 'fadeIn',
        animationDuration: '0.4s',
        animationFillMode: 'both',
      },
    }),
  },
  companyChipText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
  },

  // Matching
  matchCompany: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '500',
    marginBottom: 4,
  },
  matchTitle: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '80%',
    maxWidth: 400,
  },
  scoreBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A78BFA',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#A78BFA',
    minWidth: 60,
    textAlign: 'right',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Fill pane
  fillPane: {
    flex: 1,
    gap: 12,
  },
  screenshotPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
  },
  fillProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fillProgressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fillProgressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  fillProgressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    minWidth: 80,
  },
  fillFieldLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },

  // Upload overlay
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
  },
  uploadSpinner: {
    fontSize: 36,
    color: '#FBBF24',
    marginBottom: 12,
    ...Platform.select({
      web: {
        animationName: 'spin',
        animationDuration: '1.5s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      },
    }),
  },
  uploadText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Ready pane
  readyScreenshotWrap: {
    position: 'relative',
  },
  readyOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  readyOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  readyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  disabledSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    opacity: 0.5,
  },
  disabledSubmitText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  endDemoButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  endDemoText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats card (completed)
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    marginBottom: 24,
    minWidth: 300,
  },
  statRow: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },

  // Error
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 400,
  },
});

export default ShowcaseAgentView;
