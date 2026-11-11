import { Stack } from 'expo-router';
import { DriverTripProvider } from '../../context/DriverTripContext';

export default function DriverFlowLayout() {
  return (
    <DriverTripProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F5F2' } }}>
        <Stack.Screen name="driver-preview" />
        <Stack.Screen name="incoming-request" />
        <Stack.Screen name="active-trip" />
        <Stack.Screen name="trip-payment-summary" />
        <Stack.Screen name="earnings" />
        <Stack.Screen name="trip-history" />
        <Stack.Screen name="trip-history-detail" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </DriverTripProvider>
  );
}
