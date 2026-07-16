// src/pages/ChatPage.jsx — Enhanced welcome screen + animated farmer illustrations
import { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { Trash2 } from 'lucide-react';

const WELCOME = {
  en: {
    greeting: 'Hello! I am Uzhavar AI 🌾',
    sub: 'Your farming assistant. Ask me anything about crops, soil, pests, weather, or schemes.',
    tap: '🎙️ Tap Voice Mode to speak in your language',
    examples: [
      { icon: '🌾', text: 'How to grow paddy?', tag: 'Crops' },
      { icon: '💰', text: 'What is PM-KISAN?', tag: 'Schemes' },
      { icon: '🌡️', text: 'Best crop for summer?', tag: 'Season' },
    ],
    features: ['🌾 Crop advice', '🌦️ Weather tips', '💊 Pest cures', '📋 Gov schemes'],
  },
  ta: {
    greeting: 'வணக்கம்! நான் உழவர் AI 🌾',
    sub: 'உங்கள் வேளாண் உதவியாளர். பயிர்கள், மண், பூச்சிகள், வானிலை பற்றி கேளுங்கள்.',
    tap: '🎙️ குரல் முறை அழுத்தி பேசுங்கள்',
    examples: [
      { icon: '🌾', text: 'நெல் எப்படி பயிரிடுவது?', tag: 'பயிர்கள்' },
      { icon: '💰', text: 'PM-KISAN என்றால் என்ன?', tag: 'திட்டங்கள்' },
      { icon: '🌡️', text: 'கோடை காலத்தில் என்ன பயிர்?', tag: 'பருவம்' },
    ],
    features: ['🌾 பயிர் அறிவுரை', '🌦️ வானிலை குறிப்புகள்', '💊 பூச்சி தீர்வு', '📋 அரசு திட்டங்கள்'],
  },
  hi: {
    greeting: 'नमस्ते! मैं उझावर AI हूँ 🌾',
    sub: 'आपका किसान सहायक। फसल, मिट्टी, कीट, मौसम या योजनाओं के बारे में पूछें।',
    tap: '🎙️ आवाज़ मोड दबाकर बोलें',
    examples: [
      { icon: '🌾', text: 'धान कैसे उगाएं?', tag: 'फसल' },
      { icon: '💰', text: 'PM-KISAN क्या है?', tag: 'योजना' },
      { icon: '🌡️', text: 'गर्मियों में कौन सी फसल?', tag: 'मौसम' },
    ],
    features: ['🌾 फसल सलाह', '🌦️ मौसम टिप्स', '💊 कीट उपचार', '📋 सरकारी योजनाएं'],
  },
};

// Floating particle background
function FarmParticles() {
  return (
    <div className="farm-particles" aria-hidden="true">
      {['🌿','🍀','🌱','🌾','🍃','🌻','🌿','🍀'].map((emoji, i) => (
        <span key={i} className={`farm-particle farm-particle--${i + 1}`}>{emoji}</span>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { messages, isLoading, language, clearMessages, voiceMode } = useApp();
  const { sendMessage } = useChat();
  const bottomRef = useRef(null);
  const w = WELCOME[language] || WELCOME.en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-page">
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <FarmParticles />

            {/* Hero section */}
            <div className="welcome-hero">
              <div className="welcome-banner-wrapper">
                <img src="/farming-bg.png" alt="Lush Rice Paddy Field" className="welcome-banner-img" />
                <div className="welcome-banner-overlay" />
                <div className="welcome-plant-ring">
                  <div className="welcome-plant">🌿</div>
                </div>
              </div>
              <h2 className={`welcome-title ${language !== 'en' ? 'font-tamil' : ''}`}>{w.greeting}</h2>
              <p className={`welcome-sub ${language !== 'en' ? 'font-tamil' : ''}`}>{w.sub}</p>
            </div>

            {/* Feature pills */}
            <div className="welcome-features">
              {w.features.map((f, i) => (
                <span key={i} className={`welcome-feature-pill ${language !== 'en' ? 'font-tamil' : ''}`}>{f}</span>
              ))}
            </div>

            {/* Voice hint */}
            <div className="welcome-voice-hint">
              <div className="voice-hint-pulse" />
              <span className={language !== 'en' ? 'font-tamil' : ''}>{w.tap}</span>
            </div>

            {/* Example questions */}
            <div className="welcome-examples">
              <p className={`welcome-examples-label ${language !== 'en' ? 'font-tamil' : ''}`}>
                {language === 'ta' ? '✨ இதை முயற்சிக்கவும்' : language === 'hi' ? '✨ इन्हें आज़माएं' : '✨ Try asking'}
              </p>
              {w.examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(ex.text)}
                  className={`welcome-example-btn ${language !== 'en' ? 'font-tamil' : ''}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="welcome-example-icon">{ex.icon}</span>
                  <span className="welcome-example-text">{ex.text}</span>
                  <span className="welcome-example-tag">{ex.tag}</span>
                </button>
              ))}
            </div>

            {/* Bottom badge */}
            <div className="welcome-badge">
              <span>🤖</span>
              <span className={language !== 'en' ? 'font-tamil' : ''}>
                {language === 'ta' ? 'AI மூலம் இயக்கப்படுகிறது • தமிழில் பேசுங்கள்'
                  : language === 'hi' ? 'AI द्वारा संचालित • हिंदी में बोलें'
                  : 'Powered by AI • Speak Tamil, Hindi or English'}
              </span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id || msg.timestamp} message={msg} />
        ))}

        {isLoading && (
          <div className="msg-wrapper msg-wrapper--ai">
            <div className="msg-avatar">🌾</div>
            <div className="msg-bubble msg-bubble--ai msg-bubble--thinking">
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <button onClick={clearMessages} className="clear-chat-btn" title="Clear chat">
          <Trash2 size={14} />
          <span className={language !== 'en' ? 'font-tamil' : ''}>
            {language === 'ta' ? 'அழி' : language === 'hi' ? 'साफ' : 'Clear'}
          </span>
        </button>
      )}

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
