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

export type WeatherRecommendationItem = {
  name: string;
  category_label?: string | null;
};

export type WeatherRecommendationProfile =
  | 'rainy'
  | 'snowy'
  | 'hot'
  | 'cold'
  | 'mild';

export type WeatherRecommendationIcon =
  | 'Sun'
  | 'CloudRain'
  | 'CloudSnow'
  | 'Cloud';

export type WeatherRecommendationMeta = {
  profile: WeatherRecommendationProfile;
  icon: WeatherRecommendationIcon;
  label: string;
  reason: string;
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

type RandomFn = () => number;

const HOT_TEMPERATURE_F = 82;
const COLD_TEMPERATURE_F = 55;

const HOT_CATEGORY_LABELS = new Set(['Fruit Teas']);
const COLD_CATEGORY_LABELS = new Set(['Milk Teas', 'Green & Oolong Teas']);

const HOT_KEYWORDS = ['slush', 'iced', 'fruit tea', 'fruitberry'] as const;
const FRUIT_FLAVOR_KEYWORDS = [
  'mango',
  'strawberry',
  'lychee',
  'peach',
  'pineapple',
  'passionfruit',
  'guava',
  'berry',
] as const;
const COLD_KEYWORDS = [
  'latte',
  'milk',
  'matcha',
  'oolong',
  'coffee',
  'brown sugar',
  'wintermelon',
  'taro',
  'thai',
  'almond',
  'coconut',
  'red bean',
  'caramel',
  'honeydew',
] as const;
const MILD_KEYWORDS = [
  'tea',
  'matcha',
  'milk',
  'coffee',
  'fruit',
  'slush',
  'iced',
] as const;

function matchesKeywords(value: string, keywords: readonly string[]) {
  const normalizedValue = value.toLowerCase();
  return keywords.some((keyword) => normalizedValue.includes(keyword));
}

function pickRandomItem<T>(items: T[], random: RandomFn) {
  if (items.length === 0) return null;

  const index = Math.floor(random() * items.length);
  return items[index] ?? null;
}

function isHotWeatherDrink(item: WeatherRecommendationItem) {
  const categoryLabel = item.category_label ?? '';
  return (
    HOT_CATEGORY_LABELS.has(categoryLabel) ||
    matchesKeywords(item.name, HOT_KEYWORDS) ||
    (categoryLabel !== 'Milk Teas' &&
      matchesKeywords(item.name, FRUIT_FLAVOR_KEYWORDS))
  );
}

function isColdWeatherDrink(item: WeatherRecommendationItem) {
  const categoryLabel = item.category_label ?? '';
  return (
    COLD_CATEGORY_LABELS.has(categoryLabel) ||
    matchesKeywords(item.name, COLD_KEYWORDS)
  );
}

function isMildWeatherDrink(item: WeatherRecommendationItem) {
  return (
    isHotWeatherDrink(item) ||
    isColdWeatherDrink(item) ||
    matchesKeywords(item.name, MILD_KEYWORDS)
  );
}

export function weatherCodeToLabel(code: number | null): string {
  if (code === null) {
    return 'Weather unavailable';
  }

  return weatherCodeLabels[code] ?? 'Weather unavailable';
}

export function getWeatherRecommendationProfile(
  weather: Pick<WeatherSnapshot, 'current'> | null
): WeatherRecommendationProfile {
  const currentTemp = weather?.current.temperatureF;
  const condition = weather?.current.condition.toLowerCase() ?? '';

  if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('thunderstorm')
  ) {
    return 'rainy';
  }

  if (condition.includes('snow') || condition.includes('fog')) {
    return 'snowy';
  }

  if (typeof currentTemp === 'number' && currentTemp >= HOT_TEMPERATURE_F) {
    return 'hot';
  }

  if (typeof currentTemp === 'number' && currentTemp <= COLD_TEMPERATURE_F) {
    return 'cold';
  }

  return 'mild';
}

export function getWeatherRecommendationMeta(
  weather: Pick<WeatherSnapshot, 'current'> | null
): WeatherRecommendationMeta {
  const profile = getWeatherRecommendationProfile(weather);

  switch (profile) {
    case 'rainy':
      return {
        profile,
        icon: 'CloudRain',
        label: 'Rainy Day Pick',
        reason:
          'Rainy weather calls for something smoother and more comforting.',
      };
    case 'snowy':
      return {
        profile,
        icon: 'CloudSnow',
        label: 'Cozy Weather Pick',
        reason:
          'Cool, overcast weather pairs better with richer and cozier drinks.',
      };
    case 'hot':
      return {
        profile,
        icon: 'Sun',
        label: 'Hot Weather Pick',
        reason:
          'Warm weather today makes fruit-forward, icy drinks the better pick.',
      };
    case 'cold':
      return {
        profile,
        icon: 'Cloud',
        label: 'Cold Weather Comfort',
        reason:
          'Cooler air outside makes a richer, cozier drink feel like the right move.',
      };
    case 'mild':
    default:
      return {
        profile: 'mild',
        icon: 'Cloud',
        label: 'House Weather Pick',
        reason: 'Today feels like a good match for a balanced house favorite.',
      };
  }
}

export function pickWeatherRecommendedItem<T extends WeatherRecommendationItem>(
  items: T[],
  weather: Pick<WeatherSnapshot, 'current'> | null,
  random: RandomFn = Math.random
) {
  if (items.length === 0) return null;

  const profile = getWeatherRecommendationProfile(weather);

  let matchingItems: T[];

  switch (profile) {
    case 'rainy':
    case 'snowy':
    case 'cold':
      matchingItems = items.filter(isColdWeatherDrink);
      break;
    case 'hot':
      matchingItems = items.filter(isHotWeatherDrink);
      break;
    case 'mild':
    default:
      matchingItems = items.filter(isMildWeatherDrink);
      break;
  }

  return pickRandomItem(matchingItems.length > 0 ? matchingItems : items, random);
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
