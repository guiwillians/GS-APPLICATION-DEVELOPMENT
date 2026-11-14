// API pública Open-Meteo (sem chave): https://open-meteo.com
// Coordenadas de referência: Santo André - SP (território de demonstração).
const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-23.6639&longitude=-46.5383' +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum' +
  '&timezone=America%2FSao_Paulo&forecast_days=7';

export async function fetchWeather(timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`Falha na API de clima (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.daily) throw new Error('Resposta inesperada da API de clima');
    return {
      fetchedAt: new Date().toISOString(),
      daily: {
        time: json.daily.time,
        tmax: json.daily.temperature_2m_max,
        tmin: json.daily.temperature_2m_min,
        precip: json.daily.precipitation_sum,
      },
    };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tempo esgotado ao consultar o clima');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
