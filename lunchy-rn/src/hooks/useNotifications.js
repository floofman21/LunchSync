import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      // TODO: schedule reminders based on upcoming lunches
      // e.g. Notifications.scheduleNotificationAsync({ content: { title: 'Lunch today!' }, trigger: { ... } })
    })();
  }, []);
}
