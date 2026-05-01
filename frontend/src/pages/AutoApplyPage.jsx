import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from './AutoApplyPage.styles';
import { useBreakpoints } from '../hooks/useBreakpoints';
import {
  getAutoApplySettings, updateAutoApplySettings,
  getPipeline, updatePipelineStatus, removeFromPipeline,
  getMatches, saveMatch, dismissMatch,
  applyToJob, generateCoverLetter,
  getActivity, getAnalytics,
  getAgentStatus, startAgent, pauseAgent, runAgentCycle,
} from '../services/autoApplyService';
import ApplicationModal from '../components/ApplicationModal';
import ShowcaseAgentView from '../components/ShowcaseAgentView';
import { getShowcaseStatus } from '../services/showcaseService';

const TABS = ['Pipeline', 'Matches', 'Activity', 'Analytics', 'Settings'];
const STATUSES = ['saved', 'applied', 'interviewing', 'offered', 'rejected'];
const WORK_ARRANGEMENTS = ['any', 'remote', 'hybrid', 'onsite'];

const ACTION_LABELS = {
  saved: 'Saved to pipeline',
  applied: 'Applied',
  dismissed: 'Dismissed match',
  cover_letter_generated: 'Cover letter generated',
  status_changed_to_applied: 'Moved to Applied',
  status_changed_to_interviewing: 'Moved to Interviewing',
  status_changed_to_offered: 'Moved to Offered',
  status_changed_to_rejected: 'Moved to Rejected',
  status_changed_to_saved: 'Moved to Saved',
  agent_started: 'Agent activated',
  agent_paused: 'Agent paused',
  agent_cycle_complete: 'Agent cycle completed',
  browser_applied: 'Applied via browser automation',
  browser_apply_needs_human: 'Needs manual completion',
  browser_apply_failed: 'Browser application failed',
};

const ACTION_ICONS = {
  saved: '📌', applied: '📨', dismissed: '👋', cover_letter_generated: '📝',
  status_changed_to_applied: '📨', status_changed_to_interviewing: '🎤',
  status_changed_to_offered: '🎉', status_changed_to_rejected: '❌',
  status_changed_to_saved: '📌', agent_started: '🤖', agent_paused: '⏸',
  agent_cycle_complete: '✅',
};

const STATUS_COLORS = {
  idle: '#6B7280', searching: '#A78BFA', scoring: '#6366F1',
  generating: '#8B5CF6', applying: '#34D399', paused: '#FBBF24', error: '#EF4444',
};

const TIER_LABELS = { 1: 'Perfect', 2: 'Strong', 3: 'Stretch', 4: 'Weak' };
const TIER_COLORS = { 1: '#34D399', 2: '#A78BFA', 3: '#FBBF24', 4: '#EF4444' };

const AutoApplyPage = () => {
  const { isWideLayout } = useBreakpoints();
  const [activeTab, setActiveTab] = useState('Pipeline');
  const [loading, setLoading] = useState(false);

  // Agent status
  const [agentStatus, setAgentStatus] = useState({ status: 'idle', enabled: false });

  // Pipeline
  const [pipeline, setPipeline] = useState({ saved: [], applied: [], interviewing: [], offered: [], rejected: [] });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // Matches
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Activity
  const [activityItems, setActivityItems] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    positions: [], locations: [], work_arrangement: 'any',
    match_threshold: 70, auto_generate_cover_letter: true,
    daily_apply_limit: 10, agent_enabled: false, auto_apply_enabled: false,
    search_interval_hours: 6, excluded_companies: [], follow_up_days: 7,
  });
  const [positionInput, setPositionInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [excludedInput, setExcludedInput] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Application modal
  const [applicationModal, setApplicationModal] = useState(null);

  // Showcase mode
  const [showcaseMode, setShowcaseMode] = useState(false);

  // Check showcase mode on mount
  useEffect(() => {
    getShowcaseStatus()
      .then((res) => { if (res?.enabled) setShowcaseMode(true); })
      .catch(() => {});
  }, []);

  // Load agent status on mount
  useEffect(() => {
    loadAgentStatus();
    const interval = setInterval(loadAgentStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Load tab data
  useEffect(() => { loadTabData(activeTab); }, [activeTab]);

  const loadAgentStatus = async () => {
    try {
      const res = await getAgentStatus();
      if (res?.success) setAgentStatus(res.data);
    } catch (e) { /* ignore */ }
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'Pipeline': {
          const res = await getPipeline();
          if (res?.success) setPipeline(res.data);
          break;
        }
        case 'Matches': {
          setMatchesLoading(true);
          const res = await getMatches();
          if (res?.success) setMatches(res.data || []);
          setMatchesLoading(false);
          break;
        }
        case 'Activity': {
          const res = await getActivity();
          if (res?.success) setActivityItems(res.data || []);
          break;
        }
        case 'Analytics': {
          const res = await getAnalytics();
          if (res?.success) setAnalytics(res.data);
          break;
        }
        case 'Settings': {
          const res = await getAutoApplySettings();
          if (res?.success) setSettings(prev => ({ ...prev, ...res.data }));
          break;
        }
      }
    } catch (e) { console.error(`Failed to load ${tab}:`, e); }
    setLoading(false);
  };

  // Agent controls
  const handleStartAgent = async () => {
    try {
      const res = await startAgent();
      if (res?.success) setAgentStatus(res.data);
    } catch (e) { alert(e.message); }
  };

  const handlePauseAgent = async () => {
    try {
      const res = await pauseAgent();
      if (res?.success) setAgentStatus(res.data);
    } catch (e) { alert(e.message); }
  };

  const handleRunCycle = async () => {
    try {
      setAgentStatus(prev => ({ ...prev, status: 'searching', current_task: 'Running manual cycle...' }));
      const res = await runAgentCycle();
      if (res?.success) {
        const data = res.data || {};
        alert(`Cycle complete: ${data.searched || 0} found, ${data.scored || 0} saved, ${data.applied || 0} applied`);
      }
      loadAgentStatus();
      if (activeTab === 'Pipeline') loadTabData('Pipeline');
    } catch (e) { alert(e.message); loadAgentStatus(); }
  };

  // Pipeline actions
  const handleStatusChange = async (jobId, newStatus) => {
    try { await updatePipelineStatus(jobId, newStatus); loadTabData('Pipeline'); }
    catch (e) { alert(e.message || 'Failed to update status'); }
  };

  const handleRemoveFromPipeline = async (jobId) => {
    try { await removeFromPipeline(jobId); loadTabData('Pipeline'); }
    catch (e) { alert(e.message || 'Failed to remove'); }
  };

  const handleSaveMatch = async (job) => {
    try { await saveMatch(job.job_id, job); setMatches(prev => prev.filter(m => m.job_id !== job.job_id)); }
    catch (e) { alert(e.message || 'Failed to save'); }
  };

  const handleDismissMatch = async (jobId) => {
    try { await dismissMatch(jobId); setMatches(prev => prev.filter(m => m.job_id !== jobId)); }
    catch (e) { alert(e.message || 'Failed to dismiss'); }
  };

  const handleApplyFromMatch = async (job) => {
    try {
      await saveMatch(job.job_id, job);
      setMatches(prev => prev.filter(m => m.job_id !== job.job_id));
      setApplicationModal({
        jobId: job.job_id,
        jobData: { title: job.title, company: job.company, url: job.url },
      });
    } catch (e) { alert(e.message || 'Failed to save job'); }
  };

  const handleApplyFromPipeline = (jobId, jobData) => {
    setApplicationModal({
      jobId,
      jobData: {
        title: jobData?.title || 'Position',
        company: jobData?.company || 'Company',
        url: jobData?.url,
      },
    });
  };

  const handleModalClose = (status) => {
    setApplicationModal(null);
    if (status === 'completed' || status === 'needs_human') {
      loadTabData('Pipeline');
      loadTabData('Activity');
    } else if (status === 'retry') {
      // Re-open the modal for retry
      const prev = applicationModal;
      setTimeout(() => setApplicationModal(prev), 100);
    }
  };

  const handleGenerateCoverLetter = async (jobId) => {
    try { await generateCoverLetter(jobId); loadTabData('Pipeline'); alert('Cover letter generated!'); }
    catch (e) { alert(e.message || 'Failed to generate cover letter'); }
  };

  // Settings
  const addTag = (field, input, setInput) => {
    const val = input.trim();
    if (val && !(settings[field] || []).includes(val)) {
      setSettings(prev => ({ ...prev, [field]: [...(prev[field] || []), val] }));
      setInput('');
    }
  };

  const removeTag = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: (prev[field] || []).filter(v => v !== val) }));
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try { await updateAutoApplySettings(settings); alert('Settings saved!'); }
    catch (e) { alert(e.message || 'Failed to save settings'); }
    setSettingsSaving(false);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const mins = Math.floor((now - d) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ─── Agent Status Bar ───

  const renderAgentStatusBar = () => {
    const s = agentStatus;
    const statusColor = STATUS_COLORS[s.status] || '#6B7280';
    const isActive = s.enabled && s.status !== 'paused';
    const isWorking = ['searching', 'scoring', 'generating', 'applying'].includes(s.status);

    return (
      <View style={[styles.card, { marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: statusColor,
            ...Platform.select({ web: isWorking ? { animationKeyframes: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } }, animationDuration: '1.5s', animationIterationCount: 'infinite' } : {} }) }} />
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '600' }}>
              {isActive ? (isWorking ? 'Working' : 'Active') : s.status === 'paused' ? 'Paused' : 'Inactive'}
            </Text>
            {s.current_task && (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>
                {s.current_task}
              </Text>
            )}
            {s.last_action && !s.current_task && (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                Last: {s.last_action} {s.last_action_time ? `(${formatTime(s.last_action_time)})` : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonSecondary, { flex: 0, paddingHorizontal: 16 }]}
            onPress={handleRunCycle}
          >
            <Text style={styles.actionButtonTextSecondary}>Run Cycle</Text>
          </Pressable>
          {isActive ? (
            <Pressable
              style={[styles.actionButton, { flex: 0, paddingHorizontal: 16, backgroundColor: 'rgba(251, 191, 36, 0.15)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' }]}
              onPress={handlePauseAgent}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FBBF24' }}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary, { flex: 0, paddingHorizontal: 16 }]}
              onPress={handleStartAgent}
            >
              <Text style={styles.actionButtonText}>Start Agent</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ─── Score Breakdown Badge ───

  const renderScoreBadge = (score, tier) => {
    const tierColor = TIER_COLORS[tier] || '#A78BFA';
    const tierLabel = TIER_LABELS[tier] || '';
    return (
      <View style={[styles.matchBadge, { borderColor: `${tierColor}40` }]}>
        <Text style={[styles.matchScore, { color: tierColor }]}>{score}%</Text>
        {tierLabel && <Text style={[styles.matchLabel, { color: tierColor }]}>{tierLabel}</Text>}
      </View>
    );
  };

  // ─── Pipeline Card ───

  const renderPipelineCard = (item) => {
    const job = item.job_data || {};
    const cardId = item.job_id || item._id;
    const isExpanded = expandedCard === cardId;

    return (
      <Pressable
        key={cardId}
        style={[styles.card, hoveredCard === cardId && styles.cardHover]}
        onHoverIn={() => setHoveredCard(cardId)}
        onHoverOut={() => setHoveredCard(null)}
        onPress={() => setExpandedCard(isExpanded ? null : cardId)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCompany}>{job.company || 'Company'}</Text>
            <Text style={styles.cardTitle}>{job.title || 'Position'}</Text>
          </View>
          {item.match_score > 0 && renderScoreBadge(item.match_score, item.tier)}
        </View>
        {job.location && <Text style={styles.cardLocation}>{job.location}</Text>}

        {/* Rationale */}
        {item.rationale && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
            {item.rationale}
          </Text>
        )}

        {/* Flags */}
        {item.flags && item.flags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {item.flags.map((f, i) => (
              <View key={i} style={{ backgroundColor: 'rgba(251,191,36,0.1)', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' }}>
                <Text style={{ fontSize: 11, color: '#FBBF24' }}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cover letter status */}
        <View style={styles.coverLetterBadge}>
          <View style={[styles.coverLetterDot, { backgroundColor: item.cover_letter ? '#34D399' : 'rgba(255,255,255,0.2)' }]} />
          <Text style={styles.coverLetterText}>
            {item.cover_letter ? 'Cover letter ready' : 'No cover letter'}
          </Text>
        </View>

        {/* Expanded: score breakdown + cover letter preview */}
        {isExpanded && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {item.score_breakdown && (
              <View style={{ gap: 4, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Score Breakdown</Text>
                {Object.entries(item.score_breakdown).map(([key, val]) => (
                  <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>
                      {typeof val === 'object' ? val.score : val}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {item.cover_letter && (
              <View style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Cover Letter Preview</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 }} numberOfLines={8}>
                  {item.cover_letter}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Status selector */}
        <View style={styles.statusSelector}>
          {STATUSES.map(s => (
            <Pressable key={s} style={[styles.statusOption, item.status === s && styles.statusOptionActive]}
              onPress={(e) => { e.stopPropagation(); handleStatusChange(item.job_id, s); }}>
              <Text style={[styles.statusOptionText, item.status === s && styles.statusOptionTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.cardActions}>
          {item.status === 'saved' && (
            <Pressable style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={(e) => { e.stopPropagation(); handleApplyFromPipeline(item.job_id, job); }}>
              <Text style={styles.actionButtonText}>Apply</Text>
            </Pressable>
          )}
          {!item.cover_letter && (
            <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={(e) => { e.stopPropagation(); handleGenerateCoverLetter(item.job_id); }}>
              <Text style={styles.actionButtonTextSecondary}>Gen. Cover Letter</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={(e) => { e.stopPropagation(); handleRemoveFromPipeline(item.job_id); }}>
            <Text style={styles.actionButtonTextDanger}>Remove</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  // ─── Pipeline Tab ───

  const renderPipelineTab = () => {
    const totalItems = Object.values(pipeline).flat().length;
    if (totalItems === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No jobs in your pipeline</Text>
          <Text style={styles.emptyText}>
            Go to the Matches tab to find AI-matched jobs, or start the agent to automatically discover and save opportunities.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.pipelineContainer}>
        {STATUSES.map(status => (
          <View key={status} style={styles.pipelineColumn}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{status}</Text>
              <View style={styles.columnCount}>
                <Text style={styles.columnCountText}>{(pipeline[status] || []).length}</Text>
              </View>
            </View>
            <View style={styles.columnCards}>
              {(pipeline[status] || []).map(renderPipelineCard)}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // ─── Match Card ───

  const renderMatchCard = (job) => (
    <Pressable key={job.job_id}
      style={[styles.card, hoveredCard === job.job_id && styles.cardHover]}
      onHoverIn={() => setHoveredCard(job.job_id)}
      onHoverOut={() => setHoveredCard(null)}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardCompany}>{job.company || 'Company'}</Text>
          <Text style={styles.cardTitle}>{job.title || 'Position'}</Text>
        </View>
        {job.match_score > 0 && renderScoreBadge(job.match_score, job.tier)}
      </View>
      {job.location && <Text style={styles.cardLocation}>{job.location}</Text>}

      {/* Source badge */}
      {job.source && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, color: '#6366F1' }}>{job.source}</Text>
          </View>
          {job.recommendation && (
            <View style={{ backgroundColor: job.recommendation === 'apply' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
              paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, color: job.recommendation === 'apply' ? '#34D399' : '#FBBF24' }}>
                {job.recommendation}
              </Text>
            </View>
          )}
        </View>
      )}

      {job.rationale && (
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
          {job.rationale}
        </Text>
      )}

      {job.description && (
        <Text style={styles.cardDescription} numberOfLines={3}>{job.description}</Text>
      )}

      {/* Score breakdown */}
      {job.score_breakdown && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4, marginBottom: 4 }}>
          {Object.entries(job.score_breakdown).slice(0, 4).map(([key, val]) => (
            <View key={key} style={{ flexDirection: 'row', gap: 4 }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{key.replace(/_/g, ' ')}:</Text>
              <Text style={{ fontSize: 11, color: '#A78BFA', fontWeight: '600' }}>{typeof val === 'object' ? val.score : val}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => handleApplyFromMatch(job)}>
          <Text style={styles.actionButtonText}>Apply Now</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => handleSaveMatch(job)}>
          <Text style={styles.actionButtonTextSecondary}>Save</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={() => handleDismissMatch(job.job_id)}>
          <Text style={styles.actionButtonTextDanger}>Dismiss</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  // ─── Matches Tab ───

  const renderMatchesTab = () => {
    if (matchesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A78BFA" />
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16, fontSize: 15 }}>
            AI is finding and scoring job matches...
          </Text>
        </View>
      );
    }
    if (matches.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>
            Update your preferences in Settings to improve matching. Make sure you have target positions and locations set. The agent searches multiple job boards including Adzuna and Google Jobs.
          </Text>
        </View>
      );
    }
    return <View style={{ gap: 16 }}>{matches.map(renderMatchCard)}</View>;
  };

  // ─── Activity Tab ───

  const renderActivityTab = () => {
    if (activityItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>
            Activate the agent to see its activity here. Every search, match, application, and status change is logged.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.activityList}>
        {activityItems.map((item, idx) => {
          const action = item.action || '';
          const details = item.details || {};
          const label = ACTION_LABELS[action] || action.replace(/_/g, ' ');
          const icon = ACTION_ICONS[action] || '📋';
          return (
            <View key={item._id || idx} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityIconText}>{icon}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {label}{details.title ? ` — ${details.title}` : ''}{details.company ? ` at ${details.company}` : ''}
                </Text>
                {details.match_score && (
                  <Text style={{ color: '#A78BFA', fontSize: 12 }}>Match: {details.match_score}%</Text>
                )}
                <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── Analytics Tab ───

  const renderAnalyticsTab = () => {
    if (!analytics) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#A78BFA" /></View>;

    const stats = [
      { label: 'Total Applied', value: analytics.total_applied || 0, color: '#A78BFA' },
      { label: 'Interviewing', value: analytics.total_interviewing || 0, color: '#6366F1' },
      { label: 'Offers', value: analytics.total_offered || 0, color: '#34D399' },
      { label: 'Response Rate', value: `${analytics.response_rate || 0}%`, color: '#FBBF24' },
      { label: 'In Pipeline', value: analytics.total_in_pipeline || 0, color: '#8B5CF6' },
      { label: 'Avg Match Score', value: analytics.avg_match_score || 0, color: '#A78BFA' },
      { label: 'Cover Letters', value: analytics.cover_letters_generated || 0, color: '#6366F1' },
      { label: 'Total Actions', value: analytics.total_actions || 0, color: '#34D399' },
    ];

    return (
      <View>
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {analytics.total_applied < 10 && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' }}>
              Detailed analytics unlock after 10+ applications. You're at {analytics.total_applied}/10.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Settings Tab ───

  const renderSettingsTab = () => (
    <View style={styles.settingsSection}>
      {/* Agent Control */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Agent Control</Text>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.fieldLabel}>Enable Agent</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Agent will automatically search for jobs on a schedule
            </Text>
          </View>
          <Pressable style={[styles.toggleTrack, settings.agent_enabled ? styles.toggleTrackOn : styles.toggleTrackOff]}
            onPress={() => setSettings(prev => ({ ...prev, agent_enabled: !prev.agent_enabled }))}>
            <View style={[styles.toggleThumb, settings.agent_enabled ? styles.toggleThumbOn : styles.toggleThumbOff]} />
          </Pressable>
        </View>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.fieldLabel}>Auto-Apply</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Automatically apply to high-scoring matches (above threshold)
            </Text>
          </View>
          <Pressable style={[styles.toggleTrack, settings.auto_apply_enabled ? styles.toggleTrackOn : styles.toggleTrackOff]}
            onPress={() => setSettings(prev => ({ ...prev, auto_apply_enabled: !prev.auto_apply_enabled }))}>
            <View style={[styles.toggleThumb, settings.auto_apply_enabled ? styles.toggleThumbOn : styles.toggleThumbOff]} />
          </Pressable>
        </View>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.fieldLabel}>Auto-Generate Cover Letter</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              AI generates a tailored cover letter when applying
            </Text>
          </View>
          <Pressable style={[styles.toggleTrack, settings.auto_generate_cover_letter ? styles.toggleTrackOn : styles.toggleTrackOff]}
            onPress={() => setSettings(prev => ({ ...prev, auto_generate_cover_letter: !prev.auto_generate_cover_letter }))}>
            <View style={[styles.toggleThumb, settings.auto_generate_cover_letter ? styles.toggleThumbOn : styles.toggleThumbOff]} />
          </Pressable>
        </View>
      </View>

      {/* Target Positions */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Target Positions</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="e.g. Software Developer"
            placeholderTextColor="rgba(255,255,255,0.3)" value={positionInput}
            onChangeText={setPositionInput} onSubmitEditing={() => addTag('positions', positionInput, setPositionInput)} />
          <Pressable style={[styles.actionButton, styles.actionButtonPrimary, { flex: 0, paddingHorizontal: 20 }]}
            onPress={() => addTag('positions', positionInput, setPositionInput)}>
            <Text style={styles.actionButtonText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.tagContainer}>
          {(settings.positions || []).map(v => (
            <View key={v} style={styles.tag}><Text style={styles.tagText}>{v}</Text>
              <Pressable onPress={() => removeTag('positions', v)}><Text style={styles.tagRemove}>x</Text></Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Target Locations */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Target Locations</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="e.g. Calgary, AB"
            placeholderTextColor="rgba(255,255,255,0.3)" value={locationInput}
            onChangeText={setLocationInput} onSubmitEditing={() => addTag('locations', locationInput, setLocationInput)} />
          <Pressable style={[styles.actionButton, styles.actionButtonPrimary, { flex: 0, paddingHorizontal: 20 }]}
            onPress={() => addTag('locations', locationInput, setLocationInput)}>
            <Text style={styles.actionButtonText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.tagContainer}>
          {(settings.locations || []).map(v => (
            <View key={v} style={styles.tag}><Text style={styles.tagText}>{v}</Text>
              <Pressable onPress={() => removeTag('locations', v)}><Text style={styles.tagRemove}>x</Text></Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Work Arrangement */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Work Arrangement</Text>
        <View style={styles.radioGroup}>
          {WORK_ARRANGEMENTS.map(opt => (
            <Pressable key={opt} style={[styles.radioOption, settings.work_arrangement === opt && styles.radioOptionActive]}
              onPress={() => setSettings(prev => ({ ...prev, work_arrangement: opt }))}>
              <Text style={[styles.radioText, settings.work_arrangement === opt && styles.radioTextActive]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Match Threshold */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Match Threshold</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{settings.match_threshold}%</Text>
          <Pressable style={styles.sliderTrack}
            onPress={(e) => {
              if (Platform.OS === 'web') {
                const rect = e.target.getBoundingClientRect();
                const x = e.nativeEvent.pageX - rect.left;
                const pct = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
                setSettings(prev => ({ ...prev, match_threshold: pct }));
              }
            }}>
            <View style={[styles.sliderFill, { width: `${settings.match_threshold}%` }]} />
          </Pressable>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>
            Only show/apply to jobs scoring above this threshold
          </Text>
        </View>
      </View>

      {/* Daily Limit + Search Interval */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Limits</Text>
        <View style={{ gap: 12 }}>
          <View>
            <Text style={styles.fieldLabel}>Daily Apply Limit</Text>
            <TextInput style={styles.textInput} value={String(settings.daily_apply_limit || 10)}
              onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) setSettings(prev => ({ ...prev, daily_apply_limit: n })); }}
              keyboardType="numeric" placeholder="10" placeholderTextColor="rgba(255,255,255,0.3)" />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Search Interval (hours)</Text>
            <TextInput style={styles.textInput} value={String(settings.search_interval_hours || 6)}
              onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) setSettings(prev => ({ ...prev, search_interval_hours: n })); }}
              keyboardType="numeric" placeholder="6" placeholderTextColor="rgba(255,255,255,0.3)" />
          </View>
        </View>
      </View>

      {/* Excluded Companies */}
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>Excluded Companies</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Company to exclude"
            placeholderTextColor="rgba(255,255,255,0.3)" value={excludedInput}
            onChangeText={setExcludedInput} onSubmitEditing={() => addTag('excluded_companies', excludedInput, setExcludedInput)} />
          <Pressable style={[styles.actionButton, styles.actionButtonDanger, { flex: 0, paddingHorizontal: 20 }]}
            onPress={() => addTag('excluded_companies', excludedInput, setExcludedInput)}>
            <Text style={styles.actionButtonTextDanger}>Exclude</Text>
          </Pressable>
        </View>
        <View style={styles.tagContainer}>
          {(settings.excluded_companies || []).map(v => (
            <View key={v} style={[styles.tag, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
              <Text style={[styles.tagText, { color: '#EF4444' }]}>{v}</Text>
              <Pressable onPress={() => removeTag('excluded_companies', v)}><Text style={styles.tagRemove}>x</Text></Pressable>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSaveSettings}>
        <Text style={styles.saveButtonText}>{settingsSaving ? 'Saving...' : 'Save Settings'}</Text>
      </Pressable>
    </View>
  );

  // ─── Tab Content Router ───

  const renderTabContent = () => {
    if (loading && activeTab !== 'Matches') {
      return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#A78BFA" /></View>;
    }
    switch (activeTab) {
      case 'Pipeline': return renderPipelineTab();
      case 'Matches': return renderMatchesTab();
      case 'Activity': return renderActivityTab();
      case 'Analytics': return renderAnalyticsTab();
      case 'Settings': return renderSettingsTab();
      default: return null;
    }
  };

  // ─── Main Render ───

  if (showcaseMode) {
    return (
      <View style={styles.container}>
        <Header />
        <ShowcaseAgentView />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <LinearGradient colors={['#0A0A0F', '#12101A', '#0A0A0F']} style={styles.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Hero */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Autonomous Job Agent</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Auto<Text style={styles.heroTitleAccent}> Apply</Text>
                </Text>
                <Text style={styles.heroDescription}>
                  AI-powered multi-source job discovery, intelligent matching with detailed scoring,
                  automated cover letter generation, and full pipeline management.
                </Text>
              </View>
            </View>

            {/* Agent Status Bar */}
            {renderAgentStatusBar()}

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {TABS.map(tab => (
                <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </Pressable>
              ))}
            </View>

            {renderTabContent()}
          </View>
        </ScrollView>
      </LinearGradient>

      {applicationModal && (
        <ApplicationModal
          jobId={applicationModal.jobId}
          jobData={applicationModal.jobData}
          onClose={handleModalClose}
        />
      )}
    </View>
  );
};

export default AutoApplyPage;
