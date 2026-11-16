import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { updateDriverPushToken } from './tripService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerDriverPushNotifications() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return null;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('trip-requests', {
        name: 'Solicitudes de viaje',
        importance: 5,
      });
    } catch (error) {
      console.warn('No se pudo crear el canal de notificaciones; se continuará sin configuración personalizada:', error);
    }
  }

  const permissions = await Notifications.getPermissionsAsync();
  const finalStatus = permissions.status === 'granted'
    ? permissions.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') {
    throw new Error('NOTIFICATION_PERMISSION_DENIED');
  }

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  if (!deviceToken?.data) throw new Error('PUSH_TOKEN_UNAVAILABLE');
  await updateDriverPushToken(String(deviceToken.data), Platform.OS);
  return deviceToken.data;
}

export function listenForDriverPushTokenChanges(onError) {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return () => {};

  const subscription = Notifications.addPushTokenListener((nextToken) => {
    if (!nextToken?.data) return;
    updateDriverPushToken(String(nextToken.data), Platform.OS).catch(onError);
  });
  return () => subscription.remove();
}
