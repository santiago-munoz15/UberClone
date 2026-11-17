import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverTripProvider } from '../../context/DriverTripContext';
import { DriverAuthProvider, useDriverAuth } from '../../context/DriverAuthContext';

export default function DriverFlowLayout() {
  return (
    <DriverAuthProvider>
      <DriverFlowContent />
    </DriverAuthProvider>
  );
}

function DriverFlowContent() {
  const { user, driver, authLoading, driverLoading } = useDriverAuth();
  if (authLoading || (user && driverLoading)) {
    return <SafeAreaView style={{ alignItems: 'center', backgroundColor: '#F4F5F2', flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#687E1B" /></SafeAreaView>;
  }
  if (!user || user.isAnonymous || driver?.status !== 'approved') return <Redirect href="/" />;

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
