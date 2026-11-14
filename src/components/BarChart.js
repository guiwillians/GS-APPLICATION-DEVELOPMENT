import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { fmt } from '../utils/format';

// Gráfico de barras sem dependências externas. Barras em âmbar = previsão.
export default function BarChart({ data, height = 140, unit = '', title = 'Gráfico', decimals = 0 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const actual = data.filter((d) => !d.predicted);
  const pred = data.filter((d) => d.predicted);
  const lastActual = actual.length ? actual[actual.length - 1] : data[0];
  const summary =
    `${title}. Últimos ${actual.length} dias, de ${fmt(Math.min(...actual.map((d) => d.value)), decimals)} ` +
    `a ${fmt(Math.max(...actual.map((d) => d.value)), decimals)} ${unit}.` +
    (pred.length
      ? ` Previsão para os próximos ${pred.length} dias, de ${fmt(Math.min(...pred.map((d) => d.value)), decimals)} ` +
        `a ${fmt(Math.max(...pred.map((d) => d.value)), decimals)} ${unit}.`
      : '');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <View style={[styles.plot, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.col}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, (d.value / max) * height),
                  backgroundColor: d.predicted ? colors.predicted : colors.primary,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        <Text style={styles.tick}>{data[0].label}</Text>
        <Text style={styles.tick}>{lastActual.label} (hoje)</Text>
        <Text style={styles.tick}>{data[data.length - 1].label}</Text>
      </View>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Observado</Text>
        {pred.length ? (
          <>
            <View style={[styles.dot, { backgroundColor: colors.predicted, marginLeft: 12 }]} />
            <Text style={styles.legendText}>Previsto</Text>
          </>
        ) : null}
        <Text style={[styles.legendText, { marginLeft: 'auto' }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderColor: colors.border },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontSize: 11, color: colors.muted },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: 12, color: colors.muted },
});
