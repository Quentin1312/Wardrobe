import { Redirect } from 'expo-router';

// Entry point — real routing decision happens in the root layout's auth gate.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
