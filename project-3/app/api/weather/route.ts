import { NextResponse } from 'next/server';
import { loadWeatherSnapshot } from '@/lib/weather';

const DEFAULT_LATITUDE = 30.628;
const DEFAULT_LONGITUDE = -96.3344;
const DEFAULT_TIMEZONE = 'America/Chicago';
const DEFAULT_FORECAST_DAYS = 3;
const DEFAULT_LOCATION_LABEL = 'College Station, TX';

function parseNumberParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function parseIntegerParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const latitude = parseNumberParam(searchParams.get('lat'), DEFAULT_LATITUDE, -90, 90);
  const longitude = parseNumberParam(
    searchParams.get('lon'),
    DEFAULT_LONGITUDE,
    -180,
    180
  );
  const forecastDays = parseIntegerParam(
    searchParams.get('days'),
    DEFAULT_FORECAST_DAYS,
    1,
    7
  );

  if (latitude === null || longitude === null || forecastDays === null) {
    return NextResponse.json(
      {
        error:
          'Invalid weather query. lat must be -90..90, lon must be -180..180, days must be 1..7.',
      },
      { status: 400 }
    );
  }

  const timezone = searchParams.get('timezone') || DEFAULT_TIMEZONE;
  const locationLabel = searchParams.get('label') || DEFAULT_LOCATION_LABEL;

  try {
    const snapshot = await loadWeatherSnapshot({
      latitude,
      longitude,
      timezone,
      forecastDays,
      locationLabel,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Failed to fetch weather snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to load weather data.' },
      { status: 502 }
    );
  }
}
