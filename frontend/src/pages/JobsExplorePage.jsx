import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import styles from './JobsExplorePage.styles';
import './JobPages.css';
import { useBreakpoints } from '../hooks/useBreakpoints';
import {
  cacheJobs,
  fetchLinkedInJobs,
  fetchAppliedJobs,
  fetchSavedJobs,
  getAuthToken,
  getUserProfile,
  recordJobSearchSignals,
} from '../services/api';

const DEFAULT_LOCATION = '';
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 30, 50];
const JOB_TYPE_OPTIONS = ['All Types', 'Internship', 'Full-time', 'Part-time', 'Contract', 'Temporary', 'Co-op', 'Remote'];
const SORT_OPTIONS = [
  { value: 'match', label: 'Best match' },
  { value: 'posted_newest', label: 'Newest posted' },
  { value: 'posted_oldest', label: 'Oldest posted' },
];

const stopPressBubble = (e) => {
  if (e?.stopPropagation) e.stopPropagation();
  if (e?.nativeEvent?.stopPropagation) e.nativeEvent.stopPropagation();
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.jobs)) return value.jobs;
  if (Array.isArray(value?.value)) return value.value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.jobs)) return value.data.jobs;
  return [];
};

const normalizeTypes = (job) => {
  const rawTypes = [
    job.employment_type,
    job.job_type,
    ...(Array.isArray(job.types) ? job.types : []),
  ]
    .flat()
    .filter(Boolean);

  if (job.remote || /remote/i.test(String(job.job_location || ''))) {
    rawTypes.push('Remote');
  }

  const uniqueTypes = [...new Set(rawTypes.map((type) => String(type).trim()).filter(Boolean))];
  return uniqueTypes.length > 0 ? uniqueTypes : ['Full-time'];
};

const stripTitleNoise = (title) => {
  let t = String(title || '').trim();
  if (!t) return '';
  t = t.replace(/\s*[-–—]\s*(?:term|duration|placement|contract)\s+.*$/i, '');
  t = t.replace(/\s*\(\s*\d+\s*(?:month|week|day|year)s?\s*(?:term|contract|internship)?\s*\)\s*$/i, '');
  t = t.replace(/,\s*\d+\s*(?:month|week)s?\s*(?:term|internship|placement)\s*$/i, '');
  t = t.replace(/\s{2,}/g, ' ').trim();
  if (t.length > 90) t = t.split(/\s+/).slice(0, 12).join(' ');
  return t;
};

const sanitizeJobTitle = (value) => {
  const text = String(value || '').replace(/\*+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const blockedPrefixes = /^(about|pay|benefits|responsibilities|qualifications|work location|job type|location|requirements|what you will do|who you are|overview)/i;
  const fragments = [
    text,
    ...text
      .split(/\s[-–—|:]\s|,\s+/)
      .map((part) => part.trim())
      .filter(Boolean),
  ];

  for (const fragment of fragments) {
    if (blockedPrefixes.test(fragment)) continue;
    if (fragment.length < 3) continue;

    const candidate = fragment.length > 80
      ? fragment.split(/\b(?:join|build|work|help|support|develop|create|collaborate|design|manage|lead)\b/i)[0].trim()
      : fragment;

    if (candidate.length > 90) continue;
    if (candidate.split(/\s+/).length <= 12) return stripTitleNoise(candidate);
  }

  const fallback = fragments[0];
  if (fallback.length > 90) {
    return stripTitleNoise(fallback.split(/\s+/).slice(0, 12).join(' '));
  }

  return stripTitleNoise(fallback);
};

const extractTitleFromDescription = (description) => {
  const lines = String(description || '')
    .split(/\n+/)
    .map((line) => line.replace(/\*+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const blockedPrefixes = /^(about|pay|benefits|responsibilities|qualifications|work location|job type|location|requirements|what you will do|who you are|overview)/i;
  const roleHint = /\b(engineer|developer|analyst|manager|intern|co-op|specialist|designer|consultant|associate|architect|scientist|product|program manager)\b/i;

  for (const line of lines.slice(0, 20)) {
    if (blockedPrefixes.test(line) || line.length < 6 || line.length > 90 || line.endsWith(':')) continue;
    if (roleHint.test(line)) return line;
  }

  return '';
};

const cleanJobDescription = (raw) => {
  let text = String(raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/\*+/g, ' ');
  text = text.replace(/\s*\/\s+/g, ' ').replace(/\s+\/\s*/g, ' ');
  text = text.replace(/[•·▪▸►]+\s*/g, '\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text || 'No description available yet.';
};

const normalizeJob = (job, index) => {
  const company =
    job.company ||
    job.company_name ||
    job.employer_name ||
    'Company';

  const title =
    job.title ||
    job.job_title ||
    job.job_position ||
    job.position ||
    'Untitled role';

  const sanitizedTitle = sanitizeJobTitle(title);
  const descriptionTitle = extractTitleFromDescription(job.job_description || job.description || job.snippet || '');

  const fallbackTitle = (() => {
    if (sanitizedTitle && sanitizedTitle.toLowerCase() !== 'untitled role') return sanitizedTitle;
    if (descriptionTitle) return descriptionTitle;
    return sanitizedTitle || title;
  })();

  return {
    id: String(job.id || job.job_id || job.job_urn || job.job_link || `${company}-${fallbackTitle}-${index}`),
    source: String(job.source || (String(job.job_link || '').toLowerCase().includes('indeed') ? 'indeed' : 'linkedin')),
    company,
    title: fallbackTitle,
    location: job.location || job.job_location || 'Location not listed',
    rate: job.salary || job.base_pay || job.compensation || 'Compensation not listed',
    types: normalizeTypes(job),
    description: cleanJobDescription(job.job_description || job.description || job.snippet || ''),
    posted: job.posted || job.job_posting_time || job.job_posting_date || job.date || 'Recently posted',
    matchScore: Math.round(
      Number(job.fit_score ?? job.match_score ?? job.matchScore ?? 0)
    ),
    applyUrl: job.apply_url || job.job_link || job.link || job.url || null,
  };
};

const JobsExplorePage = () => {
  const router = useRouter();
  const { isWideLayout } = useBreakpoints();
  const scrollViewRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('Recommended For You');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(DEFAULT_LOCATION);
  const [pageSize, setPageSize] = useState(10);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('All Types');
  const [showJobTypeMenu, setShowJobTypeMenu] = useState(false);
  const [sortBy, setSortBy] = useState('match');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [focusedSearch, setFocusedSearch] = useState(false);
  const [hoveredJob, setHoveredJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [sourceWarnings, setSourceWarnings] = useState([]);
  const [preferredPositions, setPreferredPositions] = useState([]);
  const [preferredLocations, setPreferredLocations] = useState([]);
  const jobsListYRef = useRef(0);
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const loadRequestIdRef = useRef(0);

  const tabs = ['Recommended For You', 'All Jobs', 'Applied Jobs', 'Saved Jobs'];

  const activeKeywords = useMemo(
    () => searchQuery.split(/\s+/).map((word) => word.trim()).filter(Boolean),
    [searchQuery]
  );

  const hasNextPage = useMemo(() => {
    if (selectedTab === 'Applied Jobs' || selectedTab === 'Saved Jobs') return false;
    return page * pageSize < totalJobs;
  }, [page, pageSize, selectedTab, totalJobs]);

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Best match',
    [sortBy]
  );

  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 260],
  });

  useEffect(() => {
    if (!loadingJobs) {
      shimmerProgress.stopAnimation();
      shimmerProgress.setValue(0);
      return undefined;
    }

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    shimmerLoop.start();
    return () => {
      shimmerLoop.stop();
    };
  }, [loadingJobs, shimmerProgress]);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const profileResponse = await getUserProfile();
        const profileData = profileResponse?.data || {};
        const jobPreferences = profileData?.job_preferences || {};

        if (!isMounted) return;

        const positions = Array.isArray(jobPreferences.positions)
          ? jobPreferences.positions.map((v) => String(v).trim()).filter(Boolean)
          : [];
        const locations = Array.isArray(jobPreferences.locations)
          ? jobPreferences.locations.map((v) => String(v).trim()).filter(Boolean)
          : [];

        setPreferredPositions(positions);
        setPreferredLocations(locations);
      } catch {
        if (!isMounted) return;
        setPreferredPositions([]);
        setPreferredLocations([]);
      }
    };

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTab === 'Applied Jobs' || selectedTab === 'Saved Jobs') return;
    if (!getAuthToken()) return;

    const keywords = searchQuery.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    const loc = locationQuery?.trim();

    const timer = setTimeout(() => {
      if (!keywords.length && !loc) return;
      recordJobSearchSignals({
        keywords,
        locations: loc ? [loc] : [],
      }).catch(() => {});
    }, 1400);

    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, selectedTab]);

  const loadJobs = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    const requestStartedAt = Date.now();

    if (selectedTab === 'Applied Jobs' || selectedTab === 'Saved Jobs') {
      setLoadingJobs(true);
      setJobs([]);
      setJobsError('');
      setSourceWarnings([]);

      if (!getAuthToken()) {
        setJobs([]);
        setTotalJobs(0);
        setJobsError(selectedTab === 'Applied Jobs'
          ? 'Sign in to see jobs you have applied to.'
          : 'Sign in to see your saved jobs.');
        setLoadingJobs(false);
        setHasLoadedOnce(true);
        return;
      }

      try {
        const res = selectedTab === 'Applied Jobs'
          ? await fetchAppliedJobs()
          : await fetchSavedJobs();
        if (requestId !== loadRequestIdRef.current) return;
        const raw = Array.isArray(res?.jobs) ? res.jobs : [];
        const normalized = raw.map((row, i) =>
          normalizeJob(
            {
              ...row,
              source: row.source || 'linkedin',
              description: row.description || '',
            },
            i
          )
        );
        setJobs(normalized);
        setTotalJobs(Number(res?.total_count ?? normalized.length) || 0);
        cacheJobs(normalized);
        setHasLoadedOnce(true);
      } catch (error) {
        if (requestId !== loadRequestIdRef.current) return;
        setJobs([]);
        setTotalJobs(0);
        setJobsError(error?.message || (selectedTab === 'Applied Jobs' ? 'Unable to load applied jobs.' : 'Unable to load saved jobs.'));
        setHasLoadedOnce(true);
      } finally {
        if (requestId === loadRequestIdRef.current) {
          const elapsed = Date.now() - requestStartedAt;
          const remainingDelay = Math.max(0, 150 - elapsed);
          if (remainingDelay > 0) {
            setTimeout(() => {
              if (requestId === loadRequestIdRef.current) {
                setLoadingJobs(false);
              }
            }, remainingDelay);
          } else {
            setLoadingJobs(false);
          }
        }
      }
      return;
    }

    setLoadingJobs(true);
    setJobs([]);
    setJobsError('');
    setSourceWarnings([]);

    try {
      const isRecommended = selectedTab === 'Recommended For You';
      const hasProfilePreferences = preferredPositions.length > 0 || preferredLocations.length > 0;
      const requestKeywords =
        activeKeywords.length > 0
          ? activeKeywords
          : (isRecommended && preferredPositions.length > 0 ? preferredPositions : []);

      const requestLocation =
        locationQuery?.trim()
          ? locationQuery
          : (isRecommended && preferredLocations.length > 0 ? preferredLocations[0] : DEFAULT_LOCATION);

      const response = await fetchLinkedInJobs({
        keywords: requestKeywords,
        location: requestLocation,
        page,
        limit: pageSize,
        sources: ['linkedin', 'indeed'],
        includeDetails: true,
        jobTypes: selectedJobType !== 'All Types' ? [selectedJobType] : [],
        preferredPositions: isRecommended ? preferredPositions : [],
        preferredLocations: isRecommended ? preferredLocations : [],
        minFitScore: isRecommended ? (hasProfilePreferences ? 32 : 0) : 0,
        fitMode: isRecommended ? 'strict' : 'broad',
        sortBy,
      });

      if (requestId !== loadRequestIdRef.current) return;

      const normalizedJobs = toArray(response).map(normalizeJob);
      setJobs(normalizedJobs);
      setTotalJobs(Number(response?.total_count ?? response?.total ?? response?.count ?? normalizedJobs.length) || 0);
      cacheJobs(normalizedJobs);
      const errs = response?.source_errors || {};
      setSourceWarnings(
        Object.keys(errs).length > 0
          ? Object.entries(errs).map(([src, msg]) => `${src}: ${msg}`)
          : []
      );
      setHasLoadedOnce(true);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return;
      setJobs([]);
      setTotalJobs(0);
      setJobsError(error?.message || 'Unable to load jobs right now.');
      setHasLoadedOnce(true);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        const elapsed = Date.now() - requestStartedAt;
        const remainingDelay = Math.max(0, 150 - elapsed);
        if (remainingDelay > 0) {
          setTimeout(() => {
            if (requestId === loadRequestIdRef.current) {
              setLoadingJobs(false);
            }
          }, remainingDelay);
        } else {
          setLoadingJobs(false);
        }
      }
    }
  }, [
    activeKeywords,
    locationQuery,
    page,
    pageSize,
    preferredLocations,
    preferredPositions,
    selectedJobType,
    selectedTab,
    sortBy,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 350);

    return () => clearTimeout(timer);
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, locationQuery, selectedJobType, selectedTab, pageSize, sortBy]);

  useEffect(() => {
    setShowPageSizeMenu(false);
    setShowJobTypeMenu(false);
    setShowSortMenu(false);
    setHoveredJob(null);
    if (scrollViewRef.current && typeof scrollViewRef.current.scrollTo === 'function') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, jobsListYRef.current - 16), animated: true });
      }, 0);
    }
  }, [page]);

  const tailoredContent = useMemo(() => {
    if (selectedTab === 'All Jobs') {
      return {
        title: 'Explore Every Opportunity',
        text: `Browse ${totalJobs} open roles and refine results by keywords, location, and filters.`,
      };
    }

    if (selectedTab === 'Applied Jobs' || selectedTab === 'Saved Jobs') {
      return {
        title: selectedTab === 'Applied Jobs' ? 'Application Tracker' : 'Saved Jobs',
        text: selectedTab === 'Applied Jobs'
          ? 'Keep track of roles you have already applied to and revisit next steps quickly.'
          : 'All jobs you bookmarked from the job details page show up here.',
      };
    }

    if (preferredPositions.length > 0 || preferredLocations.length > 0) {
      return {
        title: 'Tailored Just For You',
        text: `Showing roles that match your preferred positions or locations (${totalJobs} found).`,
      };
    }

    return {
      title: 'Tailored Just For You',
      text: `Based on your search, we found ${totalJobs} jobs that match your goals.`,
    };
  }, [preferredLocations.length, preferredPositions.length, selectedTab, totalJobs]);

  const handleJobPress = (job) => {
    cacheJobs([job]);
    router.push({
      pathname: `/job/${job.id}`,
      params: {
        source: job.source || 'linkedin',
      },
    });
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
        <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>AI-Powered Job Matching</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Discover Your Next
                  <Text style={styles.heroTitleAccent}> Opportunity</Text>
                </Text>
                <Text style={styles.heroDescription}>
                  Find jobs that match your skills, preferences, and career goals
                </Text>
              </View>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalJobs}</Text>
                <Text style={styles.statLabel}>Jobs Found</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{jobs.length ? `${Math.round(jobs.reduce((sum, job) => sum + job.matchScore, 0) / jobs.length)}%` : '0%'}</Text>
                <Text style={styles.statLabel}>Avg Match</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>Updated</Text> 
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsSection}>
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <Pressable
                    key={tab}
                    style={[
                      styles.tab,
                      selectedTab === tab && styles.tabActive,
                      !isWideLayout && { minWidth: 0, flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
                    ]}
                    onPress={() => setSelectedTab(tab)}
                  >
                    {(tab === 'Applied Jobs' || tab === 'Saved Jobs') && (
                      <View style={styles.checkmarkContainer}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.tabText,
                        selectedTab === tab && styles.tabTextActive,
                        !isWideLayout && { fontSize: 13, textAlign: 'center' },
                      ]}
                      numberOfLines={2}
                    >
                      {tab}
                    </Text>
                    {selectedTab === tab && (
                      <View style={styles.tabIndicator} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Enhanced Search Bar */}
            <View style={[styles.searchSection, styles.searchSectionSticky]}>
              <View style={[
                styles.searchBar,
                focusedSearch && styles.searchBarFocused
              ]}>
                <View style={styles.searchIconContainer}>
                  <View style={styles.searchIcon}>
                    <View style={styles.searchIconCircle} />
                    <View style={styles.searchIconLine} />
                  </View>
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search jobs, companies, or keywords..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setFocusedSearch(true)}
                  onBlur={() => setFocusedSearch(false)}
                />
                <View style={styles.searchDivider} />
                <View style={styles.searchFilters}>
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Location"
                    placeholderTextColor="#6B7280"
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                  />
                  <View style={styles.pageSizeContainer}>
                    <Pressable
                      style={styles.filterChip}
                      onPress={() => {
                        setShowPageSizeMenu(false);
                        setShowSortMenu(false);
                        setShowJobTypeMenu((prev) => !prev);
                      }}
                    >
                      <Text style={styles.filterChipText}>{selectedJobType}</Text>
                      <View style={styles.filterArrowIcon}>
                        <View style={styles.filterArrowUp} />
                        <View style={styles.filterArrowDown} />
                      </View>
                    </Pressable>
                    {showJobTypeMenu ? (
                      <View style={[styles.pageSizeMenu, styles.jobTypeMenu]}>
                        {JOB_TYPE_OPTIONS.map((type) => (
                          <Pressable
                            key={type}
                            style={[
                              styles.pageSizeOption,
                              selectedJobType === type && styles.pageSizeOptionActive,
                            ]}
                            onPress={() => {
                              setSelectedJobType(type);
                              setShowJobTypeMenu(false);
                              setPage(1);
                            }}
                          >
                            <Text
                              style={[
                                styles.pageSizeOptionText,
                                selectedJobType === type && styles.pageSizeOptionTextActive,
                              ]}
                            >
                              {type}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  {selectedTab !== 'Applied Jobs' ? (
                    <View style={styles.pageSizeContainer}>
                      <Pressable
                        style={styles.filterChip}
                        onPress={() => {
                          setShowPageSizeMenu(false);
                          setShowJobTypeMenu(false);
                          setShowSortMenu((prev) => !prev);
                        }}
                      >
                        <Text style={styles.filterChipText} numberOfLines={1}>
                          {sortLabel}
                        </Text>
                        <View style={styles.filterArrowIcon}>
                          <View style={styles.filterArrowUp} />
                          <View style={styles.filterArrowDown} />
                        </View>
                      </Pressable>
                      {showSortMenu ? (
                        <View style={[styles.pageSizeMenu, styles.jobTypeMenu]}>
                          {SORT_OPTIONS.map((opt) => (
                            <Pressable
                              key={opt.value}
                              style={[
                                styles.pageSizeOption,
                                sortBy === opt.value && styles.pageSizeOptionActive,
                              ]}
                              onPress={() => {
                                setSortBy(opt.value);
                                setShowSortMenu(false);
                                setPage(1);
                              }}
                            >
                              <Text
                                style={[
                                  styles.pageSizeOptionText,
                                  sortBy === opt.value && styles.pageSizeOptionTextActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  <View style={styles.pageSizeContainer}>
                    <Pressable
                      style={styles.filterChip}
                      onPress={() => {
                        setShowJobTypeMenu(false);
                        setShowSortMenu(false);
                        setShowPageSizeMenu((prev) => !prev);
                      }}
                    >
                      <Text style={styles.filterChipText}>{pageSize} per page</Text>
                      <View style={styles.filterArrowIcon}>
                        <View style={styles.filterArrowUp} />
                        <View style={styles.filterArrowDown} />
                      </View>
                    </Pressable>
                    {showPageSizeMenu ? (
                      <View style={styles.pageSizeMenu}>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <Pressable
                            key={size}
                            style={[
                              styles.pageSizeOption,
                              pageSize === size && styles.pageSizeOptionActive,
                            ]}
                            onPress={() => {
                              setPageSize(size);
                              setShowPageSizeMenu(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.pageSizeOptionText,
                                pageSize === size && styles.pageSizeOptionTextActive,
                              ]}
                            >
                              {size} per page
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* Tailored Section */}
            <View style={styles.tailoredSection}>
              <View style={styles.tailoredIconContainer}>
                <View style={styles.tailoredIcon}>
                  <View style={styles.tailoredCircle}>
                    <View style={styles.tailoredStar} />
                  </View>
                </View>
              </View>
              <View style={styles.tailoredContent}>
                <Text style={styles.tailoredTitle}>{tailoredContent.title}</Text>
                <Text style={styles.tailoredText}>
                  {tailoredContent.text}
                </Text>
              </View>
            </View>

            {/* Job Listings */}
            <View
              key={`jobs-page-${page}-${pageSize}-${selectedTab}`}
              style={styles.jobsList}
              onLayout={(event) => {
                jobsListYRef.current = event.nativeEvent.layout.y;
              }}
            >
              {loadingJobs && (
                <>
                  {!hasLoadedOnce && (
                    <View style={styles.statusCard}>
                      <Text style={styles.statusText}>Loading latest jobs...</Text>
                    </View>
                  )}
                  {[1, 2].map((placeholder) => (
                    <View key={`skeleton-${placeholder}`} style={styles.skeletonCard}>
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.skeletonShimmer,
                          { transform: [{ translateX: shimmerTranslateX }, { skewX: '-18deg' }] },
                        ]}
                      >
                        <LinearGradient
                          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.skeletonShimmerGradient}
                        />
                      </Animated.View>
                      <View style={styles.skeletonHeaderRow}>
                        <View style={styles.skeletonAvatar} />
                        <View style={styles.skeletonHeaderCopy}>
                          <View style={styles.skeletonLineWrap}>
                            <View style={styles.skeletonLineBase} />
                            <View style={styles.skeletonLineShine} />
                            <View style={[styles.skeletonLine, styles.skeletonLineWide]} />
                          </View>
                          <View style={styles.skeletonLineWrap}>
                            <View style={styles.skeletonLineBase} />
                            <View style={styles.skeletonLineShine} />
                            <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
                          </View>
                        </View>
                      </View>
                      <View style={styles.skeletonMetaRow}>
                        <View style={styles.skeletonMetaPill} />
                        <View style={styles.skeletonMetaPill} />
                        <View style={styles.skeletonMetaPill} />
                      </View>
                      <View style={styles.skeletonLineWrap}>
                        <View style={styles.skeletonLineBase} />
                        <View style={styles.skeletonLineShine} />
                        <View style={[styles.skeletonLine, styles.skeletonLineLong]} />
                      </View>
                      <View style={styles.skeletonLineWrap}>
                        <View style={styles.skeletonLineBase} />
                        <View style={styles.skeletonLineShine} />
                        <View style={[styles.skeletonLine, styles.skeletonLineWide]} />
                      </View>
                      <View style={styles.skeletonFooterRow}>
                        <View style={styles.skeletonFooterButton} />
                        <View style={styles.skeletonFooterButton} />
                      </View>
                    </View>
                  ))}
                </>
              )}

              {!loadingJobs && jobsError ? (
                <View style={styles.statusCard}>
                  <Text style={styles.errorText}>{jobsError}</Text>
                  <Pressable style={styles.retryButton} onPress={loadJobs}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}

              {!loadingJobs && !jobsError && jobs.length === 0 ? (
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>No jobs found for this search yet.</Text>
                </View>
              ) : null}

              {!loadingJobs && !jobsError && sourceWarnings.length > 0 ? (
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>Some job sources are temporarily unavailable:</Text>
                  <Text style={styles.warningText}>{sourceWarnings.join(' | ')}</Text>
                </View>
              ) : null}

              {jobs.map((job) => (
                <View
                  key={job.id}
                  style={[
                    styles.jobCard,
                    Platform.OS === 'web' && hoveredJob === job.id && styles.jobCardHover,
                  ]}
                  {...(Platform.OS === 'web'
                    ? {
                        onPointerEnter: () => setHoveredJob(job.id),
                        onPointerLeave: () => setHoveredJob(null),
                      }
                    : {})}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${job.title} at ${job.company}`}
                    onPress={() => handleJobPress(job)}
                    style={({ pressed }) => (pressed && Platform.OS !== 'web' ? { opacity: 0.92 } : null)}
                  >
                    <View style={styles.jobCardHeader}>
                      <View style={styles.jobCardHeaderLeft}>
                        <View style={styles.companyLogo}>
                          <Text style={styles.companyLogoText}>
                            {job.company.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.jobCardHeaderContent}>
                          <Text style={styles.jobCardTitle}>{job.title}</Text>
                          <Text style={styles.jobCardCompany}>{job.company}</Text>
                        </View>
                      </View>
                      <View style={styles.jobCardHeaderRight}>
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchScore}>{job.matchScore}%</Text>
                          <Text style={styles.matchLabel}>Match</Text>
                        </View>
                        <Pressable
                          style={styles.bookmarkButton}
                          onPress={(e) => stopPressBubble(e)}
                          hitSlop={8}
                        >
                          <View style={styles.bookmarkIcon}>
                            <View style={styles.bookmarkShape} />
                          </View>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.jobCardDetails}>
                      <View style={styles.jobDetailItem}>
                        <View style={styles.detailIcon}>
                          <View style={styles.locationIcon} />
                        </View>
                        <Text style={styles.jobCardLocation}>{job.location}</Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <View style={styles.detailIcon}>
                          <View style={styles.moneyIcon} />
                        </View>
                        <Text style={styles.jobCardRate}>{job.rate}</Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <View style={styles.detailIcon}>
                          <View style={styles.timeIcon} />
                        </View>
                        <Text style={styles.jobCardPosted}>Posted {job.posted}</Text>
                      </View>
                    </View>

                    <View style={styles.jobTypes}>
                      {job.types.map((type, index) => (
                        <View key={index} style={styles.jobTypeTag}>
                          <Text style={styles.jobTypeText}>{type}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.jobCardDescription} numberOfLines={2}>
                      {job.description}
                    </Text>
                  </Pressable>

                  <View style={styles.jobCardFooter}>
                    <Pressable
                      style={styles.viewDetailsButton}
                      onPress={() => handleJobPress(job)}
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <View style={styles.viewDetailsArrow}>
                        <View style={styles.arrowLine} />
                        <View style={styles.arrowHead} />
                      </View>
                    </Pressable>
                  </View>
                </View>
              ))}

              {!loadingJobs && !jobsError && selectedTab !== 'Applied Jobs' && jobs.length > 0 ? (
                <View style={styles.paginationRow}>
                  <Pressable
                    style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                    onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>Previous</Text>
                  </Pressable>
                  <Text style={styles.pageLabel}>Page {page}</Text>
                  <Pressable
                    style={[styles.pageButton, !hasNextPage && styles.pageButtonDisabled]}
                    onPress={() => setPage((prev) => prev + 1)}
                    disabled={!hasNextPage}
                  >
                    <Text
                      style={[styles.pageButtonText, !hasNextPage && styles.pageButtonTextDisabled]}
                    >
                      Next
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default JobsExplorePage;
