// src/services/weather.js
// Weather service using Open-Meteo API (100% free, no API key needed)

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather codes
const WMO_CODES = {
  0: { en: 'Clear sky', ta: 'தெளிவான வானம்', icon: '☀️' },
  1: { en: 'Mainly clear', ta: 'பெரும்பாலும் தெளிவு', icon: '🌤️' },
  2: { en: 'Partly cloudy', ta: 'பகுதியளவு மேகமூட்டம்', icon: '⛅' },
  3: { en: 'Overcast', ta: 'மேகமூட்டம்', icon: '☁️' },
  45: { en: 'Foggy', ta: 'மூடுபனி', icon: '🌫️' },
  51: { en: 'Light drizzle', ta: 'இலேசான தூறல்', icon: '🌦️' },
  61: { en: 'Slight rain', ta: 'சிறிய மழை', icon: '🌧️' },
  63: { en: 'Moderate rain', ta: 'மிதமான மழை', icon: '🌧️' },
  65: { en: 'Heavy rain', ta: 'கனமழை', icon: '⛈️' },
  80: { en: 'Rain showers', ta: 'மழை மாறி மாறி', icon: '🌦️' },
  95: { en: 'Thunderstorm', ta: 'இடிமழை', icon: '⛈️' },
};

export const getWeatherByLocation = async (lat, lon, language = 'en') => {
  const res = await fetch(
    `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=Asia%2FKolkata&forecast_days=5`
  );
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  return formatWeather(data, language);
};

export const geocodeCity = async (city) => {
  const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!res.ok) throw new Error('Geocode failed');
  const data = await res.json();
  return data.results?.[0] || null;
};

export const getWeatherByCity = async (city, language = 'en') => {
  const location = await geocodeCity(city);
  if (!location) throw new Error(`City not found: ${city}`);
  return getWeatherByLocation(location.latitude, location.longitude, language);
};

const formatWeather = (data, language = 'en') => {
  const c = data.current;
  const d = data.daily;
  const code = c.weathercode;
  const condition = WMO_CODES[code] || WMO_CODES[0];

  const forecast = d.time.slice(0, 5).map((date, i) => ({
    date,
    high: Math.round(d.temperature_2m_max[i]),
    low: Math.round(d.temperature_2m_min[i]),
    rain: d.precipitation_sum[i],
    uv: d.uv_index_max[i],
    icon: (WMO_CODES[d.weathercode[i]] || WMO_CODES[0]).icon,
    condition: (WMO_CODES[d.weathercode[i]] || WMO_CODES[0])[language] || condition.en,
  }));

  const farmingTip = getFarmingAdvice(c, d, language);

  return {
    current: {
      temp: Math.round(c.temperature_2m),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      condition: condition[language] || condition.en,
      icon: condition.icon,
      precipitation: c.precipitation,
    },
    forecast,
    farmingTip,
  };
};

const getFarmingAdvice = (current, daily, language = 'en') => {
  const rain = daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);
  const temp = current.temperature_2m;

  if (language === 'ta') {
    if (rain > 20) return '⚠️ அடுத்த சில நாட்களில் அதிக மழை எதிர்பார்க்கப்படுகிறது. வயலில் தண்ணீர் தேங்காமல் வடிகால் ஏற்பாடு செய்யுங்கள்.';
    if (rain < 2 && temp > 35) return '🌿 வெப்பம் அதிகம் உள்ளது. பயிர்களுக்கு காலை அல்லது மாலை நேரத்தில் நீர் பாய்ச்சுங்கள்.';
    if (temp < 20) return '❄️ குளிர் வானிலை உள்ளது. பூச்சி நோய்கள் அதிகரிக்கலாம். பயிர்களை கவனமாக கண்காணிக்கவும்.';
    return '✅ வானிலை விவசாயத்திற்கு சாதகமாக உள்ளது. வழக்கமான பராமரிப்பு பணிகளை மேற்கொள்ளுங்கள்.';
  }

  if (rain > 20) return '⚠️ Heavy rain expected in next 3 days. Ensure proper drainage in your fields to prevent waterlogging.';
  if (rain < 2 && temp > 35) return '🌿 Hot and dry weather. Water your crops in early morning or evening to reduce evaporation.';
  if (temp < 20) return '❄️ Cool weather. Monitor crops for fungal diseases which thrive in cold, moist conditions.';
  return '✅ Weather looks favorable for farming. Good time for regular crop maintenance activities.';
};

// Browser geolocation wrapper
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      enableHighAccuracy: false,
    });
  });
