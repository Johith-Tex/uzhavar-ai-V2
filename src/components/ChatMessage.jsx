// src/components/ChatMessage.jsx
import { useState, useEffect } from 'react';
import { Volume2, VolumeX, ThumbsUp, ThumbsDown } from 'lucide-react';
import { speaker } from '../services/voice';
import { saveFeedback } from '../services/firebase';
import { useApp } from '../contexts/AppContext';

export default function ChatMessage({ message, autoPlayId }) {
  const { language, user, isSpeaking, setIsSpeaking } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const isUser = message.role === 'user';

  // Auto-play if this message is flagged for auto-speak
  useEffect(() => {
    if (autoPlayId && autoPlayId === message.id && !isUser && message.content && !message.streaming) {
      handleSpeak();
    }
  }, [autoPlayId, message.id, message.content]);

  const handleSpeak = () => {
    if (speaking) {
      speaker.stop();
      setSpeaking(false);
      setIsSpeaking(false);
    } else {
      setSpeaking(true);
      setIsSpeaking(true);
      speaker.speak(
        message.content,
        message.language || language,
        () => setSpeaking(true),
        () => { setSpeaking(false); setIsSpeaking(false); },
        () => { setSpeaking(false); setIsSpeaking(false); }
      );
    }
  };

  const handleFeedback = async (rating) => {
    setFeedback(rating);
    if (user) saveFeedback(user.uid, message.id, rating);
  };

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const renderContent = (text) => {
    if (!text) return null;
    // Simple markdown: bold, bullets
    return text.split('\n').map((line, i) => {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="msg-bullet">
            <span className="bullet-dot">•</span>
            <span>{line.replace(/^[•\-]\s/, '')}</span>
          </div>
        );
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="msg-line">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      );
    });
  };

  return (
    <div className={`msg-wrapper ${isUser ? 'msg-wrapper--user' : 'msg-wrapper--ai'}`}>
      {!isUser && (
        <div className={`msg-avatar ${isSpeaking && speaking ? 'msg-avatar--speaking' : ''}`}>
          {isSpeaking && speaking ? '🔊' : '🌾'}
        </div>
      )}
      <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'} ${message.error ? 'msg-bubble--error' : ''}`}>
        <div className={`msg-text ${message.language === 'ta' || message.language === 'hi' ? 'font-tamil' : ''}`}>
          {renderContent(message.content) || (message.streaming ? '...' : '')}
        </div>
        <div className="msg-footer">
          <span className="msg-time">{formatTime(message.timestamp)}</span>
          {!isUser && message.content && !message.streaming && (
            <div className="msg-actions">
              <button
                onClick={handleSpeak}
                className={`msg-action-btn ${speaking ? 'msg-action-btn--active' : ''}`}
                title={speaking ? 'Stop' : 'Read aloud'}
              >
                {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              {feedback === null && (
                <>
                  <button onClick={() => handleFeedback('up')} className="msg-action-btn" title="Helpful">
                    <ThumbsUp size={13} />
                  </button>
                  <button onClick={() => handleFeedback('down')} className="msg-action-btn" title="Not helpful">
                    <ThumbsDown size={13} />
                  </button>
                </>
              )}
              {feedback === 'up' && <span className="feedback-done">👍</span>}
              {feedback === 'down' && <span className="feedback-done">👎</span>}
            </div>
          )}
        </div>
      </div>
      {isUser && <div className="msg-avatar msg-avatar--user">👤</div>}
    </div>
  );
}
