import { DATA, DISTRICTS, METRICS, HORIZON } from '../data/syntheticData';
import { avg, fmt } from '../utils/format';

export function linearRegression(ys) {
  const n = ys.length;
  const xMean = (n - 1) / 2;
  const yMean = avg(ys);
  let sxy = 0;
  let sxx = 0;
  ys.forEach((y, x) => {
    sxy += (x - xMean) * (y - yMean);
    sxx += (x - xMean) * (x - xMean);
  });
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = yMean - slope * xMean;
  let ssRes = 0;
  let ssTot = 0;
  ys.forEach((y, x) => {
    const pred = intercept + slope * x;
    ssRes += (y - pred) * (y - pred);
    ssTot += (y - yMean) * (y - yMean);
  });
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export function forecastSeries(ys, horizon = HORIZON) {
  const reg = linearRegression(ys);
  const predictions = Array.from({ length: horizon }, (_, i) =>
    Math.max(0, reg.intercept + reg.slope * (ys.length + i)),
  );
  return { ...reg, predictions };
}

export function confidenceFrom(r2) {
  const pct = Math.round(Math.min(1, Math.max(0, r2)) * 100);
  const label = pct >= 70 ? 'Alta' : pct >= 40 ? 'Média' : 'Baixa';
  return { pct, label };
}

const TREND_LIMITATIONS = [
  'Modelo simples (regressão linear) que não considera sazonalidade semanal, feriados nem eventos extraordinários.',
  'Os dados são sintéticos, criados para demonstração; não representam medições reais.',
  'A confiança indica o quanto a tendência se ajusta aos últimos 30 dias (R²); não é a probabilidade de o evento ocorrer.',
];

export function buildAlerts(thresholdPct, weather) {
  const alerts = [];

  DISTRICTS.forEach((district) => {
    Object.keys(METRICS).forEach((metric) => {
      const ys = DATA.series[district.id][metric];
      const hist = avg(ys);
      if (hist <= 0) return;
      const f = forecastSeries(ys, HORIZON);
      const predictedMean = avg(f.predictions);
      const variation = ((predictedMean - hist) / hist) * 100;
      if (variation < thresholdPct) return;
      const m = METRICS[metric];
      alerts.push({
        id: `${district.id}-${metric}`,
        kind: 'trend',
        districtId: district.id,
        metric,
        title: `${m.label}: alta prevista em ${district.name}`,
        severity: variation >= 25 ? 'alta' : 'media',
        variationPct: variation,
        historicalMean: hist,
        predictedMean,
        confidence: confidenceFrom(f.r2),
        horizonDays: HORIZON,
        justification:
          `A tendência dos últimos 30 dias indica média de ${fmt(predictedMean, m.decimals)} ${m.unit} ` +
          `nos próximos ${HORIZON} dias, ${fmt(variation, 1)}% acima da média histórica ` +
          `(${fmt(hist, m.decimals)} ${m.unit}).`,
        limitations: TREND_LIMITATIONS,
      });
    });
  });

  if (weather && weather.daily && weather.daily.tmax) {
    const { tmax, precip } = weather.daily;
    const maxT = Math.max(...tmax.filter((v) => v != null));
    const totalRain = precip.filter((v) => v != null).reduce((a, b) => a + b, 0);
    const weatherLimits = [
      'Previsão numérica do Open-Meteo: a incerteza aumenta nos dias mais distantes.',
      'Limiares (calor ≥ 33 °C; chuva acumulada ≥ 60 mm em 7 dias) são ilustrativos e devem ser calibrados pelo órgão local.',
      'Dados de um ponto de referência da cidade; microclimas de cada bairro podem diferir.',
    ];
    if (maxT >= 33) {
      alerts.push({
        id: 'clima-calor',
        kind: 'weather',
        title: 'Calor intenso previsto: pressão sobre água e energia',
        severity: maxT >= 36 ? 'alta' : 'media',
        confidence: { pct: 70, label: 'Média' },
        horizonDays: 7,
        justification: `A previsão aponta máxima de ${fmt(maxT, 1)} °C nos próximos 7 dias. Dias muito quentes costumam elevar o consumo de água e energia.`,
        limitations: weatherLimits,
      });
    }
    if (totalRain >= 60) {
      alerts.push({
        id: 'clima-chuva',
        kind: 'weather',
        title: 'Chuva acumulada elevada: risco para drenagem e resíduos',
        severity: totalRain >= 100 ? 'alta' : 'media',
        confidence: { pct: 65, label: 'Média' },
        horizonDays: 7,
        justification: `A previsão soma ${fmt(totalRain, 0)} mm em 7 dias. Chuva forte pode causar alagamentos, obstrução de bueiros e aumento de chamados.`,
        limitations: weatherLimits,
      });
    }
  }

  const rank = { alta: 0, media: 1 };
  return alerts.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || (b.variationPct || 0) - (a.variationPct || 0),
  );
}
