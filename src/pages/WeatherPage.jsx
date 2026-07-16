// src/pages/WeatherPage.jsx
import { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, RefreshCw, Droplets, Wind, Eye, Thermometer } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getWeatherByLocation, getWeatherByCity, getCurrentPosition } from '../services/weather';
import WeatherCard from '../components/WeatherCard';
import toast from 'react-hot-toast';

const T = {
  en: {
    title: 'Weather & Farm Advisory',
    subtitle: 'Real-time weather for smarter farming decisions',
    searchPlaceholder: 'Enter city (e.g. Madurai)',
    myLocation: 'My Location',
    searching: 'Fetching weather...',
    noData: 'Search a city or use your location',
    error: 'Could not fetch weather. Check internet.',
    cities: 'Quick Cities',
    farmTip: 'Farming Tip',
  },
  ta: {
    title: 'வானிலை & வேளாண் ஆலோசனை',
    subtitle: 'சிறந்த சாகுபடிக்கு நேரடி வானிலை தகவல்',
    searchPlaceholder: 'நகர் உள்ளிடுங்கள் (எ.கா. மதுரை)',
    myLocation: 'என் இடம்',
    searching: 'வானிலை பெறுகிறோம்...',
    noData: 'நகர் தேடுங்கள் அல்லது இடம் பயன்படுத்துங்கள்',
    error: 'வானிலை கிடைக்கவில்லை.',
    cities: 'முக்கிய நகரங்கள்',
    farmTip: 'வேளாண் குறிப்பு',
  },
  hi: {
    title: 'मौसम और किसान सलाह',
    subtitle: 'बेहतर खेती के लिए ताज़ा मौसम जानकारी',
    searchPlaceholder: 'शहर खोजें (जैसे, मदुरई)',
    myLocation: 'मेरी जगह',
    searching: 'मौसम लाया जा रहा है...',
    noData: 'कोई शहर खोजें या जगह उपयोग करें',
    error: 'मौसम नहीं मिला। इंटरनेट जाँचें।',
    cities: 'प्रमुख शहर',
    farmTip: 'खेती की सलाह',
  },
};

const TN_CITIES = ['Madurai', 'Chennai', 'Coimbatore', 'Trichy', 'Salem', 'Thanjavur', 'Vellore', 'Tirunelveli'];

const getFarmTip = (weather, language) => {
  if (!weather) return null;
  const temp = weather.temperature || weather.main?.temp;
  const rain = weather.description?.toLowerCase().includes('rain') || weather.weather?.[0]?.description?.toLowerCase().includes('rain');
  const tips = {
    en: rain
      ? '🌧️ Rain expected — avoid pesticide spraying today. Good day to prepare soil.'
      : temp > 35
      ? '☀️ High heat today — water crops in early morning or evening. Avoid midday watering.'
      : '✅ Good weather for field work. Check soil moisture before irrigation.',
    ta: rain
      ? '🌧️ மழை வாய்ப்பு — இன்று பூச்சிக்கொல்லி தெளிக்க வேண்டாம். மண் தயாரிக்க நல்ல நாள்.'
      : temp > 35
      ? '☀️ அதிக வெப்பம் — காலை அல்லது மாலையில் பயிர்களுக்கு தண்ணீர் பாய்ச்சுங்கள்.'
      : '✅ வேலைக்கு நல்ல வானிலை. நீர்ப்பாசனத்திற்கு முன் மண் ஈரப்பதம் சரிபார்க்கவும்.',
    hi: rain
      ? '🌧️ बारिश की संभावना — आज कीटनाशक न छिड़कें। मिट्टी तैयार करने का अच्छा दिन।'
      : temp > 35
      ? '☀️ आज बहुत गर्मी — सुबह या शाम फसल को पानी दें। दोपहर में सिंचाई न करें।'
      : '✅ खेत काम के लिए अच्छा मौसम। सिंचाई से पहले मिट्टी की नमी जाँचें।',
  };
  return tips[language] || tips.en;
};

export default function WeatherPage() {
  const { language, weatherData, setWeatherData } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState('');
  const t = T[language] || T.en;
  const isNonEn = language !== 'en';

  const fetchWeather = async (city) => {
    setLoading(true);
    try {
      const data = await getWeatherByCity(city, language);
      setWeatherData(data);
      setCurrentCity(city);
    } catch (err) {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchByLocation = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const data = await getWeatherByLocation(pos.coords.latitude, pos.coords.longitude, language);
      setWeatherData(data);
      setCurrentCity(language === 'ta' ? 'உங்கள் இடம்' : language === 'hi' ? 'आपकी जगह' : 'Your Location');
    } catch (err) {
      toast.error('Location access denied. Try searching by city name.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!weatherData) fetchWeather('Madurai'); }, []);
  useEffect(() => { if (currentCity && currentCity !== 'Your Location' && currentCity !== 'உங்கள் இடம்' && currentCity !== 'आपकी जगह') fetchWeather(currentCity); }, [language]);

  const farmTip = getFarmTip(weatherData, language);

  return (
    <div className="weather-page">
      {/* Search bar */}
      <div className="weather-search-area">
        <div className="weather-search-row">
          <div className="weather-search-box">
            <Search size={15} className="search-icon-inner" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && query.trim()) fetchWeather(query.trim()); }}
              placeholder={t.searchPlaceholder}
              className={`weather-search-input ${isNonEn ? 'font-tamil' : ''}`}
            />
          </div>
          <button onClick={() => query.trim() && fetchWeather(query.trim())} disabled={loading} className="weather-search-btn">
            <Search size={16} />
          </button>
          <button onClick={fetchByLocation} disabled={loading} className="weather-loc-btn">
            <MapPin size={15} />
            <span className={isNonEn ? 'font-tamil' : ''}>{t.myLocation}</span>
          </button>
        </div>

        {/* City chips */}
        <div className="city-chips-row">
          {TN_CITIES.map(city => (
            <button key={city} onClick={() => fetchWeather(city)}
              className={`city-chip ${currentCity === city ? 'city-chip--active' : ''}`}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="weather-loading">
          <div className="weather-loading-orb">🌤️</div>
          <p className={isNonEn ? 'font-tamil' : ''}>{t.searching}</p>
        </div>
      ) : weatherData ? (
        <div className="weather-content">
          {/* Location badge */}
          {currentCity && (
            <div className="weather-location-row">
              <MapPin size={13} />
              <span className={isNonEn ? 'font-tamil' : ''}>{currentCity}</span>
              <button onClick={() => fetchWeather(currentCity)} className="weather-refresh">
                <RefreshCw size={12} />
              </button>
            </div>
          )}
          <WeatherCard data={weatherData} />

          {/* Farm advisory tip */}
          {farmTip && (
            <div className="farm-tip-card">
              <div className="farm-tip-label">
                <span>🌱</span>
                <span className={isNonEn ? 'font-tamil' : ''}>{t.farmTip}</span>
              </div>
              <p className={`farm-tip-text ${isNonEn ? 'font-tamil' : ''}`}>{farmTip}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="weather-empty">
          <span>🌦️</span>
          <p className={isNonEn ? 'font-tamil' : ''}>{t.noData}</p>
        </div>
      )}
    </div>
  );
}
