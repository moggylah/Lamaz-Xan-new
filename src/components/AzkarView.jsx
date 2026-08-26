import { useEffect, useMemo, useRef, useState } from 'react';
import { BackIcon, CheckIcon, ChevronIcon, DhikrIcon, SunriseIcon, SunsetIcon } from './Icons.jsx';
import { AZKAR, getAzkarMeaning, getAzkarName } from '../lib/azkar.js';
import { triggerHaptic } from '../lib/haptics.js';
import { t } from '../lib/i18n.js';

const SUMMARY_IDS = new Set(['sayyid-istighfar', 'afiyah', 'ghayb', 'hayyu-qayyum', 'morning-kingdom', 'morning-life', 'fitrah', 'evening-kingdom', 'evening-life', 'baqarah-last', 'after-full-dhikr', 'after-tahlil', 'ayat-kursi']);

const SCRIPTURE_KEYS = {
  ikhlas: 'azkar.surahIkhlas',
  falaq: 'azkar.surahFalaq',
  nas: 'azkar.surahNas',
  'baqarah-last': 'azkar.baqarahLast',
  'ayat-kursi': 'azkar.ayatKursi',
};

function getBaseId(id = '') { return id.replace(/^after-/, ''); }

const categories = [
  { key: 'morning', titleKey: 'azkar.morning', hintKey: 'azkar.morningHint', Icon: SunriseIcon },
  { key: 'evening', titleKey: 'azkar.evening', hintKey: 'azkar.eveningHint', Icon: SunsetIcon },
  { key: 'afterPrayer', titleKey: 'azkar.afterPrayer', hintKey: 'azkar.afterPrayerHint', Icon: DhikrIcon },
];

function makeCounterKey(category, item) {
  return `${category}:${item.id}`;
}

function readCounters() {
  try {
    return JSON.parse(localStorage.getItem('lamaz-azkar-counters') || '{}');
  } catch {
    return {};
  }
}

function firstIncompleteIndex(category, items, remaining) {
  const index = items.findIndex((item) => (remaining[makeCounterKey(category, item)] ?? item.repetitions) > 0);
  return index >= 0 ? index : 0;
}

export default function AzkarView({ language = 'ru', hapticsEnabled = true, counterEnabled = true }) {
  const [category, setCategory] = useState('morning');
  const [readerOpen, setReaderOpen] = useState(false);
  const [remaining, setRemaining] = useState(readCounters);
  const [currentIndex, setCurrentIndex] = useState(() => firstIncompleteIndex('morning', AZKAR.morning, readCounters()));
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const touchStartRef = useRef(null);
  const advanceTimer = useRef(null);
  const scrollAreaRef = useRef(null);

  const items = AZKAR[category] || [];
  const selectedCategory = categories.find((item) => item.key === category) || categories[0];
  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    try {
      localStorage.setItem('lamaz-azkar-counters', JSON.stringify(remaining));
    } catch {
      return undefined;
    }
  }, [remaining]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setTranscriptionOpen(false);
    setTranslationOpen(false);

    if (!readerOpen) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.querySelector('.azkar-reader-header')?.scrollIntoView({ block: 'start' });

      let hintSeen = false;
      try {
        hintSeen = localStorage.getItem('lamaz-azkar-scroll-hint-seen') === 'true';
      } catch {
        hintSeen = false;
      }

      const content = scrollAreaRef.current;
      const isLong = content && content.scrollHeight > window.innerHeight * 0.62;
      setShowScrollHint(!hintSeen && Boolean(isLong));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [category, currentIndex, readerOpen]);

  useEffect(() => {
    if (!showScrollHint) return undefined;

    const dismissHint = () => {
      setShowScrollHint(false);
      try {
        localStorage.setItem('lamaz-azkar-scroll-hint-seen', 'true');
      } catch {
        return;
      }
    };

    window.addEventListener('scroll', dismissHint, { passive: true, once: true });
    window.addEventListener('touchmove', dismissHint, { passive: true, once: true });
    return () => {
      window.removeEventListener('scroll', dismissHint);
      window.removeEventListener('touchmove', dismissHint);
    };
  }, [showScrollHint]);

  const completedCount = useMemo(
    () => items.filter((item) => remaining[makeCounterKey(category, item)] === 0).length,
    [category, items, remaining],
  );

  function getRemaining(item) {
    const key = makeCounterKey(category, item);
    return remaining[key] ?? item.repetitions;
  }

  function goTo(index) {
    window.clearTimeout(advanceTimer.current);
    if (!items.length) return;
    setCurrentIndex(Math.max(0, Math.min(index, items.length - 1)));
  }

  function changeCategory(nextCategory) {
    window.clearTimeout(advanceTimer.current);
    const nextItems = AZKAR[nextCategory] || [];
    setCategory(nextCategory);
    setCurrentIndex(firstIncompleteIndex(nextCategory, nextItems, remaining));
  }

  function openCategory(nextCategory) {
    changeCategory(nextCategory);
    setReaderOpen(true);
  }

  function decrement(item) {
    if (!item) return;
    const key = makeCounterKey(category, item);
    const value = getRemaining(item);
    if (value <= 0) return;

    const nextValue = Math.max(0, value - 1);
    setRemaining((current) => ({ ...current, [key]: nextValue }));
    triggerHaptic(nextValue === 0 ? [22, 45, 34] : 18, hapticsEnabled);

  }

  function resetItem(item) {
    if (!item) return;
    const key = makeCounterKey(category, item);
    setRemaining((current) => ({ ...current, [key]: item.repetitions }));
  }

  function resetCategory() {
    if (!window.confirm(t(language, 'azkar.resetConfirm'))) return;
    setRemaining((current) => {
      const next = { ...current };
      for (const item of items) next[makeCounterKey(category, item)] = item.repetitions;
      return next;
    });
    setCurrentIndex(0);
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(currentItem.arabic);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.72;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleTouchStart(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const horizontalDistance = Math.abs(dx);
    const verticalDistance = Math.abs(dy);

    if (horizontalDistance < 48) return;
    if (horizontalDistance <= verticalDistance * 1.2) return;

    if (dx < 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  }

  if (!readerOpen) {
    return (
      <section className="azkar-screen azkar-sections-screen">
        <aside className="azkar-time-guide">
          <p>
            Время утренних азкаров начинается с наступлением времени утренней молитвы (фаджр).
            Их можно читать как до совершения молитвы, так и после неё — вплоть до наступления
            зухра (обеденной молитвы).
          </p>
          <p>
            Время вечерних азкаров начинается с наступлением асра (послеполуденной молитвы)
            и продолжается до магриба. Если вы не успели прочитать их до магриба, можно сделать
            это до наступления иши, а если не успели и до иши — до начала последней трети ночи.
          </p>
          <small>А Аллаху известно лучше.</small>
        </aside>

        <div className="azkar-section-list">
          {categories.map(({ key, titleKey, hintKey, Icon }) => {
            const categoryItems = AZKAR[key] || [];
            const done = categoryItems.filter(
              (item) => remaining[makeCounterKey(key, item)] === 0,
            ).length;

            return (
              <button className="azkar-section-card" type="button" key={key} onClick={() => openCategory(key)}>
                <span className={`azkar-section-icon ${key}`}><Icon size={25} /></span>
                <span className="azkar-section-copy">
                  <strong>{t(language, titleKey)}</strong>
                  <small>{t(language, hintKey)}</small>
                  <span>{t(language, 'azkar.itemsCount', { count: categoryItems.length })}{done > 0 ? ` · ${t(language, 'azkar.progress', { done, total: categoryItems.length })}` : ''}</span>
                </span>
                <ChevronIcon size={21} />
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (!currentItem) return null;

  const count = getRemaining(currentItem);
  const complete = count === 0;
  const itemProgress = currentItem.repetitions > 0
    ? Math.round(((currentItem.repetitions - count) / currentItem.repetitions) * 100)
    : 100;

  return (
    <section className="azkar-screen">
      <header className="azkar-reader-header">
        <button type="button" onClick={() => setReaderOpen(false)} aria-label={t(language, 'aria.back')}>
          <BackIcon size={22} />
        </button>
        <div>
          <strong>{t(language, selectedCategory.titleKey)}</strong>
          <span>{t(language, selectedCategory.hintKey)}</span>
        </div>
      </header>

      <div className="azkar-position-card">
        <div className="azkar-position-copy">
          <div>
            <span>{t(language, selectedCategory.hintKey)}</span>
            <strong>{t(language, 'azkar.position', { current: currentIndex + 1, total: items.length })}</strong>
          </div>
          <button type="button" onClick={resetCategory}>{t(language, 'azkar.resetAll')}</button>
        </div>
      </div>

      <div className="azkar-swipe-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <article className={`azkar-slide ${complete ? 'complete' : ''}`} key={`${category}-${currentItem.id}`}>
          <div className="azkar-slide-topline">
            <div>
              <span className="azkar-number">{t(language, 'azkar.dhikrNumber', { number: currentIndex + 1 })}</span>
              <strong className="azkar-item-title">{SCRIPTURE_KEYS[getBaseId(currentItem.id)] ? t(language, SCRIPTURE_KEYS[getBaseId(currentItem.id)]) : getAzkarName(currentItem, language)}</strong>
            </div>
            <span className="azkar-repeat-label">{t(language, 'azkar.times', { count: currentItem.repetitions })}</span>
          </div>

          <div className="azkar-scroll-area" ref={scrollAreaRef}>
            <p className="azkar-arabic azkar-arabic-slide" dir="rtl" lang="ar">{currentItem.arabic}</p>

            <button type="button" className={isSpeaking ? 'azkar-audio-control is-playing' : 'azkar-audio-control'} onClick={toggleSpeech}>
              <span className="azkar-audio-button" aria-hidden="true">{isSpeaking ? '■' : '▶'}</span>
              <span className="azkar-audio-copy">
                <strong>{isSpeaking ? t(language, 'azkar.stopAudio') : t(language, 'azkar.playAudio')}</strong>
                <small>{t(language, 'azkar.audioHint')}</small>
              </span>
              <span className="azkar-audio-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>
            </button>

            <div className="azkar-folds">
              <details className="azkar-fold" open={transcriptionOpen} onToggle={(event) => setTranscriptionOpen(event.currentTarget.open)}>
                <summary>{t(language, 'azkar.transcription')}</summary>
                <div className="azkar-fold-content" dir="ltr">
                  <p>{currentItem.transcription}</p>
                </div>
              </details>

              <details className="azkar-fold azkar-translation-fold" open={translationOpen} onToggle={(event) => setTranslationOpen(event.currentTarget.open)}>
                <summary>{t(language, SUMMARY_IDS.has(getBaseId(currentItem.id)) ? 'azkar.meaningSummary' : 'azkar.translation')}</summary>
                <div className="azkar-fold-content">
                  <p>{getAzkarMeaning(currentItem, language)}</p>
                </div>
              </details>
            </div>

            {currentItem.reference && (
              <div className="azkar-meta azkar-slide-meta">
                <span>{currentItem.reference}</span>
              </div>
            )}
          </div>

          {counterEnabled && (
          <div className="azkar-counter-zone" role="button" tabIndex={complete ? -1 : 0} onClick={() => decrement(currentItem)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); decrement(currentItem); } }}>
            <button
              type="button"
              className={`azkar-counter azkar-counter-large ${complete ? 'done' : ''}`}
              onClick={(event) => { event.stopPropagation(); decrement(currentItem); }}
              disabled={complete}
              aria-label={t(language, 'azkar.counterLabel', { count })}
              style={{ '--counter-progress': `${itemProgress * 3.6}deg` }}
            >
              <span className="azkar-counter-inner">
                {complete ? <CheckIcon size={30} /> : count}
              </span>
            </button>

            <div className="azkar-counter-copy">
              <strong>{complete ? t(language, 'azkar.done') : t(language, 'azkar.remaining', { count })}</strong>
              <span>{complete ? t(language, 'azkar.completedHint') : t(language, 'azkar.tapOptional')}</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); resetItem(currentItem); }}>{t(language, 'azkar.reset')}</button>
            </div>
          </div>
          )}
        </article>

      </div>

      {showScrollHint && (
        <div className="azkar-scroll-hint" role="status">
          <span aria-hidden="true">↑</span>
          {t(language, 'azkar.scrollContinue')}
        </div>
      )}

      <nav className="azkar-reader-nav" aria-label={t(language, 'azkar.title')}>
        <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>‹ {t(language, 'azkar.previous')}</button>
        <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === items.length - 1}>{t(language, 'azkar.next')} ›</button>
      </nav>
      {counterEnabled && <p className="azkar-completed-total">{t(language, 'azkar.progress', { done: completedCount, total: items.length })}</p>}
    </section>
  );
}
