import { Redirect } from 'expo-router';
import TripPaymentSummaryScreen from '../../screens/trips/TripPaymentSummaryScreen';

export default function TripPaymentSummaryRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <TripPaymentSummaryScreen />;
}
