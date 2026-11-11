import { Redirect } from 'expo-router';
import DriverHomeScreen from '../../screens/home/DriverHomeScreen';

export default function DriverPreviewRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DriverHomeScreen />;
}
