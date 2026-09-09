import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

export const isNativeApp = Capacitor.isNativePlatform();

export async function getDevicePosition() {
  if (!isNativeApp) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation unavailable'));
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }
  await Geolocation.requestPermissions();
  return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

export async function getNativeNotificationPermission() {
  if (!isNativeApp) return 'unsupported';
  const result = await LocalNotifications.checkPermissions();
  return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default';
}

export async function requestNativeNotificationPermission() {
  if (!isNativeApp) return 'unsupported';
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default';
}

export async function syncNativeNotifications({ todayTimes, tomorrowTimes, prefs, language, translate, mosqueName = '' }) {
  if (!isNativeApp) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
  if (!prefs?.enabled || (await getNativeNotificationPermission()) !== 'granted') return;

  const notifications = [];
  const lead = (Number(prefs.leadMinutes) || 0) * 60_000;
  const now = Date.now();
  const rows = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'qiyam'];
  [todayTimes, tomorrowTimes].forEach((times, dayIndex) => {
    rows.forEach((key, rowIndex) => {
      if (!prefs.prayers?.[key] || !(times?.[key] instanceof Date)) return;
      const at = new Date(times[key].getTime() - lead);
      if (at.getTime() <= now) return;
      const prayer = translate(language, `prayer.${key}`);
      notifications.push({
        id: 1000 + dayIndex * 20 + rowIndex,
        title: key === 'qiyam'
          ? translate(language, 'notification.lastThirdStarted')
          : lead > 0
            ? translate(language, 'notification.inMinutes', { prayer, minutes: Number(prefs.leadMinutes) })
            : translate(language, 'notification.prayerTime', { prayer }),
        body: [translate(language, 'notification.time', { time: times[key].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }), mosqueName].filter(Boolean).join(' · '),
        schedule: { at },
        extra: { view: 'prayers' },
      });
    });
  });

  ['morning', 'evening'].forEach((key, index) => {
    const reminder = prefs.azkar?.[key];
    if (!reminder?.enabled || !/^\d{2}:\d{2}$/.test(reminder.time || '')) return;
    const [hour, minute] = reminder.time.split(':').map(Number);
    notifications.push({
      id: 2000 + index,
      title: translate(language, `notification.azkar.${key}Title`),
      body: `${translate(language, 'notification.azkar.verse')}\n${translate(language, 'notification.azkar.source')}`,
      schedule: { on: { hour, minute }, repeats: true },
      extra: { view: 'azkar' },
    });
  });

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}
