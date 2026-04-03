import React from 'react';
import { View, Platform } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import hubIconStyles from './hubOptionIcons.styles';
import { THEME } from '../styles/theme';

const STROKE = THEME.colors.primary;

/**
 * AI from job posting — document + sparkles (unique vs Interview Buddy question-mark doc).
 */
export const JobPostingOptionIcon = () => (
  <>
    {Platform.OS === 'web' ? (
      <svg width={52} height={52} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="11" width="22" height="30" rx="5" stroke={STROKE} strokeWidth="2.5" />
        <path d="M14 20h10" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 26h14" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 32h9" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 9v7" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M32.5 12.5h7" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="40" cy="22" r="2" fill={STROKE} />
        <path d="M44 26v5" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
        <path d="M41.5 28.5h5" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ) : (
      <>
        <View style={hubIconStyles.iconJobDoc} />
        <View style={hubIconStyles.iconJobLine1} />
        <View style={hubIconStyles.iconJobLine2} />
        <View style={hubIconStyles.iconJobLine3} />
        <View style={[hubIconStyles.iconSparkleDot, { top: 6, left: 42 }]} />
        <View style={[hubIconStyles.iconSparkleDot, { top: 10, left: 50 }]} />
        <View style={[hubIconStyles.iconSparkleDot, { top: 16, left: 46 }]} />
        <View style={[hubIconStyles.iconSparkleDot, { top: 12, left: 38 }]} />
        <View style={[hubIconStyles.iconSparkleDot, { top: 22, left: 52, width: 4, height: 4, borderRadius: 2 }]} />
      </>
    )}
  </>
);

/** Template / optimize — Octicons `project-template` (same on web and native). */
export const TemplateOptimizeOptionIcon = () => (
  <Octicons name="project-template" size={24} color={STROKE} />
);
