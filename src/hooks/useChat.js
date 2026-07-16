// src/hooks/useChat.js
import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { askLLM } from '../services/llm';
import { speaker } from '../services/voice';

export const useChat = () => {
  const { messages, addMessage, setIsLoading, language, autoSpeak, setIsSpeaking } = useApp();
  const autoPlayRef = useRef(null);
  const setAutoPlayRef = useRef(null);

  const sendMessage = useCallback(async (text, shouldSpeak) => {
    if (!text?.trim()) return;

    // Add user message
    await addMessage({ role: 'user', content: text, language });

    setIsLoading(true);

    // Streaming placeholder
    const placeholderId = 'streaming-' + Date.now();
    const placeholder = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      language,
      streaming: true,
    };

    await addMessage(placeholder);

    try {
      const history = messages
        .slice(-10)
        .filter(m => m.role && m.content)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      history.push({ role: 'user', content: text });

      let fullText = '';

      // Use streaming
      fullText = await askLLM(history, language, (chunk, full) => {
        fullText = full;
        addMessage({ ...placeholder, content: fullText });
      });

      // Update placeholder to final message
      const finalMsg = await addMessage({
        id: placeholderId,
        role: 'assistant',
        content: fullText,
        language,
        streaming: false,
      });

      // Auto-speak if enabled
      const speakNow = shouldSpeak !== undefined ? shouldSpeak : autoSpeak;
      if (speakNow && fullText) {
        setTimeout(() => {
          setIsSpeaking(true);
          speaker.speak(
            fullText,
            language,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false),
            () => setIsSpeaking(false)
          );
        }, 300);
      }

    } catch (err) {
      await addMessage({
        role: 'assistant',
        content: language === 'ta'
          ? 'மன்னிக்கவும், இப்போது பதில் சொல்ல முடியவில்லை. கிசான் கால் சென்டர்: 1800-180-1551'
          : language === 'hi'
          ? 'माफ़ करें, अभी जवाब नहीं दे पा रहा। किसान कॉल सेंटर: 1800-180-1551'
          : 'Sorry, I am having trouble connecting. Kisan Call Center: 1800-180-1551 (free)',
        language,
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, addMessage, setIsLoading, language, autoSpeak, setIsSpeaking]);

  return { sendMessage };
};
