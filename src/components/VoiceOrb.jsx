// src/components/VoiceOrb.jsx — Animated voice button for illiterate farmers
import { useEffect, useState } from 'react';

export default function VoiceOrb({ isListening, isSpeaking, onClick, disabled, language }) {
  const [ripples, setRipples] = useState([]);
  const [frame, setFrame] = useState(0);

  // Ripple animation when listening or speaking
  useEffect(() => {
    if (!isListening && !isSpeaking) { setRipples([]); return; }
    const interval = setInterval(() => {
      const id = Date.now();
      setRipples(prev => [...prev.slice(-3), { id, scale: 0 }]);
    }, 700);
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  // Waveform animation
  useEffect(() => {
    if (!isListening && !isSpeaking) return;
    const raf = requestAnimationFrame(function loop() {
      setFrame(f => f + 1);
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [isListening, isSpeaking]);

  const label = {
    ta: { idle: 'தட்டி பேசுங்கள்', listening: 'கேட்கிறேன்...', speaking: 'பதில் சொல்கிறேன்...' },
    hi: { idle: 'दबाकर बोलें', listening: 'सुन रहा हूँ...', speaking: 'जवाब दे रहा हूँ...' },
    en: { idle: 'Tap to Speak', listening: 'Listening...', speaking: 'Speaking...' },
  }[language] || { idle: 'Tap to Speak', listening: 'Listening...', speaking: 'Speaking...' };

  const state = isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle';
  const emoji = state === 'listening' ? '🎙️' : state === 'speaking' ? '🔊' : '🎤';

  // Waveform bars
  const bars = 7;
  const waveHeights = Array.from({ length: bars }, (_, i) => {
    if (state === 'idle') return 0.3;
    const phase = (frame * 0.08) + (i * 0.9);
    return 0.3 + 0.7 * Math.abs(Math.sin(phase));
  });

  return (
    <div className="voice-orb-container">
      {/* Ripple rings */}
      {ripples.map(r => (
        <div key={r.id} className={`orb-ripple orb-ripple--${state}`} />
      ))}

      {/* Main orb button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`voice-orb voice-orb--${state}`}
        aria-label={label[state]}
      >
        {/* Waveform */}
        {state !== 'idle' ? (
          <div className="orb-wave">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className="orb-bar"
                style={{ height: `${Math.round(h * 28)}px`, opacity: 0.5 + h * 0.5 }}
              />
            ))}
          </div>
        ) : (
          <span className="orb-icon">{emoji}</span>
        )}
      </button>

      {/* Label below */}
      <p className={`orb-label orb-label--${state} ${language !== 'en' ? 'font-tamil' : ''}`}>
        {label[state]}
      </p>
    </div>
  );
}
