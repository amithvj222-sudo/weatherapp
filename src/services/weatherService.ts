/**
 * Weather Service using Open-Meteo API (Free, no key required)
 */

export interface WeatherData {
  current: {
    temp: number;
    weatherCode: number;
    isDay: boolean;
    windSpeed: number;
    humidity: number;
    apparentTemp: number;
  };
  hourly: {
    time: string[];
    temp: number[];
    precipProb: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    weatherCode: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface ClimateData {
  years: number[];
  avgTemp: number[];
  precipSum: number[];
}

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
  
  const response = await fetch(url);
  const data = await response.json();

  return {
    current: {
      temp: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      windSpeed: data.current.wind_speed_10m,
      humidity: data.current.relative_humidity_2m,
      apparentTemp: data.current.apparent_temperature,
    },
    hourly: {
      time: data.hourly.time,
      temp: data.hourly.temperature_2m,
      precipProb: data.hourly.precipitation_probability,
    },
    daily: {
      time: data.daily.time,
      tempMax: data.daily.temperature_2m_max,
      tempMin: data.daily.temperature_2m_min,
      weatherCode: data.daily.weather_code,
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
    }
  };
};

export const fetchClimateTrends = async (lat: number, lon: number): Promise<ClimateData> => {
  // fetching historical data for the last 10 years to show trends
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0];
  
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Aggregate by year
  const yearlyData: Record<number, { temps: number[], precip: number[] }> = {};
  
  data.daily.time.forEach((time: string, index: number) => {
    const year = new Date(time).getFullYear();
    if (!yearlyData[year]) yearlyData[year] = { temps: [], precip: [] };
    if (data.daily.temperature_2m_mean[index] !== null) yearlyData[year].temps.push(data.daily.temperature_2m_mean[index]);
    if (data.daily.precipitation_sum[index] !== null) yearlyData[year].precip.push(data.daily.precipitation_sum[index]);
  });
  
  const years = Object.keys(yearlyData).map(Number).sort();
  const avgTemp = years.map(y => {
    const temps = yearlyData[y].temps;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
  });
  const precipSum = years.map(y => {
    const precip = yearlyData[y].precip;
    return precip.reduce((a, b) => a + b, 0);
  });

  return { years, avgTemp, precipSum };
};

export const getWeatherDescription = (code: number): string => {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown';
}
