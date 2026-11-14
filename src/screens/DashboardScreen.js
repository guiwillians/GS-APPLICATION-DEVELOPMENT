import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import BarChart from '../components/BarChart';
import { useApp } from '../state/AppContext';
import { DATA, DISTRICTS, METRICS, HORIZON, getSeries, futureLabels } from '../data/syntheticData';
import { forecastSeries } from '../services/forecast';
import { avg, fmt } from '../utils/format';
import { colors, spacing } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { alerts, decisionByAlert, weather, weatherStatus, weatherError, refreshWeather } = useApp();
  const [districtId, setDistrictId] = useState('all');
  const [metric, setMetric] = useState('water');

  const m = METRICS[metric];
  const series = getSeries(districtId, metric);
  const reg = forecastSeries(series, HORIZON);
  const dates = DATA.dates;
  const fut = futureLabels(HORIZON);
  const chartData = [
    ...series.slice(-14).map((v, i) => ({ label: dates[dates.length - 14 + i], value: v })),
    ...reg.predictions.map((v, i) => ({ label: fut[i], value: v, predicted: true })),
  ];

  const pending = alerts.filter((a) => !decisionByAlert[a.id]).length;
  const districtName = districtId === 'all' ? 'Cidade toda' : DISTRICTS.find((d) => d.id === districtId).name;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="Resumo para o gestor">
        <Text style={styles.big} accessibilityLiveRegion="polite">
          {pending} {pending === 1 ? 'alerta aguardando' : 'alertas aguardando'} decisão
        </Text>
        <Text style={styles.muted}>
          O painel antecipa problemas e apoia a decisão. Nenhuma ação é executada automaticamente.
        </Text>
        <View style={{ height: spacing.sm }} />
        <Button
          title="Ver alertas"
          onPress={() => navigation.navigate('Alertas')}
          hint="Abre a lista de alertas preditivos"
        />
      </Card>

      <Card title="Território">
        <View style={styles.wrap}>
          <Chip label="Cidade toda" selected={districtId === 'all'} onPress={() => setDistrictId('all')} />
          {DISTRICTS.map((d) => (
            <Chip key={d.id} label={d.name} selected={districtId === d.id} onPress={() => setDistrictId(d.id)} />
          ))}
        </View>
      </Card>

      <View style={styles.grid}>
        {Object.keys(METRICS).map((k) => {
          const s = getSeries(districtId, k);
          const today = s[s.length - 1];
          const delta = ((today - avg(s)) / avg(s)) * 100;
          const sel = k === metric;
          return (
            <Pressable
              key={k}
              onPress={() => setMetric(k)}
              style={[styles.kpi, sel && styles.kpiSel]}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${METRICS[k].label}: hoje ${fmt(today, METRICS[k].decimals)} ${METRICS[k].unit}, ${fmt(
                Math.abs(delta),
                1,
              )} por cento ${delta >= 0 ? 'acima' : 'abaixo'} da média de 30 dias`}
            >
              <Text style={styles.kpiLabel}>
                {METRICS[k].icon} {METRICS[k].label}
              </Text>
              <Text style={styles.kpiValue}>{fmt(today, METRICS[k].decimals)}</Text>
              <Text style={styles.kpiUnit}>{METRICS[k].unit}</Text>
              <Text style={[styles.kpiDelta, { color: delta > 5 ? colors.danger : colors.ok }]}>
                {delta >= 0 ? '▲' : '▼'} {fmt(Math.abs(delta), 1)}% vs média 30d
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card title={`${m.label} — ${districtName}`}>
        <BarChart
          data={chartData}
          unit={m.unit}
          decimals={m.decimals}
          title={`${m.label} em ${districtName}`}
        />
        <Text style={[styles.muted, { marginTop: spacing.sm }]}>
          Previsão por tendência linear (próximos {HORIZON} dias). Dados sintéticos de demonstração.
        </Text>
      </Card>

      <Card title="Clima local (Open-Meteo)">
        {weatherStatus === 'loading' && <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando clima" />}
        {weatherStatus === 'error' && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            Não foi possível atualizar o clima: {weatherError}.{weather ? ' Exibindo dados salvos.' : ''}
          </Text>
        )}
        {weather && weather.daily && (
          <View style={styles.wrap}>
            {weather.daily.time.slice(0, 7).map((t, i) => (
              <View
                key={t}
                style={styles.day}
                accessible
                accessibilityLabel={`Dia ${t.slice(8, 10)}: máxima ${fmt(weather.daily.tmax[i], 0)} graus, chuva ${fmt(
                  weather.daily.precip[i],
                  0,
                )} milímetros`}
              >
                <Text style={styles.dayLabel}>{t.slice(8, 10)}/{t.slice(5, 7)}</Text>
                <Text style={styles.dayTemp}>{fmt(weather.daily.tmax[i], 0)}°</Text>
                <Text style={styles.dayRain}>{fmt(weather.daily.precip[i], 0)} mm</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: spacing.sm }} />
        <Button title="Atualizar clima" variant="secondary" onPress={refreshWeather} disabled={weatherStatus === 'loading'} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  big: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  muted: { fontSize: 13, color: colors.muted },
  error: { fontSize: 13, color: colors.danger, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpi: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: spacing.sm,
  },
  kpiSel: { borderColor: colors.primary, backgroundColor: '#E6F4F1' },
  kpiLabel: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  kpiValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  kpiUnit: { fontSize: 11, color: colors.muted },
  kpiDelta: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  day: { alignItems: 'center', width: '14.28%', marginBottom: 8 },
  dayLabel: { fontSize: 10, color: colors.muted },
  dayTemp: { fontSize: 15, fontWeight: '800', color: colors.text },
  dayRain: { fontSize: 10, color: colors.info },
});
