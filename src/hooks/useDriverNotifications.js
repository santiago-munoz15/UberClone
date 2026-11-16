import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  listenForDriverPushTokenChanges,
  registerDriverPushNotifications,
} from '../services/notificationService';
import { useDriverAuth } from '../context/DriverAuthContext';

export default function useDriverNotifications() {
  const { user } = useDriverAuth();

  useEffect(() => {
    if (!user || user.isAnonymous) return undefined;

    const handleNotificationResponse = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type !== 'incoming_trip') return;
      router.push({
        pathname: '/incoming-request',
        params: data.tripId ? { tripId: String(data.tripId) } : undefined,
      });
      Notifications.clearLastNotificationResponse();
    };

    registerDriverPushNotifications().catch((error) => {
      console.error('No se pudieron configurar las notificaciones del conductor:', error);
    });

    const tokenSubscription = listenForDriverPushTokenChanges((error) => {
      console.error('No se pudo actualizar el token de notificaciones del conductor:', error);
    });
    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse) handleNotificationResponse(initialResponse);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      tokenSubscription();
      responseSubscription.remove();
    };
  }, [user]);
}
