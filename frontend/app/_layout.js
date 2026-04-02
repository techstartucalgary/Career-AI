import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { MessagesProvider } from '../src/contexts/MessagesContext';
import MessagesOverlay from '../src/components/MessagesOverlay';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  '"textShadow*" style props are deprecated. Use "textShadow".',
]);

export default function RootLayout() {
  return (
    <MessagesProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      <MessagesOverlay />
    </MessagesProvider>
  );
}

