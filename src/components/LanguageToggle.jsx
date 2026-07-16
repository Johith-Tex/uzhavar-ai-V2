// src/components/LanguageToggle.jsx
import { useApp } from '../contexts/AppContext';

const LANGS = [
  { code: 'ta', label: 'த', full: 'தமிழ்' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'en', label: 'EN', full: 'English' },
];

export default function LanguageToggle() {
  const { language, changeLanguage } = useApp();
  return (
    <div className="lang-toggle">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => changeLanguage(l.code)}
          className={`lang-btn ${language === l.code ? 'lang-btn--active' : ''}`}
          title={l.full}
          aria-label={l.full}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
