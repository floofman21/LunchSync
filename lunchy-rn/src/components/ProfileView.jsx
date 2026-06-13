import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Users, Plus, LogOut, Salad, Hash, Check, Copy } from 'lucide-react-native';
import { useAppContext } from '../AppContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '../theme';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];
const TEAM_EMOJIS     = ['🍕', '🌮', '🍜', '🥗', '🍣', '🌯', '🍔', '🥘'];

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Pressable style={cc.row} onPress={handleCopy}>
      <Text style={cc.label}>invite code</Text>
      <Text style={cc.badge}>{code}</Text>
      {copied
        ? <Check size={14} color={COLORS.yesFg} />
        : <Copy  size={14} color={COLORS.ink3}  />
      }
    </Pressable>
  );
}

const cc = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  label: { fontSize: 12, color: COLORS.ink3 },
  badge: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: COLORS.cherry, backgroundColor: COLORS.cherryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm, letterSpacing: 1 },
});

export default function ProfileView() {
  const {
    me, teams, lunches, activeTeamId, dietary,
    switchToTeamId, createTeam, joinTeamByCode, leaveTeam, setDietary,
  } = useAppContext();

  const myDietary  = (dietary || {})[me] || [];
  const myTeams    = teams.filter(t => t.members.includes(me));
  const lunchesAttended = lunches.filter(l => l.rsvps[me] === 'yes').length;
  const initial    = me ? me[0].toUpperCase() : '?';

  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newEmoji,   setNewEmoji]   = useState('🍕');
  const [codeInput,  setCodeInput]  = useState('');
  const [codeMsg,    setCodeMsg]    = useState(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTeam(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('🍕');
    setShowCreate(false);
  };

  const handleJoinByCode = async () => {
    const result = await joinTeamByCode(codeInput);
    if (result === true) {
      setCodeMsg({ ok: true, text: 'joined!' });
      setCodeInput('');
    } else if (result === 'already') {
      setCodeMsg({ ok: false, text: "you're already on that team" });
    } else {
      setCodeMsg({ ok: false, text: 'code not found — double-check it' });
    }
    setTimeout(() => setCodeMsg(null), 3000);
  };

  const confirmLeave = (team) => {
    Alert.alert('Leave team', `Leave ${team.emoji} ${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave',  style: 'destructive', onPress: () => leaveTeam(team.id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={pv.scroll}>
      {/* Avatar card */}
      <View style={pv.headerCard}>
        <View style={pv.avatar}>
          <Text style={pv.avatarText}>{initial}</Text>
        </View>
        <View style={pv.info}>
          <Text style={pv.name}>{me}</Text>
          <Text style={pv.sub}>lunch enthusiast</Text>
        </View>
        <View style={pv.stats}>
          <View style={pv.stat}>
            <Text style={pv.statNum}>{myTeams.length}</Text>
            <Text style={pv.statLabel}>teams</Text>
          </View>
          <View style={pv.stat}>
            <Text style={pv.statNum}>{lunchesAttended}</Text>
            <Text style={pv.statLabel}>attended</Text>
          </View>
        </View>
      </View>

      {/* Dietary */}
      <View style={pv.sectionHeader}>
        <Salad size={15} color={COLORS.ink3} />
        <Text style={pv.sectionTitle}>dietary restrictions</Text>
      </View>
      <View style={pv.section}>
        <Text style={pv.hint}>Tag your restrictions — the app flags incompatible restaurants during voting.</Text>
        <View style={pv.tagGrid}>
          {DIETARY_OPTIONS.map(tag => {
            const active = myDietary.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[pv.dietTag, active && pv.dietTagActive]}
                onPress={() => setDietary(active ? myDietary.filter(t => t !== tag) : [...myDietary, tag])}
              >
                <Text style={[pv.dietTagText, active && pv.dietTagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Teams */}
      <View style={pv.sectionHeader}>
        <Users size={15} color={COLORS.ink3} />
        <Text style={pv.sectionTitle}>your teams</Text>
      </View>

      {myTeams.length === 0 && (
        <Text style={pv.emptyTeams}>not on any teams yet — create one or enter a team code!</Text>
      )}

      {myTeams.map(team => {
        const isActive = team.id === activeTeamId;
        return (
          <View key={team.id} style={[pv.teamCard, isActive && pv.teamCardActive]}>
            <View style={pv.teamTop}>
              <Text style={pv.teamEmoji}>{team.emoji}</Text>
              <Text style={pv.teamName} numberOfLines={1}>{team.name}</Text>
              {isActive
                ? <View style={pv.activeBadge}><Text style={pv.activeBadgeText}>active</Text></View>
                : <Text style={pv.memberCount}>{team.members.length} members</Text>
              }
            </View>
            <View style={pv.memberList}>
              {team.members.map(m => (
                <Text key={m} style={[pv.memberPill, m === me && pv.memberPillMe]}>{m}</Text>
              ))}
            </View>
            {team.joinCode && <CopyCode code={team.joinCode} />}
            <View style={pv.teamActions}>
              {!isActive && (
                <Pressable style={[pv.teamActionBtn, pv.btnSwitch]} onPress={() => switchToTeamId(team.id)}>
                  <Text style={pv.btnSwitchText}>switch to this team</Text>
                </Pressable>
              )}
              <Pressable style={[pv.teamActionBtn, pv.btnLeave]} onPress={() => confirmLeave(team)}>
                <LogOut size={13} color={COLORS.noFg} />
                <Text style={pv.btnLeaveText}>leave</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Join by code */}
      <View style={pv.sectionHeader}>
        <Hash size={15} color={COLORS.ink3} />
        <Text style={pv.sectionTitle}>join by code</Text>
      </View>
      <View style={pv.joinRow}>
        <TextInput
          style={pv.joinInput}
          placeholder="enter team code (e.g. ABC123)"
          placeholderTextColor={COLORS.ink4}
          value={codeInput}
          onChangeText={v => { setCodeInput(v.toUpperCase()); setCodeMsg(null); }}
          onSubmitEditing={handleJoinByCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          returnKeyType="go"
        />
        <Pressable
          style={[pv.joinBtn, !codeInput.trim() && pv.joinBtnDisabled]}
          onPress={handleJoinByCode}
          disabled={!codeInput.trim()}
        >
          <Text style={pv.joinBtnText}>join</Text>
        </Pressable>
      </View>
      {codeMsg && (
        <Text style={[pv.codeMsg, codeMsg.ok ? pv.codeMsgOk : pv.codeMsgErr]}>{codeMsg.text}</Text>
      )}

      {/* Create team */}
      <View style={pv.createSection}>
        {!showCreate ? (
          <Pressable style={pv.createBtn} onPress={() => setShowCreate(true)}>
            <Plus size={15} color={COLORS.cherry} />
            <Text style={pv.createBtnText}>create a new team</Text>
          </Pressable>
        ) : (
          <View style={pv.createForm}>
            <Text style={pv.createFormTitle}>new team</Text>
            <View style={pv.emojiPicker}>
              {TEAM_EMOJIS.map(e => (
                <Pressable key={e} style={[pv.emojiOpt, newEmoji === e && pv.emojiOptActive]} onPress={() => setNewEmoji(e)}>
                  <Text style={pv.emojiOptText}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={pv.teamNameInput}
              placeholder="team name…"
              placeholderTextColor={COLORS.ink4}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              autoFocus
            />
            <View style={pv.createActions}>
              <Pressable style={pv.btnCancelCreate} onPress={() => { setShowCreate(false); setNewName(''); }}>
                <Text style={pv.btnCancelCreateText}>cancel</Text>
              </Pressable>
              <Pressable
                style={[pv.btnDoCreate, !newName.trim() && pv.btnDoCreateDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={pv.btnDoCreateText}>create</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const pv = StyleSheet.create({
  scroll:      { padding: SPACING.md, paddingBottom: SPACING.xl },

  headerCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.cherry, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  info:        { flex: 1 },
  name:        { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  sub:         { fontSize: 12, color: COLORS.ink3 },
  stats:       { flexDirection: 'row', gap: 16 },
  stat:        { alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '800', color: COLORS.cherry },
  statLabel:   { fontSize: 11, color: COLORS.ink3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: SPACING.md },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.ink2, textTransform: 'uppercase', letterSpacing: 0.4 },
  section:       { marginBottom: SPACING.sm },
  hint:          { fontSize: 13, color: COLORS.ink3, marginBottom: SPACING.sm, lineHeight: 18 },

  tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietTag:       { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  dietTagActive: { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  dietTagText:   { fontSize: 13, color: COLORS.ink2 },
  dietTagTextActive: { color: COLORS.cherry, fontWeight: '600' },

  emptyTeams:   { fontSize: 14, color: COLORS.ink3, fontStyle: 'italic', marginBottom: SPACING.sm },

  teamCard:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.xs },
  teamCardActive: { borderColor: COLORS.cherry, borderWidth: 1.5 },
  teamTop:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  teamEmoji:      { fontSize: 20 },
  teamName:       { fontSize: 15, fontWeight: '700', color: COLORS.ink, flex: 1 },
  activeBadge:    { backgroundColor: COLORS.cherry, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText:{ fontSize: 11, fontWeight: '700', color: '#fff' },
  memberCount:    { fontSize: 12, color: COLORS.ink3 },
  memberList:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  memberPill:     { fontSize: 12, color: COLORS.ink2, backgroundColor: COLORS.surface2, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  memberPillMe:   { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry, color: COLORS.cherry, fontWeight: '700' },
  teamActions:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  teamActionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1 },
  btnSwitch:      { backgroundColor: COLORS.surface2, borderColor: COLORS.borderMed },
  btnSwitchText:  { fontSize: 13, fontWeight: '600', color: COLORS.ink2 },
  btnLeave:       { backgroundColor: COLORS.noBg, borderColor: COLORS.noFg + '50' },
  btnLeaveText:   { fontSize: 13, fontWeight: '600', color: COLORS.noFg },

  joinRow:        { flexDirection: 'row', gap: 8, marginBottom: 6 },
  joinInput:      { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.surface2, fontFamily: 'monospace' },
  joinBtn:        { backgroundColor: COLORS.cherry, borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center' },
  joinBtnDisabled:{ opacity: 0.45 },
  joinBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  codeMsg:        { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  codeMsgOk:      { color: COLORS.yesFg },
  codeMsgErr:     { color: COLORS.noFg },

  createSection:  { marginTop: SPACING.md },
  createBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.cherry, borderStyle: 'dashed', justifyContent: 'center' },
  createBtnText:  { fontSize: 15, fontWeight: '600', color: COLORS.cherry },

  createForm:        { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.xs },
  createFormTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: SPACING.sm },
  emojiPicker:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  emojiOpt:          { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  emojiOptActive:    { backgroundColor: COLORS.cherryLight, borderColor: COLORS.cherry },
  emojiOptText:      { fontSize: 20 },
  teamNameInput:     { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.ink, backgroundColor: COLORS.surface2, marginBottom: SPACING.sm },
  createActions:     { flexDirection: 'row', gap: 8 },
  btnCancelCreate:   { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  btnCancelCreateText: { fontSize: 14, color: COLORS.ink3 },
  btnDoCreate:          { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.cherry, alignItems: 'center' },
  btnDoCreateDisabled:  { opacity: 0.45 },
  btnDoCreateText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});
