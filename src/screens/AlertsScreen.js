import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Chip from '../components/Chip';
import AlertCard from '../components/AlertCard';
import { useApp } from '../state/AppContext';
import { colors, spacing } from '../theme';

export default function AlertsScreen({ navigation }) {
  const { alerts, decisionByAlert, thresholdPct } = useApp();
  const [filter, setFilter] = useState('pendentes');

  const list = alerts.filter((a) => (filter === 'pendentes' ? !decisionByAlert[a.id] : !!decisionByAlert[a.id]));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        Alertas preditivos com variação prevista ≥ {thresholdPct}% (ajustável em Ajustes). Toda decisão é do gestor.
      </Text>
      <View style={styles.row}>
        <Chip label="Pendentes" selected={filter === 'pendentes'} onPress={() => setFilter('pendentes')} />
        <Chip label="Decididos" selected={filter === 'decididos'} onPress={() => setFilter('decididos')} />
      </View>
      {list.length === 0 && (
        <Text style={styles.empty} accessibilityLiveRegion="polite">
          {filter === 'pendentes' ? 'Nenhum alerta pendente. 🎉' : 'Nenhuma decisão registrada ainda.'}
        </Text>
      )}
      {list.map((a) => (
        <AlertCard
          key={a.id}
          alert={a}
          decision={decisionByAlert[a.id]}
          onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  muted: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', marginBottom: spacing.xs },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.lg, fontSize: 15 },
});
