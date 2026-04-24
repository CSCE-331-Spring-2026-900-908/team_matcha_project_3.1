'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

type ForecastDay = {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
};

type WeatherApiResponse = {
  location: {
    label: string;
  };
  current: {
    temperatureF: number | null;
    windMph: number | null;
    condition: string;
  };
  forecast: ForecastDay[];
};

export default function Home() {
  const { t } = useLanguage();
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [currentCondition, setCurrentCondition] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [weatherLocationLabel, setWeatherLocationLabel] = useState("College Station, TX");

  const portalLinks = [
    {
      href: "/menu",
      label: "Menu",
    },
    {
      href: "/employee",
      label: "Employee",
    },
    {
      href: "/manager",
      label: "Manager",
    },
    {
      href: "/kiosk",
      label: "Kiosk",
    }
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        setIsLoadingWeather(true);
        setWeatherError(null);

        const response = await fetch("/api/weather");

        if (!response.ok) {
          throw new Error(t("Failed to load weather."));
        }

        const data: WeatherApiResponse = await response.json();

        if (isMounted) {
          setCurrentTemp(
            typeof data.current?.temperatureF === "number" ? data.current.temperatureF : null
          );
          setWindSpeed(typeof data.current?.windMph === "number" ? data.current.windMph : null);
          setCurrentCondition(data.current?.condition ?? t("Weather unavailable"));
          setForecast(Array.isArray(data.forecast) ? data.forecast : []);
          setWeatherLocationLabel(data.location?.label || "College Station, TX");
        }
      } catch {
        if (isMounted) {
          setWeatherError(t("Failed to load weather."));
          setCurrentCondition(t("Weather unavailable"));
        }
      } finally {
        if (isMounted) {
          setIsLoadingWeather(false);
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    []
  );

  return (
    <main className="min-h-screen bg-[#eef1ec] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center rounded-[28px] border border-[#c8d1c4] bg-[#f8faf7] p-8 shadow-[0_18px_48px_rgba(31,37,32,0.08)] sm:p-12">
        <header>
          <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#4a554a]">
            {t("Team Matcha POS")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-[#1f2520]">
            {t("Portal")}
          </h1>
        </header>

        <nav className="mt-10 grid gap-6 md:grid-cols-3">
          {portalLinks.map((portalLink) => (
            <Link
              key={portalLink.href}
              href={portalLink.href}
              className={`flex min-h-[160px] items-center justify-center rounded-[24px] border border-[#b9c5b6] bg-white px-6 py-6 text-center shadow-[0_8px_24px_rgba(31,37,32,0.06)] transition hover:border-[#829080] hover:bg-[#f4f7f3] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                portalLink.label === "Kiosk" ? "md:col-start-2" : ""
              }`}
            >
              <h2 className="text-3xl font-bold text-[#1f2520]">
                {t(portalLink.label)}
              </h2>
            </Link>
          ))}
        </nav>

        <section className="mt-10 rounded-[24px] border border-[#b9c5b6] bg-white p-6 shadow-[0_8px_24px_rgba(31,37,32,0.06)]">
          <h2 className="text-2xl font-bold text-[#1f2520]">{t("Local Weather Forecast")}</h2>
          <p className="mt-1 text-sm font-medium text-[#4a554a]">{weatherLocationLabel}</p>

          {isLoadingWeather ? (
            <p className="mt-4 text-base text-[#4a554a]">{t("Loading weather...")}</p>
          ) : null}

          {!isLoadingWeather && weatherError ? (
            <p className="mt-4 rounded-[16px] border border-[#e7c0b8] bg-[#fff4f1] px-4 py-3 text-base font-medium text-[#8b4a3a]">
              {weatherError}
            </p>
          ) : null}

          {!isLoadingWeather && !weatherError ? (
            <div className="mt-4">
              <div className="rounded-[18px] border border-[#dce5d8] bg-[#f8faf7] px-4 py-4">
                <p className="text-sm uppercase tracking-[0.16em] text-[#4a554a]">{t("Current conditions")}</p>
                <p className="mt-2 text-3xl font-bold">
                  {currentTemp !== null ? `${Math.round(currentTemp)}°F` : t("Weather unavailable")}
                </p>
                <p className="mt-1 text-base text-[#4a554a]">
                  {currentCondition ?? t("Weather unavailable")}
                  {windSpeed !== null ? ` • ${t("Wind")} ${Math.round(windSpeed)} mph` : ""}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {forecast.map((day) => (
                  <div key={day.date} className="rounded-[16px] border border-[#dce5d8] bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-[#4a554a]">
                      {dateFormatter.format(new Date(`${day.date}T12:00:00`))}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1f2520]">
                      {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                    </p>
                    <p className="mt-1 text-sm text-[#4a554a] break-words">
                      {day.condition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
