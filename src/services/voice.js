// src/services/voice.js
// Tamil & Hindi TTS: Sarvam AI Bulbul v3 — natural Indian voices, correct "nga"/"zh" pronunciation
// English TTS: Web Speech API (fast, no network needed)
// STT: Web Speech API with slang-aware recognition
//
// Sarvam AI: https://dashboard.sarvam.ai — free ₹1000 credits on signup
// Bulbul v3 supports Tamil script directly — no Tanglish needed!

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || '';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

// Best voices per language (Sarvam bulbul:v3)
const SARVAM_VOICE = {
  ta: 'kavitha',   // Natural Tamil female voice
  hi: 'kavitha',   // Same warm voice for Hindi
};

export const SUPPORTED_LANGS = {
  ta: { code: 'ta-IN', name: 'தமிழ்', label: 'Tamil', flag: '🌿', ttsLang: 'ta-IN' },
  hi: { code: 'hi-IN', name: 'हिंदी', label: 'Hindi', flag: '🌻', ttsLang: 'hi-IN' },
  en: { code: 'en-IN', name: 'English', label: 'English', flag: '🌾', ttsLang: 'en-IN' },
};

// ─── Text Cleaning ─────────────────────────────────────────────────────────

function cleanForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/•/g, ',')
    .replace(/[_~`]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .replace(/[\(\)]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Split text into chunks safe for Sarvam TTS (≤500 chars each).
 * Sarvam supports longer chunks than Google TTS — fewer round trips.
 */
function splitIntoChunks(text, maxLen = 450) {
  const clean = cleanForSpeech(text).substring(0, 2000);
  const sentences = clean.split(/(?<=[.!?।\u0964\u0965])\s+/u);

  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      current = s.length <= maxLen ? s : s.substring(0, maxLen);
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(c => c.length > 1);
}

function isSecureOrigin() {
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function waitForVoices(timeout = 3000) {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (voices.length > 0) return resolve(voices);
    const timer = setTimeout(() => resolve([]), timeout);
    window.speechSynthesis?.addEventListener('voiceschanged', () => {
      clearTimeout(timer);
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
}

async function getWebSpeechVoice(language) {
  const voices = await waitForVoices();
  const langCode = SUPPORTED_LANGS[language]?.code;
  return (
    voices.find(v => v.lang === langCode && !v.localService) ||
    voices.find(v => v.lang === langCode) ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

// ─── Sarvam Bulbul v3 TTS ──────────────────────────────────────────────────
// Sends Tamil/Hindi text to Sarvam, gets back base64 WAV, plays via Audio.
// Correctly pronounces Tamil characters: ங (nga), ழ (zh), ண (retroflex n), etc.

async function sarvamTTSChunk(text, langCode, speaker, abortSignal) {
  if (abortSignal?.aborted) return null;
  if (!SARVAM_API_KEY) throw new Error('VITE_SARVAM_API_KEY missing');

  const res = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: langCode,   // e.g. "ta-IN"
      speaker: speaker,                  // e.g. "kavitha"
      model: 'bulbul:v3',
      pace: 1.05,                        // Slightly faster for conversational feel
      speech_sample_rate: 22050,
      enable_preprocessing: true,        // Handles numbers, currencies, English words in Tamil text
    }),
    signal: abortSignal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sarvam TTS ${res.status}: ${err}`);
  }

  const data = await res.json();
  // Sarvam returns { audios: ["base64wav..."] }
  const base64 = data?.audios?.[0];
  if (!base64) throw new Error('Sarvam returned no audio');

  // Decode base64 WAV → Blob → Object URL → Audio element
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function playObjectURL(url, abortSignal) {
  return new Promise((resolve) => {
    if (abortSignal?.aborted) { URL.revokeObjectURL(url); return resolve(); }
    const audio = new Audio(url);
    const cleanup = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        audio.pause();
        audio.src = '';
        cleanup();
      }, { once: true });
    }
    audio.play().catch(cleanup);
  });
}

// ─── VoiceRecognizer ──────────────────────────────────────────────────────────

export class VoiceRecognizer {
  constructor() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.webSpeechSupported = !!SR;
    this.supported = this.webSpeechSupported || !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    this._SR = SR;
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this._active = false;
    this._retryCount = 0;
    this._maxRetries = 3;
  }

  _build() {
    const rec = new this._SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    return rec;
  }

  _bestAlternative(results, language) {
    const last = results[results.length - 1];
    if (language !== 'ta' && language !== 'hi') return last[0].transcript;
    const scriptRange = language === 'ta'
      ? /[\u0B80-\u0BFF]/   // Tamil Unicode block
      : /[\u0900-\u097F]/;  // Devanagari
    for (let i = 0; i < last.length; i++) {
      if (scriptRange.test(last[i].transcript)) return last[i].transcript;
    }
    return last[0].transcript;
  }

  start(language = 'ta', onInterim, onFinal, onError, onEnd) {
    if (!this.supported) { onError?.('Voice input needs Chrome or Edge browser.'); return; }
    if (!isSecureOrigin()) {
      onError?.(
        language === 'ta' ? 'குரல் உள்ளீட்டிற்கு HTTPS தேவை.' :
        language === 'hi' ? 'वॉइस के लिए HTTPS चाहिए।' :
        'Voice input requires HTTPS or localhost.'
      );
      return;
    }
    this._active = true;
    this._retryCount = 0;

    // Use Sarvam STT for Indian languages if key is available
    if ((language === 'ta' || language === 'hi') && SARVAM_API_KEY) {
      this._startSarvam(language, onInterim, onFinal, onError, onEnd);
    } else if (this.webSpeechSupported) {
      this._attemptWebSpeech(language, onInterim, onFinal, onError, onEnd);
    } else {
      onError?.('STT not supported.');
    }
  }

  async _startSarvam(language, onInterim, onFinal, onError, onEnd) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      
      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        
        // If it was just cancelled without needing transcription
        if (!this._active) {
          onEnd?.();
          return;
        }

        onInterim?.(language === 'ta' ? 'புரிந்துகொள்கிறேன்...' : 'समझ रहा हूँ...');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          // For saaras:v3, we can optionally pass model parameter
          formData.append('model', 'saaras:v3');

          const res = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: { 'api-subscription-key': SARVAM_API_KEY },
            body: formData
          });

          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          const transcript = data.transcript || '';

          if (this._active) {
            this._active = false;
            onFinal?.(transcript.trim());
          }
        } catch (err) {
          console.error('Sarvam STT Error:', err);
          if (this._active) {
            onError?.(language === 'ta' ? 'குரலை புரிந்துகொள்ள முடியவில்லை.' : 'आवाज़ समझ नहीं आई।');
          }
        } finally {
          this._active = false;
          onEnd?.();
        }
      };
      
      this.mediaRecorder.start();
    } catch (err) {
      console.error('Mic Error:', err);
      onError?.(language === 'ta' ? 'மைக்ரோஃபோன் அனுமதி தேவை.' : 'माइक की अनुमति दें।');
    }
  }

  _attemptWebSpeech(language, onInterim, onFinal, onError, onEnd) {
    if (this.recognition) { try { this.recognition.abort(); } catch (_) {} }
    this.recognition = this._build();
    this.recognition.lang = SUPPORTED_LANGS[language]?.code || 'ta-IN';

    this.recognition.onresult = (event) => {
      this._retryCount = 0;
      const transcript = this._bestAlternative(event.results, language);
      const isFinal = event.results[event.results.length - 1].isFinal;
      if (isFinal) { this._active = false; onFinal?.(transcript.trim()); }
      else { onInterim?.(transcript); }
    };

    this.recognition.onerror = (event) => {
      if (!this._active) return;
      if ((event.error === 'network' || event.error === 'no-speech') && this._retryCount < this._maxRetries) {
        this._retryCount++;
        setTimeout(() => { if (this._active) this._attemptWebSpeech(language, onInterim, onFinal, onError, onEnd); }, 600 * this._retryCount);
        return;
      }
      this._active = false;
      const msgs = {
        'no-speech': language === 'ta' ? 'பேச்சு கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.' : language === 'hi' ? 'आवाज़ नहीं सुनाई दी।' : 'No speech detected.',
        'audio-capture': language === 'ta' ? 'மைக்ரோஃபோன் கண்டுபிடிக்கவில்லை.' : language === 'hi' ? 'माइक नहीं मिला।' : 'Microphone not found.',
        'not-allowed': language === 'ta' ? 'மைக்ரோஃபோன் அனுமதி தேவை.' : language === 'hi' ? 'माइक की अनुमति दें।' : 'Microphone permission denied.',
        'network': language === 'ta' ? 'நெட்வொர்க் பிழை.' : language === 'hi' ? 'नेटवर्क त्रुटि।' : 'Network error.',
      };
      onError?.(msgs[event.error] || `Voice error: ${event.error}`);
    };

    this.recognition.onend = () => { this._active = false; onEnd?.(); };

    try {
      this.recognition.start();
    } catch (_) {
      try { this.recognition.abort(); } catch (__) {}
      setTimeout(() => { if (this._active) this._attemptWebSpeech(language, onInterim, onFinal, onError, onEnd); }, 400);
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      // Intentionally keep _active = true so that onstop triggers transcription
      this.mediaRecorder.stop();
    } else {
      this._active = false;
      if (this.webSpeechSupported && this.recognition) { try { this.recognition.stop(); } catch (_) {} }
    }
  }

  cancel() {
    this._active = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.webSpeechSupported && this.recognition) { try { this.recognition.abort(); } catch (_) {} }
  }
}

// ─── VoiceSpeaker ──────────────────────────────────────────────────────────────
// Tamil  → Sarvam Bulbul v3 (natural Tamil voice, correct "nga"/"zh" sounds)
// Hindi  → Sarvam Bulbul v3 (natural Hindi voice)
// English → Web Speech API (fast, no network round-trip)

export class VoiceSpeaker {
  constructor() {
    this.webSpeechSupported = 'speechSynthesis' in window;
    this._speaking = false;
    this._abortController = null;
    this._resumeTimer = null;
  }

  async speak(text, language = 'en', onStart, onEnd, onError) {
    this.stop();
    await new Promise(r => setTimeout(r, 80));

    const chunks = splitIntoChunks(text);
    if (!chunks.length) { onEnd?.(); return; }

    this._speaking = true;
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    onStart?.();

    try {
      if ((language === 'ta' || language === 'hi') && SARVAM_API_KEY) {
        // Tamil & Hindi → Sarvam Bulbul v3 (natural Indian voices)
        await this._speakWithSarvam(chunks, language, signal);
      } else if (language === 'ta' || language === 'hi') {
        // Fallback if no Sarvam key: Web Speech with Indian English voice
        // (at least phonetics are closer than pure US English)
        console.warn('No SARVAM_API_KEY — falling back to Web Speech. Add key for natural Tamil voice.');
        const voice = await getWebSpeechVoice('en');
        if (this.webSpeechSupported) {
          await this._speakWithWebSpeech(chunks, 'en', voice, signal);
        }
      } else {
        // English → Web Speech API
        const voice = await getWebSpeechVoice('en');
        if (this.webSpeechSupported) {
          await this._speakWithWebSpeech(chunks, 'en', voice, signal);
        }
      }
    } catch (err) {
      if (!signal.aborted) onError?.(String(err));
    } finally {
      this._cleanup();
      if (!signal.aborted) onEnd?.();
    }
  }

  stop() {
    if (this._abortController) { this._abortController.abort(); this._abortController = null; }
    this._cleanup();
    if (this.webSpeechSupported) { try { window.speechSynthesis.cancel(); } catch (_) {} }
  }

  isSpeaking() { return this._speaking; }

  // ── Sarvam Bulbul v3 engine (Tamil + Hindi) ───────────────────────────────
  async _speakWithSarvam(chunks, language, signal) {
    const langCode = SUPPORTED_LANGS[language]?.ttsLang || 'ta-IN';
    const speaker = SARVAM_VOICE[language] || 'anushka';

    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) break;
      try {
        const url = await sarvamTTSChunk(chunks[i], langCode, speaker, signal);
        if (url && !signal.aborted) {
          await playObjectURL(url, signal);
          // Natural pause between sentences
          if (!signal.aborted && i < chunks.length - 1) {
            await new Promise(r => setTimeout(r, 150));
          }
        }
      } catch (err) {
        if (!signal.aborted) console.warn('Sarvam chunk error:', err.message);
        // Skip broken chunk and continue
      }
    }
  }

  // ── Web Speech engine (English fallback) ─────────────────────────────────
  async _speakWithWebSpeech(chunks, language, voice, signal) {
    const langCode = SUPPORTED_LANGS[language]?.code || 'en-IN';

    // Chrome 15-second pause bug workaround
    this._resumeTimer = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused && !signal.aborted)
        window.speechSynthesis.resume();
    }, 5000);

    for (const chunk of chunks) {
      if (signal.aborted) break;
      await new Promise((resolve) => {
        const utt = new SpeechSynthesisUtterance(chunk);
        utt.lang = langCode;
        utt.rate = 0.9;
        utt.pitch = 1.05;
        utt.volume = 1.0;
        if (voice) utt.voice = voice;

        const cleanup = () => { signal.removeEventListener('abort', onAbort); resolve(); };
        const onAbort = () => { window.speechSynthesis.cancel(); cleanup(); };
        utt.onend = cleanup;
        utt.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') console.warn('TTS error:', e.error); cleanup(); };
        signal.addEventListener('abort', onAbort, { once: true });
        window.speechSynthesis.speak(utt);
      });
      if (!signal.aborted) await new Promise(r => setTimeout(r, 60));
    }
  }

  _cleanup() {
    this._speaking = false;
    clearInterval(this._resumeTimer);
    this._resumeTimer = null;
  }
}

export const recognizer = new VoiceRecognizer();
export const speaker = new VoiceSpeaker();
