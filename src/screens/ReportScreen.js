import React, { useState } from 'react';
import { ScrollView, View, Text, Switch, Alert, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useApp } from '../state/AppContext';
import { DISTRICTS } from '../data/syntheticData';
import { formatDateTime } from '../utils/format';
import { colors, spacing } from '../theme';

const CATEGORIES = ['Vazamento de água', 'Falta de energia', 'Lixo acumulado', 'Alagamento', 'Outro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ReportScreen() {
  const { reports, addReport, deleteReport } = useApp();
  const [districtId, setDistrictId] = useState(null);
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!districtId) e.district = 'Selecione o bairro.';
    if (!category) e.category = 'Selecione a categoria.';
    const d = description.trim();
    if (d.length < 15) e.description = 'Descreva a ocorrência com pelo menos 15 caracteres.';
    if (contact.trim()) {
      if (!EMAIL_RE.test(contact.trim())) e.contact = 'E-mail inválido.';
      else if (!consent) e.consent = 'Para guardar o contato, autorize o uso para retorno sobre esta ocorrência.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    addReport({
      id: String(Date.now()),
      districtId,
      category,
      description: description.trim(),
      contact: contact.trim() && consent ? contact.trim() : null,
      createdAt: new Date().toISOString(),
    });
    setDistrictId(null);
    setCategory(null);
    setDescription('');
    setContact('');
    setConsent(false);
    setErrors({});
    Alert.alert('Ocorrência registrada', 'Obrigado! O registro foi salvo neste dispositivo.');
  }

  function confirmDelete(id) {
    Alert.alert('Excluir ocorrência', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteReport(id) },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card title="Registrar ocorrência da comunidade">
        <Text style={styles.privacy}>
          🔒 Privacidade: não informe nomes, CPF, endereço exato ou dados de terceiros. O contato é opcional e só é guardado com seu consentimento.
        </Text>

        <Text style={styles.label}>Bairro</Text>
        <View style={styles.wrap}>
          {DISTRICTS.map((d) => (
            <Chip key={d.id} label={d.name} selected={districtId === d.id} onPress={() => setDistrictId(d.id)} />
          ))}
        </View>
        {errors.district ? <Text style={styles.error} accessibilityLiveRegion="polite">{errors.district}</Text> : null}

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
        {errors.category ? <Text style={styles.error} accessibilityLiveRegion="polite">{errors.category}</Text> : null}

        <TextField
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={280}
          error={errors.description}
          hint={`${description.length}/280`}
        />
        <TextField
          label="E-mail para retorno (opcional)"
          value={contact}
          onChangeText={setContact}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.contact}
        />
        <View style={styles.switchRow}>
          <Switch
            value={consent}
            onValueChange={setConsent}
            accessibilityLabel="Autorizo guardar meu e-mail apenas para retorno sobre esta ocorrência"
            trackColor={{ true: colors.primary }}
          />
          <Text style={styles.switchText}>Autorizo guardar meu e-mail apenas para retorno sobre esta ocorrência.</Text>
        </View>
        {errors.consent ? <Text style={styles.error} accessibilityLiveRegion="polite">{errors.consent}</Text> : null}
        <Button title="Salvar ocorrência" onPress={submit} />
      </Card>

      <Card title={`Ocorrências salvas (${reports.length})`}>
        {reports.length === 0 && <Text style={styles.muted}>Nenhuma ocorrência registrada.</Text>}
        {reports.map((r) => (
          <View key={r.id} style={styles.item}>
            <Text style={styles.bold}>
              {r.category} — {DISTRICTS.find((d) => d.id === r.districtId).name}
            </Text>
            <Text style={styles.muted}>{formatDateTime(r.createdAt)}</Text>
            <Text style={styles.body}>{r.description}</Text>
            <Button title="Excluir" variant="secondary" onPress={() => confirmDelete(r.id)} style={{ marginTop: 8 }} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  privacy: { fontSize: 13, color: colors.muted, marginBottom: spacing.md, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  switchText: { flex: 1, marginLeft: 8, fontSize: 13, color: colors.text },
  error: { fontSize: 13, color: colors.danger, fontWeight: '600', marginBottom: 8 },
  muted: { fontSize: 13, color: colors.muted },
  bold: { fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, marginTop: 4 },
  item: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, marginTop: 10 },
});
