import { useEffect, useMemo, useRef, useState } from 'react';
import { formatClock, formatMonthTitle, formatWeekday } from '../lib/date.js';
import { getLanguage, t } from '../lib/i18n.js';
import { buildMonthSchedule, shiftMonth } from '../lib/monthly.js';
import { downloadMonthlySchedulePdf } from '../lib/pdf.js';

const mainPrayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const allPrayerKeys = ['fajr', 'sunrise', 'duha', 'dhuhr', 'asr', 'maghrib', 'isha', 'qiyam'];
const pageSize = 7;

export default function CalendarView({
  location, method, madhab, timeZone, mosqueSchedule, selectedMosque, duhaOffset, todayParts, language = 'ru',
}) {
  const [monthState, setMonthState] = useState({ year: todayParts.year, month: todayParts.month });
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, todayParts.day - 1));
  const [mode, setMode] = useState('day');
  const touchStartRef = useRef(null);

  const rows = useMemo(
    () => buildMonthSchedule({
      ...monthState, location, method, madhab, timeZone, mosqueSchedule, selectedMosque, duhaOffset,
    }),
    [monthState.year, monthState.month, location.lat, location.lng, method, madhab, timeZone, mosqueSchedule, selectedMosque, duhaOffset],
  );

  useEffect(() => {
    const current = monthState.year === todayParts.year && monthState.month === todayParts.month;
    setSelectedIndex(current ? Math.max(0, todayParts.day - 1) : 0);
  }, [monthState.year, monthState.month, todayParts.year, todayParts.month, todayParts.day]);

  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, Math.max(0, rows.length - 1)));
  const selectedRow = rows[safeSelectedIndex];
  const weekStart = Math.floor(safeSelectedIndex / pageSize) * pageSize;
  const visibleRows = rows.slice(weekStart, weekStart + pageSize);
  const monthTitle = formatMonthTitle(monthState.year, monthState.month, language);
  const locale = getLanguage(language).locale;

  function changeMonth(amount) {
    setMonthState((current) => shiftMonth(current.year, current.month, amount));
  }

  function goToday() {
    setMonthState({ year: todayParts.year, month: todayParts.month });
    setSelectedIndex(Math.max(0, todayParts.day - 1));
    setMode('day');
  }

  function changeWeek(amount) {
    setSelectedIndex(Math.max(0, Math.min(rows.length - 1, weekStart + amount * pageSize)));
  }

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.15) changeWeek(dx < 0 ? 1 : -1);
  }

  function isToday(row) {
    return row.dateParts.year === todayParts.year && row.dateParts.month === todayParts.month && row.dateParts.day === todayParts.day;
  }

  function downloadPdf() {
    downloadMonthlySchedulePdf({ rows, year: monthState.year, month: monthState.month, timeZone, language });
  }

  const selectedDateTitle = selectedRow?.date.toLocaleDateString(locale, {
    timeZone, weekday: 'long', day: 'numeric', month: 'long',
  });
  const selectedHijriDate = selectedRow?.date.toLocaleDateString(`${locale}-u-ca-islamic`, {
    timeZone, day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <section className="calendar-screen calendar-redesign">
      <div className="calendar-toolbar">
        <button type="button" className="calendar-month-button" onClick={() => changeMonth(-1)} aria-label={t(language, 'calendar.previous')}>‹</button>
        <div className="calendar-month-title"><h2>{monthTitle}</h2></div>
        <button type="button" className="calendar-month-button" onClick={() => changeMonth(1)} aria-label={t(language, 'calendar.next')}>›</button>
      </div>

      <div className="calendar-actions-row">
        <div className="calendar-mode-switch" role="tablist" aria-label={t(language, 'calendar.view')}>
          <button type="button" className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')} role="tab" aria-selected={mode === 'day'}>{t(language, 'calendar.day')}</button>
          <button type="button" className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')} role="tab" aria-selected={mode === 'month'}>{t(language, 'calendar.month')}</button>
        </div>
        <button type="button" className="calendar-today-button" onClick={goToday}>{t(language, 'calendar.today')}</button>
      </div>

      {mode === 'day' ? (
        <>
          <div className="calendar-week-picker" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <button type="button" className="calendar-week-button" onClick={() => changeWeek(-1)} disabled={weekStart === 0} aria-label={t(language, 'calendar.previousWeek')}>‹</button>
            <div className="calendar-week-days">
              {visibleRows.map((row, offset) => {
                const rowIndex = weekStart + offset;
                return (
                  <button type="button" key={row.dateParts.day} className={`${rowIndex === safeSelectedIndex ? 'selected' : ''} ${isToday(row) ? 'today' : ''}`} onClick={() => setSelectedIndex(rowIndex)} aria-pressed={rowIndex === safeSelectedIndex}>
                    <span>{formatWeekday(row.date, timeZone, language, true)}</span>
                    <strong>{row.dateParts.day}</strong>
                  </button>
                );
              })}
            </div>
            <button type="button" className="calendar-week-button" onClick={() => changeWeek(1)} disabled={weekStart + pageSize >= rows.length} aria-label={t(language, 'calendar.nextWeek')}>›</button>
          </div>

          {selectedRow && (
            <article className={`calendar-selected-day ${isToday(selectedRow) ? 'is-today' : ''}`}>
              <header className="calendar-selected-heading">
                <div><h3>{selectedDateTitle}</h3><p>{selectedHijriDate}</p></div>
                {isToday(selectedRow) && <span>{t(language, 'calendar.today')}</span>}
              </header>
              <div className="calendar-selected-times">
                {allPrayerKeys.map((key) => (
                  <div className={mainPrayerKeys.includes(key) ? 'primary' : 'secondary'} key={key}>
                    <span>{t(language, `prayer.${key}`)}</span>
                    <strong>{formatClock(selectedRow.times[key], timeZone, language)}</strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </>
      ) : (
        <div className="calendar-month-grid-wrap">
          <table className="calendar-month-grid">
            <thead><tr><th>{t(language, 'calendar.date')}</th>{mainPrayerKeys.map((key) => <th key={key}>{t(language, `prayer.${key}`)}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.dateParts.day} className={isToday(row) ? 'is-today' : ''} onClick={() => { setSelectedIndex(index); setMode('day'); }}>
                  <td><strong>{row.dateParts.day}</strong><span>{formatWeekday(row.date, timeZone, language, true)}</span></td>
                  {mainPrayerKeys.map((key) => <td key={key}>{formatClock(row.times[key], timeZone, language)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="calendar-footer-actions">
        <span className="calendar-source-badge">{selectedMosque ? t(language, 'calendar.mosqueSource', { mosque: selectedMosque.name }) : t(language, 'calendar.calculatedSource')}</span>
        <button type="button" className="calendar-pdf-link" onClick={downloadPdf}>{t(language, 'calendar.downloadPdf')}</button>
      </div>
    </section>
  );
}
