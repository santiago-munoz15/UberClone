
import { useEffect, useRef } from 'react';
import DriverRegistrationScreen from '../screens/register/DriverRegistrationScreen';
import { testFirebaseConnection } from '../services/testFirebase';

export default function HomeRoute() {
  const testExecuted = useRef(false);

  useEffect(() => {
    if (testExecuted.current) return;

    testExecuted.current = true;

    testFirebaseConnection();
  }, []);

  return <DriverRegistrationScreen />;
}
