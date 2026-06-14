import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert,
} from 'react-native';
import { Plus, Trash2, Tag, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { isPast } from '../data';
import { useAppContext } from '../AppContext';
import { theme } from '../theme';
import { Card, Button, Pill, SectionHeader } from '../ui';

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
    .join('  ');
}

function getCompatLabel(restaurantName, nextLunchYes, dietary, restaurantTags) {
  if (!nextLunchYes.length || !Object.keys(dietary).length) return null;
  const rTags     = (restaurantTags || {})[restaurantName] || [];
  const conflicts = nextLunchYes.filter(n => (dietary[n] || []).some(r => !rTags.includes(r)));
  if (conflicts.length === 0) return { ok: true,  label: '✓ all good' };
  return           { ok: false, label: `⚠️ ${conflicts.join(', ')}` };
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
    <Card style={sr.card}>
      <View style={sr.row}>
        {/* emoji tile */}
        <View style={sr.tile}>
          <Text style={sr.tileText}>{r.name[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        {/* main info */}
        <View style={sr.main}>
          <Text style={sr.name}>{r.name}</Text>
          <Text style={sr.meta}>
            {visits ? `${visits} visit${visits !== 1 ? 's' : ''}` : 'untouched'}
            {r.addedBy !== 'system' ? ` · by ${r.addedBy}` : ''}
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

        {/* actions */}
        <View style={sr.actions}>
          <Pressable
            hitSlop={6}
            style={[sr.actionBtn, editingTags && sr.actionBtnActive]}
            onPress={() => { Haptics.selectionAsync(); setEditingTags(e => !e); }}
          >
            <Tag size={14} color={editingTags ? theme.colors.honey : theme.colors.muted} />
          </Pressable>
          <Pressable hitSlop={6} style={sr.actionBtn} onPress={confirmRemove}>
            <Trash2 size={14} color={theme.colors.cocoa} />
          </Pressable>
        </View>
      </View>

      {editingTags && (
        <View style={sr.tagEditor}>
          <Text style={sr.tagHint}>what does this place accommodate?</Text>
          <View style={sr.tagOptions}>
            {DIETARY_OPTIONS.map(tag => (
              <Pill key={tag} label={tag} active={tags.includes(tag)} tone="honey" onPress={() => toggleTag(tag)} />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const sr = StyleSheet.create({
  card:    { marginBottom: theme.space.sm, padding: theme.space.md },
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm },
  tile:    { width: 40, height: 40, borderRadius: theme.radius.tile, backgroundColor: theme.colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  tileText:{ fontSize: 18, fontWeight: '600', color: theme.colors.espresso },
  main:    { flex: 1, gap: 3 },
  name:    { ...theme.type.h2, fontSize: 15 },
  meta:    { ...theme.type.meta },
  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: 2 },
  tagPill: { fontSize: 11, fontWeight: '600', color: theme.colors.muted, backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 3, borderWidth: 1, borderColor: theme.colors.line },
  compatBadge: { fontSize: 11, fontWeight: '600', borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 3, overflow: 'hidden' },
  compatOk:   { color: theme.colors.sage,  backgroundColor: 'rgba(125,138,95,0.12)'  },
  compatWarn: { color: theme.colors.cocoa, backgroundColor: 'rgba(138,90,60,0.12)' },
  actions:    { flexDirection: 'row', gap: theme.space.xs, alignItems: 'center' },
  actionBtn:      { padding: 6, backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, borderWidth: 1, borderColor: theme.colors.line },
  actionBtnActive:{ backgroundColor: 'rgba(201,163,106,0.15)', borderColor: theme.colors.honey },
  tagEditor:  { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.space.md, marginTop: theme.space.sm, gap: theme.space.sm },
  tagHint:    { ...theme.type.meta },
  tagOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
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
        <Card style={sv.onboarding}>
          <Text style={sv.onboardingTitle}>no spots yet. where do you all actually eat?</Text>
          <Text style={sv.onboardingBody}>start a crew and add your go-to places.</Text>
          <Button label="set up my team →" onPress={() => navigation.navigate('You')} variant="primary" style={sv.onboardingBtn} />
        </Card>
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addRestaurant(draft);
    setDraft('');
  };

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={sv.list}
      data={restaurants}
      keyExtractor={r => r.name}
      ListHeaderComponent={
        <>
          <SectionHeader label={`${restaurants.length} spots`} style={sv.sectionHeader} />
          <View style={sv.addRow}>
            <TextInput
              style={sv.addInput}
              placeholder="add a new spot…"
              placeholderTextColor={theme.colors.muted}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={onAdd}
              returnKeyType="done"
            />
            <Button label="add" onPress={onAdd} variant="primary" style={sv.addBtn} />
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
  list:    { padding: theme.space.screen, paddingBottom: theme.space.xxl },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.space.screen },
  onboarding:      { alignItems: 'center', gap: theme.space.md },
  onboardingTitle: { ...theme.type.h2, textAlign: 'center' },
  onboardingBody:  { ...theme.type.body, textAlign: 'center', color: theme.colors.muted },
  onboardingBtn:   { marginTop: theme.space.sm },
  sectionHeader:   { marginBottom: theme.space.sm },
  addRow:   { flexDirection: 'row', gap: theme.space.sm, marginBottom: theme.space.md, alignItems: 'center' },
  addInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm + 2, fontSize: 14, color: theme.colors.ink, backgroundColor: theme.colors.surface },
  addBtn:   { paddingVertical: theme.space.sm + 2 },
});
