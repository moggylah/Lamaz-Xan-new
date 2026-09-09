import { useRef, useState } from 'react';
import { LearnIcon } from './Icons.jsx';

const alphabet = [['ا','Алиф'],['ب','Ба'],['ت','Та'],['ث','Са'],['ج','Джим'],['ح','Ха'],['خ','Хо'],['د','Даль'],['ذ','Заль'],['ر','Ра'],['ز','Зай'],['س','Син'],['ش','Шин'],['ص','Сад'],['ض','Дад'],['ط','Та'],['ظ','За'],['ع','Айн'],['غ','Гайн'],['ف','Фа'],['ق','Каф'],['ك','Кяф'],['ل','Лям'],['م','Мим'],['ن','Нун'],['ه','Ха'],['و','Уау'],['ي','Йа']];
const letterTimings = [[0.24,0.87],[1.70,2.47],[3.22,3.97],[4.96,5.67],[6.56,7.47],[8.20,9.15],[9.82,10.75],[11.60,12.43],[13.16,14.11],[15.10,16.05],[17.06,18.01],[18.60,19.71],[20.28,21.35],[22.06,23.03],[23.90,24.83],[25.80,26.57],[27.34,28.39],[29.12,30.09],[30.88,31.87],[32.58,33.59],[34.60,35.51],[36.20,37.07],[37.82,38.77],[39.42,40.45],[41.18,42.15],[42.96,43.89],[44.74,45.73],[46.50,47.31]];
const lessons = [['Арабский алфавит','28 букв · произношение',true],['Огласовки','Фатха, касра и дамма'],['Соединение букв','Начало, середина и конец слова'],['Сукун','Буква без гласного звука'],['Танвин','Двойные огласовки'],['Долгие гласные','Алиф, уау и йа'],['Шадда','Удвоение согласных'],['Читаем слова','Первые короткие слова'],['Правила остановки','Как правильно завершать чтение'],['Первые аяты','Переход к чтению Корана']];

const wordAudio = (id) => 'https://audio.qurancdn.com/wbw/' + id + '.mp3';
const verseAudio = (id) => 'https://verses.quran.foundation/Alafasy/mp3/' + id + '.mp3';

const courseLessonData = {
  3: { title: 'Соединение букв', badge: 'Формы букв', intro: 'Большинство арабских букв меняют форму в зависимости от места в слове.', rule: 'Читайте справа налево и следите, соединяется ли буква с соседней.', cards: [{label:'Отдельно',arabic:'ب',hint:'ба'},{label:'В начале',arabic:'بـ',hint:'начальная форма'},{label:'В середине',arabic:'ـبـ',hint:'средняя форма'},{label:'В конце',arabic:'ـب',hint:'конечная форма'}], practice: [{text:'بِسْمِ',audio:wordAudio('001_001_001')},{text:'اللَّهِ',audio:wordAudio('001_001_002')},{text:'الرَّحْمَنِ',audio:wordAudio('001_001_003')}] },
  4: { title: 'Сукун', badge: 'Без гласного', intro: 'Сукун ْ показывает, что после согласной буквы нет гласного звука.', rule: 'Букву с сукуном произносят коротко и сразу переходят к следующей.', cards: [{label:'Знак',arabic:'بْ',hint:'б без гласного'},{label:'После фатхи',arabic:'أَبْ',hint:'аб'},{label:'После касры',arabic:'إِبْ',hint:'иб'},{label:'После даммы',arabic:'أُبْ',hint:'уб'}], practice: [{text:'قُلْ',audio:wordAudio('112_001_001')},{text:'لَمْ',audio:wordAudio('112_003_001')},{text:'يَلِدْ',audio:wordAudio('112_003_002')}] },
  5: { title: 'Танвин', badge: 'Двойные огласовки', intro: 'Танвин — двойная огласовка в конце слова, добавляющая короткий звук «н».', rule: 'При продолжении чтения звучит «ан», «ин» или «ун». При остановке правило меняется.', cards: [{label:'Фатхатан',arabic:'بً',hint:'бан'},{label:'Касратан',arabic:'بٍ',hint:'бин'},{label:'Дамматан',arabic:'بٌ',hint:'бун'}], practice: [{text:'أَحَدٌ',audio:wordAudio('112_001_004')},{text:'كُفُوًا',audio:wordAudio('112_004_004')}] },
  6: { title: 'Долгие гласные', badge: 'Растягивание', intro: 'После короткой огласовки одна из трёх букв может удлинить звук.', rule: 'Долгий звук тянется примерно вдвое дольше короткого.', cards: [{label:'Фатха + алиф',arabic:'بَا',hint:'баа'},{label:'Касра + йа',arabic:'بِي',hint:'бии'},{label:'Дамма + уау',arabic:'بُو',hint:'буу'}], practice: [{text:'مَالِكِ',audio:wordAudio('001_004_001')},{text:'نَسْتَعِينُ',audio:wordAudio('001_005_004')},{text:'الضَّالِّينَ',audio:wordAudio('001_007_009')}] },
  7: { title: 'Шадда', badge: 'Удвоение', intro: 'Шадда ّ означает, что согласная буква произносится удвоенно.', rule: 'Первая часть удвоенной буквы читается с сукуном, вторая — со своей огласовкой.', cards: [{label:'С фатхой',arabic:'بَّ',hint:'бба'},{label:'С касрой',arabic:'بِّ',hint:'бби'},{label:'С даммой',arabic:'بُّ',hint:'ббу'}], practice: [{text:'رَبِّ',audio:wordAudio('001_002_003')},{text:'اللَّهُ',audio:wordAudio('112_002_001')},{text:'إِيَّاكَ',audio:wordAudio('001_005_001')}] },
  8: { title: 'Читаем слова', badge: 'Практика', intro: 'Соединяем буквы, огласовки, сукун и долгие гласные в короткие слова.', rule: 'Не угадывайте слово целиком: читайте его справа налево по частям.', cards: [{label:'Шаг 1',arabic:'قُـ',hint:'ку'},{label:'Шаг 2',arabic:'ـلْ',hint:'ль'},{label:'Вместе',arabic:'قُلْ',hint:'куль'}], practice: [{text:'قُلْ',audio:wordAudio('112_001_001')},{text:'هُوَ',audio:wordAudio('112_001_002')},{text:'أَحَدٌ',audio:wordAudio('112_001_004')},{text:'الصَّمَدُ',audio:wordAudio('112_002_002')}] },
  9: { title: 'Правила остановки', badge: 'Вакф', intro: 'При остановке в конце аята последняя огласовка обычно не произносится.', rule: 'Остановитесь спокойно, не добавляя лишнего гласного звука в конце.', cards: [{label:'Продолжаем',arabic:'رَحِيمٌ وَ',hint:'рахиимун ва'},{label:'Останавливаемся',arabic:'رَحِيمْ',hint:'рахиим'}], practice: [{text:'الْعَالَمِينَ',audio:wordAudio('001_002_004')},{text:'نَسْتَعِينُ',audio:wordAudio('001_005_004')},{text:'الضَّالِّينَ',audio:wordAudio('001_007_009')}] },
  10: { title: 'Первые аяты', badge: 'Чтение Корана', intro: 'Применяем изученные правила на знакомых коротких фрагментах.', rule: 'Читайте медленно, следите за огласовками и не спешите переходить к следующему слову.', cards: [{label:'Басмала',arabic:'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',hint:'Сура «Аль-Фатиха», аят 1',audio:verseAudio('001001')},{label:'Короткий аят',arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ',hint:'Сура «Аль-Ихляс», аят 1',audio:verseAudio('112001')}], practice: [{text:'الْحَمْدُ',audio:wordAudio('001_002_001')},{text:'اللَّهُ الصَّمَدُ',audio:verseAudio('112002')}] }
};

const levelLessonData = {
  intermediate: [
    {title:'Повторение основ',badge:'Проверка знаний',intro:'Закрепляем буквы, огласовки, сукун, танвин и шадду перед новыми правилами.',rule:'Читайте медленно и называйте правило, которое видите в каждом слове.',examples:[{label:'Огласовки и шадда',arabic:'الْحَمْدُ لِلَّهِ',hint:'Сура «Аль-Фатиха», аят 2',audio:verseAudio('001002')}]},
    {title:'Солнечные и лунные буквы',badge:'Аль артикль',intro:'После ال лям иногда произносится ясно, а иногда сливается со следующей буквой.',rule:'Перед солнечной буквой лям не звучит, следующая буква получает шадду. Перед лунной лям читается.',examples:[{label:'Солнечная',arabic:'وَالشَّمْسِ',hint:'лям не произносится',audio:verseAudio('091001')},{label:'Лунная',arabic:'وَالْقَمَرِ',hint:'лям произносится',audio:verseAudio('091002')}]},
    {title:'Калькаля',badge:'Отскок звука',intro:'У букв ق ط ب ج د с сукуном появляется короткий отскакивающий звук.',rule:'Не добавляйте полноценную огласовку: звук должен быть коротким и ясным.',examples:[{label:'Калькаля в конце',arabic:'أَحَدٌ',hint:'обратите внимание на د при остановке',audio:verseAudio('112001')}]},
    {title:'Гунна',badge:'Носовой звук',intro:'Гунна — носовой звук, особенно заметный у نّ и مّ.',rule:'Удерживайте гунну примерно две счётные единицы, не превращая её в отдельную гласную.',examples:[{label:'Нун с шаддой',arabic:'إِنَّا',hint:'удержите звук نّ',audio:verseAudio('108001')}]},
    {title:'Нун сакина и танвин',badge:'Четыре правила',intro:'После نْ и танвина чтение зависит от следующей буквы: изхар, идгам, икляб или ихфа.',rule:'Сначала найдите нун сакина или танвин, затем посмотрите на следующую букву.',examples:[{label:'Пример для разбора',arabic:'مِن شَرِّ',hint:'ихфа перед ش',audio:verseAudio('113002')}]},
    {title:'Мим сакина',badge:'Три правила',intro:'Для مْ различают ясное чтение, скрытие перед ب и слияние перед م.',rule:'Следующая буква определяет: изхар шафави, ихфа шафави или идгам шафави.',examples:[{label:'Мим сакина',arabic:'تَرْمِيهِم بِحِجَارَةٍ',hint:'обратите внимание на مْ перед ب',audio:verseAudio('105004')}]},
    {title:'Виды удлинения',badge:'Мадд',intro:'Долгота звука зависит от причины и вида мадда.',rule:'Начните с естественного мадда в две счётные единицы; более долгие виды изучайте отдельно.',examples:[{label:'Пример мадда',arabic:'الضَّالِّينَ',hint:'долгий звук в конце «Аль-Фатихи»',audio:verseAudio('001007')}]},
    {title:'Чтение коротких сур',badge:'Практика',intro:'Соединяем изученные правила в непрерывном чтении короткой суры.',rule:'Сначала прослушайте аят, затем повторите без спешки, сохраняя огласовки и остановки.',examples:[{label:'Сура «Аль-Каусар»',arabic:'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',hint:'аят 1',audio:verseAudio('108001')},{label:'Следующий аят',arabic:'فَصَلِّ لِرَبِّكَ وَانْحَرْ',hint:'аят 2',audio:verseAudio('108002')}]}
  ],
  advanced: [
    {title:'Введение в таджвид',badge:'Цель чтения',intro:'Таджвид помогает отдавать каждой букве её правильное место и свойства.',rule:'Правила дополняют живое обучение: сложные места желательно проверять с преподавателем.',examples:[{label:'Начало практики',arabic:'اقْرَأْ بِاسْمِ رَبِّكَ',hint:'Сура «Аль-Аляк», аят 1',audio:verseAudio('096001')}]},
    {title:'Махраджи букв',badge:'Места выхода',intro:'Буквы выходят из основных областей: полости рта, горла, языка, губ и носового прохода.',rule:'Слушайте и сравнивайте близкие буквы; положение органов речи важнее русской транскрипции.',examples:[{label:'Горловые буквы',arabic:'أَعُوذُ بِرَبِّ الْفَلَقِ',hint:'обратите внимание на ع и حروف الحلق',audio:verseAudio('113001')}]},
    {title:'Свойства букв',badge:'Сыфат',intro:'У букв есть устойчивые свойства: звонкость, мягкость, возвышение языка и другие.',rule:'Изучайте свойства парами и применяйте их без искусственного усиления звука.',examples:[{label:'Тяжёлые буквы',arabic:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',hint:'обратите внимание на ق',audio:verseAudio('113001')}]},
    {title:'Правила нун и мим',badge:'Подробный разбор',intro:'Углубляем изхар, идгам, икляб, ихфа и правила мим сакина.',rule:'Определяйте правило на стыке слов и сохраняйте нужную степень гунны.',examples:[{label:'Нун перед ش',arabic:'مِن شَرِّ مَا خَلَقَ',hint:'ихфа',audio:verseAudio('113002')},{label:'Мим перед ب',arabic:'تَرْمِيهِم بِحِجَارَةٍ',hint:'ихфа шафави',audio:verseAudio('105004')}]},
    {title:'Виды мадда',badge:'Длительность',intro:'Разбираем естественный, соединённый, раздельный и другие виды удлинения.',rule:'Количество счётов зависит от вида чтения; придерживайтесь одной проверенной передачи.',examples:[{label:'Мадд в аяте',arabic:'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',hint:'прослушайте длину гласных',audio:verseAudio('108001')}]},
    {title:'Знаки остановки',badge:'Вакф и ибтида',intro:'Знаки мусхафа помогают понять, где остановиться, продолжить или не разрывать смысл.',rule:'Остановка должна сохранять смысл; при сомнении вернитесь к началу смыслового отрезка.',examples:[{label:'Практика окончания',arabic:'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',hint:'Сура «Аль-Ихляс», аят 4',audio:verseAudio('112004')}]}
  ]
};

function LevelLesson({ level, index, onBack, onPrevious, onNext }) {
  const lesson = levelLessonData[level][index];
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(null);
  function play(example, exampleIndex) { const audio = audioRef.current; if (!audio) return; audio.src=example.audio; setPlaying(exampleIndex); audio.play().catch(()=>setPlaying(null)); }
  return <section className="course-detail-lesson level-detail-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>Все уроки уровня</span></button>
    <header className="quran-lesson-heading"><div><span>Урок {index+1} из {levelLessonData[level].length}</span><h2>{lesson.title}</h2></div><strong>{lesson.badge}</strong></header>
    <p className="course-detail-intro">{lesson.intro}</p><div className="course-rule-card"><span>Правило</span><p>{lesson.rule}</p></div>
    <audio ref={audioRef} onEnded={()=>setPlaying(null)}/><div className={'level-example-grid count-'+lesson.examples.length}>{lesson.examples.map((example,i)=><button type="button" className={playing===i?'is-playing':''} onClick={()=>play(example,i)} key={example.arabic}><small>{example.label}</small><strong dir="rtl">{example.arabic}</strong><span>{playing===i?'Слушайте…':example.hint}</span></button>)}</div>
    <div className="quran-lesson-navigation"><button type="button" onClick={onPrevious}>‹ <span>{index===0?'Все уроки':'Урок '+index}</span></button><button type="button" className="primary" onClick={onNext}><span>{index===levelLessonData[level].length-1?'Все уроки':'Урок '+(index+2)}</span> ›</button></div>
  </section>;
}

function CourseLesson({ number, onBack, onPrevious, onNext }) {
  const lesson = courseLessonData[number];
  const lessonAudioRef = useRef(null);
  const [playingItem, setPlayingItem] = useState(null);
  function playItem(item, key) { if (!item.audio || !lessonAudioRef.current) return; const audio = lessonAudioRef.current; audio.src = item.audio; setPlayingItem(key); audio.play().catch(() => setPlayingItem(null)); }
  return <section className="course-detail-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>К программе курса</span></button>
    <header className="quran-lesson-heading"><div><span>Урок {number}</span><h2>{lesson.title}</h2></div><strong>{lesson.badge}</strong></header>
    <p className="course-detail-intro">{lesson.intro}</p>
    <div className="course-rule-card"><span>Правило</span><p>{lesson.rule}</p></div><audio ref={lessonAudioRef} onEnded={() => setPlayingItem(null)} />
    <div className={'course-concept-grid count-' + lesson.cards.length + (number === 10 ? ' verse-layout' : '')}>{lesson.cards.map((card,index)=><button type="button" disabled={!card.audio} className={playingItem==='card-'+index?'is-playing':''} onClick={()=>playItem(card,'card-'+index)} key={card.label}><small>{card.label}</small><strong dir="rtl">{card.arabic}</strong><span>{card.hint}</span></button>)}</div>
    <div className="course-practice"><div><span>Практика</span><h3>Прочитайте самостоятельно</h3></div>{lesson.practice.map((item,index)=><button type="button" className={'course-practice-example '+(playingItem==='practice-'+index?'is-playing':'')} onClick={()=>playItem(item,'practice-'+index)} key={item.text}><strong dir="rtl">{item.text}</strong><span>{playingItem==='practice-'+index?'Слушайте…':'Нажмите, чтобы прослушать'}</span></button>)}</div>
    <div className="quran-lesson-navigation"><button type="button" onClick={onPrevious}>‹ <span>Урок {number - 1}</span></button><button type="button" className="primary" onClick={onNext}><span>{number === 10 ? 'Все уроки' : 'Урок ' + (number + 1)}</span> ›</button></div>
  </section>;
}

const harakat = [
  { key: 'fatha', mark: 'َ', name: 'Фатха', sound: 'а', position: 'Ставится над буквой', examples: [{text:'أَحَدٌ',read:'ахадун',audio:'https://audio.qurancdn.com/wbw/112_001_004.mp3'},{text:'لَمْ',read:'лям',audio:'https://audio.qurancdn.com/wbw/112_003_001.mp3'}] },
  { key: 'kasra', mark: 'ِ', name: 'Касра', sound: 'и', position: 'Ставится под буквой', examples: [{text:'بِسْمِ',read:'бисми',audio:'https://audio.qurancdn.com/wbw/001_001_001.mp3'},{text:'لِلَّهِ',read:'лилляхи',audio:'https://audio.qurancdn.com/wbw/001_002_002.mp3'}] },
  { key: 'damma', mark: 'ُ', name: 'Дамма', sound: 'у', position: 'Ставится над буквой', examples: [{text:'قُلْ',read:'куль',audio:'https://audio.qurancdn.com/wbw/112_001_001.mp3'},{text:'هُوَ',read:'хува',audio:'https://audio.qurancdn.com/wbw/112_001_002.mp3'}] },
];

function HarakatLesson({ onBack, onNext }) {
  const [selected, setSelected] = useState(0);
  const [playingExample, setPlayingExample] = useState(null);
  const exampleAudioRef = useRef(null);
  const item = harakat[selected];
  function playExample(example, index) { const audio = exampleAudioRef.current; if (!audio) return; audio.src = example.audio; setPlayingExample(index); audio.play().catch(() => setPlayingExample(null)); }
  return <section className="harakat-lesson">
    <button type="button" className="quran-inline-back" onClick={onBack}>‹ <span>К программе курса</span></button>
    <header className="quran-lesson-heading"><div><span>Урок 2</span><h2>Огласовки</h2></div><strong>3 знака</strong></header>
    <p className="harakat-intro">Огласовка добавляет к букве короткий гласный звук. Сама буква остаётся той же.</p>
    <div className="harakat-tabs" role="tablist" aria-label="Огласовки">{harakat.map((value, index) => <button type="button" role="tab" aria-selected={selected === index} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} key={value.key}><span>{'ب' + value.mark}</span><strong>{value.name}</strong></button>)}</div>
    <div className="harakat-focus-card">
      <div className="harakat-symbol" aria-hidden="true"><span>{'ب' + item.mark}</span></div>
      <div className="harakat-focus-copy"><span>{item.name}</span><h3>Короткий звук «{item.sound}»</h3><p>{item.position}. Произносится коротко, без растягивания.</p></div>
    </div>
    <div className="harakat-position"><span className={'harakat-position-mark ' + item.key}>{'ب' + item.mark}</span><div><strong>{item.position}</strong><small>{item.key === 'kasra' ? 'Обратите внимание: знак находится снизу.' : 'Знак находится сверху, но имеет свою форму.'}</small></div></div>
    <div className="harakat-examples"><div><h3>Послушайте примеры</h3><span>Нажмите на слово</span></div><audio ref={exampleAudioRef} onEnded={() => setPlayingExample(null)} onPause={() => setPlayingExample(null)}/><div className="harakat-example-grid harakat-audio-examples" dir="rtl">{item.examples.map((example,index)=><button type="button" className={playingExample===index?'is-playing':''} onClick={()=>playExample(example,index)} key={example.text}><span>{example.text}</span><small dir="ltr">{playingExample===index?'Слушайте…':example.read}</small></button>)}</div></div>
    <div className="harakat-rule"><strong>Запомните</strong><div><span>ـَ</span> = а</div><div><span>ـِ</span> = и</div><div><span>ـُ</span> = у</div></div>
    <button type="button" className="quran-next-lesson" onClick={onNext}><span><small>Следующий урок</small><strong>Соединение букв</strong></span><b aria-hidden="true">›</b></button>
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
  const openLesson = (number) => { setActiveLesson(number); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' })); };
  return (
    <section className="quran-learning-screen quran-course-redesign">
      <div className="quran-level-switch quran-level-switch-top" role="tablist" aria-label="Уровень обучения">
        <button type="button" className={level === 'beginner' ? 'active' : ''} onClick={() => openLevel('beginner')} role="tab" aria-selected={level === 'beginner'}><strong>Начинающий</strong><span>Чтение с нуля</span></button>
        <button type="button" className={level === 'intermediate' ? 'active' : ''} onClick={() => openLevel('intermediate')} role="tab" aria-selected={level === 'intermediate'}><strong>Средний</strong><span>Уверенное чтение</span></button>
        <button type="button" className={level === 'advanced' ? 'active' : ''} onClick={() => openLevel('advanced')} role="tab" aria-selected={level === 'advanced'}><strong>Продвинутый</strong><span>Таджвид</span></button>
      </div>
      {level === 'intermediate' ? activeLesson === 0 ? <>
        <div className="quran-course-hero quran-course-hero-compact quran-intermediate-hero"><div className="quran-course-hero-icon"><LearnIcon size={30}/></div><div><span className="quran-course-kicker">Средний уровень</span><h1>Уверенное чтение</h1><p>8 уроков: закрепление основ и первые правила таджвида.</p></div></div>
        <div className="quran-track-card"><div className="quran-track-heading"><div><span>Следующий этап</span><h2>Программа среднего уровня</h2></div><strong>8 уроков</strong></div>{levelLessonData.intermediate.map((lesson,index)=><button type="button" className="quran-track-row" onClick={()=>openLesson(index+1)} key={lesson.title}><span className="quran-track-number">{index+1}</span><span className="quran-track-copy"><strong>{lesson.title}</strong><small>{lesson.badge}</small></span><span className="quran-track-action">Открыть <b>›</b></span></button>)}</div>
      </> : <LevelLesson level="intermediate" index={activeLesson-1} onBack={()=>setActiveLesson(0)} onPrevious={()=>activeLesson===1?setActiveLesson(0):openLesson(activeLesson-1)} onNext={()=>activeLesson===levelLessonData.intermediate.length?setActiveLesson(0):openLesson(activeLesson+1)}/> : level === 'advanced' ? activeLesson === 0 ? <>
        <div className="quran-course-hero quran-course-hero-compact"><div className="quran-course-hero-icon"><LearnIcon size={30}/></div><div><span className="quran-course-kicker">Продвинутый уровень</span><h1>Таджвид</h1><p>6 углублённых уроков о правильном чтении Корана.</p></div></div>
        <div className="quran-track-card"><div className="quran-track-heading"><div><span>Продвинутый курс</span><h2>Программа таджвида</h2></div><strong>6 уроков</strong></div>{levelLessonData.advanced.map((lesson,index)=><button type="button" className="quran-track-row" onClick={()=>openLesson(index+1)} key={lesson.title}><span className="quran-track-number">{index+1}</span><span className="quran-track-copy"><strong>{lesson.title}</strong><small>{lesson.badge}</small></span><span className="quran-track-action">Открыть <b>›</b></span></button>)}</div>
      </> : <LevelLesson level="advanced" index={activeLesson-1} onBack={()=>setActiveLesson(0)} onPrevious={()=>activeLesson===1?setActiveLesson(0):openLesson(activeLesson-1)} onNext={()=>activeLesson===levelLessonData.advanced.length?setActiveLesson(0):openLesson(activeLesson+1)}/> : activeLesson === 0 ? <>
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
          <button type="button" className="quran-next-lesson" onClick={()=>openLesson(2)}><span><small>Следующий урок</small><strong>Огласовки</strong></span><b aria-hidden="true">›</b></button>
        </section>}
        {activeLesson === 2 && <HarakatLesson onBack={() => setActiveLesson(0)} onNext={() => openLesson(3)} />}
        {activeLesson > 2 && <CourseLesson number={activeLesson} onBack={() => setActiveLesson(0)} onPrevious={() => openLesson(activeLesson - 1)} onNext={() => activeLesson === 10 ? setActiveLesson(0) : openLesson(activeLesson + 1)} />}
      </>}
    </section>
  );
}
