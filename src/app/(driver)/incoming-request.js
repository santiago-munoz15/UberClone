import { Redirect } from 'expo-router';
import IncomingRequestScreen from '../../screens/requests/IncomingRequestScreen';

export default function IncomingRequestRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <IncomingRequestScreen />;
}
