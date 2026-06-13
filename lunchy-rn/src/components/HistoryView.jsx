import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fmtDate, isPast } from '../data';
import { useAppContext } from '../AppContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme';

const RATINGS = [
  { key: 'fire',  emoji: '🔥', label: 'loved it'    },
  { key: 'meh',   emoji: '😐', label: 'it was ok'   },
  { key: 'never', emoji: '❌', label: 'never again' },
];

export default function HistoryView() {
  const navigation = useNavigation();
  const { me, lunches, ratings, setRating, activeTeamList: teams } = useAppContext();
  const myTeams  = (teams || []).filter(t => t.members.includes(me));

  if (myTeams.length === 0) {
    return (
      <View style={hv.center}>
        <View style={hv.onboarding}>
          <Text style={hv.onboardingEmoji}>📖</Text>
          <Text style={hv.onboardingTitle}>no history yet</Text>
          <Text style={hv.onboardingBody}>Join or create a team to start tracking your group's lunch history.</Text>
          <Pressable style={hv.onboardingBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={hv.onboardingBtnText}>set up my team →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const teammates = new Set(myTeams.flatMap(t => t.members));
  const past = lunches
    .filter(l => isPast(l.date))
    .filter(l => Object.entries(l.rsvps).some(([n, s]) => s === 'yes' && teammates.has(n)))
    .slice()
    .reverse();

  if (past.length === 0) {
    return (
      <View style={hv.center}>
        <Text style={hv.empty}>no past lunches yet — the first one's coming up.</Text>
      </View>
    );
  }

  const renderItem = ({ item: l }) => {
    const attendees   = Object.entries(l.rsvps)
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
      <View style={hi.item}>
        <View style={hi.row}>
          <Text style={hi.date}>{fmtDate(l.date)}</Text>
          <Text style={hi.where} numberOfLines={1}>{l.restaurant || 'no spot picked'}</Text>
          <View style={hi.whoRow}>
            <Text style={hi.who} numberOfLines={1}>
              {attendees.length > 0 ? attendees.join(', ') : 'ghost town'}
            </Text>
            <View style={hi.countBadge}>
              <Text style={hi.countText}>{attendees.length}</Text>
            </View>
          </View>
        </View>

        {l.restaurant && (
          <View style={hi.ratingSection}>
            <View style={hi.ratingSummary}>
              {totalRated > 0
                ? RATINGS.filter(r => counts[r.key] > 0).map(r => (
                    <Text key={r.key} style={hi.ratingTally}>{r.emoji} {counts[r.key]}</Text>
                  ))
                : <Text style={hi.ratingNone}>no ratings yet</Text>
              }
            </View>
            <View style={hi.ratingBtns}>
              {RATINGS.map(r => (
                <Pressable
                  key={r.key}
                  style={[hi.ratingBtn, myRating === r.key && hi.ratingBtnActive]}
                  onPress={() => setRating(l.id, myRating === r.key ? null : r.key)}
                >
                  <Text style={hi.ratingEmoji}>{r.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      contentContainerStyle={hv.list}
      data={past}
      keyExtractor={l => l.id}
      ListHeaderComponent={<Text style={hv.sectionLabel}>the archives</Text>}
      renderItem={renderItem}
    />
  );
}

const hv = StyleSheet.create({
  list:            { padding: SPACING.md, paddingBottom: SPACING.xl },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  onboarding:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm },
  onboardingEmoji: { fontSize: 40, marginBottom: 8 },
  onboardingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 8, textAlign: 'center' },
  onboardingBody:  { fontSize: 14, color: COLORS.ink3, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  onboardingBtn:   { backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12 },
  onboardingBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  empty:           { fontSize: 15, color: COLORS.ink3, textAlign: 'center' },
});

const hi = StyleSheet.create({
  item:         { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.xs },
  row:          { gap: 3, marginBottom: 8 },
  date:         { fontSize: 12, fontWeight: '700', color: COLORS.cherry, textTransform: 'uppercase', letterSpacing: 0.3 },
  where:        { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  whoRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  who:          { fontSize: 13, color: COLORS.ink3, flex: 1 },
  countBadge:   { backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  countText:    { fontSize: 11, fontWeight: '700', color: COLORS.ink2 },
  ratingSection:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  ratingSummary:{ flexDirection: 'row', gap: 8, flex: 1 },
  ratingTally:  { fontSize: 13, color: COLORS.ink2 },
  ratingNone:   { fontSize: 13, color: COLORS.ink4, fontStyle: 'italic' },
  ratingBtns:   { flexDirection: 'row', gap: 6 },
  ratingBtn:    { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  ratingBtnActive: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  ratingEmoji:  { fontSize: 18 },
});
