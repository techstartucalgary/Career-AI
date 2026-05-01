import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import styles, { COLORS } from './ApplicationModal.styles';
import { browserApplyToJob } from '../services/autoApplyService';

// Inject CSS keyframe for spinner on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

const STATUS_ORDER = [
  'starting', 'resolving_url', 'detecting_board', 'navigating',
  'finding_apply', 'analyzing_form', 'filling', 'form_filled',
  'uploading_resume', 'cover_letter', 'pre_submit', 'submitting',
];

function StepIcon({ status }) {
  if (status === 'in_progress') {
    return (
      <View style={[styles.stepIcon, styles.stepIconActive]}>
        <ActivityIndicator size={12} color={COLORS.primary} />
      </View>
    );
  }
  if (status === 'completed') {
    return (
      <View style={[styles.stepIcon, styles.stepIconCompleted]}>
        <Text style={[styles.stepIconText, { color: COLORS.success }]}>✓</Text>
      </View>
    );
  }
  if (status === 'needs_human') {
    return (
      <View style={[styles.stepIcon, styles.stepIconWarning]}>
        <Text style={[styles.stepIconText, { color: COLORS.warning }]}>!</Text>
      </View>
    );
  }
  if (status === 'failed') {
    return (
      <View style={[styles.stepIcon, styles.stepIconFailed]}>
        <Text style={[styles.stepIconText, { color: COLORS.danger }]}>✕</Text>
      </View>
    );
  }
  return (
    <View style={[styles.stepIcon, styles.stepIconPending]}>
      <Text style={[styles.stepIconText, { color: COLORS.textMuted }]}>–</Text>
    </View>
  );
}

export default function ApplicationModal({ jobId, jobData, onClose }) {
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [overallStatus, setOverallStatus] = useState('connecting');
  const [latestScreenshot, setLatestScreenshot] = useState(null);
  const [manualUrl, setManualUrl] = useState(null);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setOverallStatus('in_progress');
        await browserApplyToJob(jobId, (event) => {
          if (cancelled) return;

          setSteps((prev) => {
            // Group filling_* events into one
            const stepId =
              event.step_id && event.step_id.startsWith('filling_')
                ? 'filling'
                : event.step_id;

            const merged = { ...event, step_id: stepId };
            const idx = prev.findIndex((s) => s.step_id === stepId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = merged;
              return copy;
            }
            return [...prev, merged];
          });

          setProgress(event.progress || 0);

          if (event.screenshot) {
            setLatestScreenshot(event.screenshot);
          }

          if (event.status === 'completed' && event.step_id === 'submitting') {
            setOverallStatus('completed');
          } else if (event.status === 'needs_human') {
            setOverallStatus('needs_human');
            if (event.details?.url) setManualUrl(event.details.url);
          } else if (event.status === 'failed') {
            setOverallStatus('failed');
            setError(event.message);
          }
        });

        // Stream ended — if status hasn't been set to a terminal state
        if (!cancelled) {
          setOverallStatus((prev) =>
            prev === 'in_progress' ? 'completed' : prev
          );
        }
      } catch (err) {
        if (!cancelled) {
          setOverallStatus('failed');
          setError(err.message || 'Connection failed');
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [jobId]);

  // Auto-scroll timeline
  useEffect(() => {
    if (scrollRef.current && Platform.OS === 'web') {
      scrollRef.current.scrollToEnd?.({ animated: true });
    }
  }, [steps]);

  const openUrl = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const progressColor =
    overallStatus === 'completed' ? styles.progressFillSuccess :
    overallStatus === 'needs_human' ? styles.progressFillWarning :
    overallStatus === 'failed' ? styles.progressFillDanger : null;

  const title = jobData?.title || 'Position';
  const company = jobData?.company || 'Company';

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Applying to {title}</Text>
            <Text style={styles.subtitle}>at {company}</Text>
          </View>
          <Pressable
            style={styles.closeBtn}
            onPress={() => onClose(overallStatus)}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {overallStatus === 'connecting' && 'Connecting...'}
            {overallStatus === 'in_progress' && `Applying... ${progress}%`}
            {overallStatus === 'completed' && 'Application submitted!'}
            {overallStatus === 'needs_human' && 'Needs your help'}
            {overallStatus === 'failed' && 'Application failed'}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                progressColor,
                { width: `${Math.max(progress, overallStatus === 'connecting' ? 1 : 0)}%` },
              ]}
            />
          </View>
        </View>

        {/* Status Badge */}
        {overallStatus === 'completed' && (
          <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>
              ✓ Successfully submitted
            </Text>
          </View>
        )}
        {overallStatus === 'needs_human' && (
          <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.warning }]}>
              ! Manual step required
            </Text>
          </View>
        )}
        {overallStatus === 'failed' && (
          <View style={[styles.statusBadge, styles.statusBadgeFailed]}>
            <Text style={[styles.statusBadgeText, { color: COLORS.danger }]}>
              ✕ {error || 'Something went wrong'}
            </Text>
          </View>
        )}

        {/* Steps Timeline */}
        <ScrollView
          ref={scrollRef}
          style={styles.stepsContainer}
          showsVerticalScrollIndicator={false}
        >
          {steps.map((step, i) => (
            <View key={step.step_id || i} style={styles.stepItem}>
              <StepIcon status={step.status} />
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepMessage,
                    step.status === 'completed' && { color: COLORS.textSecondary },
                  ]}
                >
                  {step.message}
                </Text>
                {step.details?.board_type && (
                  <Text style={styles.stepDetails}>
                    Board: {step.details.board_type}
                  </Text>
                )}
                {step.details?.field_count !== undefined && (
                  <Text style={styles.stepDetails}>
                    Fields: {step.details.fields?.join(', ') || step.details.field_count}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {overallStatus === 'connecting' && (
            <View style={styles.stepItem}>
              <StepIcon status="in_progress" />
              <View style={styles.stepContent}>
                <Text style={styles.stepMessage}>Connecting to server...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Screenshot Preview */}
        {latestScreenshot && (
          <View style={styles.screenshotContainer}>
            <Text style={styles.screenshotLabel}>Live preview</Text>
            {Platform.OS === 'web' ? (
              <img
                src={`data:image/png;base64,${latestScreenshot}`}
                alt="Application screenshot"
                style={{ width: '100%', height: 180, objectFit: 'contain', backgroundColor: '#000' }}
              />
            ) : (
              <Image
                source={{ uri: `data:image/png;base64,${latestScreenshot}` }}
                style={styles.screenshotImage}
              />
            )}
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footer}>
          {overallStatus === 'completed' && (
            <Pressable
              style={[styles.btnPrimary, styles.btnSuccess]}
              onPress={() => onClose('completed')}
            >
              <Text style={[styles.btnText, styles.btnTextDark]}>Done</Text>
            </Pressable>
          )}

          {overallStatus === 'needs_human' && manualUrl && (
            <>
              <Pressable
                style={[styles.btnPrimary, styles.btnWarning]}
                onPress={() => openUrl(manualUrl)}
              >
                <Text style={[styles.btnText, styles.btnTextDark]}>
                  Open in Browser
                </Text>
              </Pressable>
              <Pressable
                style={styles.btnSecondary}
                onPress={() => onClose('needs_human')}
              >
                <Text style={styles.btnSecondaryText}>Close</Text>
              </Pressable>
            </>
          )}

          {overallStatus === 'needs_human' && !manualUrl && (
            <Pressable
              style={styles.btnSecondary}
              onPress={() => onClose('needs_human')}
            >
              <Text style={styles.btnSecondaryText}>Close</Text>
            </Pressable>
          )}

          {overallStatus === 'failed' && (
            <>
              <Pressable
                style={styles.btnPrimary}
                onPress={() => {
                  setSteps([]);
                  setProgress(0);
                  setOverallStatus('connecting');
                  setError(null);
                  setLatestScreenshot(null);
                  // Re-trigger by remounting
                  onClose('retry');
                }}
              >
                <Text style={styles.btnText}>Retry</Text>
              </Pressable>
              {jobData?.url && (
                <Pressable
                  style={styles.btnSecondary}
                  onPress={() => openUrl(jobData.url)}
                >
                  <Text style={styles.btnSecondaryText}>Apply Manually</Text>
                </Pressable>
              )}
            </>
          )}

          {(overallStatus === 'in_progress' || overallStatus === 'connecting') && (
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
                Application in progress...
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
