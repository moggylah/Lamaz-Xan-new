import { ChevronIcon, LearnIcon } from './Icons.jsx';
import { t } from '../lib/i18n.js';

export default function SectionsView({ language = 'ru', onNavigate }) {
  const sections = [
    { view: 'quran', Icon: LearnIcon, title: t(language, 'quran.title'), description: t(language, 'sections.quranHint') },
  ];

  return (
    <section className="sections-screen">
      <header className="sections-intro">
        <span>{t(language, 'sections.kicker')}</span>
        <h1>{t(language, 'sections.title')}</h1>
        <p>{t(language, 'sections.intro')}</p>
      </header>

      <div className="sections-list">
        {sections.map(({ view, Icon, title, description }, index) => (
          <button type="button" className="sections-row" key={view} onClick={() => onNavigate?.(view)}>
            <span className="sections-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="sections-icon"><Icon size={25}/></span>
            <span className="sections-copy"><strong>{title}</strong><small>{description}</small></span>
            <ChevronIcon size={20}/>
          </button>
        ))}
      </div>
    </section>
  );
}
