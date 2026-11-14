// Dados SINTÉTICOS para demonstração (não representam medições reais).
// Gerados de forma determinística para que o app se comporte sempre igual.

export const DAYS = 30;
export const HORIZON = 7;

export const DISTRICTS = [
  { id: 'centro', name: 'Centro' },
  { id: 'jardim-flores', name: 'Jardim das Flores' },
  { id: 'vila-nova', name: 'Vila Nova' },
  { id: 'rural-norte', name: 'Zona Rural Norte' },
];

export const METRICS = {
  water: { label: 'Água', unit: 'm³/dia', icon: '💧', decimals: 0 },
  energy: { label: 'Energia', unit: 'MWh/dia', icon: '⚡', decimals: 1 },
  waste: { label: 'Resíduos', unit: 't/dia', icon: '♻️', decimals: 1 },
  demand: { label: 'Chamados', unit: 'chamados/dia', icon: '📞', decimals: 0 },
};

const PARAMS = {
  centro: {
    water: [1200, 0.2], energy: [52, 0.01], waste: [85, 0.05], demand: [140, 0.3],
  },
  'jardim-flores': {
    water: [800, 14], energy: [31, 0.04], waste: [52, 0.1], demand: [90, 0.2],
  },
  'vila-nova': {
    water: [950, 0.5], energy: [38, 0.02], waste: [60, 1.4], demand: [110, 2.5],
  },
  'rural-norte': {
    water: [400, -1], energy: [9, 0.1], waste: [8, 0], demand: [25, 0.1],
  },
};

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function labelFor(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function generate() {
  const dates = Array.from({ length: DAYS }, (_, i) => labelFor(i - (DAYS - 1)));
  const series = {};
  DISTRICTS.forEach((d, di) => {
    series[d.id] = {};
    Object.keys(METRICS).forEach((m, mi) => {
      const [base, trend] = PARAMS[d.id][m];
      const rand = mulberry32(1000 + di * 10 + mi);
      series[d.id][m] = Array.from({ length: DAYS }, (_, i) => {
        const weekly = base * 0.05 * Math.sin((2 * Math.PI * (i % 7)) / 7);
        const noise = base * 0.03 * (rand() - 0.5) * 2;
        const v = Math.max(0, base + trend * i + weekly + noise);
        return Math.round(v * 10) / 10;
      });
    });
  });
  return { dates, series };
}

export const DATA = generate();

export function getSeries(districtId, metric) {
  if (districtId === 'all') {
    return Array.from({ length: DAYS }, (_, i) =>
      DISTRICTS.reduce((sum, d) => sum + DATA.series[d.id][metric][i], 0),
    );
  }
  return DATA.series[districtId][metric];
}

export function futureLabels(horizon = HORIZON) {
  return Array.from({ length: horizon }, (_, i) => labelFor(i + 1));
}
