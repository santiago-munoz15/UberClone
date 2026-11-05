import { signInDriverAnonymously } from './authService';

export const testFirebaseConnection = async () => {
  try {
    const user = await signInDriverAnonymously();

    console.log('FIREBASE CONECTADO');
    console.log('UID del conductor:', user.uid);
    console.log('Usuario anónimo:', user.isAnonymous);

    return user;

  } catch (error) {
    console.error('Error conectando con Firebase:', error);
    throw error;
  }
};