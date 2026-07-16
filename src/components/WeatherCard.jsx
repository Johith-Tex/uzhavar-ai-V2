// src/components/WeatherCard.jsx
import { Droplets, Wind, Thermometer, Eye } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const DAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ta: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'],
};

export default function WeatherCard({ data }) {
  const { language } = useApp();
  if (!data) return null;
  const { current, forecast, farmingTip } = data;
  const days = DAYS[language];

  return (
    <div className="weather-card">
      {/* Current weather */}
      <div className="weather-current">
        <div className="weather-icon-big">{current.icon}</div>
        <div className="weather-now">
          <span className="weather-temp">{current.temp}°C</span>
          <span className={`weather-cond ${language === 'ta' ? 'font-tamil' : ''}`}>{current.condition}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="weather-stats">
        <div className="weather-stat">
          <Droplets size={16} />
          <span>{current.humidity}%</span>
        </div>
        <div className="weather-stat">
          <Wind size={16} />
          <span>{current.windSpeed} km/h</span>
        </div>
        <div className="weather-stat">
          <Thermometer size={16} />
          <span>{current.precipitation} mm</span>
        </div>
      </div>

      {/* Farming tip */}
      <div className={`weather-tip ${language === 'ta' ? 'font-tamil' : ''}`}>
        {farmingTip}
      </div>

      {/* 5-day forecast */}
      <div className="forecast-row">
        {forecast.map((day, i) => {
          const date = new Date(day.date);
          const dayName = i === 0
            ? (language === 'ta' ? 'இன்று' : 'Today')
            : days[date.getDay()];
          return (
            <div key={day.date} className="forecast-day">
              <span className="forecast-label">{dayName}</span>
              <span className="forecast-icon">{day.icon}</span>
              <span className="forecast-high">{day.high}°</span>
              <span className="forecast-low">{day.low}°</span>
              {day.rain > 0 && <span className="forecast-rain">💧{day.rain}mm</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
