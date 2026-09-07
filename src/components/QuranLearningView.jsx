import { useRef, useState } from 'react';
import { LearnIcon } from './Icons.jsx';

const alphabet = [['ا','Алиф'],['ب','Ба'],['ت','Та'],['ث','Са'],['ج','Джим'],['ح','Ха'],['خ','Хо'],['د','Даль'],['ذ','Заль'],['ر','Ра'],['ز','Зай'],['س','Син'],['ش','Шин'],['ص','Сад'],['ض','Дад'],['ط','Та'],['ظ','За'],['ع','Айн'],['غ','Гайн'],['ف','Фа'],['ق','Каф'],['ك','Кяф'],['ل','Лям'],['م','Мим'],['ن','Нун'],['ه','Ха'],['و','Уау'],['ي','Йа']];
const letterTimings = [[0.24,0.87],[1.70,2.47],[3.22,3.97],[4.96,5.67],[6.56,7.47],[8.20,9.15],[9.82,10.75],[11.60,12.43],[13.16,14.11],[15.10,16.05],[17.06,18.01],[18.60,19.71],[20.28,21.35],[22.06,23.03],[23.90,24.83],[25.80,26.57],[27.34,28.39],[29.12,30.09],[30.88,31.87],[32.58,33.59],[34.60,35.51],[36.20,37.07],[37.82,38.77],[39.42,40.45],[41.18,42.15],[42.96,43.89],[44.74,45.73],[46.50,47.31]];
const lessons = [['Арабский алфавит','28 букв · произношение',true],['Огласовки','Фатха, касра и дамма'],['Соединение букв','Начало, середина и конец слова'],['Сукун','Буква без гласного звука'],['Танвин','Двойные огласовки'],['Долгие гласные','Алиф, уау и йа'],['Шадда','Удвоение согласных'],['Читаем слова','Первые короткие слова'],['Правила остановки','Как правильно завершать чтение'],['Первые аяты','Переход к чтению Корана']];

const courseLessonData = {
  3: { title: 'Соединение букв', badge: 'Формы букв', intro: 'Большинство арабских букв меняют форму в зависимости от места в слове.', rule: 'Читайте справа налево и следите, соединяется ли буква с соседней.', cards: [{label:'Отдельно',arabic:'ب',hint:'ба'},{label:'В начале',arabic:'بـ',hint:'начальная форма'},{label:'В середине',arabic:'ـبـ',hint:'средняя форма'},{label:'В конце',arabic:'ـب',hint:'конечная форма'}], practice: ['بَابٌ','بَيْتٌ','كِتَابٌ'] },
  4: { title: 'Сукун', badge: 'Без гласного', intro: 'Сукун ْ показывает, что после согласной буквы нет гласного звука.', rule: 'Букву с сукуном произносят коротко и сразу переходят к следующей.', cards: [{label:'Знак',arabic:'بْ',hint:'б без гласного'},{label:'После фатхи',arabic:'أَبْ',hint:'аб'},{label:'После касры',arabic:'إِبْ',hint:'иб'},{label:'После даммы',arabic:'أُبْ',hint:'уб'}], practice: ['قُلْ','مِنْ','يَكْتُبُ'] },
  5: { title: 'Танвин', badge: 'Двойные огласовки', intro: 'Танвин — двойная огласовка в конце слова, добавляющая короткий звук «н».', rule: 'При продолжении чтения звучит «ан», «ин» или «ун». При остановке правило меняется.', cards: [{label:'Фатхатан',arabic:'ـً',hint:'ан'},{label:'Касратан',arabic:'ـٍ',hint:'ин'},{label:'Дамматан',arabic:'ـٌ',hint:'ун'}], practice: ['كِتَابًا','كِتَابٍ','كِتَابٌ'] },
  6: { title: 'Долгие гласные', badge: 'Растягивание', intro: 'После короткой огласовки одна из трёх букв может удлинить звук.', rule: 'Долгий звук тянется примерно вдвое дольше короткого.', cards: [{label:'Фатха + алиф',arabic:'بَا',hint:'баа'},{label:'Касра + йа',arabic:'بِي',hint:'бии'},{label:'Дамма + уау',arabic:'بُو',hint:'буу'}], practice: ['قَالَ','قِيلَ','نُورٌ'] },
  7: { title: 'Шадда', badge: 'Удвоение', intro: 'Шадда ّ означает, что согласная буква произносится удвоенно.', rule: 'Первая часть удвоенной буквы читается с сукуном, вторая — со своей огласовкой.', cards: [{label:'С фатхой',arabic:'بَّ',hint:'бба'},{label:'С касрой',arabic:'بِّ',hint:'бби'},{label:'С даммой',arabic:'بُّ',hint:'ббу'}], practice: ['رَبِّ','إِنَّ','ثُمَّ'] },
  8: { title: 'Читаем слова', badge: 'Практика', intro: 'Соединяем буквы, огласовки, сукун и долгие гласные в короткие слова.', rule: 'Не угадывайте слово целиком: читайте его справа налево по частям.', cards: [{label:'Шаг 1',arabic:'قُـ',hint:'ку'},{label:'Шаг 2',arabic:'ـلْ',hint:'ль'},{label:'Вместе',arabic:'قُلْ',hint:'куль'}], practice: ['رَبٌّ','كِتَابٌ','نُورٌ','أَحَدٌ'] },
  9: { title: 'Правила остановки', badge: 'Вакф', intro: 'При остановке в конце аята последняя огласовка обычно не произносится.', rule: 'Остановитесь спокойно, не добавляя лишнего гласного звука в конце.', cards: [{label:'Продолжаем',arabic:'رَحِيمٌ وَ',hint:'рахиимун ва'},{label:'Останавливаемся',arabic:'رَحِيمْ',hint:'рахиим'}], practice: ['الْعَالَمِينَ','نَسْتَعِينُ','الْمُفْلِحُونَ'] },
  10: { title: 'Первые аяты', badge: 'Чтение Корана', intro: 'Применяем изученные правила на знакомых коротких фрагментах.', rule: 'Читайте медленно, следите за огласовками и не спешите переходить к следующему слову.', cards: [{label:'Басмала',arabic:'بِسْمِ اللَّهِ',hint:'бисмилляхи'},{label:'Короткий аят',arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ',hint:'Сура «Аль-Ихляс», аят 1'}], practice: ['الْحَمْدُ لِلَّهِ','اللَّهُ الصَّمَدُ'] }
};

function CourseLesson({ number, onBack }) {
  const lesson = courseLessonData[number];
  return <section className="course-detail-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>К программе курса</span></button>
    <header className="quran-lesson-heading"><div><span>Урок {number}</span><h2>{lesson.title}</h2></div><strong>{lesson.badge}</strong></header>
    <p className="course-detail-intro">{lesson.intro}</p>
    <div className="course-rule-card"><span>Правило</span><p>{lesson.rule}</p></div>
    <div className={'course-concept-grid count-' + lesson.cards.length}>{lesson.cards.map((card,index)=><button type="button" disabled key={card.label}><small>{card.label}</small><strong dir="rtl">{card.arabic}</strong><span>{card.hint}</span></button>)}</div>
    <div className="course-practice"><div><span>Практика</span><h3>Прочитайте самостоятельно</h3></div>{lesson.practice.map((text,index)=><div className="course-practice-example" key={text}><strong dir="rtl">{text}</strong></div>)}</div>
    <aside className="harakat-audio-note">Озвучка будет подключаться только из проверенного источника и запускаться нажатием на пример.</aside>
  </section>;
}

const harakat = [
  { key: 'fatha', mark: 'َ', name: 'Фатха', sound: 'а', position: 'Ставится над буквой', examples: [{text:'أَحَدٌ',read:'ахадун',audio:'https://audio.qurancdn.com/wbw/112_001_004.mp3'},{text:'لَمْ',read:'лям',audio:'https://audio.qurancdn.com/wbw/112_003_001.mp3'}] },
  { key: 'kasra', mark: 'ِ', name: 'Касра', sound: 'и', position: 'Ставится под буквой', examples: [{text:'بِسْمِ',read:'бисми',audio:'https://audio.qurancdn.com/wbw/001_001_001.mp3'},{text:'لِلَّهِ',read:'лилляхи',audio:'https://audio.qurancdn.com/wbw/001_002_002.mp3'}] },
  { key: 'damma', mark: 'ُ', name: 'Дамма', sound: 'у', position: 'Ставится над буквой', examples: [{text:'قُلْ',read:'куль',audio:'https://audio.qurancdn.com/wbw/112_001_001.mp3'},{text:'هُوَ',read:'хува',audio:'https://audio.qurancdn.com/wbw/112_001_002.mp3'}] },
];

function HarakatLesson({ onBack }) {
  const [selected, setSelected] = useState(0);
  const [playingExample, setPlayingExample] = useState(null);
  const exampleAudioRef = useRef(null);
  const item = harakat[selected];
  function playExample(example, index) { const audio = exampleAudioRef.current; if (!audio) return; audio.src = example.audio; setPlayingExample(index); audio.play().catch(() => setPlayingExample(null)); }
  return <section className="harakat-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>К программе курса</span></button>
    <header className="quran-lesson-heading"><div><span>Урок 2</span><h2>Огласовки</h2></div><strong>3 знака</strong></header>
    <p className="harakat-intro">Огласовка добавляет к букве короткий гласный звук. Сама буква остаётся той же.</p>
    <div className="harakat-tabs" role="tablist" aria-label="Огласовки">{harakat.map((value, index) => <button type="button" role="tab" aria-selected={selected === index} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} key={value.key}><span>{'◌' + value.mark}</span><strong>{value.name}</strong></button>)}</div>
    <div className="harakat-focus-card">
      <div className="harakat-symbol" aria-hidden="true"><span>{'ب' + item.mark}</span></div>
      <div className="harakat-focus-copy"><span>{item.name}</span><h3>Короткий звук «{item.sound}»</h3><p>{item.position}. Произносится коротко, без растягивания.</p></div>
    </div>
    <div className="harakat-position"><span className={'harakat-position-mark ' + item.key}>{'ب' + item.mark}</span><div><strong>{item.position}</strong><small>{item.key === 'kasra' ? 'Обратите внимание: знак находится снизу.' : 'Знак находится сверху, но имеет свою форму.'}</small></div></div>
    <div className="harakat-examples"><div><h3>Послушайте примеры</h3><span>Нажмите на слово</span></div><audio ref={exampleAudioRef} onEnded={() => setPlayingExample(null)} onPause={() => setPlayingExample(null)}/><div className="harakat-example-grid harakat-audio-examples" dir="rtl">{item.examples.map((example,index)=><button type="button" className={playingExample===index?'is-playing':''} onClick={()=>playExample(example,index)} key={example.text}><span>{example.text}</span><small dir="ltr">{playingExample===index?'Слушайте…':example.read}</small></button>)}</div></div>
    <div className="harakat-rule"><strong>Запомните</strong><div><span>ـَ</span> = а</div><div><span>ـِ</span> = и</div><div><span>ـُ</span> = у</div></div>
    <aside className="quran-audio-source"><strong>Источник аудио</strong><span>Пословное произношение Корана · Quran Foundation</span><a href="https://quran.foundation" target="_blank" rel="noreferrer">Открыть источник</a></aside>
  </section>;
}

export default function QuranLearningView() {
  const audioRef = useRef(null);
  const [level, setLevel] = useState('beginner');
  const [activeLesson, setActiveLesson] = useState(0);
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
  const openLevel = (nextLevel) => { setLevel(nextLevel); setActiveLesson(0); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openLesson = (number) => { setActiveLesson(number); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); };
  return (
    <section className="quran-learning-screen quran-course-redesign">
      <div className="quran-level-switch quran-level-switch-top" role="tablist" aria-label="Уровень обучения">
        <button type="button" className={level === 'beginner' ? 'active' : ''} onClick={() => openLevel('beginner')} role="tab" aria-selected={level === 'beginner'}><strong>Начинающий</strong><span>Чтение с нуля</span></button>
        <button type="button" className={level === 'intermediate' ? 'active' : ''} onClick={() => openLevel('intermediate')} role="tab" aria-selected={level === 'intermediate'}><strong>Средний</strong><span>Уверенное чтение</span></button>
        <button type="button" className={level === 'advanced' ? 'active' : ''} onClick={() => openLevel('advanced')} role="tab" aria-selected={level === 'advanced'}><strong>Продвинутый</strong><span>Таджвид</span></button>
      </div>
      {level === 'intermediate' ? <>
        <div className="quran-course-hero quran-course-hero-compact quran-intermediate-hero"><div className="quran-course-hero-icon"><LearnIcon size={30}/></div><div><span className="quran-course-kicker">Средний уровень</span><h1>Уверенное чтение</h1><p>Закрепляем основы и переходим к первым правилам таджвида.</p></div></div>
        <div className="quran-track-card"><div className="quran-track-heading"><div><span>Следующий этап</span><h2>Программа среднего уровня</h2></div><strong>8 уроков</strong></div>{['Повторение основ','Солнечные и лунные буквы','Калькаля','Гунна','Нун сакина и танвин','Мим сакина','Виды удлинения','Чтение коротких сур'].map((title,index)=><div className="quran-track-row is-locked" key={title}><span className="quran-track-number">{index+1}</span><span className="quran-track-copy"><strong>{title}</strong><small>{index===0?'Проверка готовности к уровню':'Урок готовится'}</small></span><span className="quran-track-lock">Скоро</span></div>)}</div>
      </> : level === 'advanced' ? <>
        <div className="quran-course-hero quran-course-hero-compact"><div className="quran-course-hero-icon"><LearnIcon size={30}/></div><div><span className="quran-course-kicker">Следующий уровень</span><h1>Таджвид</h1><p>Правильное произношение и правила чтения Корана.</p></div></div>
        <div className="quran-track-card"><div className="quran-track-heading"><div><span>Продвинутый курс</span><h2>Программа готовится</h2></div><strong>6 тем</strong></div>{['Введение в таджвид','Махраджи букв','Свойства букв','Правила нун и мим','Виды мадда','Знаки остановки'].map((title,index)=><div className="quran-track-row is-locked" key={title}><span className="quran-track-number">{index+1}</span><span className="quran-track-copy"><strong>{title}</strong><small>Будет добавлено после проверки материалов</small></span><span className="quran-track-lock">Скоро</span></div>)}</div>
      </> : activeLesson === 0 ? <>
        <div className="quran-course-hero quran-course-hero-compact"><div className="quran-course-hero-icon"><LearnIcon size={30}/></div><div><span className="quran-course-kicker">Курс для начинающих</span><h1>Учимся читать Коран</h1><p>10 последовательных уроков: от букв до первых аятов.</p></div></div>
        <div className="quran-course-summary"><div><strong>10</strong><span>уроков</span></div><i/><div><strong>28</strong><span>букв</span></div><i/><div><strong>Шаг за шагом</strong><span>без спешки</span></div></div>
        <div className="quran-track-card"><div className="quran-track-heading"><div><span>Ваш маршрут</span><h2>Программа курса</h2></div><strong>Начните с урока 1</strong></div>{lessons.map(([title,hint],index)=><button type="button" className="quran-track-row" onClick={()=>openLesson(index+1)} key={title}><span className="quran-track-number">{index+1}</span><span className="quran-track-copy"><strong>{title}</strong><small>{hint}</small></span><span className="quran-track-action">{index===0?'Слушать':'Открыть'} <b aria-hidden="true">›</b></span></button>)}</div>
      </> : <>
        {activeLesson === 1 && <section className="quran-active-lesson">
          <button type="button" className="quran-inline-back" onClick={() => setActiveLesson(0)}>‹ <span>Все уроки</span></button>
          <header className="quran-lesson-heading"><div><span>Урок 1 из 10</span><h2>Арабский алфавит</h2></div><strong>28 букв</strong></header>
          <audio ref={audioRef} src="/audio/quran/arabic-alphabet.ogg" preload="auto" onTimeUpdate={trackLetter} onEnded={() => setActiveLetter(null)} />
          <p className="quran-lesson-tip quran-letter-audio-tip"><span><strong>Нажмите на букву, чтобы услышать её</strong>Повторное нажатие воспроизведёт звук ещё раз.</span></p>
          <div className="quran-alphabet-grid" dir="rtl">{alphabet.map(([letter,name],index)=><button type="button" className={activeLetter===index?'is-playing':''} key={letter+name} onClick={()=>playLetter(index)} aria-label={name+'. Прослушать произношение'}><span className="quran-letter">{letter}</span><span className="quran-letter-name" dir="ltr">{activeLetter===index?'Слушайте…':name}</span></button>)}</div>
          <aside className="quran-audio-source"><strong>Источник аудио</strong><span>Произношение: Ibraheem alex · Wikimedia Commons</span><a href="https://commons.wikimedia.org/wiki/File:%D8%AD%D8%B1%D9%88%D9%81_%D8%A7%D9%84%D8%A3%D8%A8%D8%AC%D8%AF%D9%8A%D8%A9_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9_Arabic_alphabet.ogg" target="_blank" rel="noreferrer">GFDL 1.2+ · открыть оригинал</a></aside>
          <button type="button" className="quran-next-lesson" onClick={()=>openLesson(2)}><span><small>Следующий урок</small><strong>Огласовки</strong></span><b aria-hidden="true">›</b></button>
        </section>}
        {activeLesson === 2 && <HarakatLesson onBack={() => setActiveLesson(0)} />}
        {activeLesson > 2 && <CourseLesson number={activeLesson} onBack={() => setActiveLesson(0)} />}
      </>}
    </section>
  );
}
