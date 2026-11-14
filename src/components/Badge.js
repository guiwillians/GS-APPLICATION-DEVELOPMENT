import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

const TONES = {
  danger: colors.danger,
  warn: colors.warn,
  ok: colors.ok,
  info: colors.info,
  muted: colors.muted,
};

export default function Badge({ label, tone = 'muted' }) {
  const c = TONES[tone] || colors.muted;
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <Text style={[styles.text, { color: c }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 4,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
