// src/pages/CropGuidePage.jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import { useNavigate } from 'react-router-dom';

const CROPS = [
  { id: 'paddy',      icon: '🌾', en: 'Paddy / Rice',  ta: 'நெல்',            hi: 'धान',       season: 'Jun–Nov, Dec–Mar', soil: 'Clay loam',        water: 'High'   },
  { id: 'sugarcane',  icon: '🎋', en: 'Sugarcane',      ta: 'கரும்பு',        hi: 'गन्ना',      season: 'Jan–Mar',          soil: 'Loam',             water: 'High'   },
  { id: 'banana',     icon: '🍌', en: 'Banana',         ta: 'வாழை',           hi: 'केला',       season: 'Year-round',       soil: 'Rich loam',        water: 'Medium' },
  { id: 'groundnut',  icon: '🥜', en: 'Groundnut',      ta: 'நிலக்கடலை',     hi: 'मूंगफली',    season: 'Jun–Aug',          soil: 'Sandy loam',       water: 'Low'    },
  { id: 'turmeric',   icon: '🟡', en: 'Turmeric',       ta: 'மஞ்சள்',        hi: 'हल्दी',      season: 'Jun–Jul',          soil: 'Well-drained loam',water: 'Medium' },
  { id: 'cotton',     icon: '🌸', en: 'Cotton',         ta: 'பஞ்சு',          hi: 'कपास',       season: 'May–Jun',          soil: 'Black cotton soil',water: 'Medium' },
  { id: 'tomato',     icon: '🍅', en: 'Tomato',         ta: 'தக்காளி',        hi: 'टमाटर',      season: 'Jun–Aug',          soil: 'Loam',             water: 'Medium' },
  { id: 'onion',      icon: '🧅', en: 'Onion',          ta: 'வெங்காயம்',     hi: 'प्याज',      season: 'Oct–Nov',          soil: 'Sandy loam',       water: 'Low'    },
  { id: 'coconut',    icon: '🥥', en: 'Coconut',        ta: 'தேங்காய்',       hi: 'नारियल',     season: 'Year-round',       soil: 'Sandy loam',       water: 'Medium' },
  { id: 'maize',      icon: '🌽', en: 'Maize',          ta: 'மக்காச்சோளம்',  hi: 'मक्का',      season: 'Jun–Jul, Oct–Nov', soil: 'Loam',             water: 'Medium' },
  { id: 'blackgram',  icon: '🫘', en: 'Black Gram',     ta: 'உளுந்து',        hi: 'उड़द',       season: 'Jun–Jul, Nov–Dec', soil: 'Loam',             water: 'Low'    },
  { id: 'wheat',      icon: '🌿', en: 'Wheat',          ta: 'கோதுமை',         hi: 'गेहूं',      season: 'Oct–Nov',          soil: 'Loam / Clay loam', water: 'Medium' },
  { id: 'brinjal',    icon: '🍆', en: 'Brinjal',        ta: 'கத்திரிக்காய்',  hi: 'बैंगन',      season: 'Year-round',       soil: 'Sandy loam',       water: 'Medium' },
  { id: 'chilli',     icon: '🌶️', en: 'Chilli',        ta: 'மிளகாய்',        hi: 'मिर्च',      season: 'Jun–Aug',          soil: 'Loam',             water: 'Low'    },
];

const QUESTIONS = {
  en: ['How to grow {crop}?', 'Diseases of {crop}?', 'Best fertilizer for {crop}?', 'How to increase {crop} yield?'],
  ta: ['{crop} எப்படி பயிரிடுவது?', '{crop} நோய்கள் என்ன?', '{crop} க்கு சிறந்த உரம்?', '{crop} மகசூல் அதிகரிக்க?'],
  hi: ['{crop} कैसे उगाएं?', '{crop} की बीमारियां?', '{crop} के लिए कौन सी खाद?', '{crop} की पैदावार कैसे बढ़ाएं?'],
};

const WATER_COLOR = { High: '#3ab5f5', Medium: '#48c96a', Low: '#f0b429' };

export default function CropGuidePage() {
  const { language } = useApp();
  const { sendMessage } = useChat();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const isNonEn = language !== 'en';

  const T = {
    en: { title: 'Crop Guide', sub: 'Tap a crop for AI farming advice', searchPlaceholder: 'Search crops...', season: 'Season', soil: 'Soil', water: 'Water', askAI: 'Ask AI' },
    ta: { title: 'பயிர் வழிகாட்டி', sub: 'AI ஆலோசனைக்கு ஒரு பயிரை தேர்ந்தெடுங்கள்', searchPlaceholder: 'பயிர் தேடுங்கள்...', season: 'சீசன்', soil: 'மண்', water: 'நீர்', askAI: 'AI கேளுங்கள்' },
    hi: { title: 'फसल गाइड', sub: 'AI से खेती की सलाह के लिए फसल चुनें', searchPlaceholder: 'फसल खोजें...', season: 'मौसम', soil: 'मिट्टी', water: 'पानी', askAI: 'AI से पूछें' },
  }[language] || { title: 'Crop Guide', sub: 'Tap a crop', searchPlaceholder: 'Search...', season: 'Season', soil: 'Soil', water: 'Water', askAI: 'Ask AI' };

  const getName = (crop) => crop[language] || crop.en;

  const filtered = CROPS.filter(c => {
    const q = search.toLowerCase();
    return !q || c.en.toLowerCase().includes(q) || (c[language] || '').includes(q) || c.id.includes(q);
  });

  const handleAsk = (crop, template) => {
    const name = getName(crop);
    sendMessage(template.replace('{crop}', name), false);
    navigate('/');
  };

  return (
    <div className="crop-guide-page">
      <div className="page-header-v2">
        <h2 className={`page-title-v2 ${isNonEn ? 'font-tamil' : ''}`}>{T.title}</h2>
        <p className={`page-sub-v2 ${isNonEn ? 'font-tamil' : ''}`}>{T.sub}</p>
      </div>

      {/* Search */}
      <div className="crop-search-wrap">
        <Search size={15} className="crop-search-icon" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={T.searchPlaceholder}
          className={`crop-search-input ${isNonEn ? 'font-tamil' : ''}`}
        />
      </div>

      {/* Grid */}
      <div className="crop-grid-v2">
        {filtered.map(crop => (
          <button
            key={crop.id}
            onClick={() => setSelected(selected?.id === crop.id ? null : crop)}
            className={`crop-tile ${selected?.id === crop.id ? 'crop-tile--active' : ''}`}
          >
            <span className="crop-tile-icon">{crop.icon}</span>
            <span className={`crop-tile-name ${isNonEn ? 'font-tamil' : ''}`}>{getName(crop)}</span>
          </button>
        ))}
      </div>

      {/* Selected crop detail */}
      {selected && (
        <div className="crop-detail-card">
          <div className="crop-detail-header">
            <span className="crop-detail-icon">{selected.icon}</span>
            <div>
              <h3 className={`crop-detail-name ${isNonEn ? 'font-tamil' : ''}`}>{getName(selected)}</h3>
              <span className="crop-detail-en">{selected.en}</span>
            </div>
          </div>

          <div className="crop-meta-grid">
            <div className="crop-meta-cell">
              <span className="crop-meta-key">📅 {T.season}</span>
              <span className="crop-meta-val">{selected.season}</span>
            </div>
            <div className="crop-meta-cell">
              <span className="crop-meta-key">🌍 {T.soil}</span>
              <span className="crop-meta-val">{selected.soil}</span>
            </div>
            <div className="crop-meta-cell">
              <span className="crop-meta-key">💧 {T.water}</span>
              <span className="crop-meta-val" style={{ color: WATER_COLOR[selected.water] }}>{selected.water}</span>
            </div>
          </div>

          <p className={`crop-ask-heading ${isNonEn ? 'font-tamil' : ''}`}>🤖 {T.askAI}:</p>
          <div className="crop-questions-list">
            {(QUESTIONS[language] || QUESTIONS.en).map((q, i) => (
              <button
                key={i}
                onClick={() => handleAsk(selected, q)}
                className={`crop-question-btn ${isNonEn ? 'font-tamil' : ''}`}
              >
                {q.replace('{crop}', getName(selected))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
