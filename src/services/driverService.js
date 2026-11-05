
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { signInDriverAnonymously } from './authService';

export const saveDriverRegistration = async (
  personalInfo,
  vehicleInfo,
  driverDocuments
) => {
  try {
    const user = await signInDriverAnonymously();

    const driverRef = doc(db, 'drivers', user.uid);

    await setDoc(driverRef, {
      personalInfo,
      vehicleInfo,
      driverDocuments,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('REGISTRO GUARDADO EN FIRESTORE:', user.uid);

    return user.uid;

  } catch (error) {
    console.error('Error guardando el registro:', error);
    throw error;
  }
};
