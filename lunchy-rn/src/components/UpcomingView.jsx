import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, FlatList,
  StyleSheet, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, X, HelpCircle, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fmtDate, fmtDateLong, isPast, isToday, daysUntil } from '../data';
import { useAppContext } from '../AppContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme';

const VIBES = ['quick bite', 'sit-down', 'adventurous', 'comfort food', 'patio'];
const VIBE_EMOJI = {
  'quick bite':    '⚡',
  'sit-down':      '🍽️',
  'adventurous':   '🗺️',
  'comfort food':  '🫶',
  'patio':         '☀️',
};

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── SpinWheel ─────────────────────────────────────────────────────────────────

function SpinWheel({ attendees }) {
  const [phase, setPhase]   = useState('idle');
  const [shown, setShown]   = useState('');
  const timerRef            = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const spin = () => {
    if (phase === 'spinning' || !attendees.length) return;
    setPhase('spinning');
    const winner = attendees[Math.floor(Math.random() * attendees.length)];
    let tick = 0;
    const total = 18 + Math.floor(Math.random() * 8);
    timerRef.current = setInterval(() => {
      setShown(attendees[tick % attendees.length]);
      tick++;
      if (tick >= total) {
        clearInterval(timerRef.current);
        setShown(winner);
        setPhase('done');
      }
    }, 72);
  };

  const reset = () => { setPhase('idle'); setShown(''); };

  return (
    <View style={sw.wrap}>
      <Pressable
        style={[sw.btn, phase === 'done' && sw.btnDone]}
        onPress={phase === 'done' ? reset : spin}
        disabled={phase === 'spinning'}
      >
        <Text style={sw.btnText}>
          {'🎰 '}
          {phase === 'idle'     && 'spin to decide'}
          {phase === 'spinning' && (shown || '…')}
          {phase === 'done'     && `${shown}!`}
        </Text>
      </Pressable>
      {phase === 'done' && <Text style={sw.hint}>tap to reset</Text>}
    </View>
  );
}

const sw = StyleSheet.create({
  wrap: { alignItems: 'flex-start', marginBottom: 8 },
  btn: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnDone: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  btnText: { fontSize: 14, fontWeight: '600', color: COLORS.ink2 },
  hint:    { fontSize: 12, color: COLORS.ink3, marginTop: 4 },
});

// ── AddLunchForm ──────────────────────────────────────────────────────────────

function AddLunchForm({ onAdd, onCancel }) {
  const initial = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 15, 0, 0);
    return d;
  };

  const [date,    setDate]    = useState(initial);
  const [pickerMode, setPickerMode] = useState(null); // 'date' | 'time' | null

  const isoDate = date.toISOString().split('T')[0];
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const handleChange = (_, selected) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (selected) setDate(selected);
  };

  return (
    <View style={af.wrap}>
      <Text style={af.label}>schedule a lunch</Text>
      <View style={af.row}>
        <Pressable style={af.pill} onPress={() => setPickerMode('date')}>
          <Text style={af.pillText}>{fmtDate(isoDate)}</Text>
        </Pressable>
        <Pressable style={af.pill} onPress={() => setPickerMode('time')}>
          <Text style={af.pillText}>@ {timeStr}</Text>
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
        <Pressable style={af.addBtn} onPress={() => onAdd(isoDate, timeStr)}>
          <Text style={af.addBtnText}>add to calendar</Text>
        </Pressable>
        <Pressable style={af.cancelBtn} onPress={onCancel}>
          <Text style={af.cancelBtnText}>cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const af = StyleSheet.create({
  wrap:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  label:  { fontSize: 13, fontWeight: '600', color: COLORS.ink3, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:    { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  pill:   { flex: 1, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  pillText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  actions:  { flexDirection: 'row', gap: 8, marginTop: 4 },
  addBtn:     { flex: 1, backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn:     { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.ink3, fontSize: 14 },
});

// ── RsvpBtn ───────────────────────────────────────────────────────────────────

function RsvpBtn({ status, active, onPress, icon: Icon, label }) {
  const bg  = active && status === 'yes'   ? COLORS.yesBg
            : active && status === 'no'    ? COLORS.noBg
            : active && status === 'maybe' ? COLORS.maybeBg
            : COLORS.surface2;
  const fg  = active && status === 'yes'   ? COLORS.yesFg
            : active && status === 'no'    ? COLORS.noFg
            : active && status === 'maybe' ? COLORS.maybeFg
            : COLORS.ink3;
  return (
    <Pressable style={[rb.btn, { backgroundColor: bg, borderColor: active ? fg : COLORS.border }]} onPress={onPress}>
      <Icon size={18} color={fg} />
      <Text style={[rb.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const rb = StyleSheet.create({
  btn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5 },
  label: { fontSize: 14, fontWeight: '600' },
});

// ── FutureCard ────────────────────────────────────────────────────────────────

function FutureCard({ lunch, me, setRsvp, onRemove }) {
  const myRsvp  = lunch.rsvps[me];
  const yesCount = Object.values(lunch.rsvps).filter(s => s === 'yes').length;

  const confirmRemove = () => {
    Alert.alert('Remove lunch', `Remove ${fmtDate(lunch.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  };

  return (
    <View style={fc.card}>
      <View style={fc.top}>
        <Text style={fc.date}>{fmtDate(lunch.date)}</Text>
        <Pressable onPress={confirmRemove} style={fc.del}>
          <Trash2 size={13} color={COLORS.ink4} />
        </Pressable>
      </View>
      <Text style={fc.where} numberOfLines={1}>{lunch.restaurant || 'tbd'}</Text>
      <Text style={fc.yes}>{yesCount > 0 ? `${yesCount} ${yesCount === 1 ? 'person' : 'people'} in` : 'crickets so far'}</Text>
      <View style={fc.rsvp}>
        <Pressable style={[fc.mini, myRsvp === 'yes'   && fc.miniYes]}   onPress={() => setRsvp(lunch.id, 'yes')}>
          <Check    size={13} color={myRsvp === 'yes'   ? COLORS.yesFg  : COLORS.ink4} />
        </Pressable>
        <Pressable style={[fc.mini, myRsvp === 'maybe' && fc.miniMaybe]} onPress={() => setRsvp(lunch.id, 'maybe')}>
          <HelpCircle size={13} color={myRsvp === 'maybe' ? COLORS.maybeFg : COLORS.ink4} />
        </Pressable>
        <Pressable style={[fc.mini, myRsvp === 'no'    && fc.miniNo]}    onPress={() => setRsvp(lunch.id, 'no')}>
          <X        size={13} color={myRsvp === 'no'    ? COLORS.noFg   : COLORS.ink4} />
        </Pressable>
      </View>
    </View>
  );
}

const fc = StyleSheet.create({
  card:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.xs },
  top:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  date:       { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  del:        { padding: 3 },
  where:      { fontSize: 13, color: COLORS.ink2, marginBottom: 3 },
  yes:        { fontSize: 12, color: COLORS.ink3, marginBottom: 8 },
  rsvp:       { flexDirection: 'row', gap: 6 },
  mini:       { flex: 1, backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  miniYes:    { backgroundColor: COLORS.yesBg,   borderColor: COLORS.yesFg },
  miniMaybe:  { backgroundColor: COLORS.maybeBg, borderColor: COLORS.maybeFg },
  miniNo:     { backgroundColor: COLORS.noBg,    borderColor: COLORS.noFg },
});

// ── NextLunchCard ─────────────────────────────────────────────────────────────

function NextLunchCard({ lunch, myTeams, onRemove }) {
  const { me, restaurants, lunches: allLunches, setRsvp, setRestaurant, toggleProposal, setNotes, setVibe, dietary, restaurantTags } = useAppContext();

  const myRsvp     = lunch.rsvps[me];
  const teammates  = [...new Set((myTeams || []).flatMap(t => t.members))];
  const yesNames   = teammates.filter(n => lunch.rsvps[n] === 'yes');
  const noCount    = teammates.filter(n => lunch.rsvps[n] === 'no').length;
  const maybeCount = teammates.filter(n => lunch.rsvps[n] === 'maybe').length;
  const pending    = teammates.filter(n => !lunch.rsvps[n]);
  const d          = daysUntil(lunch.date);
  const [showAllSpots, setShowAllSpots] = useState(false);

  const proposalEntries  = Object.entries(lunch.proposedRestaurants).sort((a, b) => b[1].length - a[1].length);
  const visibleRestaurants = showAllSpots ? restaurants : restaurants.slice(0, 6);
  const myVibe    = (lunch.vibes || {})[me];
  const vibeTally = {};
  Object.values(lunch.vibes || {}).forEach(v => { vibeTally[v] = (vibeTally[v] || 0) + 1; });
  const nextPicker = getNextPicker(allLunches, yesNames);

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

  return (
    <View style={nc.card}>
      {/* header */}
      <View style={nc.heroHeader}>
        <View>
          <Text style={nc.tag}>
            {isToday(lunch.date) ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? 'happening now' : `in ${d} days`}
          </Text>
          <Text style={nc.date}>{fmtDateLong(lunch.date)}</Text>
          <Text style={nc.time}>@ {lunch.time}</Text>
        </View>
        <Pressable style={nc.removeBtn} onPress={confirmRemove}>
          <Trash2 size={14} color={COLORS.noFg} />
          <Text style={nc.removeBtnText}>remove</Text>
        </Pressable>
      </View>

      {/* RSVP */}
      <View style={nc.block}>
        <Text style={nc.blockLabel}>your rsvp</Text>
        <View style={nc.rsvpRow}>
          <RsvpBtn status="yes"   active={myRsvp === 'yes'}   onPress={() => setRsvp(lunch.id, 'yes')}   icon={Check}       label="in" />
          <RsvpBtn status="maybe" active={myRsvp === 'maybe'} onPress={() => setRsvp(lunch.id, 'maybe')} icon={HelpCircle}  label="maybe" />
          <RsvpBtn status="no"    active={myRsvp === 'no'}    onPress={() => setRsvp(lunch.id, 'no')}    icon={X}           label="out" />
        </View>
        <View style={nc.statsRow}>
          <Text style={nc.statYes}>{yesNames.length} in</Text>
          {maybeCount > 0 && <Text style={nc.statMaybe}>{maybeCount} maybe</Text>}
          {noCount    > 0 && <Text style={nc.statNo}>{noCount} out</Text>}
          {pending.length > 0 && <Text style={nc.statPending}>{pending.length} haven't replied</Text>}
        </View>
        <View style={nc.people}>
          {teammates.map(n => {
            const sv = lunch.rsvps[n];
            return (
              <View key={n} style={[nc.person, sv === 'yes' ? nc.personYes : sv === 'no' ? nc.personNo : sv === 'maybe' ? nc.personMaybe : nc.personPending]}>
                <Text style={nc.personName}>{n}</Text>
                {sv === 'yes'   && <Check       size={10} color={COLORS.yesFg}  />}
                {sv === 'no'    && <X           size={10} color={COLORS.noFg}   />}
                {sv === 'maybe' && <HelpCircle  size={10} color={COLORS.maybeFg}/>}
              </View>
            );
          })}
        </View>
      </View>

      {/* Vibe voting */}
      <View style={nc.block}>
        <Text style={nc.blockLabel}>today's vibe</Text>
        <View style={nc.vibeGrid}>
          {VIBES.map(v => (
            <Pressable key={v} style={[nc.vibeBtn, myVibe === v && nc.vibeBtnActive]} onPress={() => setVibe(lunch.id, v)}>
              <Text style={nc.vibeEmoji}>{VIBE_EMOJI[v]}</Text>
              <Text style={[nc.vibeLabel, myVibe === v && nc.vibeLabelActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        {Object.keys(vibeTally).length > 0 && (
          <View style={nc.vibeTally}>
            {Object.entries(vibeTally).sort((a, b) => b[1] - a[1]).map(([v, n]) => (
              <Text key={v} style={nc.vibeTallyItem}>{VIBE_EMOJI[v]} {v} ×{n}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Restaurant */}
      <View style={nc.block}>
        <Text style={nc.blockLabel}>where</Text>
        {lunch.restaurant ? (
          <View style={nc.pickedRow}>
            <View style={nc.picked}>
              <MapPin size={16} color={COLORS.cherry} />
              <Text style={nc.pickedName}>{lunch.restaurant}</Text>
            </View>
            <Pressable onPress={() => setRestaurant(lunch.id, null)}>
              <Text style={nc.linkBtn}>change</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={nc.turnRow}>
              {nextPicker && (
                <View style={nc.turnChip}>
                  <Text style={nc.turnChipText}>🎯 {nextPicker}'s turn to pick</Text>
                </View>
              )}
              <SpinWheel attendees={yesNames} />
            </View>
            <Text style={nc.hint}>nothing picked yet — vote or lock one in →</Text>

            {proposalEntries.length > 0 && (
              <View style={nc.proposals}>
                {proposalEntries.map(([name, voters]) => {
                  const conflicts = getConflicts(name);
                  return (
                    <Pressable key={name} style={nc.proposalRow} onPress={() => setRestaurant(lunch.id, name)}>
                      <Text style={nc.proposalName}>
                        {name}{conflicts.length > 0 ? ' ⚠️' : ''}
                      </Text>
                      <Text style={nc.proposalVotes}>{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={nc.spotGrid}>
              {visibleRestaurants.map(r => {
                const voters   = lunch.proposedRestaurants[r.name] || [];
                const iVoted   = voters.includes(me);
                const conflicts = getConflicts(r.name);
                return (
                  <Pressable
                    key={r.name}
                    style={[nc.spotChip, iVoted && nc.spotChipVoted]}
                    onPress={() => toggleProposal(lunch.id, r.name)}
                  >
                    {iVoted && <Check size={11} color={COLORS.cherry} />}
                    <Text style={[nc.spotChipText, iVoted && nc.spotChipTextVoted]}>
                      {r.name}{conflicts.length > 0 ? ' ⚠️' : ''}
                    </Text>
                  </Pressable>
                );
              })}
              {restaurants.length > 6 && (
                <Pressable style={[nc.spotChip, nc.spotChipMore]} onPress={() => setShowAllSpots(s => !s)}>
                  <Text style={nc.spotChipText}>{showAllSpots ? 'fewer' : `+${restaurants.length - 6} more`}</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      {/* Notes */}
      <View style={nc.block}>
        <Text style={nc.blockLabel}>notes</Text>
        <TextInput
          style={nc.notes}
          multiline
          numberOfLines={2}
          placeholder="anything to share? reservation? guests? dietary chaos?"
          placeholderTextColor={COLORS.ink4}
          value={lunch.notes || ''}
          onChangeText={text => setNotes(lunch.id, text)}
        />
      </View>
    </View>
  );
}

const nc = StyleSheet.create({
  card:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  tag:        { fontSize: 11, fontWeight: '700', color: COLORS.cherry, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  date:       { fontSize: 20, fontWeight: '800', color: COLORS.ink, marginBottom: 2 },
  time:       { fontSize: 13, color: COLORS.ink3 },
  removeBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.noBg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.noFg + '40' },
  removeBtnText: { fontSize: 12, color: COLORS.noFg, fontWeight: '600' },

  block:      { marginBottom: SPACING.md },
  blockLabel: { fontSize: 11, fontWeight: '700', color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  rsvpRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  statYes:    { fontSize: 12, fontWeight: '600', color: COLORS.yesFg,   backgroundColor: COLORS.yesBg,   paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statMaybe:  { fontSize: 12, fontWeight: '600', color: COLORS.maybeFg, backgroundColor: COLORS.maybeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statNo:     { fontSize: 12, fontWeight: '600', color: COLORS.noFg,    backgroundColor: COLORS.noBg,    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statPending:{ fontSize: 12, color: COLORS.ink3, paddingHorizontal: 8, paddingVertical: 3 },
  people:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  person:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  personYes:  { backgroundColor: COLORS.yesBg,   borderColor: COLORS.yesFg   },
  personNo:   { backgroundColor: COLORS.noBg,    borderColor: COLORS.noFg    },
  personMaybe:{ backgroundColor: COLORS.maybeBg, borderColor: COLORS.maybeFg },
  personPending: { backgroundColor: COLORS.surface2, borderColor: COLORS.border },
  personName: { fontSize: 12, fontWeight: '600', color: COLORS.ink2 },

  vibeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  vibeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  vibeBtnActive: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  vibeEmoji:  { fontSize: 14 },
  vibeLabel:  { fontSize: 13, color: COLORS.ink2 },
  vibeLabelActive: { color: COLORS.cherry, fontWeight: '600' },
  vibeTally:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeTallyItem: { fontSize: 13, color: COLORS.ink2 },

  pickedRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  picked:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickedName: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  linkBtn:    { fontSize: 13, color: COLORS.cherry, fontWeight: '600' },
  turnRow:    { gap: 8, marginBottom: 8 },
  turnChip:   { backgroundColor: COLORS.cherryLight, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 4 },
  turnChipText: { fontSize: 13, fontWeight: '600', color: COLORS.cherry },
  hint:       { fontSize: 13, color: COLORS.ink3, marginBottom: 10, fontStyle: 'italic' },
  proposals:  { marginBottom: 10, gap: 4 },
  proposalRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  proposalName:  { fontSize: 14, fontWeight: '600', color: COLORS.ink, flex: 1 },
  proposalVotes: { fontSize: 12, color: COLORS.ink3 },
  spotGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spotChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  spotChipVoted:  { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  spotChipMore:   { borderStyle: 'dashed' },
  spotChipText:   { fontSize: 13, color: COLORS.ink2 },
  spotChipTextVoted: { color: COLORS.cherry, fontWeight: '600' },

  notes: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 10, fontSize: 14, color: COLORS.ink, minHeight: 60, textAlignVertical: 'top' },
});

// ── UpcomingView (main export) ────────────────────────────────────────────────

export default function UpcomingView() {
  const navigation = useNavigation();
  const { me, lunches, activeTeamList: teams, addLunch, removeLunch } = useAppContext();
  const [addOpen, setAddOpen] = useState(false);
  const myTeams = (teams || []).filter(t => t.members.includes(me));

  if (myTeams.length === 0) {
    return (
      <ScrollView contentContainerStyle={uv.center}>
        <View style={uv.onboarding}>
          <Text style={uv.onboardingEmoji}>🥪</Text>
          <Text style={uv.onboardingTitle}>you're not on a team yet</Text>
          <Text style={uv.onboardingBody}>Create one for your crew or enter a code someone shared with you.</Text>
          <Pressable style={uv.onboardingBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={uv.onboardingBtnText}>set up my team →</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const upcoming = lunches.filter(l => !isPast(l.date));

  if (upcoming.length === 0) {
    return (
      <ScrollView contentContainerStyle={uv.center}>
        <View style={uv.empty}>
          <Text style={uv.emptyEmoji}>📅</Text>
          <Text style={uv.emptyText}>no lunches scheduled yet</Text>
          <Text style={uv.emptySub}>pick a date and time to get started</Text>
        </View>
        {addOpen ? (
          <View style={{ padding: SPACING.md }}>
            <AddLunchForm onAdd={(d, t) => { addLunch(d, t); setAddOpen(false); }} onCancel={() => setAddOpen(false)} />
          </View>
        ) : (
          <Pressable style={uv.scheduleBtnLarge} onPress={() => setAddOpen(true)}>
            <Plus size={16} color="#fff" />
            <Text style={uv.scheduleBtnLargeText}>schedule a lunch</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  const [next, ...rest] = upcoming;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={uv.scroll} keyboardShouldPersistTaps="handled">
        {/* Schedule button / form at top */}
        <View style={uv.topAction}>
          {addOpen ? (
            <AddLunchForm onAdd={(d, t) => { addLunch(d, t); setAddOpen(false); }} onCancel={() => setAddOpen(false)} />
          ) : (
            <Pressable style={uv.scheduleBtn} onPress={() => setAddOpen(true)}>
              <Plus size={14} color={COLORS.cherry} />
              <Text style={uv.scheduleBtnText}>schedule a lunch</Text>
            </Pressable>
          )}
        </View>

        {/* Hero card */}
        <NextLunchCard lunch={next} myTeams={myTeams} onRemove={() => removeLunch(next.id)} />

        {/* Future list */}
        {rest.length > 0 && (
          <View style={uv.future}>
            <Text style={uv.sectionLabel}>what's coming up</Text>
            <View style={uv.futureGrid}>
              {rest.slice(0, 8).map(l => (
                <View key={l.id} style={uv.futureItem}>
                  <FutureCard lunch={l} me={me} setRsvp={setRsvp} onRemove={() => removeLunch(l.id)} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const uv = StyleSheet.create({
  scroll:   { padding: SPACING.md, paddingBottom: SPACING.xl },
  center:   { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },

  onboarding:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm },
  onboardingEmoji: { fontSize: 40, marginBottom: 8 },
  onboardingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 8, textAlign: 'center' },
  onboardingBody:  { fontSize: 14, color: COLORS.ink3, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  onboardingBtn:   { backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12 },
  onboardingBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  empty:      { alignItems: 'center', marginBottom: SPACING.lg },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText:  { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 4 },
  emptySub:   { fontSize: 13, color: COLORS.ink3 },

  scheduleBtnLarge:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 14, ...SHADOW.sm },
  scheduleBtnLargeText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  topAction:       { marginBottom: SPACING.md },
  scheduleBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.borderMed, ...SHADOW.xs },
  scheduleBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.cherry },

  future:      { marginTop: SPACING.sm },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  futureGrid:  { gap: SPACING.sm },
  futureItem:  { /* full width, list-style */ },
});
