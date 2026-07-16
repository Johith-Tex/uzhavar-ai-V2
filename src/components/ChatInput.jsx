// src/components/ChatInput.jsx — Uzhavar AI
// Voice Mode orb: fake listen → types Tamil farming tip → Sarvam TTS reads it
// Text Mode mic : real Web Speech API voice input

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, MicOff, X, RefreshCw, Keyboard } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useApp } from '../contexts/AppContext';
import VoiceOrb from './VoiceOrb';

const QUICK_PROMPTS = {
  en: [
    { icon: '🌱', text: 'How to improve soil health?' },
    { icon: '🐛', text: 'My crop has pests, help!' },
    { icon: '💧', text: 'Water management tips' },
    { icon: '📋', text: 'PM-KISAN scheme details' },
    { icon: '🌦️', text: 'When to sow paddy?' },
    { icon: '🧪', text: 'What fertilizer for tomato?' },
  ],
  ta: [
    { icon: '🌱', text: 'மண் வளம் எப்படி மேம்படுத்துவது?' },
    { icon: '🐛', text: 'பயிரில் பூச்சி இருக்கு, என்ன பண்றது?' },
    { icon: '💧', text: 'தண்ணீர் சேமிப்பு எப்படி?' },
    { icon: '📋', text: 'PM-KISAN பணம் எப்படி கிடைக்கும்?' },
    { icon: '🌦️', text: 'நெல் எப்போ விதைக்கணும்?' },
    { icon: '🧪', text: 'தக்காளிக்கு என்ன உரம் போடணும்?' },
  ],
  hi: [
    { icon: '🌱', text: 'मिट्टी की सेहत कैसे सुधारें?' },
    { icon: '🐛', text: 'फसल में कीड़े हैं, मदद करें!' },
    { icon: '💧', text: 'पानी बचाने के तरीके' },
    { icon: '📋', text: 'PM-KISAN पैसा कैसे मिलेगा?' },
    { icon: '🌦️', text: 'धान कब बोएं?' },
    { icon: '🧪', text: 'टमाटर के लिए कौन सी खाद?' },
  ],
};

const isNetworkError = (err) =>
  err && (err.includes('நெட்வொர்க்') || err.includes('Network') || err.includes('नेटवर्क'));

export default function ChatInput({ onSend, disabled }) {
  const { language, isLoading, isSpeaking, autoSpeak, toggleAutoSpeak, voiceMode, setVoiceMode } = useApp();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const voiceModeRef = useRef(voiceMode);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const handleTranscript = useCallback((transcript, autoSend) => {
    if (autoSend || voiceModeRef.current) {
      onSend(transcript, true);
    } else {
      setText(prev => prev ? prev + ' ' + transcript : transcript);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [onSend]);

  // Real voice — used for both text-mode mic button and Voice Mode orb
  const { isListening: realListening, interimText: realInterim, error,
          startListening, stopListening, retryListening, supported } =
    useVoice(handleTranscript, false);

  // isSpeaking from context tells VoiceOrb when Sarvam audio is playing
  const orbActive = realListening || isSpeaking;

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || disabled || isLoading) return;
    onSend(msg, true);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const T = {
    en: { placeholder: 'Ask about crops, soil, pests, schemes...', voiceMode: 'Voice Mode', textMode: 'Text Mode', retry: 'Retry' },
    ta: { placeholder: 'பயிர், மண், பூச்சி, திட்டங்கள் பற்றி கேளுங்கள்...', voiceMode: 'குரல் முறை', textMode: 'உரை முறை', retry: 'மீண்டும் முயற்சி' },
    hi: { placeholder: 'फसल, मिट्टी, कीट, योजनाओं के बारे में पूछें...', voiceMode: 'आवाज़ मोड', textMode: 'टेक्स्ट मोड', retry: 'फिर कोशिश करें' },
  }[language];

  // ════════════════════════════════════════════════════════════════════════
  // VOICE MODE
  // ════════════════════════════════════════════════════════════════════════
  if (voiceMode) {
    return (
      <div className="voice-mode-panel">

        {/* Tip / transcript bubble — shown while listening OR speaking */}
        {(realListening || isSpeaking || realInterim) && (
          <div className="voice-tip-bubble">
            <span className="vtb-icon">🌾</span>
            <span className="font-tamil fake-typing-text">
              {realInterim || (
                realListening
                  ? 'கேட்கிறேன்...'   // "Listening..."
                  : 'படிக்கிறேன்...'  // "Reading..."
              )}
            </span>
          </div>
        )}

        {/* Voice Orb */}
        <VoiceOrb
          isListening={realListening}
          isSpeaking={isSpeaking}
          onClick={orbActive ? stopListening : startListening}
          disabled={isLoading}
          language={language}
        />

        {/* Label under orb */}
        <p className="font-tamil orb-tip-label">
          {realListening
            ? '🎙️ கேட்கிறேன்...'
            : isSpeaking
              ? '🔊 சொல்கிறேன்...'
              : '🌿 தட்டி கேளுங்கள்'}
        </p>

        {/* Switch to text mode */}
        <button
          onClick={() => { stopListening(); setVoiceMode(false); }}
          className="mode-switch-btn"
        >
          <Keyboard size={15} style={{ marginRight: 5 }} /> {T.textMode}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // TEXT MODE
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="chat-input-area">
      <div className="quick-prompts-scroll">
        {QUICK_PROMPTS[language]?.map((p, i) => (
          <button
            key={i}
            onClick={() => onSend(p.text, true)}
            disabled={isLoading}
            className="quick-prompt-chip"
          >
            <span>{p.icon}</span>
            <span className={language !== 'en' ? 'font-tamil' : ''}>{p.text}</span>
          </button>
        ))}
      </div>

      {(realListening || realInterim) && (
        <div className="voice-interim">
          <div className="voice-pulse-dot" />
          <span className={language !== 'en' ? 'font-tamil' : ''}>{realInterim || '...'}</span>
          <button onClick={stopListening} className="voice-stop-btn"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="voice-error">
          <span className={language !== 'en' ? 'font-tamil' : ''}>{error}</span>
          {isNetworkError(error) && (
            <button onClick={retryListening} className="voice-retry-inline">
              <RefreshCw size={11} /> {T.retry}
            </button>
          )}
        </div>
      )}

      <div className="input-row">
        {supported && (
          <button
            onClick={realListening ? stopListening : startListening}
            disabled={isLoading}
            className={`mic-btn ${realListening ? 'mic-btn--active' : ''}`}
            aria-label={realListening ? 'Stop' : 'Voice input'}
          >
            {realListening ? <MicOff size={18} /> : <Mic size={20} />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKey}
          placeholder={T.placeholder}
          disabled={isLoading}
          rows={1}
          className={`chat-textarea ${language !== 'en' ? 'font-tamil' : ''}`}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || isLoading}
          className={`send-btn ${text.trim() && !isLoading ? 'send-btn--active' : ''}`}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>

      <div className="input-meta">
        <label className="autospeak-toggle">
          <div className={`toggle-track ${autoSpeak ? 'toggle-track--on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <input type="checkbox" checked={autoSpeak} onChange={toggleAutoSpeak} style={{ display: 'none' }} />
          <span className={language !== 'en' ? 'font-tamil' : ''}>
            {autoSpeak
              ? (language === 'ta' ? '🔊 தானாக படிக்கும்' : language === 'hi' ? '🔊 ऑटो सुनाएं' : '🔊 Auto Read: ON')
              : (language === 'ta' ? '🔇 படிக்காது' : language === 'hi' ? '🔇 ऑடो बंद' : '🔇 Auto Read: OFF')}
          </span>
        </label>

        <button onClick={() => setVoiceMode(true)} className="voice-mode-btn">
          🎙️ {T.voiceMode}
        </button>
      </div>
    </div>
  );
}
