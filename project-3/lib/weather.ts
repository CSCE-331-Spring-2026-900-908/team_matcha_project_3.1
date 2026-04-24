export type ForecastDay = {
  date: string;
  minTemp: number;
  maxTemp: number;
  weatherCode: number;
  condition: string;
};

export type WeatherSnapshot = {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
    label: string;
  };
  current: {
    temperatureF: number | null;
    windMph: number | null;
    weatherCode: number | null;
    condition: string;
  };
  forecast: ForecastDay[];
  fetchedAt: string;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
};

const weatherCodeLabels: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function weatherCodeToLabel(code: number | null): string {
  if (code === null) {
    return 'Weather unavailable';
  }

  return weatherCodeLabels[code] ?? 'Weather unavailable';
}

type LoadWeatherOptions = {
  latitude: number;
  longitude: number;
  timezone: string;
  forecastDays: number;
  locationLabel: string;
};

export async function loadWeatherSnapshot(
  options: LoadWeatherOptions
): Promise<WeatherSnapshot> {
  const { latitude, longitude, timezone, forecastDays, locationLabel } = options;

  const openMeteoUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit` +
    `&wind_speed_unit=mph` +
    `&timezone=${encodeURIComponent(timezone)}` +
    `&forecast_days=${forecastDays + 1}`;

  const response = await fetch(openMeteoUrl, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch weather provider data');
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  const weatherCode =
    typeof payload.current?.weather_code === 'number'
      ? payload.current.weather_code
      : null;

  const forecast: ForecastDay[] = [];
  if (
    payload.daily?.time &&
    payload.daily.temperature_2m_min &&
    payload.daily.temperature_2m_max &&
    payload.daily.weather_code
  ) {
    for (let i = 1; i < payload.daily.time.length; i += 1) {
      const date = payload.daily.time[i];
      const minTemp = payload.daily.temperature_2m_min[i];
      const maxTemp = payload.daily.temperature_2m_max[i];
      const code = payload.daily.weather_code[i];

      if (
        typeof date === 'string' &&
        typeof minTemp === 'number' &&
        typeof maxTemp === 'number' &&
        typeof code === 'number'
      ) {
        forecast.push({
          date,
          minTemp,
          maxTemp,
          weatherCode: code,
          condition: weatherCodeToLabel(code),
        });
      }
    }
  }

  return {
    location: {
      latitude,
      longitude,
      timezone,
      label: locationLabel,
    },
    current: {
      temperatureF:
        typeof payload.current?.temperature_2m === 'number'
          ? payload.current.temperature_2m
          : null,
      windMph:
        typeof payload.current?.wind_speed_10m === 'number'
          ? payload.current.wind_speed_10m
          : null,
      weatherCode,
      condition: weatherCodeToLabel(weatherCode),
    },
    forecast: forecast.slice(0, forecastDays),
    fetchedAt: new Date().toISOString(),
  };
}
