// src/hooks/useVoice.js
import { useState, useCallback, useRef } from 'react';
import { recognizer } from '../services/voice';
import { useApp } from '../contexts/AppContext';

export const useVoice = (onTranscript, autoSend = false) => {
  const { language } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const retryRef = useRef(0);

  const clearError = () => {
    setTimeout(() => setError(null), 5000);
  };

  const startListening = useCallback(() => {
    setError(null);
    setInterimText('');
    setIsListening(true);

    // Auto-stop after 15 seconds (slightly longer for Tamil speakers)
    timeoutRef.current = setTimeout(() => {
      recognizer.stop();
    }, 15000);

    recognizer.start(
      language,
      (interim) => setInterimText(interim),
      (final) => {
        clearTimeout(timeoutRef.current);
        setIsListening(false);
        setInterimText('');
        retryRef.current = 0;
        if (final.trim()) onTranscript(final.trim(), autoSend);
      },
      (err) => {
        clearTimeout(timeoutRef.current);
        setIsListening(false);
        setInterimText('');
        setError(err);
        clearError();
      },
      () => {
        clearTimeout(timeoutRef.current);
        setIsListening(false);
      }
    );
  }, [language, onTranscript, autoSend]);

  const stopListening = useCallback(() => {
    clearTimeout(timeoutRef.current);
    recognizer.stop();
  }, []);

  return {
    isListening,
    interimText,
    error,
    startListening,
    stopListening,
    supported: recognizer.supported,
    // Expose retry so UI can offer a retry button after network error
    retryListening: startListening,
  };
};
