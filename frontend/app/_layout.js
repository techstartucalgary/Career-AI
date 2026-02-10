import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MessagesProvider } from '../src/contexts/MessagesContext';
import MessagesOverlay from '../src/components/MessagesOverlay';

export default function RootLayout() {
  return (
    <MessagesProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      <MessagesOverlay />
    </MessagesProvider>
  );
}

