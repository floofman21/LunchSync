import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  Alert, Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Check, X, HelpCircle, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fmtDate, fmtDateLong, isPast, isToday, daysUntil } from '../data';
import { useAppContext } from '../AppContext';
import { theme } from '../theme';
import { Card, Button, Pill, Avatar, SectionHeader } from '../ui';

const VIBES = ['quick bite', 'sit-down', 'adventurous', 'comfort food', 'patio'];
const VIBE_EMOJI = {
  'quick bite':   '⚡',
  'sit-down':     '🍽️',
  'adventurous':  '🗺️',
  'comfort food': '🫶',
  'patio':        '☀️',
};

// ── helpers ─────────────────────────────────────────────────────────────────

function getNextPicker(allLunches, yesAttendees) {
  if (!yesAttendees.length) return null;
  const counts  = Object.fromEntries(yesAttendees.map(n => [n, 0]));
  const lastIdx = Object.fromEntries(yesAttendees.map(n => [n, -1]));
  allLunches
    .filter(l => l.lockedBy && l.restaurant && isPast(l.date))
    .forEach((l, i) => {
      if (counts[l.lockedBy] !== undefined) {
        counts[l.lockedBy]++;
        lastIdx[l.lockedBy] = i;
      }
    });
  return [...yesAttendees].sort((a, b) =>
    counts[a] !== counts[b] ? counts[a] - counts[b] : lastIdx[a] - lastIdx[b]
  )[0];
}

// ── AddLunchForm ─────────────────────────────────────────────────────────────

function AddLunchForm({ onAdd, onCancel }) {
  const initial = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 15, 0, 0);
    return d;
  };
  const [date, setDate]           = useState(initial);
  const [pickerMode, setPickerMode] = useState(null);

  const isoDate = date.toISOString().split('T')[0];
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const handleChange = (_, selected) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (selected) setDate(selected);
  };

  return (
    <Card style={af.wrap}>
      <Text style={af.eyebrow}>plan a lunch</Text>
      <View style={af.row}>
        <Pressable style={af.datePill} onPress={() => setPickerMode('date')}>
          <Text style={af.datePillText}>{fmtDate(isoDate)}</Text>
        </Pressable>
        <Pressable style={af.datePill} onPress={() => setPickerMode('time')}>
          <Text style={af.datePillText}>@ {timeStr}</Text>
        </Pressable>
      </View>
      {pickerMode && (
        <DateTimePicker
          value={date}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={pickerMode === 'date' ? new Date() : undefined}
          onChange={handleChange}
        />
      )}
      <View style={af.actions}>
        <Button label="add to calendar" onPress={() => onAdd(isoDate, timeStr)} variant="primary" style={{ flex: 1 }} />
        <Button label="cancel" onPress={onCancel} variant="secondary" />
      </View>
    </Card>
  );
}

const af = StyleSheet.create({
  wrap:         { marginBottom: theme.space.md },
  eyebrow:      { ...theme.type.eyebrow, marginBottom: theme.space.md },
  row:          { flexDirection: 'row', gap: theme.space.sm, marginBottom: theme.space.md },
  datePill:     { flex: 1, backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.line },
  datePillText: { ...theme.type.body, fontWeight: '600' },
  actions:      { flexDirection: 'row', gap: theme.space.sm },
});

// ── RsvpSegment ───────────────────────────────────────────────────────────────

function RsvpSegment({ myRsvp, onRsvp }) {
  const OPTIONS = [
    { key: 'yes',   label: 'in',    tone: 'sage'  },
    { key: 'maybe', label: 'maybe', tone: 'honey' },
    { key: 'no',    label: 'out',   tone: 'cocoa' },
  ];
  return (
    <View style={rg.row}>
      {OPTIONS.map(({ key, label, tone }) => (
        <Pill key={key} label={label} active={myRsvp === key} tone={tone} onPress={() => onRsvp(key)} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

const rg = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.space.sm },
});

// ── PersonChip ────────────────────────────────────────────────────────────────

function PersonChip({ name, rsvp }) {
  const toneColor = rsvp === 'yes' ? theme.colors.sage : rsvp === 'no' ? theme.colors.cocoa : rsvp === 'maybe' ? theme.colors.honey : theme.colors.line;
  return (
    <View style={[pc.chip, { borderColor: toneColor }]}>
      <Avatar name={name} size="sm" />
      <Text style={pc.name}>{name}</Text>
    </View>
  );
}

const pc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 4, borderWidth: 1.5 },
  name: { ...theme.type.meta, color: theme.colors.ink, fontWeight: '600' },
});

// ── HeroCard ──────────────────────────────────────────────────────────────────

function HeroCard({ lunch, myTeams, onRemove }) {
  const {
    me, restaurants, lunches: allLunches, setRsvp, setRestaurant,
    toggleProposal, setNotes, setVibe, dietary, restaurantTags,
  } = useAppContext();

  const myRsvp      = lunch.rsvps[me];
  const teammates   = [...new Set((myTeams || []).flatMap(t => t.members))];
  const yesNames    = teammates.filter(n => lunch.rsvps[n] === 'yes');
  const noCount     = teammates.filter(n => lunch.rsvps[n] === 'no').length;
  const maybeCount  = teammates.filter(n => lunch.rsvps[n] === 'maybe').length;
  const d           = daysUntil(lunch.date);
  const myVibe      = (lunch.vibes || {})[me];
  const vibeTally   = {};
  Object.values(lunch.vibes || {}).forEach(v => { vibeTally[v] = (vibeTally[v] || 0) + 1; });

  const proposalEntries = Object.entries(lunch.proposedRestaurants).sort((a, b) => b[1].length - a[1].length);
  const [showAllSpots, setShowAllSpots] = useState(false);
  const visibleRests    = showAllSpots ? restaurants : restaurants.slice(0, 6);
  const nextPicker      = getNextPicker(allLunches, yesNames);

  const getConflicts = (rName) => {
    if (!dietary || !Object.keys(dietary).length) return [];
    const rTags = (restaurantTags || {})[rName] || [];
    return yesNames.filter(n => (dietary[n] || []).some(r => !rTags.includes(r)));
  };

  const confirmRemove = () => {
    Alert.alert('Remove lunch', `Remove ${fmtDateLong(lunch.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  };

  const dayLabel = isToday(lunch.date) ? 'today'
    : d === 1 ? 'tomorrow'
    : d < 0   ? 'happening now'
    : `in ${d} days`;

  return (
    <Card dark style={hc.card}>
      {/* date header */}
      <View style={hc.header}>
        <View>
          <Text style={hc.eyebrow}>{dayLabel}</Text>
          <Text style={hc.date}>{fmtDateLong(lunch.date)}</Text>
          <Text style={hc.time}>@ {lunch.time}</Text>
        </View>
        <Pressable style={hc.removeBtn} onPress={confirmRemove}>
          <Trash2 size={13} color={theme.colors.onDarkMuted} />
        </Pressable>
      </View>

      {/* RSVP */}
      <View style={hc.section}>
        <Text style={hc.sectionLabel}>your rsvp</Text>
        <RsvpSegment myRsvp={myRsvp} onRsvp={s => setRsvp(lunch.id, s)} />
        <View style={hc.statsRow}>
          <Text style={[hc.stat, { color: theme.colors.sage }]}>{yesNames.length} in</Text>
          {maybeCount > 0 && <Text style={[hc.stat, { color: theme.colors.honey }]}>{maybeCount} maybe</Text>}
          {noCount    > 0 && <Text style={[hc.stat, { color: theme.colors.cocoa }]}>{noCount} out</Text>}
        </View>
        <View style={hc.people}>
          {teammates.map(n => (
            <PersonChip key={n} name={n} rsvp={lunch.rsvps[n]} />
          ))}
        </View>
      </View>

      {/* Vibe */}
      <View style={hc.section}>
        <Text style={hc.sectionLabel}>vibe</Text>
        <View style={hc.vibeRow}>
          {VIBES.map(v => (
            <Pressable key={v} style={[hc.vibeChip, myVibe === v && hc.vibeChipActive]} onPress={() => setVibe(lunch.id, v)}>
              <Text style={hc.vibeEmoji}>{VIBE_EMOJI[v]}</Text>
              <Text style={[hc.vibeLabel, myVibe === v && hc.vibeLabelActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Restaurant */}
      <View style={hc.section}>
        <Text style={hc.sectionLabel}>where</Text>
        {lunch.restaurant ? (
          <View style={hc.pickedRow}>
            <View style={hc.picked}>
              <MapPin size={16} color={theme.colors.honey} />
              <Text style={hc.pickedName}>{lunch.restaurant}</Text>
            </View>
            <Pressable onPress={() => setRestaurant(lunch.id, null)}>
              <Text style={hc.changeLink}>change</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {nextPicker && (
              <View style={hc.turnChip}>
                <Text style={hc.turnChipText}>🎯 {nextPicker}'s turn to pick</Text>
              </View>
            )}
            <Text style={hc.hint}>vote below or lock one in</Text>
            {proposalEntries.length > 0 && (
              <View style={hc.proposals}>
                {proposalEntries.map(([name, voters]) => (
                  <Pressable key={name} style={hc.proposalRow} onPress={() => setRestaurant(lunch.id, name)}>
                    <Text style={hc.proposalName}>{name}{getConflicts(name).length > 0 ? ' ⚠️' : ''}</Text>
                    <Text style={hc.proposalVotes}>{voters.length} vote{voters.length !== 1 ? 's' : ''}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={hc.spotGrid}>
              {visibleRests.map(r => {
                const iVoted = (lunch.proposedRestaurants[r.name] || []).includes(me);
                return (
                  <Pressable key={r.name} style={[hc.spotChip, iVoted && hc.spotChipVoted]} onPress={() => toggleProposal(lunch.id, r.name)}>
                    {iVoted && <Check size={11} color={theme.colors.honey} />}
                    <Text style={[hc.spotChipText, iVoted && hc.spotChipTextVoted]}>
                      {r.name}{getConflicts(r.name).length > 0 ? ' ⚠️' : ''}
                    </Text>
                  </Pressable>
                );
              })}
              {restaurants.length > 6 && (
                <Pressable style={hc.spotChip} onPress={() => setShowAllSpots(s => !s)}>
                  <Text style={hc.spotChipText}>{showAllSpots ? 'fewer' : `+${restaurants.length - 6} more`}</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      {/* Notes */}
      <View style={hc.section}>
        <Text style={hc.sectionLabel}>notes</Text>
        <TextInput
          style={hc.notes}
          multiline
          numberOfLines={2}
          placeholder="reservation? guests? dietary chaos?"
          placeholderTextColor={theme.colors.onDarkMuted}
          value={lunch.notes || ''}
          onChangeText={text => setNotes(lunch.id, text)}
        />
      </View>
    </Card>
  );
}

const hc = StyleSheet.create({
  card: { marginBottom: theme.space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space.lg },
  eyebrow: { ...theme.type.eyebrow, color: theme.colors.honey, marginBottom: 2 },
  date:    { fontSize: 28, fontWeight: '600', color: theme.colors.onDark, letterSpacing: -0.5 },
  time:    { ...theme.type.meta, color: theme.colors.onDarkMuted, marginTop: 2 },
  removeBtn: { padding: theme.space.xs, backgroundColor: 'rgba(250,247,241,0.1)', borderRadius: theme.radius.chip },

  section:      { marginBottom: theme.space.lg },
  sectionLabel: { ...theme.type.label, color: theme.colors.onDarkMuted, marginBottom: theme.space.sm },
  statsRow:     { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.sm, marginBottom: theme.space.sm },
  stat:         { fontSize: 12, fontWeight: '600' },
  people:       { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.xs },

  vibeRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  vibeChip:       { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, backgroundColor: 'rgba(250,247,241,0.1)', borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 6 },
  vibeChipActive: { backgroundColor: theme.colors.honey },
  vibeEmoji:      { fontSize: 13 },
  vibeLabel:      { fontSize: 12, color: theme.colors.onDarkMuted },
  vibeLabelActive:{ color: theme.colors.espresso, fontWeight: '600' },

  pickedRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  picked:     { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  pickedName: { fontSize: 17, fontWeight: '600', color: theme.colors.onDark },
  changeLink: { ...theme.type.meta, color: theme.colors.honey },
  turnChip:   { backgroundColor: 'rgba(201,163,106,0.2)', borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: theme.space.sm },
  turnChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.honey },
  hint:       { ...theme.type.meta, color: theme.colors.onDarkMuted, marginBottom: theme.space.sm, fontStyle: 'italic' },
  proposals:  { marginBottom: theme.space.sm, gap: theme.space.xs },
  proposalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(250,247,241,0.08)', borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm },
  proposalName:   { ...theme.type.body, color: theme.colors.onDark, fontWeight: '600', flex: 1 },
  proposalVotes:  { ...theme.type.meta, color: theme.colors.honey },
  spotGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.sm },
  spotChip:       { backgroundColor: 'rgba(250,247,241,0.1)', borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotChipVoted:  { backgroundColor: 'rgba(201,163,106,0.25)' },
  spotChipText:   { fontSize: 12, color: theme.colors.onDarkMuted },
  spotChipTextVoted: { color: theme.colors.honey, fontWeight: '600' },
  notes: { backgroundColor: 'rgba(250,247,241,0.08)', borderRadius: theme.radius.chip, padding: theme.space.sm, fontSize: 14, color: theme.colors.onDark, minHeight: 56, textAlignVertical: 'top' },
});

// ── FutureCard ────────────────────────────────────────────────────────────────

function FutureCard({ lunch, me, setRsvp, onRemove }) {
  const myRsvp   = lunch.rsvps[me];
  const yesCount = Object.values(lunch.rsvps).filter(s => s === 'yes').length;

  const confirmRemove = () => {
    Alert.alert('Remove lunch', `Remove ${fmtDate(lunch.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  };

  return (
    <Card style={fc.card}>
      <View style={fc.top}>
        <Text style={fc.date}>{fmtDate(lunch.date)}</Text>
        <Pressable onPress={confirmRemove} hitSlop={8}>
          <Trash2 size={13} color={theme.colors.muted} />
        </Pressable>
      </View>
      <Text style={fc.where} numberOfLines={1}>{lunch.restaurant || 'tbd'}</Text>
      <Text style={fc.count}>{yesCount > 0 ? `${yesCount} in` : 'no rsvps yet'}</Text>
      <View style={fc.mini}>
        {[['yes', theme.colors.sage], ['maybe', theme.colors.honey], ['no', theme.colors.cocoa]].map(([key, color]) => (
          <Pressable
            key={key}
            style={[fc.miniBtn, myRsvp === key && { backgroundColor: color, borderColor: color }]}
            onPress={() => { Haptics.selectionAsync(); setRsvp(lunch.id, key); }}
          >
            {key === 'yes'   && <Check       size={12} color={myRsvp === key ? theme.colors.onDark : theme.colors.muted} />}
            {key === 'maybe' && <HelpCircle  size={12} color={myRsvp === key ? theme.colors.onDark : theme.colors.muted} />}
            {key === 'no'    && <X           size={12} color={myRsvp === key ? theme.colors.onDark : theme.colors.muted} />}
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const fc = StyleSheet.create({
  card:    { marginBottom: theme.space.sm },
  top:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  date:    { ...theme.type.h2, fontSize: 14 },
  where:   { ...theme.type.meta, color: theme.colors.ink, marginBottom: 4 },
  count:   { ...theme.type.meta, marginBottom: theme.space.sm },
  mini:    { flexDirection: 'row', gap: theme.space.xs },
  miniBtn: { flex: 1, backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.line },
});

// ── UpcomingView (main export) ────────────────────────────────────────────────

export default function UpcomingView() {
  const navigation = useNavigation();
  const { me, lunches, activeTeamList: teams, addLunch, removeLunch, setRsvp } = useAppContext();
  const [addOpen, setAddOpen] = useState(false);

  const myTeams  = (teams || []).filter(t => t.members.includes(me));
  const upcoming = lunches.filter(l => !isPast(l.date));

  if (myTeams.length === 0) {
    return (
      <ScrollView contentContainerStyle={uv.center}>
        <Card style={uv.onboarding}>
          <Text style={uv.onboardingTitle}>you're not on a team yet</Text>
          <Text style={uv.onboardingBody}>Create one for your crew or enter a code someone shared with you.</Text>
          <Button label="set up your crew →" onPress={() => navigation.navigate('You')} variant="primary" style={uv.onboardingBtn} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: theme.colors.bg }}
        contentContainerStyle={uv.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Schedule button / form — always at top */}
        {addOpen ? (
          <AddLunchForm
            onAdd={(d, t) => { addLunch(d, t); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        ) : (
          <Pressable style={uv.scheduleBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddOpen(true); }}>
            <Plus size={14} color={theme.colors.honey} />
            <Text style={uv.scheduleBtnText}>plan a lunch</Text>
          </Pressable>
        )}

        {upcoming.length === 0 ? (
          <Card style={uv.empty}>
            <Text style={uv.emptyTitle}>no plans yet</Text>
            <Text style={uv.emptySub}>pick a date and time above to get started</Text>
          </Card>
        ) : (
          <>
            {/* Hero card */}
            <HeroCard
              lunch={upcoming[0]}
              myTeams={myTeams}
              onRemove={() => removeLunch(upcoming[0].id)}
            />

            {/* Future list */}
            {upcoming.length > 1 && (
              <>
                <SectionHeader label="coming up" style={uv.sectionHeader} />
                {upcoming.slice(1, 8).map(l => (
                  <FutureCard key={l.id} lunch={l} me={me} setRsvp={setRsvp} onRemove={() => removeLunch(l.id)} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const uv = StyleSheet.create({
  scroll:  { padding: theme.space.screen, paddingBottom: theme.space.xxl },
  center:  { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: theme.space.screen },

  scheduleBtn:     { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm + 2, borderWidth: 1, borderColor: theme.colors.line, marginBottom: theme.space.md, ...theme.shadow.sm },
  scheduleBtnText: { fontSize: 13, fontWeight: '600', color: theme.colors.honey },

  onboarding:      { alignItems: 'center', gap: theme.space.md },
  onboardingTitle: { ...theme.type.h2, textAlign: 'center' },
  onboardingBody:  { ...theme.type.body, textAlign: 'center', color: theme.colors.muted },
  onboardingBtn:   { marginTop: theme.space.sm },

  empty:      { alignItems: 'center', gap: theme.space.sm, paddingVertical: theme.space.xl },
  emptyTitle: { ...theme.type.h2 },
  emptySub:   { ...theme.type.meta },

  sectionHeader: { marginTop: theme.space.sm, marginBottom: theme.space.sm },
});
