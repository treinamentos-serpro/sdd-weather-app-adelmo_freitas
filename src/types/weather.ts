export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  condition: string;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  precipitationMm?: number | null;
  pressureHpa?: number | null;
}

export interface ForecastDay {
  date: string;
  available: boolean;
  weatherCode: number | null;
  condition: string | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  precipitationProbabilityPercent: number | null;
}

export interface WeatherData {
  city: City | null;
  timezone: string;
  current: CurrentWeather | null;
  forecast: ForecastDay[];
}
