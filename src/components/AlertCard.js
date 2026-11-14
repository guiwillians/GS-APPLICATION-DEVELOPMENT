import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Badge from './Badge';
import { colors, radius, spacing } from '../theme';

const ACTION_LABEL = {
  acionar: 'Equipe acionada',
  monitorar: 'Em monitoramento',
  descartar: 'Descartado',
};

export default function AlertCard({ alert, decision, onPress }) {
  const sevTone = alert.severity === 'alta' ? 'danger' : 'warn';
  const sevLabel = alert.severity === 'alta' ? 'Severidade alta' : 'Severidade média';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${alert.title}. ${sevLabel}. Confiança ${alert.confidence.label}, ${alert.confidence.pct} por cento. ${
        decision ? ACTION_LABEL[decision.action] : 'Aguardando decisão do gestor'
      }`}
      accessibilityHint="Abre o detalhe e o registro da decisão"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.title}>{alert.title}</Text>
      <View style={styles.row}>
        <Badge label={sevLabel} tone={sevTone} />
        <Badge label={`Confiança ${alert.confidence.label} (${alert.confidence.pct}%)`} tone="info" />
        <Badge
          label={decision ? ACTION_LABEL[decision.action] : 'Aguardando decisão'}
          tone={decision ? 'ok' : 'muted'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
