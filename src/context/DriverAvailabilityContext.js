import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { updateDriverAvailability } from '../services/tripService';

const DriverAvailabilityContext = createContext(null);

export function DriverAvailabilityProvider({ children }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    let driverUnsubscribe;
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      driverUnsubscribe?.();
      driverUnsubscribe = undefined;
      if (!user || user.isAnonymous) {
        setIsAvailable(false);
        return;
      }

      driverUnsubscribe = onSnapshot(
        doc(db, 'drivers', user.uid),
        (snapshot) => {
          setIsAvailable(Boolean(snapshot.data()?.isAvailable));
          setAvailabilityError(null);
        },
        (error) => {
          setAvailabilityError(error);
          console.error('No se pudo sincronizar la disponibilidad:', error);
        },
      );
    });

    return () => {
      authUnsubscribe();
      driverUnsubscribe?.();
    };
  }, []);

  const toggleAvailability = useCallback(async () => {
    const nextValue = !isAvailable;
    setIsAvailable(nextValue);
    try {
      await updateDriverAvailability(nextValue);
    } catch (error) {
      setIsAvailable(!nextValue);
      console.error('No se pudo actualizar la disponibilidad del conductor:', error);
      return false;
    }
    return true;
  }, [isAvailable]);

  const value = useMemo(
    () => ({ isAvailable, availabilityError, toggleAvailability }),
    [isAvailable, availabilityError, toggleAvailability],
  );

  return (
    <DriverAvailabilityContext.Provider value={value}>
      {children}
    </DriverAvailabilityContext.Provider>
  );
}

export function useDriverAvailability() {
  const context = useContext(DriverAvailabilityContext);
  if (!context) {
    throw new Error('useDriverAvailability debe usarse dentro de DriverAvailabilityProvider.');
  }
  return context;
}
