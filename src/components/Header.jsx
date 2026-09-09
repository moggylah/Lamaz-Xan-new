import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo.jsx';
import { BackIcon, GearIcon, MoonIcon, SunIcon } from './Icons.jsx';
import { t } from '../lib/i18n.js';

const titleKeys = {
  schedule: 'prayer.todaySchedule',
  sections: 'sections.title',
  qibla: 'tab.qibla',
  azkar: 'tab.azkar',
  calendar: 'tab.calendar',
  quran: 'quran.title',
};

export default function Header({ dates, onSettings, onHome, onThemeToggle, language = 'ru', view = 'prayers', theme = 'light' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (view === 'prayers') {
      setScrolled(false);
      return undefined;
    }

    const updateScrollState = () => setScrolled(window.scrollY > 64);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, [view]);

  if (view === 'prayers') {
    return (
      <header className="app-header app-header-home">
        <div className="brand-row">
          <button
            type="button"
            className="icon-button theme-button"
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? t(language, 'settings.light') : t(language, 'settings.dark')}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? <SunIcon size={23} /> : <MoonIcon size={23} />}
          </button>
          <div className="header-brand-lockup" aria-label="Lamaz Xan — Your prayer, your strength">
            <BrandLogo variant="mark" className="header-brand-mark" theme={theme} />
            <span className="header-brand-copy">
              <strong>Lamaz Xan</strong>
              <small>Your prayer, your strength</small>
            </span>
          </div>
          <button
            type="button"
            className="icon-button settings-button"
            onClick={onSettings}
            aria-label={t(language, 'aria.settings')}
          >
            <GearIcon size={28} />
          </button>
        </div>

        <div className="date-display" aria-label={t(language, 'aria.date')}>
          <div className="date-headline">{dates.headline}</div>
          <div className="date-hijri-line">
            <span className="date-ornament date-ornament-left" aria-hidden="true" />
            <span className="date-hijri">{dates.hijri}</span>
            <span className="date-ornament date-ornament-right" aria-hidden="true" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header app-header-section">
      <div className="section-back-slot">
        <button
          type="button"
          className={`icon-button section-back-button ${scrolled ? 'is-floating' : ''}`}
          onClick={onHome}
          aria-label={view === 'sections' ? t(language, 'tab.prayers') : t(language, 'sections.title')}
        >
          <BackIcon size={25} />
        </button>
      </div>

      <div className="section-brand">
        <BrandLogo variant="mark" className="section-brand-mark" theme={theme} />
        <div className="section-brand-copy">
          <span>Lamaz Xan</span>
          <strong>{t(language, titleKeys[view] || 'tab.prayers')}</strong>
        </div>
      </div>

      <span className="section-header-spacer" aria-hidden="true" />
    </header>
  );
}
