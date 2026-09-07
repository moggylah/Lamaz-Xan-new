import { useRef, useState } from 'react';
import { LearnIcon } from './Icons.jsx';

const alphabet = [['ا','Алиф'],['ب','Ба'],['ت','Та'],['ث','Са'],['ج','Джим'],['ح','Ха'],['خ','Хо'],['د','Даль'],['ذ','Заль'],['ر','Ра'],['ز','Зай'],['س','Син'],['ش','Шин'],['ص','Сад'],['ض','Дад'],['ط','Та'],['ظ','За'],['ع','Айн'],['غ','Гайн'],['ف','Фа'],['ق','Каф'],['ك','Кяф'],['ل','Лям'],['م','Мим'],['ن','Нун'],['ه','Ха'],['و','Уау'],['ي','Йа']];
const letterTimings = [[0.24,0.87],[1.70,2.47],[3.22,3.97],[4.96,5.67],[6.56,7.47],[8.20,9.15],[9.82,10.75],[11.60,12.43],[13.16,14.11],[15.10,16.05],[17.06,18.01],[18.60,19.71],[20.28,21.35],[22.06,23.03],[23.90,24.83],[25.80,26.57],[27.34,28.39],[29.12,30.09],[30.88,31.87],[32.58,33.59],[34.60,35.51],[36.20,37.07],[37.82,38.77],[39.42,40.45],[41.18,42.15],[42.96,43.89],[44.74,45.73],[46.50,47.31]];
const lessons = [['Арабский алфавит','28 букв · произношение',true],['Огласовки','Фатха, касра и дамма'],['Соединение букв','Начало, середина и конец слова'],['Сукун','Буква без гласного звука'],['Танвин','Двойные огласовки'],['Долгие гласные','Алиф, уау и йа'],['Шадда','Удвоение согласных'],['Читаем слова','Первые короткие слова'],['Правила остановки','Как правильно завершать чтение'],['Первые аяты','Переход к чтению Корана']];

const harakat = [
  { key: 'fatha', mark: 'َ', name: 'Фатха', sound: 'а', position: 'Ставится над буквой', examples: ['بَ','تَ','نَ','مَ'] },
  { key: 'kasra', mark: 'ِ', name: 'Касра', sound: 'и', position: 'Ставится под буквой', examples: ['بِ','تِ','نِ','مِ'] },
  { key: 'damma', mark: 'ُ', name: 'Дамма', sound: 'у', position: 'Ставится над буквой', examples: ['بُ','تُ','نُ','مُ'] },
];

function HarakatLesson({ onBack }) {
  const [selected, setSelected] = useState(0);
  const item = harakat[selected];
  return <section className="harakat-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>К программе курса</span></button>
    <header className="quran-lesson-heading"><div><span>Урок 2</span><h2>Огласовки</h2></div><strong>3 знака</strong></header>
    <p className="harakat-intro">Огласовка добавляет к букве короткий гласный звук. Сама буква остаётся той же.</p>
    <div className="harakat-tabs" role="tablist" aria-label="Огласовки">{harakat.map((value, index) => <button type="button" role="tab" aria-selected={selected === index} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} key={value.key}><span>{value.mark}</span><strong>{value.name}</strong></button>)}</div>
    <div className="harakat-focus-card">
      <div className="harakat-symbol" aria-hidden="true"><span>ب</span><b>{item.mark}</b></div>
      <div className="harakat-focus-copy"><span>{item.name}</span><h3>Короткий звук «{item.sound}»</h3><p>{item.position}. Произносится коротко, без растягивания.</p></div>
    </div>
    <div className="harakat-position"><span className={'harakat-position-mark ' + item.key}>{item.mark}</span><div><strong>{item.position}</strong><small>{item.key === 'kasra' ? 'Обратите внимание: знак находится снизу.' : 'Знак находится сверху, но имеет свою форму.'}</small></div></div>
    <div className="harakat-examples"><div><h3>Попробуйте прочитать</h3><span>Нажимайте на примеры по порядку</span></div><div className="harakat-example-grid" dir="rtl">{item.examples.map((example, index) => <button type="button" key={example}><span>{example}</span><small dir="ltr">{['б','т','н','м'][index] + item.sound}</small></button>)}</div></div>
    <div className="harakat-rule"><strong>Запомните</strong><div><span>ـَ</span> = а</div><div><span>ـِ</span> = и</div><div><span>ـُ</span> = у</div></div>
    <aside className="harakat-audio-note">Для этого урока подбирается отдельная запись преподавателя: звук будет запускаться нажатием на каждый пример.</aside>
  </section>;
}

export default function QuranLearningView() {
  const audioRef = useRef(null);
  const [level, setLevel] = useState('beginner');
  const [activeLesson, setActiveLesson] = useState(1);
  const [activeLetter, setActiveLetter] = useState(null);
  function playLetter(index) {
    const audio = audioRef.current;
    if (!audio) return;
    const [start] = letterTimings[index];
    const begin = () => { audio.currentTime = start; setActiveLetter(index); audio.play().catch(() => setActiveLetter(null)); };
    if (audio.readyState >= 1) begin(); else audio.addEventListener('loadedmetadata', begin, { once: true });
  }
  function trackLetter() {
    const audio = audioRef.current;
    if (activeLetter === null || !audio) return;
       if (audio.currentTime >= letterTimings[activeLetter][1]) { audio.pause(); setActiveLetter(null); }
  }
  return (
    <section className="quran-learning-screen">
      <div className="quran-course-hero"><div className="quran-course-hero-icon"><LearnIcon size={32} /></div><div><span className="quran-course-kicker">Пошаговый курс</span><h1>Учимся читать Коран</h1><p>От первой буквы до самостоятельного чтения — спокойно и последовательно.</p></div></div>
      <div className="quran-level-switch" role="tablist" aria-label="Уровень обучения">
        <button type="button" className={level === 'beginner' ? 'active' : ''} onClick={() => setLevel('beginner')} role="tab" aria-selected={level === 'beginner'}><strong>Начинающий</strong><span>С самого начала</span></button>
        <button type="button" className={level === 'advanced' ? 'active' : ''} onClick={() => setLevel('advanced')} role="tab" aria-selected={level === 'advanced'}><strong>Продвинутый</strong><span>Таджвид · скоро</span></button>
      </div>
      {level === 'advanced' ? <div className="quran-coming-card"><span className="quran-coming-mark">ق</span><h2>Продвинутый курс готовится</h2><p>Здесь появятся махраджи, свойства букв и правила таджвида с проверенными аудиопримерами.</p><button type="button" onClick={() => setLevel('beginner')}>Начать с основ</button></div> : activeLesson === 2 ? <HarakatLesson onBack={() => setActiveLesson(1)} /> : <>
        <section className="quran-active-lesson">
          <header className="quran-lesson-heading"><div><span>Урок 1</span><h2>Арабский алфавит</h2></div><strong>28 букв</strong></header>
          <audio ref={audioRef} src="/audio/quran/arabic-alphabet.ogg" preload="auto" onTimeUpdate={trackLetter} onEnded={() => setActiveLetter(null)} />
          <p className="quran-lesson-tip quran-letter-audio-tip"><span><strong>Нажмите на букву, чтобы услышать её</strong>Повторное нажатие воспроизведёт звук ещё раз.</span></p>
          <div className="quran-alphabet-grid" dir="rtl">{alphabet.map(([letter, name], index) => <button type="button" className={activeLetter === index ? 'is-playing' : ''} key={letter + name} onClick={() => playLetter(index)} aria-label={name + '. Прослушать произношение'}><span className="quran-letter">{letter}</span><span className="quran-letter-name" dir="ltr">{activeLetter === index ? 'Слушайте…' : name}</span></button>)}</div>
          <aside className="quran-audio-source"><strong>Источник аудио</strong><span>Произношение: Ibraheem alex · Wikimedia Commons</span><a href="https://commons.wikimedia.org/wiki/File:%D8%AD%D8%B1%D9%88%D9%81_%D8%A7%D9%84%D8%A3%D8%A8%D8%AC%D8%AF%D9%8A%D8%A9_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9_Arabic_alphabet.ogg" target="_blank" rel="noreferrer">GFDL 1.2+ · открыть оригинал</a></aside>
        </section>
        <div className="quran-course-list"><div className="quran-list-title"><h2>Программа курса</h2><span>10 уроков</span></div>{lessons.map(([title, hint], index) => { const available = index < 2; return <button type="button" disabled={!available} onClick={() => available && setActiveLesson(index + 1)} className={'quran-course-row ' + (available ? 'available' : '')} key={title}><span className="quran-course-number">{index + 1}</span><span className="quran-course-copy"><strong>{title}</strong><span>{hint}</span></span><span className="quran-course-state">{index === 0 ? 'Открыт' : index === 1 ? 'Начать' : 'Скоро'}</span></button>; })}</div>
      </>}
    </section>
  );
}
