import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../AppContext';
import { BRAND } from '../branding';
import { theme } from '../theme';
import OrbitMark from './OrbitMark';
import { Avatar } from '../ui';

export default function AppHeader() {
  const { me, syncStatus, activeTeam, handleSwitchUser } = useAppContext();
  const insets = useSafeAreaInsets();

  const isLive    = syncStatus === 'ok';
  const isSyncing = syncStatus === 'syncing';

  return (
    <View style={[s.bar, { paddingTop: insets.top + 6 }]}>
      <View style={s.brand}>
        <OrbitMark size={24} ring={theme.colors.espresso} dot={theme.colors.honey} />
        <View style={s.brandText}>
          <Text style={s.brandName}>{BRAND.name}</Text>
          {activeTeam && (
            <Text style={s.teamName} numberOfLines={1}>
              {activeTeam.emoji ? `${activeTeam.emoji} ` : ''}{activeTeam.name}
            </Text>
          )}
        </View>
      </View>

      <View style={s.right}>
        <View style={[s.syncDot, isLive && s.syncLive, isSyncing && s.syncSyncing]} />
        {me ? (
          <Pressable style={s.meChip} onPress={handleSwitchUser}>
            <Avatar name={me} size="sm" />
            <Text style={s.meName} numberOfLines={1}>{me}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  brandText: { gap: 1 },
  brandName: {
    ...theme.type.h2,
    fontSize: 17,
  },
  teamName: {
    ...theme.type.meta,
    fontSize: 11,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.line,
  },
  syncLive: {
    backgroundColor: theme.colors.sage,
  },
  syncSyncing: {
    backgroundColor: theme.colors.honey,
  },

  meChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    backgroundColor: theme.colors.cream,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  meName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ink,
    maxWidth: 100,
  },
});
