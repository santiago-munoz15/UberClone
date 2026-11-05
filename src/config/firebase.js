
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Configuración del proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBd66Yca_36jz5h8iXeI1WPAy2_2lwzhuc",
  authDomain: "uberclone-b49dc.firebaseapp.com",
  projectId: "uberclone-b49dc",
  storageBucket: "uberclone-b49dc.firebasestorage.app",
  messagingSenderId: "161380326274",
  appId: "1:161380326274:web:2d1dad7e2257bc6982cd9b"
};

// Inicializar Firebase
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Inicializar autenticación con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Firestore
const db = getFirestore(app);

export { app, auth, db };
