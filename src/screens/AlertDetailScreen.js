import React, { useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Chip from '../components/Chip';
import Button from '../components/Button';
import TextField from '../components/TextField';
import BarChart from '../components/BarChart';
import { useApp } from '../state/AppContext';
import { DATA, METRICS, HORIZON, futureLabels } from '../data/syntheticData';
import { forecastSeries } from '../services/forecast';
import { formatDateTime } from '../utils/format';
import { colors, spacing } from '../theme';

const ACTIONS = [
  { id: 'acionar', label: 'Acionar equipe de campo' },
  { id: 'monitorar', label: 'Manter monitoramento' },
  { id: 'descartar', label: 'Descartar (falso positivo)' },
];

export default function AlertDetailScreen({ route, navigation }) {
  const { alerts, decisionByAlert, decisions, addDecision } = useApp();
  const alert = alerts.find((a) => a.id === route.params.alertId);
  const [action, setAction] = useState(null);
  const [justification, setJustification] = useState('');
  const [errors, setErrors] = useState({});

  if (!alert) {
    return (
      <View style={styles.screen}>
        <Text style={styles.muted}>Este alerta não está mais ativo com o limiar atual.</Text>
      </View>
    );
  }

  const current = decisionByAlert[alert.id];
  const history = decisions.filter((d) => d.alertId === alert.id);
  const sevTone = alert.severity === 'alta' ? 'danger' : 'warn';

  let chartData = null;
  let m = null;
  if (alert.kind === 'trend') {
    m = METRICS[alert.metric];
    const ys = DATA.series[alert.districtId][alert.metric];
    const f = forecastSeries(ys, HORIZON);
    const fut = futureLabels(HORIZON);
    chartData = [
      ...ys.slice(-14).map((v, i) => ({ label: DATA.dates[DATA.dates.length - 14 + i], value: v })),
      ...f.predictions.map((v, i) => ({ label: fut[i], value: v, predicted: true })),
    ];
  }

  function validate() {
    const e = {};
    if (!action) e.action = 'Escolha uma ação.';
    const j = justification.trim();
    if (j.length < 10) e.justification = 'Descreva a justificativa com pelo menos 10 caracteres.';
    else if (j.length > 300) e.justification = 'Use no máximo 300 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const label = ACTIONS.find((a) => a.id === action).label;
    Alert.alert('Confirmar decisão', `Registrar: "${label}"?\nA decisão será registrada como sua (decisão humana).`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          addDecision({
            id: String(Date.now()),
            alertId: alert.id,
            alertTitle: alert.title,
            action,
            justification: justification.trim(),
            createdAt: new Date().toISOString(),
          });
          setAction(null);
          setJustification('');
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">{alert.title}</Text>
      <View style={styles.row}>
        <Badge label={alert.severity === 'alta' ? 'Severidade alta' : 'Severidade média'} tone={sevTone} />
        <Badge label={`Confiança ${alert.confidence.label} (${alert.confidence.pct}%)`} tone="info" />
        <Badge label={`Horizonte: ${alert.horizonDays} dias`} tone="muted" />
      </View>

      <Card title="Por que este alerta?">
        <Text style={styles.body}>{alert.justification}</Text>
      </Card>

      {chartData && (
        <Card title="Observado × previsto">
          <BarChart data={chartData} unit={m.unit} decimals={m.decimals} title={alert.title} />
        </Card>
      )}

      <Card title="Limitações (leia antes de decidir)">
        {alert.limitations.map((l, i) => (
          <Text key={i} style={styles.bullet}>• {l}</Text>
        ))}
      </Card>

      <Card title="Decisão do gestor">
        {current && (
          <Text style={styles.ok}>
            Decisão atual: {ACTIONS.find((a) => a.id === current.action).label} em {formatDateTime(current.createdAt)}
          </Text>
        )}
        <Text style={styles.muted}>
          O app apenas apoia a decisão. Ações de alto impacto exigem confirmação e justificativa humanas.
        </Text>
        <View style={{ height: spacing.sm }} />
        <View style={styles.row}>
          {ACTIONS.map((a) => (
            <Chip key={a.id} label={a.label} selected={action === a.id} onPress={() => setAction(a.id)} />
          ))}
        </View>
        {errors.action ? <Text style={styles.error} accessibilityLiveRegion="polite">{errors.action}</Text> : null}
        <TextField
          label="Justificativa"
          value={justification}
          onChangeText={setJustification}
          multiline
          maxLength={300}
          error={errors.justification}
          hint={`${justification.length}/300 — não inclua dados pessoais de cidadãos.`}
        />
        <Button title="Registrar decisão" onPress={submit} />
      </Card>

      {history.length > 0 && (
        <Card title="Histórico de decisões">
          {history.map((d) => (
            <View key={d.id} style={styles.hist}>
              <Text style={styles.bold}>{ACTIONS.find((a) => a.id === d.action).label}</Text>
              <Text style={styles.muted}>{formatDateTime(d.createdAt)}</Text>
              <Text style={styles.body}>{d.justification}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  bullet: { fontSize: 14, color: colors.text, marginBottom: 6, lineHeight: 20 },
  muted: { fontSize: 13, color: colors.muted },
  ok: { fontSize: 14, color: colors.ok, fontWeight: '700', marginBottom: 6 },
  error: { fontSize: 13, color: colors.danger, fontWeight: '600', marginBottom: 8 },
  bold: { fontWeight: '700', color: colors.text },
  hist: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 8, marginTop: 8 },
});
