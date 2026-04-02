import { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { MessagesProvider } from '../src/contexts/MessagesContext';
import MessagesOverlay from '../src/components/MessagesOverlay';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  '"textShadow*" style props are deprecated. Use "textShadow".',
]);

export default function RootLayout() {
  const segments = useSegments();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const route = `/${segments.join('/')}`.replace(/\/+/g, '/');
    const titleMap = {
      '/': 'Home',
      '/home': 'Home',
      '/authentication': 'Log In',
      '/onboarding': 'Onboarding',
      '/jobs': 'Job Board',
      '/resume': 'Resume Builder',
      '/resume/job-posting': 'Optimize Resume from Job Posting',
      '/resume/template': 'Resume Templates',
      '/cover-letter': 'Cover Letter Builder',
      '/cover-letter/job-posting': 'Optimize Cover Letter from Job Posting',
      '/cover-letter/template': 'Cover Letter Templates',
      '/interview': 'Interview Prep',
      '/interview-buddy': 'Interview Buddy',
      '/interview-buddy/video-instructions': 'Video Interview Instructions',
      '/interview-buddy/video-interview': 'Video Interview',
      '/profile': 'Profile',
      '/pricing': 'Pricing',
      '/payment': 'Payment',
      '/payment-success': 'Payment Success',
    };

    let pageTitle = titleMap[route];

    if (!pageTitle) {
      if (route.startsWith('/job/')) {
        pageTitle = 'Job Details';
      } else {
        pageTitle = 'Overview';
      }
    }

    document.title = `Career AI | ${pageTitle}`;
  }, [segments]);

  return (
    <MessagesProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      <MessagesOverlay />
    </MessagesProvider>
  );
}

