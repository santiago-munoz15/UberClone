
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const saveDriverRegistration = async (
  personalInfo,
  vehicleInfo,
  driverDocuments
) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('Inicia sesión con una cuenta de correo antes de enviar el registro.');
    }

    const driverRef = doc(db, 'drivers', user.uid);
    const existingDriver = await getDoc(driverRef);

    await setDoc(driverRef, {
      personalInfo,
      vehicleInfo,
      driverDocuments,
      status: 'pending',
      ...(existingDriver.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('REGISTRO GUARDADO EN FIRESTORE:', user.uid);

    return user.uid;

  } catch (error) {
    console.error('Error guardando el registro:', error);
    throw error;
  }
};
