
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';

// Obtener o crear la sesión anónima del conductor
export const signInDriverAnonymously = async () => {
  try {
    // Esperar a que Firebase recupere la sesión guardada
    await auth.authStateReady();

    // Si ya existe una sesión, reutilizarla
    if (auth.currentUser) {
      return auth.currentUser;
    }

    // Si no existe una sesión, crear una anónima
    const userCredential = await signInAnonymously(auth);

    return userCredential.user;

  } catch (error) {
    console.error('Error en la autenticación del conductor:', error);
    throw error;
  }
};
