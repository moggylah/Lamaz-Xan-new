import { formatClock, getLocalDateParts, wallTimeToDate } from './date.js';
import { t } from './i18n.js';

export const DEFAULT_NOTIFICATION_PREFS = {
  enabled: false,
  leadMinutes: 0,
  vibration: true,
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true, qiyam: false },
  azkar: {
    morning: { enabled: false, time: '07:00' },
    evening: { enabled: false, time: '18:00' },
  },
};

export const NOTIFICATION_ROWS = [
  { key: 'fajr' }, { key: 'dhuhr' }, { key: 'asr' }, { key: 'maghrib' }, { key: 'isha' },
  { key: 'qiyam', detailKey: 'notification.lastThirdStart' },
];

function readSent() {
  try { return JSON.parse(localStorage.getItem('lamaz-notifications-sent') || '{}'); }
  catch { return {}; }
}

function writeSent(value) {
  try { localStorage.setItem('lamaz-notifications-sent', JSON.stringify(value)); }
  catch { /* Ignore storage restrictions. */ }
}

function getDailyTime(value, now, timeZone) {
  if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  const local = getLocalDateParts(now, timeZone);
  return wallTimeToDate({ ...local, hour, minute }, timeZone);
}

async function displayNotification(title, options) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return true;
    } catch { /* Fallback below. */ }
  }
  try { new Notification(title, options); return true; }
  catch { return false; }
}

export async function sendDueNotifications({ times, prefs, now, timeZone, mosqueName = '', language = 'ru' }) {
  if (!prefs?.enabled || !times || !('Notification' in window) || Notification.permission !== 'granted') return;

  const leadMinutes = Number(prefs.leadMinutes) || 0;
  const sent = readSent();
  const nowMs = now.getTime();
  const staleBefore = nowMs - 3 * 24 * 60 * 60 * 1000;
  for (const [tag, timestamp] of Object.entries(sent)) if (Number(timestamp) < staleBefore) delete sent[tag];

  for (const row of NOTIFICATION_ROWS) {
    if (!prefs.prayers?.[row.key]) continue;
    const prayerTime = times[row.key];
    if (!(prayerTime instanceof Date) || Number.isNaN(prayerTime.getTime())) continue;

    const notifyAt = prayerTime.getTime() - leadMinutes * 60_000;
    const delta = nowMs - notifyAt;
    if (delta < 0 || delta > 120_000) continue;

    const tag = `lamaz-${row.key}-${prayerTime.getTime()}-${leadMinutes}`;
    if (sent[tag]) continue;

    const when = formatClock(prayerTime, timeZone, language);
    const prayerLabel = t(language, `prayer.${row.key}`);
    const title = row.key === 'qiyam'
      ? t(language, 'notification.lastThirdStarted')
      : leadMinutes > 0
        ? t(language, 'notification.inMinutes', { prayer: prayerLabel, minutes: leadMinutes })
        : t(language, 'notification.prayerTime', { prayer: prayerLabel });

    const bodyParts = [
      row.key === 'qiyam' ? t(language, 'notification.start', { time: when }) : t(language, 'notification.time', { time: when }),
      mosqueName && row.key !== 'qiyam' ? mosqueName : '',
    ].filter(Boolean);

    const shown = await displayNotification(title, {
      body: bodyParts.join(' · '),
      tag,
      icon: '/app-icon-192.png',
      badge: '/app-icon-192.png',
      data: { url: '/' },
      ...(prefs.vibration !== false ? { vibrate: [180, 90, 180] } : {}),
    });
    if (shown) sent[tag] = nowMs;
  }
  for (const key of ['morning', 'evening']) {
    const reminder = prefs.azkar?.[key];
    if (!reminder?.enabled) continue;

    const reminderTime = getDailyTime(reminder.time, now, timeZone);
    if (!reminderTime) continue;

    const delta = nowMs - reminderTime.getTime();
    if (delta < 0 || delta > 120_000) continue;

    const local = getLocalDateParts(now, timeZone);
    const tag = `lamaz-azkar-${key}-${local.year}-${local.month}-${local.day}-${reminder.time}`;
    if (sent[tag]) continue;

    const shown = await displayNotification(t(language, `notification.azkar.${key}Title`), {
      body: `${t(language, 'notification.azkar.verse')}\n${t(language, 'notification.azkar.source')}`,
      tag,
      icon: '/app-icon-192.png',
      badge: '/app-icon-192.png',
      data: { url: '/?view=azkar' },
      ...(prefs.vibration !== false ? { vibrate: [180, 90, 180] } : {}),
    });
    if (shown) sent[tag] = nowMs;
  }

  writeSent(sent);
}
