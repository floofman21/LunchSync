import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { fmtDate, fmtDateLong, isPast } from '../data';
import { useAppContext } from '../AppContext';
import { theme } from '../theme';
import { Card, Button, SectionHeader } from '../ui';

const RATINGS = [
  { key: 'fire',  emoji: '🔥', label: 'loved it'    },
  { key: 'meh',   emoji: '😐', label: 'it was ok'   },
  { key: 'never', emoji: '❌', label: 'never again'  },
];

export default function HistoryView() {
  const navigation = useNavigation();
  const { me, lunches, ratings, setRating, activeTeamList: teams } = useAppContext();
  const myTeams = (teams || []).filter(t => t.members.includes(me));

  if (myTeams.length === 0) {
    return (
      <View style={hv.center}>
        <Card style={hv.onboarding}>
          <Text style={hv.onboardingTitle}>no history yet</Text>
          <Text style={hv.onboardingBody}>start a crew and your lunches will land here.</Text>
          <Button label="set up my team →" onPress={() => navigation.navigate('You')} variant="primary" style={hv.onboardingBtn} />
        </Card>
      </View>
    );
  }

  const teammates = new Set(myTeams.flatMap(t => t.members));
  const past = lunches
    .filter(l => isPast(l.date))
    .filter(l => Object.entries(l.rsvps).some(([n, s]) => s === 'yes' && teammates.has(n)))
    .slice()
    .reverse();

  const renderItem = ({ item: l }) => {
    const attendees    = Object.entries(l.rsvps)
      .filter(([n, s]) => s === 'yes' && teammates.has(n))
      .map(([n]) => n);
    const lunchRatings = (ratings || {})[l.id] || {};
    const myRating     = lunchRatings[me];
    const counts = { fire: 0, meh: 0, never: 0 };
    Object.entries(lunchRatings).forEach(([n, r]) => {
      if (teammates.has(n) && counts[r] !== undefined) counts[r]++;
    });
    const totalRated = counts.fire + counts.meh + counts.never;

    return (
      <Card style={hi.card}>
        <View style={hi.top}>
          <Text style={hi.eyebrow}>{fmtDate(l.date)}</Text>
          <View style={hi.countBadge}>
            <Text style={hi.countText}>{attendees.length}</Text>
          </View>
        </View>
        <Text style={hi.where} numberOfLines={1}>{l.restaurant || 'no spot picked'}</Text>
        <Text style={hi.who} numberOfLines={1}>
          {attendees.length > 0 ? attendees.join(', ') : 'ghost town'}
        </Text>

        {l.restaurant && (
          <View style={hi.ratingRow}>
            <View style={hi.tally}>
              {totalRated > 0
                ? RATINGS.filter(r => counts[r.key] > 0).map(r => (
                    <Text key={r.key} style={hi.tallyItem}>{r.emoji} {counts[r.key]}</Text>
                  ))
                : <Text style={hi.ratingNone}>no ratings yet</Text>
              }
            </View>
            <View style={hi.ratingBtns}>
              {RATINGS.map(r => (
                <Pressable
                  key={r.key}
                  style={[hi.ratingBtn, myRating === r.key && hi.ratingBtnActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRating(l.id, myRating === r.key ? null : r.key);
                  }}
                >
                  <Text style={hi.ratingEmoji}>{r.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={hv.list}
      data={past}
      keyExtractor={l => l.id}
      ListHeaderComponent={
        past.length > 0
          ? <SectionHeader label={`${past.length} past lunch${past.length !== 1 ? 'es' : ''}`} style={hv.sectionHeader} />
          : null
      }
      ListEmptyComponent={
        <Card style={hv.empty}>
          <Text style={hv.emptyText}>no history yet — your first lunch will land here.</Text>
          <Text style={hv.emptySub}></Text>
        </Card>
      }
      renderItem={renderItem}
    />
  );
}

const hv = StyleSheet.create({
  list:            { padding: theme.space.screen, paddingBottom: theme.space.xxl },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.space.screen },
  onboarding:      { alignItems: 'center', gap: theme.space.md },
  onboardingTitle: { ...theme.type.h2, textAlign: 'center' },
  onboardingBody:  { ...theme.type.body, textAlign: 'center', color: theme.colors.muted },
  onboardingBtn:   { marginTop: theme.space.sm },
  sectionHeader:   { marginBottom: theme.space.sm },
  empty:           { alignItems: 'center', gap: theme.space.sm, paddingVertical: theme.space.xl },
  emptyText:       { ...theme.type.h2 },
  emptySub:        { ...theme.type.meta },
});

const hi = StyleSheet.create({
  card:    { marginBottom: theme.space.sm },
  top:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eyebrow: { ...theme.type.eyebrow },
  countBadge: { backgroundColor: theme.colors.cream, borderRadius: theme.radius.pill, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  countText:  { fontSize: 11, fontWeight: '700', color: theme.colors.ink },
  where:   { ...theme.type.h2, marginBottom: 3 },
  who:     { ...theme.type.meta, marginBottom: theme.space.md },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.space.sm },
  tally:      { flexDirection: 'row', gap: theme.space.sm, flex: 1 },
  tallyItem:  { ...theme.type.meta, color: theme.colors.ink },
  ratingNone: { ...theme.type.meta, fontStyle: 'italic' },
  ratingBtns: { flexDirection: 'row', gap: theme.space.sm },
  ratingBtn:  { width: 36, height: 36, borderRadius: theme.radius.chip, backgroundColor: theme.colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  ratingBtnActive: { backgroundColor: 'rgba(201,163,106,0.2)', borderColor: theme.colors.honey },
  ratingEmoji:{ fontSize: 18 },
});
