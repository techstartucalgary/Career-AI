import { View, Text } from 'react-native';

export default function TestPage() {
  console.log('TestPage rendering!');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F1C2F' }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
        ✅ Expo is Working!
      </Text>
      <Text style={{ color: '#8B7AB8', fontSize: 16, marginTop: 10 }}>
        If you see this, the app is loading correctly
      </Text>
    </View>
  );
}
