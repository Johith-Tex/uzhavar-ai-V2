// src/pages/DiseaseAnalyzerPage.jsx
// Crop & Soil Disease Analyzer — upload photo OR live camera capture
// → Groq vision (llama-4-scout-17b-16e-instruct) diagnoses in Tamil
// → Sarvam Bulbul v3 TTS reads the diagnosis aloud

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Volume2, VolumeX, RefreshCw, Microscope, History, Trash2 } from 'lucide-react';
import { saveDiagnosisResult, getDiagnosisHistory, deleteDiagnosisScan, compressImageForStorage } from '../services/firebase';
import { speaker } from '../services/voice';
import { useApp } from '../contexts/AppContext';

// ── Groq vision config ───────────────────────────────────────────────────────
const GROQ_API_KEY  = import.meta.env.VITE_GROQ_API_KEY || '';
const VISION_MODEL  = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Groq vision model

// ── System prompt for disease diagnosis ─────────────────────────────────────
const DISEASE_SYSTEM = `You are an expert agricultural scientist and plant pathologist.
Analyze the provided crop/soil image and respond ONLY in colloquial spoken Tamil (தமிழ்).
Use simple farmer-friendly language — NOT formal academic Tamil.

Your response MUST follow this structure (in Tamil):

1. நோய் / பிரச்சினை: [Disease/problem name in Tamil + English in brackets]
2. காரணம்: [2-3 sentences on cause]
3. அறிகுறிகள்: [What symptoms are visible]
4. தீர்வு: [3-4 practical solutions a farmer can do immediately]
5. தடுப்பு முறை: [How to prevent it next season]

Use colloquial Tamil:
- "தண்ணி குடுங்க" not "தண்ணீர் வழங்குங்கள்"
- "ரொம்ப நல்லா இருக்கும்" not "மிகவும் பயனுள்ளதாக இருக்கும்"
- Address as "அண்ணா" or "ஐயா"
Keep total response under 200 words for TTS readability.
If the image is NOT a crop/plant/soil, say: "இது பயிர் அல்லது மண் படம் இல்லை. பயிர் படம் எடுத்து அனுப்புங்க அண்ணா."`;

// ── Image → base64 ───────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── UI strings ───────────────────────────────────────────────────────────────
const UI = {
  ta: {
    title: 'நோய் கண்டறிதல்',
    sub: 'பயிர் / மண் படம் கொடுங்க — நோயை கண்டுபிடிச்சு தீர்வு சொல்றோம்',
    upload: 'படம் பதிவேற்று',
    camera: 'கேமரா',
    analyze: 'நோய் கண்டறி',
    analyzing: 'பகுப்பாய்வு செய்கிறோம்...',
    listen: 'கேளு',
    stop: 'நிறுத்து',
    retry: 'மீண்டும் முயற்சி',
    tapHint: 'படம் எடு அல்லது பதிவேற்று',
    resultTitle: 'நோய் அறிக்கை',
    noKey: 'Groq API key இல்லை. .env கோப்பை சரிபார்க்கவும்.',
    capture: 'படம் எடு',
    recapture: 'மீண்டும் எடு',
    switchCamera: 'கேமரா மாற்று',
    history: 'முந்தைய ஸ்கேன்கள்',
    noHistory: 'இதுவரை ஸ்கேன் இல்லை',
    saved: 'சேமிக்கப்பட்டது ✓',
    deleteConfirm: 'இந்த ஸ்கேனை நீக்கவா?',
  },
  en: {
    title: 'Disease Analyzer',
    sub: 'Upload or capture a crop/soil photo — AI diagnoses in Tamil',
    upload: 'Upload Photo',
    camera: 'Camera',
    analyze: 'Analyze',
    analyzing: 'Analyzing...',
    listen: 'Listen',
    stop: 'Stop',
    retry: 'Retry',
    tapHint: 'Take a photo or upload',
    resultTitle: 'Diagnosis Report',
    noKey: 'Groq API key missing. Check .env file.',
    capture: 'Capture',
    recapture: 'Retake',
    switchCamera: 'Flip Camera',
    history: 'Scan History',
    noHistory: 'No scans yet',
    saved: 'Saved ✓',
    deleteConfirm: 'Delete this scan?',
  },
  hi: {
    title: 'रोग पहचान',
    sub: 'फसल / मिट्टी की फोटो दें — बीमारी पहचानकर इलाज बताएंगे',
    upload: 'फोटो अपलोड',
    camera: 'कैमरा',
    analyze: 'जांचें',
    analyzing: 'जांच हो रही है...',
    listen: 'सुनें',
    stop: 'रोकें',
    retry: 'फिर कोशिश',
    tapHint: 'फोटो लें या अपलोड करें',
    resultTitle: 'रोग रिपोर्ट',
    noKey: 'Groq API key नहीं मिला।',
    capture: 'खींचें',
    recapture: 'दोबारा लें',
    switchCamera: 'कैमरा बदलें',
    history: 'पिछले स्कैन',
    noHistory: 'अभी कोई स्कैन नहीं',
    saved: 'सेव हो गया ✓',
    deleteConfirm: 'यह स्कैन हटाएं?',
  },
};

// ── Severity badge colour ────────────────────────────────────────────────────
function getSeverityColor(text) {
  const t = text.toLowerCase();
  if (t.includes('தீவிர') || t.includes('அதிக') || t.includes('serious') || t.includes('severe'))
    return 'var(--red)';
  if (t.includes('மிதமான') || t.includes('moderate'))
    return 'var(--gold)';
  return 'var(--accent)';
}

export default function DiseaseAnalyzerPage() {
  const { language, isSpeaking, setIsSpeaking } = useApp();
  const t = UI[language] || UI.en;

  // ── State ──────────────────────────────────────────────────────────────────
  const [mode, setMode]           = useState('idle');   // idle | camera | preview | analyzing | result | error
  const [imageDataUrl, setImageDataUrl] = useState(''); // data:image/... for preview
  const [imageBase64, setImageBase64]   = useState(''); // raw base64 for API
  const [diagnosis, setDiagnosis] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [speaking, setSpeaking]   = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // back camera default

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fileInputRef  = useRef(null);
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing = facingMode) => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode('camera');
    } catch (err) {
      setErrorMsg('கேமரா அனுமதி தேவை / Camera permission denied.');
      setMode('error');
    }
  }, [facingMode, stopStream]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64  = dataUrl.split(',')[1];
    setImageDataUrl(dataUrl);
    setImageBase64(base64);
    stopStream();
    setMode('preview');
  }, [stopStream]);

  // Stop stream when leaving camera mode
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    const url = URL.createObjectURL(file);
    setImageDataUrl(url);
    setImageBase64(b64);
    setMode('preview');
    e.target.value = '';
  };

  // ── Groq Vision API call ────────────────────────────────────────────────────
  const analyze = async () => {
    if (!imageBase64) return;
    if (!GROQ_API_KEY) { setErrorMsg(t.noKey); setMode('error'); return; }

    setMode('analyzing');
    setDiagnosis('');

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            { role: 'system', content: DISEASE_SYSTEM },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
                {
                  type: 'text',
                  text: 'இந்த பயிர் / மண் படத்தை பகுப்பாய்வு செய்து நோய் கண்டறிந்து தீர்வு சொல்லுங்க.',
                },
              ],
            },
          ],
          max_tokens: 600,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      setDiagnosis(text);
      setMode('result');
    } catch (err) {
      setErrorMsg(err.message || 'பகுப்பாய்வு தோல்வி / Analysis failed.');
      setMode('error');
    }
  };

  // ── Sarvam TTS ──────────────────────────────────────────────────────────────
  const handleSpeak = () => {
    if (speaking) {
      speaker.stop();
      setSpeaking(false);
      setIsSpeaking(false);
    } else {
      setSpeaking(true);
      setIsSpeaking(true);
      speaker.speak(
        diagnosis,
        'ta',
        () => {},
        () => { setSpeaking(false); setIsSpeaking(false); },
        () => { setSpeaking(false); setIsSpeaking(false); }
      );
    }
  };

  const reset = () => {
    speaker.stop();
    setSpeaking(false);
    setIsSpeaking(false);
    setImageDataUrl('');
    setImageBase64('');
    setDiagnosis('');
    setErrorMsg('');
    stopStream();
    setMode('idle');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="disease-page">

      {/* Header */}
      <div className="disease-header">
        <div className="disease-header-icon">🔬</div>
        <div>
          <h2 className={`disease-title font-tamil`}>{t.title}</h2>
          <p className={`disease-sub font-tamil`}>{t.sub}</p>
        </div>
      </div>

      {/* ── IDLE: action buttons ─────────────────────────────────────── */}
      {mode === 'idle' && (
        <div className="disease-actions">
          <button className="disease-action-btn disease-action-btn--camera"
            onClick={() => startCamera()}>
            <Camera size={32} />
            <span className="font-tamil">{t.camera}</span>
            <span className="disease-action-hint font-tamil">நேரடி கேமரா</span>
          </button>
          <button className="disease-action-btn disease-action-btn--upload"
            onClick={() => fileInputRef.current?.click()}>
            <Upload size={32} />
            <span className="font-tamil">{t.upload}</span>
            <span className="disease-action-hint font-tamil">கேலரியில் இருந்து</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Tip cards */}
          <div className="disease-tips">
            {[
              { icon: '🌿', text: 'இலை படம் தெளிவாக எடுங்கள்' },
              { icon: '🌱', text: 'மண் நெருக்கமாக பார்க்கவும்' },
              { icon: '☀️', text: 'நல்ல வெளிச்சத்தில் படம் எடுங்கள்' },
            ].map((tip, i) => (
              <div key={i} className="disease-tip-card">
                <span>{tip.icon}</span>
                <span className="font-tamil">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CAMERA: live viewfinder ──────────────────────────────────── */}
      {mode === 'camera' && (
        <div className="disease-camera-wrap">
          <video ref={videoRef} className="disease-video" playsInline muted autoPlay />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Crop overlay guide */}
          <div className="camera-overlay">
            <div className="camera-frame" />
            <p className="camera-hint font-tamil">பயிரை சதுரத்தில் வையுங்கள்</p>
          </div>

          <div className="camera-controls">
            <button className="cam-ctrl-btn" onClick={flipCamera} title={t.switchCamera}>
              <RefreshCw size={20} />
            </button>
            <button className="cam-capture-btn" onClick={capturePhoto}>
              <Camera size={26} />
              <span className="font-tamil">{t.capture}</span>
            </button>
            <button className="cam-ctrl-btn cam-ctrl-btn--cancel" onClick={reset}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW: show image + analyze button ─────────────────────── */}
      {mode === 'preview' && (
        <div className="disease-preview-wrap">
          <img src={imageDataUrl} alt="Preview" className="disease-preview-img" />
          <div className="disease-preview-actions">
            <button className="disease-retake-btn" onClick={reset}>
              <RefreshCw size={16} />
              <span className="font-tamil">{t.recapture}</span>
            </button>
            <button className="disease-analyze-btn" onClick={analyze}>
              <Microscope size={18} />
              <span className="font-tamil">{t.analyze}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYZING: spinner ───────────────────────────────────────── */}
      {mode === 'analyzing' && (
        <div className="disease-analyzing">
          <div className="analyzing-ring" />
          <img src={imageDataUrl} alt="" className="disease-analyzing-img" />
          <div className="analyzing-text">
            <Loader2 size={20} className="spin-icon" />
            <span className="font-tamil">{t.analyzing}</span>
          </div>
          <div className="analyzing-steps">
            {['படம் பகுப்பாய்வு...', 'நோய் கண்டறிதல்...', 'தீர்வு தயாரிக்கிறோம்...'].map((s, i) => (
              <span key={i} className="analyzing-step font-tamil"
                style={{ animationDelay: `${i * 0.8}s` }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT: diagnosis card ───────────────────────────────────── */}
      {mode === 'result' && (
        <div className="disease-result-wrap">
          {/* Thumbnail */}
          <img src={imageDataUrl} alt="" className="disease-result-thumb" />

          {/* Report card */}
          <div className="disease-report-card">
            <div className="report-card-header">
              <span className="report-card-icon">📋</span>
              <h3 className="font-tamil report-card-title">{t.resultTitle}</h3>
              {/* TTS button */}
              <button
                className={`report-speak-btn ${speaking ? 'report-speak-btn--active' : ''}`}
                onClick={handleSpeak}
                title={speaking ? t.stop : t.listen}
              >
                {speaking
                  ? <><VolumeX size={15} /><span className="font-tamil">{t.stop}</span></>
                  : <><Volume2 size={15} /><span className="font-tamil">{t.listen}</span></>}
              </button>
            </div>

            {/* Speaking animation bar */}
            {speaking && (
              <div className="report-speaking-bar">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rsb-bar"
                    style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}

            {/* Diagnosis text — render section headers styled */}
            <div className="report-body font-tamil">
              {diagnosis.split('\n').map((line, i) => {
                const isHeader = /^[0-9]+\./.test(line.trim()) ||
                  ['நோய்', 'காரணம்', 'அறிகுறி', 'தீர்வு', 'தடுப்பு'].some(k => line.includes(k + ':'));
                return line.trim() ? (
                  <p key={i} className={isHeader ? 'report-section-head' : 'report-section-body'}>
                    {line}
                  </p>
                ) : <div key={i} className="report-spacer" />;
              })}
            </div>

            {/* Action buttons */}
            <div className="report-footer">
              <button className="report-retry-btn" onClick={reset}>
                <Camera size={15} />
                <span className="font-tamil">புதிய படம்</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────────── */}
      {mode === 'error' && (
        <div className="disease-error">
          <span className="disease-error-icon">⚠️</span>
          <p className="font-tamil disease-error-msg">{errorMsg}</p>
          <button className="disease-retry-btn" onClick={reset}>
            <RefreshCw size={15} />
            <span className="font-tamil">{t.retry}</span>
          </button>
        </div>
      )}

    </div>
  );
}
