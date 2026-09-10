import { useMemo, useState } from 'react';
import {
  CheckIcon, CurrentIcon, EmptyCircleIcon, MoonIcon, StarIcon, SunIcon, SunriseIcon, SunsetIcon,
} from './Icons.jsx';
import { addCalendarDays, formatClock, getDateDisplay, wallTimeToDate } from '../lib/date.js';
import { calculatePrayerData, getLastThirdStart, getPastStatus } from '../lib/prayer.js';
import { t } from '../lib/i18n.js';
import { extractMosqueDay, mapMosqueDayToIqamah, mapMosqueDayToTimes } from '../lib/mymasjid.js';

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

function sameDate(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export default function TodayScheduleView({ location, method, madhab, timeZone, now, nextFard, mosqueSchedule, selectedMosque, duhaOffset, todayParts, language = 'ru' }) {
  const [selectedDate, setSelectedDate] = useState(todayParts);
  const nextDate = useMemo(() => addCalendarDays(selectedDate, 1), [selectedDate]);
  const selectedMosqueDay = useMemo(() => selectedMosque ? extractMosqueDay(mosqueSchedule, selectedDate) : null, [selectedMosque, mosqueSchedule, selectedDate]);
  const nextMosqueDay = useMemo(() => selectedMosque ? extractMosqueDay(mosqueSchedule, nextDate) : null, [selectedMosque, mosqueSchedule, nextDate]);
  const selectedData = useMemo(() => calculatePrayerData({ ...location, date: now, dateParts: selectedDate, method, madhab, timeZone, mosqueTimes: mapMosqueDayToTimes(selectedMosqueDay), duhaOffset }), [location, now, selectedDate, method, madhab, timeZone, selectedMosqueDay, duhaOffset]);
  const nextData = useMemo(() => calculatePrayerData({ ...location, date: now, dateParts: nextDate, method, madhab, timeZone, mosqueTimes: mapMosqueDayToTimes(nextMosqueDay), duhaOffset }), [location, now, nextDate, method, madhab, timeZone, nextMosqueDay, duhaOffset]);
  const times = useMemo(() => ({ ...selectedData.times, qiyam: getLastThirdStart(selectedData.times.maghrib, nextData.times.fajr) }), [selectedData.times, nextData.times.fajr]);
  const iqamahTimes = useMemo(() => mapMosqueDayToIqamah(selectedMosqueDay), [selectedMosqueDay]);
  const isToday = sameDate(selectedDate, todayParts);
  const dateValue = useMemo(() => wallTimeToDate({ ...selectedDate, hour: 12, minute: 0 }, timeZone), [selectedDate, timeZone]);
  const dateDisplay = useMemo(() => getDateDisplay(dateValue, timeZone, language), [dateValue, timeZone, language]);
  const statusNextFard = isToday ? nextFard : { key: null, tomorrow: false };

  return (
    <section className="today-schedule-screen">
      <header className="today-schedule-intro">
        <span>{isToday ? t(language, 'calendar.today') : dateDisplay.weekday}</span>
        <h1>{t(language, 'prayer.schedule')}</h1>
        {selectedMosqueDay && <p>{selectedMosque?.name}</p>}
      </header>

      <div className="schedule-date-navigation">
        <button type="button" onClick={() => setSelectedDate((date) => addCalendarDays(date, -1))} aria-label="Previous day">‹</button>
        <button type="button" className="schedule-date-current" onClick={() => setSelectedDate(todayParts)} disabled={isToday}>
          <small>{t(language, 'calendar.today')}</small>
          <strong>{dateDisplay.headline}</strong>
        </button>
        <button type="button" onClick={() => setSelectedDate((date) => addCalendarDays(date, 1))} aria-label="Next day">›</button>
      </div>

      <div className="prayer-list" role="list" aria-label={t(language, 'prayer.todaySchedule')}>
        {rows.map(({ key, type, Icon, subLabelKey }) => {
          const time = times[key];
          const status = getPastStatus(key, time, now, statusNextFard.key, statusNextFard.tomorrow);
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
