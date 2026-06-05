import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    registerForPushNotifications().then((t) => {
      setToken(t ?? null);
      setPermission(t ? 'granted' : 'denied');
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // handled by system tray
      void notification;
    });

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  const scheduleLocalReminder = async (title: string, body: string, triggerHour: number) => {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: triggerHour,
        minute: 0,
      },
    });
  };

  const cancelAllReminders = async () => {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const sendTestNotification = async () => {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🥗 Genki nhắc nhở',
        body: 'Đừng quên ghi nhận bữa ăn hôm nay nhé!',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
    });
  };

  return { token, permission, scheduleLocalReminder, cancelAllReminders, sendTestNotification };
}

async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return undefined;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'genki-app', // replace with real Expo project ID
  }).catch(() => null);

  return tokenData?.data;
}
