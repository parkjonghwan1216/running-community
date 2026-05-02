'use client';
import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  feelsLike: number;
  precip: number;
  wcode: number;
  wind: number;
  pm25: number;
  grade: 'A' | 'B' | 'C' | 'D';
  condition: string;
}

const GRADE_LABEL: Record<string, string> = {
  A: '달리기 최적',
  B: '달리기 좋음',
  C: '달리기 보통',
  D: '달리기 자제',
};

const WEATHER_ICON: Record<number, string> = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function getWeatherIcon(code: number): string {
  return WEATHER_ICON[code] ?? (code <= 3 ? '🌤️' : code <= 48 ? '🌫️' : code <= 67 ? '🌧️' : '❄️');
}

function getPm25Label(pm25: number): string {
  if (pm25 < 15) return '좋음';
  if (pm25 < 35) return '보통';
  if (pm25 < 75) return '나쁨';
  return '매우 나쁨';
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    let lat = 37.5665;
    let lon = 126.978;

    const loadWeather = (la: number, lo: number) => {
      setLoading(true);
      fetch(`/api/weather?lat=${la}&lon=${lo}`)
        .then((r) => r.json())
        .then((d) => setData(d.error ? null : d))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    };

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        setLoc({ lat, lon });
        loadWeather(lat, lon);
      },
      () => loadWeather(lat, lon),
      { timeout: 3000 },
    );
  }, []);

  if (loading) {
    return (
      <div className="weather-widget skeleton-box" style={{ height: 96, borderRadius: 14 }} />
    );
  }

  if (!data) return null;

  return (
    <div className={`weather-widget weather-widget--${data.grade.toLowerCase()}`}>
      <div className="weather-widget__left">
        <span className="weather-icon">{getWeatherIcon(data.wcode)}</span>
        <div>
          <div className="weather-temp">{data.temp}°C</div>
          <div className="weather-cond">{data.condition} · 체감 {data.feelsLike}°</div>
        </div>
      </div>
      <div className="weather-widget__right">
        <div className={`running-grade running-grade--${data.grade.toLowerCase()}`}>
          <span className="running-grade__letter">{data.grade}</span>
          <span className="running-grade__label">{GRADE_LABEL[data.grade]}</span>
        </div>
        <div className="weather-details">
          <span>PM2.5 {data.pm25} ({getPm25Label(data.pm25)})</span>
          <span className="dot-sep">바람 {data.wind}km/h</span>
          <span className="dot-sep">강수 {data.precip}%</span>
        </div>
        {loc && (
          <div className="weather-loc">📍 현재 위치 기준</div>
        )}
        {!loc && (
          <div className="weather-loc">📍 서울 기준</div>
        )}
      </div>
    </div>
  );
}
