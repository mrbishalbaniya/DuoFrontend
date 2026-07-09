export type WeatherPlace = {
  name: string;
  local_names?: Record<string, string>;
  country: string;
  state?: string;
};

export type WeatherCurrent = {
  dt?: number;
  temp?: number;
  feels_like?: number;
  pressure?: number;
  humidity?: number;
  visibility?: number;
  uvi?: number;
  clouds?: number;
  wind_speed?: number;
  wind_deg?: number;
  condition?: string;
  description?: string;
  icon?: string;
  sunrise?: number;
  sunset?: number;
};

export type WeatherHourly = {
  dt: number;
  temp: number;
  pop?: number;
  humidity?: number;
  wind_speed?: number;
  condition?: string;
  icon?: string;
};

export type WeatherDaily = {
  date: string;
  temp_min: number;
  temp_max: number;
  pop?: number;
  condition?: string;
  icon?: string;
};

export type WeatherSummary = {
  lat: number;
  lon: number;
  place: WeatherPlace | null;
  onecall: {
    current?: WeatherCurrent;
    hourly?: WeatherHourly[];
    daily?: WeatherDaily[];
    alerts?: unknown[];
    _source?: string;
  };
  air_pollution?: {
    list?: Array<{
      dt: number;
      main: { aqi: number };
      components: Record<string, number>;
    }>;
  };
};

export type WeatherGridPoint = WeatherCurrent & { lat: number; lon: number };

export type WeatherPopupState = {
  lat: number;
  lng: number;
  loading: boolean;
  error: string | null;
  data: WeatherSummary | null;
};
