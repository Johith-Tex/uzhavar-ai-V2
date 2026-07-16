// src/contexts/AppContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('uzhavar_lang') || 'ta');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    const saved = localStorage.getItem('uzhavar_autospeak');
    return saved !== null ? saved === 'true' : true; // ON by default
  });
  const [voiceMode, setVoiceMode] = useState(true); // Full voice-first mode by default
  const [weatherData, setWeatherData] = useState(null);
  const [sessionStart] = useState(Date.now());

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('uzhavar_lang', lang);
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak(prev => {
      const next = !prev;
      localStorage.setItem('uzhavar_autospeak', String(next));
      return next;
    });
  }, []);

  const addMessage = useCallback(async (msg) => {
    const newMsg = {
      id: msg.id || Date.now().toString() + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...msg,
    };
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === newMsg.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = newMsg;
        return next;
      }
      return [...prev, newMsg];
    });
    return newMsg;
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AppContext.Provider value={{
      language, changeLanguage,
      messages, addMessage, clearMessages,
      isLoading, setIsLoading,
      isSpeaking, setIsSpeaking,
      isListeningGlobal, setIsListeningGlobal,
      autoSpeak, toggleAutoSpeak,
      voiceMode, setVoiceMode,
      weatherData, setWeatherData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
