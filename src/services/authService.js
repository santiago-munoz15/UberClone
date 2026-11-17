import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { clearDriverPushToken } from './tripService';

export const createDriverAccount = async (email, password) => {
  const currentUser = auth.currentUser;
  if (currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email.trim(), password);
    return (await linkWithCredential(currentUser, credential)).user;
  }
  return (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
};

export const signInDriver = async (email, password) => (
  await signInWithEmailAndPassword(auth, email.trim(), password)
).user;

export const resetDriverPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export async function signOutDriver() {
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    try {
      await clearDriverPushToken();
    } catch (error) {
      console.error('No se pudo desactivar el conductor antes de cerrar sesión:', error);
    }
  }
  return signOut(auth);
}
