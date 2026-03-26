/**
 * Single source of truth for plan colours and content.
 * Imported by PricingPage, PaymentPage, and PaymentSuccessPage
 * so theming stays consistent across the whole flow.
 */

export const PLAN_CONFIG = {
  free: {
    name: 'Free Plan',
    price: '$0.00',
    period: '/month',
    yearlyNote: null,
    yearlyPrice: null,
    gradientColors: ['#1E1E2C', '#161622'],
    borderColor: 'rgba(120, 120, 160, 0.35)',
    selectedBorderColor: 'rgba(160, 160, 210, 0.8)',
    accentColor: 'rgba(160, 165, 200, 0.8)',
    dividerColor: 'rgba(120, 120, 160, 0.25)',
    glowColor: 'rgba(100, 100, 160, 0.15)',
    stairHeight: 430,
    featured: false,
    summaryFeatures: [
      'Manual job search across postings',
      'Basic surface level resume scan',
      'Simple cover letter templates',
      'Basic interview question set',
      'Limited AI Generated resumes and cover letters',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$7.50',
    period: '/month',
    yearlyNote: 'or $174.00/year',
    yearlyPrice: '$174.00/year',
    gradientColors: ['#3D2878', '#2B1E60'],
    borderColor: 'rgba(167, 139, 250, 0.5)',
    selectedBorderColor: 'rgba(167, 139, 250, 0.95)',
    accentColor: '#A78BFA',
    dividerColor: 'rgba(167, 139, 250, 0.3)',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    stairHeight: 550,
    featured: true,
    summaryFeatures: [
      'Tailored Rewrites for each job posting',
      'Unlimited AI-Generated resumes & cover letters',
      'Full interview prep suite',
      'AI Apply Assistant',
      'Daily limit: 10 AI-assisted applications',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$14.50',
    period: '/month',
    yearlyNote: 'or $174.00/year',
    yearlyPrice: '$174.00/year',
    gradientColors: ['#1E1508', '#120E05'],
    borderColor: 'rgba(245, 158, 11, 0.45)',
    selectedBorderColor: 'rgba(251, 191, 36, 0.9)',
    accentColor: '#F59E0B',
    dividerColor: 'rgba(245, 158, 11, 0.25)',
    glowColor: 'rgba(245, 158, 11, 0.2)',
    stairHeight: 670,
    featured: false,
    summaryFeatures: [
      'Auto-Apply AI Agent (25-40 daily)',
      'Multi-role targeting & priority processing',
      'Weekly coaching prompts',
      'Personalized career progress reports',
      'Advanced job scoring & ranking',
    ],
  },
};
