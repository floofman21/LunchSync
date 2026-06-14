import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BRAND } from '../branding';
import { theme } from '../theme';
import CrumbIcon from './CrumbIcon';
import { Button } from '../ui';

export default function Gate({ onPick, teams }) {
  const [name,  setName]  = useState('');
  const [code,  setCode]  = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("hmm, that code didn't match. double-check it?");
      return;
    }
    if (code.trim()) {
      const team = (teams || []).find(
        t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
      );
      if (!team) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("hmm, that code didn't match. double-check it?");
        return;
      }
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
        <View style={s.hero}>
          <CrumbIcon size={56} disc="#fff" crumb="#fff" bg={theme.colors.honey} />
          <Text style={s.brand}>{BRAND.name}</Text>
          <Text style={s.tagline}>{BRAND.tagline}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.eyebrow}>hey — let's get the crew fed</Text>

          <TextInput
            style={s.input}
            placeholder="what should we call you?"
            placeholderTextColor={theme.colors.muted}
            value={name}
            onChangeText={v => { setName(v); setError(''); }}
            onSubmitEditing={handleSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={s.input}
            placeholder="join with a code (optional)"
            placeholderTextColor={theme.colors.muted}
            value={code}
            onChangeText={v => { setCode(v.toUpperCase()); setError(''); }}
            onSubmitEditing={handleSubmit}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Button
            label="let's eat →"
            onPress={handleSubmit}
            variant="primary"
            disabled={!name.trim()}
            style={s.submitBtn}
          />

          <Text style={s.foot}>{BRAND.footNote}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer:  { flex: 1, backgroundColor: theme.colors.espresso },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.space.screen },

  hero: {
    alignItems: 'center',
    paddingVertical: theme.space.xxl,
    gap: theme.space.sm,
  },
  brand: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.colors.onDark,
    letterSpacing: -0.5,
    marginTop: theme.space.sm,
  },
  tagline: {
    ...theme.type.meta,
    color: theme.colors.onDarkMuted,
    fontStyle: 'italic',
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.hero,
    padding: theme.space.xl,
    ...theme.shadow.md,
  },

  eyebrow: {
    ...theme.type.eyebrow,
    marginBottom: theme.space.md,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.chip,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    fontSize: 15,
    color: theme.colors.ink,
    backgroundColor: theme.colors.cream,
    marginBottom: theme.space.sm,
  },

  error: {
    fontSize: 13,
    color: theme.colors.cocoa,
    marginBottom: theme.space.sm,
  },

  submitBtn: {
    width: '100%',
    paddingVertical: theme.space.md,
    marginTop: theme.space.xs,
  },

  foot: {
    ...theme.type.meta,
    marginTop: theme.space.lg,
    textAlign: 'center',
  },
});
