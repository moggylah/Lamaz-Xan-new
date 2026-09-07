import { useEffect, useRef, useState } from 'react';
import { CheckIcon, LearnIcon } from './Icons.jsx';

const alphabet = [['ا','Алиф'],['ب','Ба'],['ت','Та'],['ث','Са'],['ج','Джим'],['ح','Ха'],['خ','Хо'],['د','Даль'],['ذ','Заль'],['ر','Ра'],['ز','Зай'],['س','Син'],['ش','Шин'],['ص','Сад'],['ض','Дад'],['ط','Та'],['ظ','За'],['ع','Айн'],['غ','Гайн'],['ف','Фа'],['ق','Каф'],['ك','Кяф'],['ل','Лям'],['م','Мим'],['ن','Нун'],['ه','Ха'],['و','Уау'],['ي','Йа']];
const lessons = [['Арабский алфавит','28 букв · произношение',true],['Огласовки','Фатха, касра и дамма'],['Соединение букв','Начало, середина и конец слова'],['Сукун','Буква без гласного звука'],['Танвин','Двойные огласовки'],['Долгие гласные','Алиф, уау и йа'],['Шадда','Удвоение согласных'],['Читаем слова','Первые короткие слова'],['Правила остановки','Как правильно завершать чтение'],['Первые аяты','Переход к чтению Корана']];

export default function QuranLearningView() {
  const audioRef = useRef(null);
  const [level, setLevel] = useState('beginner');
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('lamaz-quran-letters') || '[]')); } catch { return new Set(); } });
  useEffect(() => { localStorage.setItem('lamaz-quran-letters', JSON.stringify([...heard])); }, [heard]);
  function toggleLetter(index) { setHeard((current) => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; }); }
  function toggleAudio() { const audio = audioRef.current; if (!audio) return; if (audio.paused) audio.play().catch(() => setPlaying(false)); else audio.pause(); }
  const progress = Math.round((heard.size / alphabet.length) * 100);
  return (
    <section className="quran-learning-screen">
      <div className="quran-course-hero"><div className="quran-course-hero-icon"><LearnIcon size={32} /></div><div><span className="quran-course-kicker">Пошаговый курс</span><h1>Учимся читать Коран</h1><p>От первой буквы до самостоятельного чтения — спокойно и последовательно.</p></div></div>
      <div className="quran-level-switch" role="tablist" aria-label="Уровень обучения">
        <button type="button" className={level === 'beginner' ? 'active' : ''} onClick={() => setLevel('beginner')} role="tab" aria-selected={level === 'beginner'}><strong>Начинающий</strong><span>С самого начала</span></button>
        <button type="button" className={level === 'advanced' ? 'active' : ''} onClick={() => setLevel('advanced')} role="tab" aria-selected={level === 'advanced'}><strong>Продвинутый</strong><span>Таджвид · скоро</span></button>
      </div>
      {level === 'advanced' ? <div className="quran-coming-card"><span className="quran-coming-mark">ق</span><h2>Продвинутый курс готовится</h2><p>Здесь появятся махраджи, свойства букв и правила таджвида с проверенными аудиопримерами.</p><button type="button" onClick={() => setLevel('beginner')}>Начать с основ</button></div> : <>
        <section className="quran-active-lesson">
          <header className="quran-lesson-heading"><div><span>Урок 1</span><h2>Арабский алфавит</h2></div><strong>{heard.size} / {alphabet.length}</strong></header>
          <div className="quran-progress" aria-label={'Прогресс: ' + progress + '%'}><span style={{ width: progress + '%' }} /></div>
          <div className="quran-audio-card"><button type="button" className={'quran-audio-button ' + (playing ? 'is-playing' : '')} onClick={toggleAudio} aria-label={playing ? 'Пауза' : 'Воспроизвести алфавит'}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span></button><div><strong>{playing ? 'Алфавит воспроизводится' : 'Послушать весь алфавит'}</strong><span>50 секунд · можно ставить на паузу</span></div><audio ref={audioRef} src="/audio/quran/arabic-alphabet.ogg" preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></div>
          <p className="quran-lesson-tip">Сначала прослушайте запись целиком. Затем отмечайте буквы, которые уже узнаёте. Отметка не обязательна.</p>
          <div className="quran-alphabet-grid" dir="rtl">{alphabet.map(([letter, name], index) => { const done = heard.has(index); return <button type="button" className={done ? 'is-heard' : ''} key={letter + name} onClick={() => toggleLetter(index)} aria-pressed={done}><span className="quran-letter">{letter}</span><span className="quran-letter-name" dir="ltr">{name}</span>{done && <span className="quran-letter-check"><CheckIcon size={15}/></span>}</button>; })}</div>
          <aside className="quran-audio-source"><strong>Источник аудио</strong><span>Произношение: Ibraheem alex · Wikimedia Commons</span><a href="https://commons.wikimedia.org/wiki/File:%D8%AD%D8%B1%D9%88%D9%81_%D8%A7%D9%84%D8%A3%D8%A8%D8%AC%D8%AF%D9%8A%D8%A9_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9_Arabic_alphabet.ogg" target="_blank" rel="noreferrer">GFDL 1.2+ · открыть оригинал</a></aside>
        </section>
        <div className="quran-course-list"><div className="quran-list-title"><h2>Программа курса</h2><span>10 уроков</span></div>{lessons.map(([title, hint, active], index) => <div className={'quran-course-row ' + (active ? 'active' : '')} key={title}><span className="quran-course-number">{active && heard.size === alphabet.length ? <CheckIcon size={18}/> : index + 1}</span><div><strong>{title}</strong><span>{hint}</span></div><span className="quran-course-state">{active ? 'Сейчас' : 'Скоро'}</span></div>)}</div>
      </>}
    </section>
  );
}
