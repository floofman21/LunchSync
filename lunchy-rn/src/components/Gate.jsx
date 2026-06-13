import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { BRAND } from '../branding';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme';

export default function Gate({ onPick, teams }) {
  const [name,  setName]  = useState('');
  const [code,  setCode]  = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('choose a username to continue'); return; }

    if (code.trim()) {
      const team = (teams || []).find(
        t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
      );
      if (!team) { setError('team code not found — double-check it'); return; }
      onPick(trimmed, team.id);
    } else {
      onPick(trimmed, null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.eyebrow}>welcome to</Text>
          <Text style={s.title}>{BRAND.name}</Text>
          <Text style={s.sub}>{BRAND.subtitle}</Text>

          <TextInput
            style={s.input}
            placeholder="username"
            placeholderTextColor={COLORS.ink4}
            value={name}
            onChangeText={v => { setName(v); setError(''); }}
            onSubmitEditing={handleSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={[s.input, s.inputSecondary]}
            placeholder="team code (optional)"
            placeholderTextColor={COLORS.ink4}
            value={code}
            onChangeText={v => { setCode(v.toUpperCase()); setError(''); }}
            onSubmitEditing={handleSubmit}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.submitBtn, !name.trim() && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={s.submitBtnText}>let's eat →</Text>
          </Pressable>

          <Text style={s.foot}>{BRAND.footNote}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer:  { flex: 1, backgroundColor: COLORS.surface2 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOW.md,
  },

  eyebrow: { fontSize: 12, fontWeight: '600', color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title:   { fontSize: 32, fontWeight: '800', color: COLORS.cherry, marginBottom: 4 },
  sub:     { fontSize: 14, color: COLORS.ink3, marginBottom: SPACING.xl },

  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.ink,
    backgroundColor: COLORS.surface2,
    marginBottom: SPACING.sm,
  },
  inputSecondary: { borderStyle: 'dashed' },

  error: { fontSize: 13, color: COLORS.noFg, marginBottom: SPACING.sm, alignSelf: 'flex-start' },

  submitBtn: {
    width: '100%',
    backgroundColor: COLORS.cherry,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOW.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  foot: { fontSize: 12, color: COLORS.ink4, marginTop: SPACING.lg, textAlign: 'center' },
});
