// src/components/Layout.jsx — Uzhavar AI
import { Outlet, NavLink } from 'react-router-dom';
import { MessageCircle, Cloud, BookOpen, Leaf, Wifi, WifiOff, Microscope, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import LanguageToggle from './LanguageToggle';
import { useState, useEffect } from 'react';

const T = {
  en: { chat: 'Chat', weather: 'Weather', schemes: 'Schemes', crops: 'Crops', disease: 'Scan', mandi: 'Mandi', tagline: 'AI Farm Assistant' },
  ta: { chat: 'அரட்டை', weather: 'வானிலை', schemes: 'திட்டங்கள்', crops: 'பயிர்கள்', disease: 'நோய்', mandi: 'மண்டி', tagline: 'AI வேளாண் உதவியாளர்' },
  hi: { chat: 'बातचीत', weather: 'मौसम', schemes: 'योजनाएं', crops: 'फसलें', disease: 'जांच', mandi: 'मंडी', tagline: 'AI किसान सहायक' },
};

export default function Layout() {
  const { language, isSpeaking, isLoading } = useApp();
  const t = T[language] || T.en;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const navItems = [
    { to: '/',        label: t.chat,    Icon: MessageCircle, activeEmoji: '💬' },
    { to: '/weather', label: t.weather, Icon: Cloud,         activeEmoji: '🌤️' },
    { to: '/mandi',   label: t.mandi,   Icon: TrendingUp,    activeEmoji: '📊' },
    { to: '/schemes', label: t.schemes, Icon: BookOpen,      activeEmoji: '📋' },
    { to: '/crops',   label: t.crops,   Icon: Leaf,          activeEmoji: '🌿' },
    { to: '/disease', label: t.disease, Icon: Microscope,    activeEmoji: '🔬' },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon-wrap">
            <span className="brand-icon">🌾</span>
            {isLoading && <div className="brand-loading-ring" />}
          </div>
          <div>
            <h1 className="brand-title">
              {language === 'hi' ? 'उझावर AI' : language === 'en' ? 'Uzhavar AI' : 'உழவர் AI'}
            </h1>
            <p className={`brand-sub ${language !== 'en' ? 'font-tamil' : ''}`}>{t.tagline}</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`online-dot ${isOnline ? 'online-dot--on' : 'online-dot--off'}`}
            title={isOnline ? 'Online' : 'Offline'}>
            {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          </div>
          {isSpeaking && (
            <div className="speaking-indicator" title="Speaking...">
              <span className="speak-bar" /><span className="speak-bar" /><span className="speak-bar" />
            </div>
          )}
          <LanguageToggle />
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map(({ to, label, Icon, activeEmoji }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="nav-icon-wrap">
                  {isActive
                    ? <span className="nav-emoji">{activeEmoji}</span>
                    : <Icon size={18} strokeWidth={1.8} />}
                  {isActive && <div className="nav-active-dot" />}
                </div>
                <span className={language !== 'en' ? 'font-tamil' : ''}
                  style={{ fontSize: '10px' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
