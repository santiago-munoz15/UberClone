import { getFunctions, httpsCallable } from 'firebase/functions';
import { Linking } from 'react-native';
import { app } from '../config/firebase';

const functions = getFunctions(app, 'us-central1');

export async function createMercadoPagoPreference(tripId) {
  if (!tripId) throw new Error('El viaje no tiene un identificador válido.');
  const createPreference = httpsCallable(functions, 'createMercadoPagoPreference');
  const result = await createPreference({ tripId });
  const data = result.data;
  if (!data?.checkoutUrl || !(await Linking.canOpenURL(data.checkoutUrl))) {
    throw new Error('Mercado Pago no devolvió una URL de checkout válida.');
  }
  await Linking.openURL(data.checkoutUrl);
  return data;
}
