import { Stack } from 'expo-router';

export default function DriverTripFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F5F2' } }}>
      <Stack.Screen name="incoming-request" />
      <Stack.Screen name="active-trip" />
      <Stack.Screen name="trip-payment-summary" />
      <Stack.Screen name="trip-history-detail" />
    </Stack>
  );
}
