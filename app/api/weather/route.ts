import { NextRequest, NextResponse } from 'next/server';

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat') ?? '37.5665';
  const lon = req.nextUrl.searchParams.get('lon') ?? '126.9780';

  // Validate lat/lon are numeric
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const [weatherRes, aqRes] = await Promise.all([
      fetch(
        `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m` +
          `&timezone=Asia%2FSeoul`,
        { next: { revalidate: 1800 } },
      ),
      fetch(
        `${AQ_URL}?latitude=${lat}&longitude=${lon}` +
          `&current=pm2_5,us_aqi` +
          `&timezone=Asia%2FSeoul`,
        { next: { revalidate: 1800 } },
      ),
    ]);

    if (!weatherRes.ok || !aqRes.ok) {
      return NextResponse.json({ error: '날씨 정보를 가져올 수 없습니다' }, { status: 502 });
    }

    const weather = await weatherRes.json();
    const aq = await aqRes.json();

    const current = weather.current ?? {};
    const aqCurrent = aq.current ?? {};

    const temp: number = current.temperature_2m ?? 0;
    const feelsLike: number = current.apparent_temperature ?? 0;
    const precip: number = current.precipitation_probability ?? 0;
    const wcode: number = current.weathercode ?? 0;
    const wind: number = current.windspeed_10m ?? 0;
    const pm25: number = aqCurrent.pm2_5 ?? 0;

    const grade = getRunningGrade(temp, pm25, precip, wcode);

    return NextResponse.json({
      temp: Math.round(temp),
      feelsLike: Math.round(feelsLike),
      precip,
      wcode,
      wind: Math.round(wind),
      pm25: Math.round(pm25 * 10) / 10,
      grade,
      condition: weatherCodeLabel(wcode),
    });
  } catch {
    return NextResponse.json({ error: '날씨 정보를 가져올 수 없습니다' }, { status: 502 });
  }
}

function getRunningGrade(
  temp: number,
  pm25: number,
  precip: number,
  wcode: number,
): 'A' | 'B' | 'C' | 'D' {
  const hasThunder = wcode >= 95;
  const heavyRain = wcode >= 65 && wcode <= 67;
  const snow = (wcode >= 71 && wcode <= 77) || (wcode >= 85 && wcode <= 86);

  if (hasThunder || pm25 >= 75 || temp <= -5 || temp >= 35) return 'D';
  if (heavyRain || snow || pm25 >= 35 || temp < 0 || temp >= 30) return 'C';
  if (pm25 >= 15 || precip >= 50 || temp < 5 || temp >= 25) return 'B';
  return 'A';
}

function weatherCodeLabel(code: number): string {
  if (code === 0) return '맑음';
  if (code <= 3) return '구름 조금';
  if (code <= 48) return '안개';
  if (code <= 55) return '이슬비';
  if (code <= 67) return '비';
  if (code <= 77) return '눈';
  if (code <= 82) return '소나기';
  if (code <= 86) return '눈 소나기';
  return '뇌우';
}
