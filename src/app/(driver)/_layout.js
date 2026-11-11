import { Stack } from 'expo-router';

export default function DriverFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F5F2' } }}>
      <Stack.Screen name="driver-preview" />
      <Stack.Screen name="incoming-request" />
    </Stack>
  );
}
