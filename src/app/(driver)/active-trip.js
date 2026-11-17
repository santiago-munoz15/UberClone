import { Redirect } from 'expo-router';
import ActiveTripScreen from '../../screens/trips/ActiveTripScreen';

export default function ActiveTripRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ActiveTripScreen />;
}
