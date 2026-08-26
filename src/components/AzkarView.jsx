import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon } from './Icons.jsx';
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
  { key: 'morning', titleKey: 'azkar.morning', hintKey: 'azkar.morningHint' },
  { key: 'evening', titleKey: 'azkar.evening', hintKey: 'azkar.eveningHint' },
  { key: 'afterPrayer', titleKey: 'azkar.afterPrayer', hintKey: 'azkar.afterPrayerHint' },
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
  const [remaining, setRemaining] = useState(readCounters);
  const [currentIndex, setCurrentIndex] = useState(() => firstIncompleteIndex('morning', AZKAR.morning, readCounters()));
  const [transcriptionOpen, setTranscriptionOpen] = useState(true);
  const [translationOpen, setTranslationOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, [category, currentIndex]);

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

  if (!currentItem) return null;

  const count = getRemaining(currentItem);
  const complete = count === 0;
  const itemProgress = currentItem.repetitions > 0
    ? Math.round(((currentItem.repetitions - count) / currentItem.repetitions) * 100)
    : 100;

  return (
    <section className="azkar-screen">
      <div className="azkar-category-tabs" role="tablist" aria-label={t(language, 'azkar.title')}>
        {categories.map((item) => (
          <button
            key={item.key}
            type="button"
            className={category === item.key ? 'active' : ''}
            onClick={() => changeCategory(item.key)}
            role="tab"
            aria-selected={category === item.key}
          >
            {t(language, item.titleKey)}
          </button>
        ))}
      </div>

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

      <nav className="azkar-reader-nav" aria-label={t(language, 'azkar.title')}>
        <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>‹ {t(language, 'azkar.previous')}</button>
        <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === items.length - 1}>{t(language, 'azkar.next')} ›</button>
      </nav>
      {counterEnabled && <p className="azkar-completed-total">{t(language, 'azkar.progress', { done: completedCount, total: items.length })}</p>}
    </section>
  );
}
