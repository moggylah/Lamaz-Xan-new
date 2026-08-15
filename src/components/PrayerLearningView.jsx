import { useMemo, useState } from 'react';
import { BackIcon, CheckIcon, ChevronIcon } from './Icons.jsx';
import {
  LEARNING_DISCLAIMER,
  adultSteps,
  adultTopics,
  commonMistakes,
  kidsQuiz as kidsQuizQuestions,
  kidsSteps,
  preparationItems,
  readings,
  shortSurahs,
} from '../lib/prayerLessons.js';

const STORAGE_KEY = 'lamaz-learning-completed';

function readCompleted() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function LearningIcon({ type }) {
  if (type === 'kids') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M12 39c1.5-10 6.1-15 12-15s10.5 5 12 15M17 28l-4 7M31 28l4 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M19.5 8.5c2.5-4 7.2-4 9.4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="13.5" r="6.5" stroke="currentColor" strokeWidth="2.2"/>
      <path d="M13 40c1.3-11.6 5.3-18.5 11-18.5S33.7 28.4 35 40M18 25l6 7 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 32v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

function TopicIcon({ kind }) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    prep: (
      <>
        <path d="M12 3.5C9.4 7 7.2 9.5 7.2 13a4.8 4.8 0 0 0 9.6 0C16.8 9.5 14.6 7 12 3.5Z" {...common} />
        <path d="m10 13.2 1.4 1.4 2.9-3" {...common} />
      </>
    ),
    pillars: (
      <>
        <path d="M4 7h16M6 7v11M10 7v11M14 7v11M18 7v11M4 18h16" {...common} />
        <path d="M5.5 4.5h13L20 7H4l1.5-2.5Z" {...common} />
      </>
    ),
    steps: (
      <>
        <path d="M5 18h4v-4h4v-4h4V6h3" {...common} />
        <path d="m17.5 3.5 2.5 2.5-2.5 2.5" {...common} />
      </>
    ),
    read: (
      <>
        <path d="M4.5 5.5c3.4-.8 5.8-.2 7.5 1.5 1.7-1.7 4.1-2.3 7.5-1.5v13c-3.4-.8-5.8-.2-7.5 1.5-1.7-1.7-4.1-2.3-7.5-1.5v-13Z" {...common} />
        <path d="M12 7v13" {...common} />
      </>
    ),
    surahs: (
      <>
        <path d="M6 4.5h10.5A1.5 1.5 0 0 1 18 6v13H7.5A1.5 1.5 0 0 1 6 17.5v-13Z" {...common} />
        <path d="M9 8h6M9 11h5M8 19V6" {...common} />
        <path d="m15.7 14 .45.9 1 .15-.72.7.17 1-.9-.47-.9.47.17-1-.72-.7 1-.15.45-.9Z" {...common} />
      </>
    ),
    mistakes: (
      <>
        <path d="M12 4 21 20H3L12 4Z" {...common} />
        <path d="M12 9v5M12 17.3h.01" {...common} />
      </>
    ),
    people: (
      <>
        <circle cx="8.2" cy="8" r="2.6" {...common} />
        <circle cx="16.4" cy="8.5" r="2.3" {...common} />
        <path d="M3.8 19v-2.2c0-3 1.8-5 4.4-5s4.4 2 4.4 5V19M13.2 19v-2c0-2.4 1.3-4.1 3.4-4.1 2.2 0 3.6 1.7 3.6 4.1v2" {...common} />
      </>
    ),
    travel: (
      <>
        <rect x="5" y="8" width="14" height="11" rx="2" {...common} />
        <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M5 12h14M9 12v2M15 12v2" {...common} />
      </>
    ),
    sahw: (
      <>
        <path d="M18.5 7.5A7.5 7.5 0 1 0 19 16" {...common} />
        <path d="M18.5 3.8v3.7h-3.7" {...common} />
        <path d="M8.2 14.5c1.1-2 2.3-3 3.8-3s2.7 1 3.8 3M9.2 16.5h5.6" {...common} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[kind] || icons.steps}
    </svg>
  );
}

function SectionBack({ onClick, label = 'Назад' }) {
  return (
    <button type="button" className="learning-inline-back" onClick={onClick}>
      <BackIcon size={20} />
      <span>{label}</span>
    </button>
  );
}

function Details({ item }) {
  const [open, setOpen] = useState(false);
  const hasMore = item.detail || item.arabic || item.source;
  if (!hasMore) return null;

  return (
    <div className={`learning-details ${open ? 'is-open' : ''}`}>
      <button type="button" className="learning-details-toggle" onClick={() => setOpen((value) => !value)}>
        <span>{open ? 'Скрыть подробности' : 'Подробнее'}</span>
        <ChevronIcon size={18} />
      </button>
      {open && (
        <div className="learning-details-body">
          {item.detail && <p>{item.detail}</p>}
          {item.arabic && (
            <div className="learning-recitation-block">
              <div className="learning-arabic" dir="rtl">{item.arabic}</div>
              {item.transliteration && <div className="learning-transcription">{item.transliteration}</div>}
              {item.translation && <div className="learning-translation">{item.translation}</div>}
            </div>
          )}
          {item.source && <p className="learning-proof"><strong>Довод:</strong> {item.source}</p>}
        </div>
      )}
    </div>
  );
}

function StepLesson({ title, steps, onBack, onComplete, kids = false }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;


  function changeStep(nextIndex) {
    const scrollY = window.scrollY;
    setIndex(Math.max(0, Math.min(steps.length - 1, nextIndex)));
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
    });
  }

  function next() {
    if (isLast) {
      onComplete?.();
      onBack();
      return;
    }
    changeStep(index + 1);
  }

  return (
    <div className={`learning-lesson ${kids ? 'kids-lesson' : ''}`}>
      <SectionBack onClick={onBack} />
      <div className="learning-lesson-head">
        <span>Шаг {index + 1} из {steps.length}</span>
        <div className="learning-progress-track"><span style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
      </div>

      <article className="learning-step-card">
        <div className="learning-step-visual">
          <img src={step.image} alt="" draggable="false" />
        </div>
        <div className="learning-step-copy">
          <span className="learning-eyebrow">{title}</span>
          <h2>{step.title}</h2>
          <p>{step.short || step.text}</p>
          {!kids && <Details key={step.id} item={step} />}
        </div>
      </article>

      <div className="learning-step-actions">
        <button type="button" className="learning-secondary-button" onClick={() => changeStep(index - 1)} disabled={index === 0}>Назад</button>
        <button type="button" className="learning-primary-button" onClick={next}>{isLast ? 'Завершить' : 'Дальше'}</button>
      </div>
    </div>
  );
}

function Preparation({ onBack, onComplete, kids = false }) {
  const [checked, setChecked] = useState([]);
  const allDone = checked.length === preparationItems.length;

  function toggle(index) {
    setChecked((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
  }

  return (
    <div className="learning-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-page-heading">
        <span className="learning-kicker">{kids ? 'Перед намазом' : 'Условия перед намазом'}</span>
        <h2>Подготовка к намазу</h2>
        <p>{kids ? 'Проверь пять вещей перед тем, как начать.' : 'Перед такбиром убедитесь, что основные условия молитвы выполнены.'}</p>
      </div>

      <div className="learning-checklist">
        {preparationItems.map((item, index) => (
          <button key={item.title} type="button" className={`learning-check-item ${checked.includes(index) ? 'is-checked' : ''}`} onClick={() => toggle(index)}>
            <span className="learning-check-circle">{checked.includes(index) && <CheckIcon size={18} />}</span>
            <span><strong>{item.title}</strong><small>{kids ? item.text.split('.')[0] + '.' : item.text}</small></span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="learning-primary-button learning-wide-button"
        disabled={!allDone}
        onClick={() => { onComplete?.(); onBack(); }}
      >
        {allDone ? 'Готово' : `Отметь всё: ${checked.length}/${preparationItems.length}`}
      </button>
    </div>
  );
}

function ReadingCards({ onBack, surahs = false }) {
  const items = surahs ? shortSurahs : readings;
  return (
    <div className="learning-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-page-heading">
        <span className="learning-kicker">{surahs ? 'Коран' : 'Что читать'}</span>
        <h2>{surahs ? 'Короткие суры' : 'Основные слова намаза'}</h2>
        <p>{surahs ? 'Суры, которые удобно выучить для чтения после «Аль-Фатихи».' : 'Арабский текст, транскрипция и смысл основных формул.'}</p>
      </div>

      <div className="learning-reading-list">
        {items.map((item) => (
          <details className="learning-reading-card" key={item.title}>
            <summary><span>{item.title}</span><ChevronIcon size={19} /></summary>
            <div className="learning-reading-body">
              <div className="learning-arabic" dir="rtl">{item.arabic}</div>
              <div className="learning-transcription">{item.transliteration}</div>
              <div className="learning-translation">{item.translation}</div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function StaticTopic({ topic, onBack }) {
  return (
    <div className="learning-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-page-heading">
        <span className="learning-kicker">Обучение намазу</span>
        <h2>{topic.title}</h2>
        <p>{topic.intro}</p>
      </div>
      <div className="learning-note-card">
        {topic.bullets.map((bullet) => <p key={bullet}>{bullet}</p>)}
        {topic.source && <p className="learning-proof"><strong>Основа:</strong> {topic.source}</p>}
      </div>
    </div>
  );
}

function Mistakes({ onBack }) {
  return (
    <div className="learning-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-page-heading">
        <span className="learning-kicker">Проверка намаза</span>
        <h2>Частые ошибки</h2>
        <p>Не список для осуждения, а напоминание о том, что стоит проверить в своём намазе.</p>
      </div>
      <div className="learning-mistakes-list">
        {commonMistakes.map((item, index) => (
          <div className="learning-mistake" key={item}>
            <span>{index + 1}</span><p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KidsIntro({ onBack, onComplete }) {
  return (
    <div className="learning-simple-page kids-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-hero-illustration"><img src="/learning/qiyam.svg" alt="" /></div>
      <div className="learning-page-heading center">
        <span className="learning-kicker">Для детей</span>
        <h2>Что такое намаз?</h2>
        <p>Намаз — это поклонение Аллаху, которое мусульманин совершает каждый день в установленное время.</p>
      </div>
      <div className="kids-fact-grid">
        <div><strong>5</strong><span>обязательных намазов в сутки</span></div>
        <div><strong>🧭</strong><span>мы поворачиваемся к кибле</span></div>
        <div><strong>🤲</strong><span>читаем Коран и поминаем Аллаха</span></div>
      </div>
      <button type="button" className="learning-primary-button learning-wide-button" onClick={() => { onComplete?.(); onBack(); }}>Я понял</button>
    </div>
  );
}

function KidsQuiz({ onBack, onComplete }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = kidsQuizQuestions[index];

  function choose(optionIndex) {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === question.answer) setScore((value) => value + 1);
  }

  function next() {
    if (index === kidsQuizQuestions.length - 1) {
      setFinished(true);
      onComplete?.();
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  }

  if (finished) {
    return (
      <div className="learning-simple-page kids-simple-page">
        <SectionBack onClick={onBack} />
        <div className="quiz-result-card">
          <div className="quiz-result-mark">✓</div>
          <span>Готово</span>
          <h2>{score} из {kidsQuizQuestions.length}</h2>
          <p>{score === kidsQuizQuestions.length ? 'Отлично! Ты запомнил все основные шаги.' : 'Хорошо! Можно ещё раз посмотреть урок и попробовать снова.'}</p>
          <button type="button" className="learning-primary-button" onClick={onBack}>К урокам</button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-simple-page kids-simple-page">
      <SectionBack onClick={onBack} />
      <div className="learning-lesson-head">
        <span>Вопрос {index + 1} из {kidsQuizQuestions.length}</span>
        <div className="learning-progress-track"><span style={{ width: `${((index + 1) / kidsQuizQuestions.length) * 100}%` }} /></div>
      </div>
      <div className="quiz-card">
        <span className="learning-kicker">Проверь себя</span>
        <h2>{question.question}</h2>
        <div className="quiz-options">
          {question.options.map((option, optionIndex) => {
            const state = selected === null ? '' : optionIndex === question.answer ? 'is-correct' : optionIndex === selected ? 'is-wrong' : '';
            return <button type="button" key={option} className={state} onClick={() => choose(optionIndex)}>{option}</button>;
          })}
        </div>
        {selected !== null && <button type="button" className="learning-primary-button learning-wide-button" onClick={next}>{index === kidsQuizQuestions.length - 1 ? 'Результат' : 'Следующий вопрос'}</button>}
      </div>
    </div>
  );
}

function DashboardCard({ icon, title, text, onClick, done }) {
  return (
    <button type="button" className="learning-dashboard-card" onClick={onClick}>
      <span className="learning-dashboard-icon"><TopicIcon kind={icon} /></span>
      <span className="learning-dashboard-copy"><strong>{title}</strong><small>{text}</small></span>
      {done ? <span className="learning-done"><CheckIcon size={18} /></span> : <ChevronIcon size={20} />}
    </button>
  );
}

export default function PrayerLearningView({ language = 'ru' }) {
  const [screen, setScreen] = useState({ name: 'home' });
  const [completed, setCompleted] = useState(readCompleted);

  const completedSet = useMemo(() => new Set(completed), [completed]);

  function markDone(id) {
    setCompleted((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  function go(name, payload = {}) {
    setScreen({ name, ...payload });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  if (screen.name === 'kids-intro') return <KidsIntro onBack={() => go('kids')} onComplete={() => markDone('kids-intro')} />;
  if (screen.name === 'kids-prep') return <Preparation kids onBack={() => go('kids')} onComplete={() => markDone('kids-prep')} />;
  if (screen.name === 'kids-steps') return <StepLesson kids title="Намаз шаг за шагом" steps={kidsSteps} onBack={() => go('kids')} onComplete={() => markDone('kids-steps')} />;
  if (screen.name === 'kids-reading') return <ReadingCards onBack={() => go('kids')} />;
  if (screen.name === 'kids-quiz') return <KidsQuiz onBack={() => go('kids')} onComplete={() => markDone('kids-quiz')} />;
  if (screen.name === 'adult-prep') return <Preparation onBack={() => go('home')} onComplete={() => markDone('adult-prep')} />;
  if (screen.name === 'adult-steps') return <StepLesson title="2 ракаата по сунне" steps={adultSteps} onBack={() => go('home')} onComplete={() => markDone('adult-steps')} />;
  if (screen.name === 'adult-reading') return <ReadingCards onBack={() => go('home')} />;
  if (screen.name === 'adult-surahs') return <ReadingCards surahs onBack={() => go('home')} />;
  if (screen.name === 'adult-mistakes') return <Mistakes onBack={() => go('home')} />;
  if (screen.name === 'adult-topic') return <StaticTopic topic={adultTopics[screen.topic]} onBack={() => go('home')} />;

  if (screen.name === 'kids') {
    return (
      <section className="learning-screen">
        <SectionBack onClick={() => go('home')} />
        <div className="learning-mode-banner kids-banner">
          <span className="learning-mode-art"><LearningIcon type="kids" /></span>
          <div><span>Простой режим</span><h2>Для детей</h2><p>Короткие объяснения, картинки и маленькая проверка знаний.</p></div>
        </div>
        <div className="learning-dashboard">
          <DashboardCard icon="people" title="Что такое намаз?" text="Коротко и понятно" done={completedSet.has('kids-intro')} onClick={() => go('kids-intro')} />
          <DashboardCard icon="prep" title="Подготовка" text="5 вещей перед намазом" done={completedSet.has('kids-prep')} onClick={() => go('kids-prep')} />
          <DashboardCard icon="steps" title="Намаз шаг за шагом" text={`${kidsSteps.length} простых шагов`} done={completedSet.has('kids-steps')} onClick={() => go('kids-steps')} />
          <DashboardCard icon="read" title="Что читать" text="Арабский, транскрипция, перевод" onClick={() => go('kids-reading')} />
          <DashboardCard icon="quiz" title="Проверь себя" text="Мини-квиз из 5 вопросов" done={completedSet.has('kids-quiz')} onClick={() => go('kids-quiz')} />
        </div>
      </section>
    );
  }

  return (
    <section className="learning-screen learning-home">
      {language !== 'ru' && <div className="learning-language-note">Учебные тексты пока доступны на русском языке.</div>}
      <div className="learning-intro">
        <span className="learning-kicker">Обучение намазу</span>
        <h2>Научись намазу шаг за шагом</h2>
        <p>Пошаговые положения, чтения, правила и дополнительные ситуации — всё в одном разделе.</p>
      </div>

      <div className="learning-dashboard learning-home-dashboard">
        <DashboardCard icon="prep" title="Подготовка к намазу" text="Чистота, одежда, кибла, время" done={completedSet.has('adult-prep')} onClick={() => go('adult-prep')} />
        <DashboardCard icon="pillars" title="Столпы и сунны" text="Что является основой намаза" onClick={() => go('adult-topic', { topic: 'obligations' })} />
        <DashboardCard icon="steps" title="2 ракаата по сунне" text={`${adultSteps.length} шагов с иллюстрациями и объяснениями`} done={completedSet.has('adult-steps')} onClick={() => go('adult-steps')} />
        <DashboardCard icon="read" title="Что читать" text="Арабский, транскрипция, перевод" onClick={() => go('adult-reading')} />
        <DashboardCard icon="surahs" title="Короткие суры" text="Аль-Ихляс, Аль-Фаляк, Ан-Нас" onClick={() => go('adult-surahs')} />
        <DashboardCard icon="mistakes" title="Частые ошибки" text="Что проверить в своём намазе" onClick={() => go('adult-mistakes')} />
        <DashboardCard icon="people" title="Мужчины и женщины" text="Общее и различия в деталях" onClick={() => go('adult-topic', { topic: 'gender' })} />
        <DashboardCard icon="travel" title="Намаз в пути" text="Сокращение и объединение" onClick={() => go('adult-topic', { topic: 'travel' })} />
        <DashboardCard icon="sahw" title="Суджуд ас-саху" text="Если забыл или ошибся" onClick={() => go('adult-topic', { topic: 'sahw' })} />
      </div>

      <div className="learning-sunnah-note">
        <span>Сунна</span>
        <p>{LEARNING_DISCLAIMER}</p>
      </div>

      <div className="learning-reference-note">
        <strong>Основа урока</strong>
        <p>Порядок молитвы собран вокруг хадиса «молитесь так, как видели меня молящимся» и достоверных сообщений о такбире, руку‘, суджуде и ташаххуде.</p>
        <small>Сахих аль-Бухари 631, 735; Сахих Муслим 397, 390, 402; Сунан Аби Дауд 730.</small>
      </div>
    </section>
  );
}
