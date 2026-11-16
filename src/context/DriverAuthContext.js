import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const DriverAuthContext = createContext(null);

export function DriverAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverError, setDriverError] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [driverLoading, setDriverLoading] = useState(true);
  const driverUnsubscribe = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      driverUnsubscribe.current?.();
      driverUnsubscribe.current = null;
      setUser(nextUser);
      setDriver(null);
      setDriverError(false);
      setAuthLoading(false);

      if (!nextUser) {
        setDriverLoading(false);
        return;
      }

      setDriverLoading(true);
      driverUnsubscribe.current = onSnapshot(
        doc(db, 'drivers', nextUser.uid),
        (snapshot) => {
          setDriver(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
          setDriverLoading(false);
        },
        (error) => {
          console.error('No se pudo leer el estado del conductor:', error);
          setDriver(null);
          setDriverError(true);
          setDriverLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      driverUnsubscribe.current?.();
    };
  }, []);

  return (
    <DriverAuthContext.Provider value={{ user, driver, driverError, authLoading, driverLoading }}>
      {children}
    </DriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const context = useContext(DriverAuthContext);
  if (!context) throw new Error('useDriverAuth debe usarse dentro de DriverAuthProvider.');
  return context;
}
