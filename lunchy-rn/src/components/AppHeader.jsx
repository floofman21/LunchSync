import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppContext } from '../AppContext';
import { BRAND } from '../branding';
import { COLORS, SPACING, SHADOW } from '../theme';

export default function AppHeader() {
  const { me, syncStatus, activeTeam, handleSwitchUser } = useAppContext();

  const dotColor = syncStatus === 'offline' ? '#e55' : syncStatus === 'syncing' ? '#f0a830' : '#3cb86a';
  const dotLabel = syncStatus === 'offline' ? 'offline' : syncStatus === 'syncing' ? 'syncing' : 'live';

  return (
    <View style={s.header}>
      <View style={s.brand}>
        <Text style={s.brandEmoji}>{BRAND.emoji}</Text>
        <View>
          <Text style={s.brandName}>{BRAND.name}</Text>
          <Text style={s.brandTag} numberOfLines={1}>
            {activeTeam ? `${activeTeam.emoji} ${activeTeam.name}` : BRAND.tagline}
          </Text>
        </View>
      </View>

      <View style={s.actions}>
        <View style={s.syncBadge}>
          <View style={[s.syncDot, { backgroundColor: dotColor }]} />
          <Text style={s.syncLabel}>{dotLabel}</Text>
        </View>
        <Pressable style={s.meChip} onPress={handleSwitchUser}>
          <View style={s.meDot} />
          <Text style={s.meText} numberOfLines={1}>
            <Text style={s.meYou}>you're </Text>
            <Text style={s.meName}>{me}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.xs,
  },
  brand:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandEmoji: { fontSize: 22 },
  brandName:  { fontSize: 17, fontWeight: '800', color: COLORS.ink },
  brandTag:   { fontSize: 11, color: COLORS.ink3, maxWidth: 160 },

  actions:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncDot:    { width: 7, height: 7, borderRadius: 4 },
  syncLabel:  { fontSize: 11, color: COLORS.ink3 },

  meChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface2,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  meDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.cherry },
  meText: { fontSize: 12, color: COLORS.ink2, maxWidth: 100 },
  meYou:  { fontWeight: '400' },
  meName: { fontWeight: '700' },
});
