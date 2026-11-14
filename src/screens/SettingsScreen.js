import React, { useState } from 'react';
import { ScrollView, Text, Alert, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useApp } from '../state/AppContext';
import { colors, spacing } from '../theme';

export default function SettingsScreen() {
  const { thresholdPct, setThreshold, clearAll } = useApp();
  const [value, setValue] = useState(String(thresholdPct));
  const [error, setError] = useState(null);

  function save() {
    const n = Number(value.replace(',', '.'));
    if (!value.trim() || !isFinite(n)) return setError('Informe um número.');
    if (n < 5 || n > 60) return setError('Use um valor entre 5 e 60.');
    setError(null);
    setThreshold(Math.round(n));
    Alert.alert('Salvo', `Limiar de alerta definido em ${Math.round(n)}%.`);
  }

  function confirmClear() {
    Alert.alert('Apagar dados locais', 'Isso apaga decisões, ocorrências e ajustes deste dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          setValue('15');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card title="Sensibilidade dos alertas">
        <TextField
          label="Variação prevista mínima (%)"
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          error={error}
          hint="Alerta quando a média prevista para 7 dias supera a média de 30 dias neste percentual (5 a 60)."
        />
        <Button title="Salvar limiar" onPress={save} />
      </Card>

      <Card title="Privacidade e uso responsável">
        <Text style={styles.body}>
          • Os dados de consumo são sintéticos e agregados por bairro; o app não coleta identificadores pessoais.{'\n'}
          • Ocorrências e decisões ficam apenas neste dispositivo (AsyncStorage).{'\n'}
          • O clima vem da API pública Open-Meteo, sem envio de dados do usuário.{'\n'}
          • Previsões são estimativas com incerteza: use-as como apoio, nunca como única base de decisão.
        </Text>
      </Card>

      <Button title="Apagar dados locais" variant="danger" onPress={confirmClear} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
