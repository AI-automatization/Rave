// CineSync — Expo React Native
// T-E001: Bu fayl placeholder — AppNavigator bilan almashtiriladi
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CineSync</Text>
      <Text style={styles.subtitle}>Expo React Native — setup jarayonida</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#E50914',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
  },
});
