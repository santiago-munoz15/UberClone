import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const testFirebaseConnection = async () => {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sesión antes de probar la conexión con Firebase.');

  const driverSnapshot = await getDoc(doc(db, 'drivers', user.uid));
  console.log('FIREBASE CONECTADO');
  console.log('UID del conductor:', user.uid);
  console.log('Perfil encontrado:', driverSnapshot.exists());
  return driverSnapshot.exists();
};
