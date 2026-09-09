import {
  CheckIcon, CurrentIcon, EmptyCircleIcon, MoonIcon, StarIcon, SunIcon, SunriseIcon, SunsetIcon,
} from './Icons.jsx';
import { formatClock } from '../lib/date.js';
import { getPastStatus } from '../lib/prayer.js';
import { t } from '../lib/i18n.js';

const rows = [
  { key: 'fajr', type: 'fard', Icon: SunriseIcon },
  { key: 'sunrise', type: 'secondary', Icon: SunriseIcon },
  { key: 'duha', type: 'secondary', Icon: SunIcon },
  { key: 'dhuhr', type: 'fard', Icon: SunIcon },
  { key: 'asr', type: 'fard', Icon: SunriseIcon },
  { key: 'maghrib', type: 'fard', Icon: SunsetIcon },
  { key: 'isha', type: 'fard', Icon: MoonIcon },
  { key: 'qiyam', type: 'secondary', Icon: StarIcon, subLabelKey: 'prayer.lastThird' },
];

export default function TodayScheduleView({ times, timeZone, now, nextFard, iqamahTimes = {}, mosqueName = '', language = 'ru' }) {
  return (
    <section className="today-schedule-screen">
      <header className="today-schedule-intro">
        <span>{t(language, 'calendar.today')}</span>
        <h1>{t(language, 'prayer.todaySchedule')}</h1>
        {mosqueName && <p>{mosqueName}</p>}
      </header>

      <div className="prayer-list" role="list" aria-label={t(language, 'prayer.todaySchedule')}>
        {rows.map(({ key, type, Icon, subLabelKey }) => {
          const time = times[key];
          const status = getPastStatus(key, time, now, nextFard.key, nextFard.tomorrow);
          return (
            <div role="listitem" className={`prayer-row ${type === 'secondary' ? 'secondary-prayer' : 'fard-prayer'} ${status === 'next' ? 'is-next' : ''}`} key={key}>
              <div className="prayer-title-wrap">
                <span className="prayer-icon"><Icon size={type === 'secondary' ? 18 : 21}/></span>
                <span className="prayer-name-stack">
                  <span className="prayer-name">{t(language, `prayer.${key}`)}</span>
                  {subLabelKey && <small>{t(language, subLabelKey)}</small>}
                </span>
              </div>
              <div className="prayer-time-wrap">
                <span className="prayer-time-stack">
                  <span className="prayer-time">{formatClock(time, timeZone, language)}</span>
                  {type === 'fard' && iqamahTimes[key] && <small className="iqamah-time">{t(language, 'prayer.iqamah', { time: iqamahTimes[key] })}</small>}
                </span>
                <span className="prayer-status" aria-hidden="true">
                  {status === 'past' ? <CheckIcon size={type === 'secondary' ? 15 : 17}/>
                    : status === 'next' ? <CurrentIcon size={17}/>
                      : <EmptyCircleIcon size={type === 'secondary' ? 15 : 17}/>}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
