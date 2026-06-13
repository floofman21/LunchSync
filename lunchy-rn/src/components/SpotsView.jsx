import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert,
} from 'react-native';
import { Plus, Trash2, Tag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { isPast } from '../data';
import { useAppContext } from '../AppContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];
const RATING_EMOJI    = { fire: '🔥', meh: '😐', never: '❌' };

function getRatingSummary(restaurantName, lunches, ratings) {
  const visitIds = lunches
    .filter(l => l.restaurant === restaurantName && isPast(l.date))
    .map(l => l.id);
  const all = visitIds.flatMap(id => Object.values((ratings || {})[id] || {}));
  if (!all.length) return null;
  const counts = { fire: 0, meh: 0, never: 0 };
  all.forEach(r => { if (counts[r] !== undefined) counts[r]++; });
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${RATING_EMOJI[k]}×${n}`)
    .join(' ');
}

function getCompatLabel(restaurantName, nextLunchYes, dietary, restaurantTags) {
  if (!nextLunchYes.length || !Object.keys(dietary).length) return null;
  const rTags     = (restaurantTags || {})[restaurantName] || [];
  const conflicts = nextLunchYes.filter(n => (dietary[n] || []).some(r => !rTags.includes(r)));
  if (conflicts.length === 0) return { ok: true, label: '✓ all good' };
  return { ok: false, label: `⚠️ ${conflicts.join(', ')}` };
}

function SpotRow({ r, nextLunchYes, visitCounts, ratings, lunches, dietary, restaurantTags, tagRestaurant, onRemove }) {
  const [editingTags, setEditingTags] = useState(false);
  const visits        = visitCounts[r.name] || 0;
  const ratingSummary = useMemo(() => getRatingSummary(r.name, lunches, ratings), [r.name, lunches, ratings]);
  const compat        = useMemo(() => getCompatLabel(r.name, nextLunchYes, dietary, restaurantTags), [r.name, nextLunchYes, dietary, restaurantTags]);
  const tags          = (restaurantTags || {})[r.name] || [];

  const toggleTag = (tag) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    tagRestaurant(r.name, next);
  };

  const confirmRemove = () => {
    Alert.alert('Remove spot', `Remove ${r.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(r.name) },
    ]);
  };

  return (
    <View style={sr.wrapper}>
      <View style={sr.row}>
        <View style={sr.main}>
          <Text style={sr.name}>{r.name}</Text>
          <Text style={sr.meta} numberOfLines={1}>
            {visits ? `${visits} visit${visits !== 1 ? 's' : ''}` : 'untouched'}
            {r.addedBy !== 'system' ? ` · added by ${r.addedBy}` : ''}
            {ratingSummary ? `  ${ratingSummary}` : ''}
          </Text>
          {(tags.length > 0 || compat) && (
            <View style={sr.tagRow}>
              {tags.map(t => <Text key={t} style={sr.tagPill}>{t}</Text>)}
              {compat && (
                <Text style={[sr.compatBadge, compat.ok ? sr.compatOk : sr.compatWarn]}>{compat.label}</Text>
              )}
            </View>
          )}
        </View>
        <View style={sr.actions}>
          <Pressable style={[sr.actionBtn, editingTags && sr.actionBtnActive]} onPress={() => setEditingTags(e => !e)}>
            <Tag size={14} color={editingTags ? COLORS.cherry : COLORS.ink3} />
          </Pressable>
          <Pressable style={sr.actionBtn} onPress={confirmRemove}>
            <Trash2 size={14} color={COLORS.noFg} />
          </Pressable>
        </View>
      </View>

      {editingTags && (
        <View style={sr.tagEditor}>
          <Text style={sr.tagHint}>tag what this place accommodates:</Text>
          <View style={sr.tagOptions}>
            {DIETARY_OPTIONS.map(tag => (
              <Pressable
                key={tag}
                style={[sr.tagToggle, tags.includes(tag) && sr.tagToggleActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[sr.tagToggleText, tags.includes(tag) && sr.tagToggleTextActive]}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const sr = StyleSheet.create({
  wrapper:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 8 },
  main:      { flex: 1 },
  name:      { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 3 },
  meta:      { fontSize: 12, color: COLORS.ink3, marginBottom: 4 },
  tagRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagPill:   { fontSize: 11, fontWeight: '600', color: COLORS.ink3, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  compatBadge: { fontSize: 11, fontWeight: '600', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  compatOk:    { color: COLORS.yesFg,  backgroundColor: COLORS.yesBg  },
  compatWarn:  { color: COLORS.maybeFg, backgroundColor: COLORS.maybeBg },
  actions:     { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn:      { padding: 6, backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  actionBtnActive: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  tagEditor:  { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12 },
  tagHint:    { fontSize: 12, color: COLORS.ink3, marginBottom: 8 },
  tagOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagToggle:      { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tagToggleActive: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  tagToggleText:      { fontSize: 12, color: COLORS.ink2 },
  tagToggleTextActive: { color: COLORS.cherry, fontWeight: '600' },
});

export default function SpotsView() {
  const navigation = useNavigation();
  const {
    me, restaurants, lunches, ratings, dietary, restaurantTags,
    activeTeamList: teams, addRestaurant, removeRestaurant, tagRestaurant,
  } = useAppContext();

  const [draft, setDraft] = useState('');
  const myTeams = (teams || []).filter(t => t.members.includes(me));

  const visitCounts = useMemo(() => {
    const counts = {};
    lunches.forEach(l => {
      if (l.restaurant && isPast(l.date)) counts[l.restaurant] = (counts[l.restaurant] || 0) + 1;
    });
    return counts;
  }, [lunches]);

  if (myTeams.length === 0) {
    return (
      <View style={sv.center}>
        <View style={sv.onboarding}>
          <Text style={sv.onboardingEmoji}>📍</Text>
          <Text style={sv.onboardingTitle}>no spots yet</Text>
          <Text style={sv.onboardingBody}>Join or create a team to build your crew's restaurant rotation.</Text>
          <Pressable style={sv.onboardingBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={sv.onboardingBtnText}>set up my team →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const teammates    = new Set(myTeams.flatMap(t => t.members));
  const nextLunch    = lunches.find(l => !isPast(l.date));
  const nextLunchYes = nextLunch
    ? Object.entries(nextLunch.rsvps).filter(([n, v]) => v === 'yes' && teammates.has(n)).map(([k]) => k)
    : [];

  const onAdd = () => {
    if (!draft.trim()) return;
    addRestaurant(draft);
    setDraft('');
  };

  return (
    <FlatList
      contentContainerStyle={sv.list}
      data={restaurants}
      keyExtractor={r => r.name}
      ListHeaderComponent={
        <>
          <Text style={sv.sectionLabel}>the rotation</Text>
          <Text style={sv.hint}>{restaurants.length} places · tag dietary accommodations · ratings from past visits</Text>
          <View style={sv.addRow}>
            <TextInput
              style={sv.addInput}
              placeholder="found a new spot? add it here…"
              placeholderTextColor={COLORS.ink4}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={onAdd}
              returnKeyType="done"
            />
            <Pressable style={sv.addBtn} onPress={onAdd}>
              <Plus size={14} color="#fff" />
              <Text style={sv.addBtnText}>add it</Text>
            </Pressable>
          </View>
        </>
      }
      renderItem={({ item: r }) => (
        <SpotRow
          r={r}
          nextLunchYes={nextLunchYes}
          visitCounts={visitCounts}
          ratings={ratings}
          lunches={lunches}
          dietary={dietary}
          restaurantTags={restaurantTags}
          tagRestaurant={tagRestaurant}
          onRemove={removeRestaurant}
        />
      )}
    />
  );
}

const sv = StyleSheet.create({
  list:           { padding: SPACING.md, paddingBottom: SPACING.xl },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  onboarding:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm },
  onboardingEmoji:{ fontSize: 40, marginBottom: 8 },
  onboardingTitle:{ fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 8, textAlign: 'center' },
  onboardingBody: { fontSize: 14, color: COLORS.ink3, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  onboardingBtn:  { backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12 },
  onboardingBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  hint:           { fontSize: 13, color: COLORS.ink3, marginBottom: SPACING.md },
  addRow:         { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  addInput:       { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.surface2 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});
