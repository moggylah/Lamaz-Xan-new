import {
  CalendarIcon, DhikrIcon, PrayerScheduleIcon, QiblaIcon, QuranIcon,
} from './Icons.jsx';
import { formatClock } from '../lib/date.js';
import { t } from '../lib/i18n.js';

function formatCountdown(ms) {
  const safe = Math.max(0, ms);
  const total = Math.floor(safe / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function PrayerTimesView({ timeZone, now, nextFard, language = 'ru', onNavigate }) {
  const nextTime = nextFard.time;

  return (
    <section className="prayer-screen">
      <button
        type="button"
        className="next-prayer-card home-next-prayer-button"
        onClick={() => onNavigate?.('schedule')}
      >
        <div className="next-prayer-copy">
          <span className="next-label">{t(language, 'prayer.next')}</span>
          <strong className="next-name">{t(language, `prayer.${nextFard.key}`)}</strong>
          <span className="next-at">{t(language, 'prayer.until', { time: formatClock(nextTime, timeZone, language) })}</span>
        </div>

        <div className="next-prayer-countdown">
          <span className="countdown-label">{t(language, 'prayer.in')}</span>
          <strong className="countdown">{formatCountdown(nextTime - now)}</strong>
        </div>

        <span className="next-prayer-expand">
          <span className="next-prayer-expand-copy">
            <PrayerScheduleIcon size={17}/>
            {t(language, 'prayer.todaySchedule')}
          </span>
          <span className="next-prayer-expand-arrow" aria-hidden="true">›</span>
        </span>
      </button>

      <h2 className="home-primary-title">{t(language, 'aria.sections')}</h2>
      <nav className="home-primary-links" aria-label={t(language, 'aria.sections')}>
        <button type="button" onClick={() => onNavigate?.('qibla')}>
          <span className="home-section-menu-icon"><QiblaIcon size={24}/></span>
          <span>{t(language, 'tab.qibla')}</span>
        </button>
        <button type="button" onClick={() => onNavigate?.('azkar')}>
          <span className="home-section-menu-icon"><DhikrIcon size={24} className="home-azkar-icon"/></span>
          <span>{t(language, 'tab.azkar')}</span>
        </button>
        <button type="button" onClick={() => onNavigate?.('quran')}>
          <span className="home-section-menu-icon"><QuranIcon size={24}/></span>
          <span>{t(language, 'quran.shortTitle')}</span>
        </button>
        <button type="button" onClick={() => onNavigate?.('calendar')}>
          <span className="home-section-menu-icon"><CalendarIcon size={24}/></span>
          <span>{t(language, 'tab.calendar')}</span>
        </button>
      </nav>

    </section>
  );
}
