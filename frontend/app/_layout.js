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
    if (typeof window === 'undefined') {
      return undefined;
    }

    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldIgnore = (message) => {
      if (!message) return false;
      const text = String(message);
      return (
        text.includes('"shadow*" style props are deprecated. Use "boxShadow".') ||
        text.includes('"textShadow*" style props are deprecated. Use "textShadow".') ||
        text.includes('Cross-Origin-Opener-Policy policy would block the window.postMessage call.') ||
        text.includes('google.accounts.id.initialize() is called multiple times.') ||
        text.includes('accounts.google.com/gsi/status') ||
        text.includes('accounts.google.com/gsi/button')
      );
    };

    console.warn = (...args) => {
      if (shouldIgnore(args[0])) return;
      originalWarn(...args);
    };

    console.error = (...args) => {
      if (shouldIgnore(args[0])) return;
      originalError(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

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

