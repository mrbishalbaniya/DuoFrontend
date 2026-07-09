"use client";

import type { WeatherSummary } from "@/lib/weather/types";

function iconUrl(icon?: string) {
  if (!icon) return null;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function fmtTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function aqiLabel(aqi?: number) {
  if (!aqi) return "—";
  const labels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
  return labels[aqi] ?? String(aqi);
}

type Props = {
  lat: number;
  lng: number;
  loading: boolean;
  error: string | null;
  data: WeatherSummary | null;
  visible: boolean;
  mood: string;
  onClose: () => void;
};

export default function WeatherPopup({
  loading,
  error,
  data,
  visible,
  mood,
  onClose,
}: Props) {
  const current = data?.onecall?.current;
  const hourly = data?.onecall?.hourly?.slice(0, 8) ?? [];
  const daily = data?.onecall?.daily?.slice(0, 7) ?? [];
  const air = data?.air_pollution?.list?.[0];
  const place = data?.place;
  const moodClass = mood.includes("rain")
    ? "rain"
    : mood.includes("snow")
      ? "snow"
      : mood.includes("thunder")
        ? "storm"
        : mood.includes("cloud")
          ? "clouds"
          : mood.includes("fog") || mood.includes("mist")
            ? "fog"
            : "clear";

  return (
    <div
      className={`weather-popup ios-glass pointer-events-auto weather-popup--${moodClass} ${
        visible ? "weather-popup--visible" : ""
      }`}
    >
      <header className="weather-popup__header">
        <div className="min-w-0 flex-1">
          <h3 className="weather-popup__title">
            {place?.name ? `${place.name}${place.country ? `, ${place.country}` : ""}` : "Weather"}
          </h3>
          <p className="weather-popup__subtitle">Live conditions · Snap Map style</p>
        </div>
        <button type="button" className="weather-popup__close" aria-label="Close" onClick={onClose}>
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </header>

      {loading ? (
        <p className="weather-popup__loading">
          <span className="weather-popup__spinner" />
          Loading live conditions…
        </p>
      ) : error ? (
        <p className="weather-popup__error">{error}</p>
      ) : current ? (
        <div className="weather-popup__body">
          <div className="weather-popup__current">
            {iconUrl(current.icon) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl(current.icon)!} alt="" className="weather-popup__icon" />
            ) : null}
            <div>
              <p className="weather-popup__temp">{Math.round(current.temp ?? 0)}°C</p>
              <p className="weather-popup__feels">
                Feels {Math.round(current.feels_like ?? current.temp ?? 0)}°C ·{" "}
                {current.description ?? current.condition}
              </p>
            </div>
          </div>

          <div className="weather-popup__grid">
            <div>
              <span>Wind</span>
              <strong>{current.wind_speed?.toFixed(1) ?? "—"} m/s</strong>
            </div>
            <div>
              <span>Humidity</span>
              <strong>{current.humidity ?? "—"}%</strong>
            </div>
            <div>
              <span>Pressure</span>
              <strong>{current.pressure ?? "—"} hPa</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>
                {current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : "—"}
              </strong>
            </div>
            <div>
              <span>UV Index</span>
              <strong>{current.uvi ?? "—"}</strong>
            </div>
            <div>
              <span>AQI</span>
              <strong>{aqiLabel(air?.main?.aqi)}</strong>
            </div>
            <div>
              <span>Clouds</span>
              <strong>{current.clouds ?? "—"}%</strong>
            </div>
            <div>
              <span>Sun</span>
              <strong>
                {fmtTime(current.sunrise)} – {fmtTime(current.sunset)}
              </strong>
            </div>
          </div>

          {hourly.length > 0 ? (
            <section className="weather-popup__section">
              <h4>Hourly</h4>
              <div className="weather-popup__hourly">
                {hourly.map((h) => (
                  <div key={h.dt} className="weather-popup__hour">
                    <span>{fmtTime(h.dt)}</span>
                    <strong>{Math.round(h.temp)}°</strong>
                    <span>{Math.round((h.pop ?? 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {daily.length > 0 ? (
            <section className="weather-popup__section">
              <h4>7-Day</h4>
              <div className="weather-popup__daily">
                {daily.map((d) => (
                  <div key={d.date} className="weather-popup__day">
                    <span>{d.date}</span>
                    <span>{d.condition}</span>
                    <strong>
                      {Math.round(d.temp_min)}° / {Math.round(d.temp_max)}°
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <p className="weather-popup__updated">
            Updated {current.dt ? new Date(current.dt * 1000).toLocaleString() : "just now"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
