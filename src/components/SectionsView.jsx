import { ChevronIcon, LearnIcon } from './Icons.jsx';
import { t } from '../lib/i18n.js';

export default function SectionsView({ language = 'ru', onNavigate }) {
  const sections = [
    { view: 'quran', Icon: LearnIcon, title: t(language, 'quran.title'), description: 'Уроки для начинающих и продолжающих' },
  ];

  return (
    <section className="sections-screen">
      <header className="sections-intro">
        <span>ВОЗМОЖНОСТИ</span>
        <h1>Другие разделы</h1>
        <p>Обучение и новые возможности будут появляться здесь, не перегружая главный экран.</p>
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
