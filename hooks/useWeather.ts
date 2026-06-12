import { useState, useEffect } from "react";
import * as Location from "expo-location";

export type WeatherData = {
  temperature: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  iconName: string;
  cityName: string;
  country: string;
};

export type WeatherStatus = "idle" | "loading" | "denied" | "ready" | "error";

// Mapa de codigos WMO (Organizacion Meteorologica Mundial) a descripciones
// legibles e iconos Ionicons. Los rangos son acumulativos: si code <= 48
// ya paso los filtros 0 y 3, entonces es niebla. Ver tabla completa en:
// https://open-meteo.com/en/docs#weathervariables
function interpretCode(code: number): { condition: string; iconName: string } {
  if (code === 0) return { condition: "Despejado", iconName: "sunny-outline" };
  if (code <= 3) return { condition: "Parcialmente nublado", iconName: "partly-sunny-outline" };
  if (code <= 48) return { condition: "Niebla", iconName: "cloud-outline" };
  if (code <= 67) return { condition: "Lluvia", iconName: "rainy-outline" };
  if (code <= 77) return { condition: "Nieve", iconName: "snow-outline" };
  if (code <= 82) return { condition: "Chubascos", iconName: "rainy-outline" };
  return { condition: "Tormenta", iconName: "thunderstorm-outline" };
}

// Hook que solicita permiso de ubicacion, obtiene coordenadas y consulta
// Open-Meteo (sin API key). Efecto secundario: pide permiso "whenInUse"
// al montarse. Retorna estado del clima y datos cuando estan disponibles.
export function useWeather(): { status: WeatherStatus; weather: WeatherData | null } {
  const [status, setStatus] = useState<WeatherStatus>("idle");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Cadena asincrona: permisos → ubicacion → API externa → geocoder reverso.
    // Cada paso chequea `cancelled` para evitar setState despues del unmount.
    async function load() {
      try {
        setStatus("loading");

        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (perm !== "granted") {
          setStatus("denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        const { latitude, longitude } = location.coords;

        // Open-Meteo no requiere API key. current=temperature_2m,weather_code
        // devuelve solo los datos puntuales del momento actual (no el forecast
        // completo). timezone=auto ajusta la hora a la zona horaria del dispositivo.
        // https://open-meteo.com/en/docs
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
        );
        if (!response.ok) throw new Error("weather_fetch_failed");
        const json = await response.json();
        if (cancelled) return;

        const temperature = Math.round(json.current.temperature_2m as number);
        const apparentTemp = Math.round(json.current.apparent_temperature as number);
        const humidity = json.current.relative_humidity_2m as number;
        const windSpeed = Math.round(json.current.wind_speed_10m as number);
        const weatherCode = json.current.weather_code as number;
        const { condition, iconName } = interpretCode(weatherCode);

        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (cancelled) return;

        const cityName = place?.city ?? place?.subregion ?? place?.region ?? "";
        const country = place?.country ?? "";

        setWeather({ temperature, apparentTemp, humidity, windSpeed, condition, iconName, cityName, country });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { status, weather };
}
