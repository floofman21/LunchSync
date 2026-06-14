import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Users, Plus, LogOut, Salad, Hash, Check, Copy } from 'lucide-react-native';
import { useAppContext } from '../AppContext';
import { theme } from '../theme';
import { Card, Button, Pill, Avatar, SectionHeader } from '../ui';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];
const TEAM_EMOJIS     = ['🍕', '🌮', '🍜', '🥗', '🍣', '🌯', '🍔', '🥘'];

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Pressable style={cc.row} onPress={handleCopy}>
      <Text style={cc.label}>invite code</Text>
      <Text style={cc.badge}>{code}</Text>
      {copied ? <Check size={14} color={theme.colors.sage} /> : <Copy size={14} color={theme.colors.muted} />}
    </Pressable>
  );
}

const cc = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  label: { ...theme.type.meta },
  badge: { fontSize: 14, fontWeight: '700', color: theme.colors.honey, backgroundColor: 'rgba(201,163,106,0.15)', paddingHorizontal: theme.space.sm, paddingVertical: 3, borderRadius: theme.radius.chip, letterSpacing: 2 },
});

export default function ProfileView() {
  const {
    me, teams, lunches, activeTeamId, dietary,
    switchToTeamId, createTeam, joinTeamByCode, leaveTeam, setDietary,
  } = useAppContext();

  const myDietary       = (dietary || {})[me] || [];
  const myTeams         = teams.filter(t => t.members.includes(me));
  const lunchesAttended = lunches.filter(l => l.rsvps[me] === 'yes').length;

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCodeMsg({ ok: true,  text: 'joined!' });
      setCodeInput('');
    } else if (result === 'already') {
      setCodeMsg({ ok: false, text: "you're already on that team" });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCodeMsg({ ok: false, text: 'code not found — double-check it' });
    }
    setTimeout(() => setCodeMsg(null), 3000);
  };

  const confirmLeave = (team) => {
    Alert.alert('Leave team', `Leave ${team.emoji ? team.emoji + ' ' : ''}${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave',  style: 'destructive', onPress: () => leaveTeam(team.id) },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={pv.scroll}
    >
      {/* Profile hero */}
      <Card dark style={pv.heroCard}>
        <Avatar name={me} size="lg" />
        <View style={pv.heroInfo}>
          <Text style={pv.heroName}>{me}</Text>
          <Text style={pv.heroSub}>lunch enthusiast</Text>
        </View>
        <View style={pv.heroStats}>
          <View style={pv.stat}>
            <Text style={pv.statNum}>{myTeams.length}</Text>
            <Text style={pv.statLabel}>teams</Text>
          </View>
          <View style={pv.statDivider} />
          <View style={pv.stat}>
            <Text style={pv.statNum}>{lunchesAttended}</Text>
            <Text style={pv.statLabel}>lunches</Text>
          </View>
        </View>
      </Card>

      {/* Dietary */}
      <SectionHeader label="dietary needs" style={pv.sectionHeader} />
      <Card style={pv.section}>
        <Text style={pv.hint}>Tag your restrictions — the app flags incompatible spots when voting.</Text>
        <View style={pv.tagGrid}>
          {DIETARY_OPTIONS.map(tag => (
            <Pill
              key={tag}
              label={tag}
              active={myDietary.includes(tag)}
              tone="sage"
              onPress={() => setDietary(
                myDietary.includes(tag)
                  ? myDietary.filter(t => t !== tag)
                  : [...myDietary, tag]
              )}
            />
          ))}
        </View>
      </Card>

      {/* Teams */}
      <SectionHeader label="your teams" style={pv.sectionHeader} />
      {myTeams.length === 0 && (
        <Text style={pv.emptyTeams}>not on any teams yet — create one or enter a code!</Text>
      )}
      {myTeams.map(team => {
        const isActive = team.id === activeTeamId;
        return (
          <Card key={team.id} style={[pv.teamCard, isActive && pv.teamCardActive]}>
            <View style={pv.teamTop}>
              {team.emoji ? <Text style={pv.teamEmoji}>{team.emoji}</Text> : null}
              <Text style={pv.teamName} numberOfLines={1}>{team.name}</Text>
              {isActive && (
                <View style={pv.activeBadge}>
                  <Text style={pv.activeBadgeText}>active</Text>
                </View>
              )}
            </View>
            <View style={pv.memberList}>
              {team.members.map(m => (
                <View key={m} style={[pv.memberPill, m === me && pv.memberPillMe]}>
                  <Text style={[pv.memberPillText, m === me && pv.memberPillMeText]}>{m}</Text>
                </View>
              ))}
            </View>
            {team.joinCode && (
              <View style={pv.copyRow}>
                <CopyCode code={team.joinCode} />
              </View>
            )}
            <View style={pv.teamActions}>
              {!isActive && (
                <Button
                  label="switch to this team"
                  onPress={() => switchToTeamId(team.id)}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label="leave"
                onPress={() => confirmLeave(team)}
                variant="ghost"
              />
            </View>
          </Card>
        );
      })}

      {/* Join by code */}
      <SectionHeader label="join by code" style={pv.sectionHeader} />
      <View style={pv.joinRow}>
        <TextInput
          style={pv.joinInput}
          placeholder="team code (e.g. ABC123)"
          placeholderTextColor={theme.colors.muted}
          value={codeInput}
          onChangeText={v => { setCodeInput(v.toUpperCase()); setCodeMsg(null); }}
          onSubmitEditing={handleJoinByCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          returnKeyType="go"
        />
        <Button label="join" onPress={handleJoinByCode} variant="primary" disabled={!codeInput.trim()} />
      </View>
      {codeMsg && (
        <Text style={[pv.codeMsg, codeMsg.ok ? pv.codeMsgOk : pv.codeMsgErr]}>{codeMsg.text}</Text>
      )}

      {/* Create team */}
      <View style={pv.createSection}>
        {!showCreate ? (
          <Pressable style={pv.createBtn} onPress={() => { Haptics.selectionAsync(); setShowCreate(true); }}>
            <Plus size={15} color={theme.colors.honey} />
            <Text style={pv.createBtnText}>create a new team</Text>
          </Pressable>
        ) : (
          <Card style={pv.createForm}>
            <Text style={pv.createFormTitle}>new team</Text>
            <View style={pv.emojiPicker}>
              {TEAM_EMOJIS.map(e => (
                <Pressable
                  key={e}
                  style={[pv.emojiOpt, newEmoji === e && pv.emojiOptActive]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={pv.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={pv.teamNameInput}
              placeholder="team name…"
              placeholderTextColor={theme.colors.muted}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              autoFocus
            />
            <View style={pv.createActions}>
              <Button label="cancel" onPress={() => { setShowCreate(false); setNewName(''); }} variant="secondary" style={{ flex: 1 }} />
              <Button label="create" onPress={handleCreate} variant="primary" disabled={!newName.trim()} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const pv = StyleSheet.create({
  scroll: { padding: theme.space.screen, paddingBottom: theme.space.xxl },

  heroCard:   { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, marginBottom: theme.space.xl, flexWrap: 'wrap' },
  heroInfo:   { flex: 1 },
  heroName:   { fontSize: 18, fontWeight: '700', color: theme.colors.onDark },
  heroSub:    { ...theme.type.meta, color: theme.colors.onDarkMuted },
  heroStats:  { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  stat:       { alignItems: 'center', gap: 2 },
  statNum:    { fontSize: 22, fontWeight: '700', color: theme.colors.honey },
  statLabel:  { ...theme.type.label, color: theme.colors.onDarkMuted },
  statDivider:{ width: 1, height: 28, backgroundColor: 'rgba(250,247,241,0.2)' },

  sectionHeader: { marginTop: theme.space.lg, marginBottom: theme.space.sm },
  section:       { marginBottom: theme.space.md },
  hint:          { ...theme.type.meta, marginBottom: theme.space.md, lineHeight: 18 },
  tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },

  emptyTeams: { ...theme.type.meta, fontStyle: 'italic', marginBottom: theme.space.sm },

  teamCard:        { marginBottom: theme.space.sm, gap: theme.space.sm },
  teamCardActive:  { borderWidth: 1.5, borderColor: theme.colors.honey },
  teamTop:         { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  teamEmoji:       { fontSize: 20 },
  teamName:        { ...theme.type.h2, flex: 1 },
  activeBadge:     { backgroundColor: theme.colors.honey, borderRadius: theme.radius.pill, paddingHorizontal: theme.space.sm, paddingVertical: 3 },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.espresso },
  memberList:      { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  memberPill:      { backgroundColor: theme.colors.cream, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.sm, paddingVertical: 3, borderWidth: 1, borderColor: theme.colors.line },
  memberPillText:  { fontSize: 12, color: theme.colors.ink },
  memberPillMe:    { backgroundColor: 'rgba(201,163,106,0.15)', borderColor: theme.colors.honey },
  memberPillMeText:{ color: theme.colors.honey, fontWeight: '700' },
  copyRow:         { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.space.sm },
  teamActions:     { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.xs },

  joinRow:   { flexDirection: 'row', gap: theme.space.sm, marginBottom: theme.space.sm, alignItems: 'center' },
  joinInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm + 2, fontSize: 14, color: theme.colors.ink, backgroundColor: theme.colors.surface },
  codeMsg:   { fontSize: 13, fontWeight: '600', marginBottom: theme.space.sm },
  codeMsgOk: { color: theme.colors.sage },
  codeMsgErr:{ color: theme.colors.cocoa },

  createSection:   { marginTop: theme.space.lg },
  createBtn:       { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: theme.space.lg, borderWidth: 1.5, borderColor: theme.colors.honey, borderStyle: 'dashed', justifyContent: 'center', ...theme.shadow.sm },
  createBtnText:   { fontSize: 15, fontWeight: '600', color: theme.colors.honey },
  createForm:      { gap: theme.space.md },
  createFormTitle: { ...theme.type.h2 },
  emojiPicker:     { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  emojiOpt:        { width: 40, height: 40, borderRadius: theme.radius.chip, backgroundColor: theme.colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  emojiOptActive:  { backgroundColor: 'rgba(201,163,106,0.2)', borderColor: theme.colors.honey },
  emojiText:       { fontSize: 20 },
  teamNameInput:   { borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.chip, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm + 2, fontSize: 15, color: theme.colors.ink, backgroundColor: theme.colors.cream },
  createActions:   { flexDirection: 'row', gap: theme.space.sm },
});
