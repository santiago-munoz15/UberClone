import { Stack } from 'expo-router';
import { DriverAvailabilityProvider } from '../context/DriverAvailabilityContext';

export default function RootLayout() {
  return (
    <DriverAvailabilityProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F5F2' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </DriverAvailabilityProvider>
  );
}
