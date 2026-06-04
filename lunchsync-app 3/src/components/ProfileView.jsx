import React, { useState } from 'react';
import { Users, Plus, LogOut, Salad, Hash, Copy, Check } from 'lucide-react';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];
const TEAM_EMOJIS = ['🍕', '🌮', '🍜', '🥗', '🍣', '🌯', '🍔', '🥘'];

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div className="team-code-row">
      <span className="team-code-label">invite code</span>
      <span className="team-code-badge">{code}</span>
      <button className="team-code-copy" onClick={handleCopy} title="copy code">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export default function ProfileView({
  me, teams, lunches, activeTeamId, switchToTeamId,
  createTeam, joinTeamByCode, leaveTeam, dietary, setDietary
}) {
  const myDietary = (dietary || {})[me] || [];
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍕');
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState(null);

  const myTeams = teams.filter(t => t.members.includes(me));
  const lunchesAttended = lunches.filter(l => l.rsvps[me] === 'yes').length;
  const initial = me ? me[0].toUpperCase() : '?';

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTeam(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('🍕');
    setShowCreate(false);
  };

  const handleJoinByCode = () => {
    const result = joinTeamByCode(codeInput);
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

  return (
    <div className="profile-view">
      <div className="profile-header-card">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <div className="profile-name">{me}</div>
          <div className="profile-sub">lunch enthusiast</div>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-num">{myTeams.length}</span>
            <span className="profile-stat-label">teams</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-num">{lunchesAttended}</span>
            <span className="profile-stat-label">lunches attended</span>
          </div>
        </div>
      </div>

      <div className="profile-section-header">
        <Salad size={15} />
        <span>dietary restrictions</span>
      </div>

      <div className="dietary-section">
        <div className="dietary-hint">
          Tag your restrictions — the app will flag incompatible restaurants during voting.
        </div>
        <div className="dietary-tags">
          {DIETARY_OPTIONS.map(tag => {
            const active = myDietary.includes(tag);
            return (
              <button
                key={tag}
                className={`dietary-tag ${active ? 'active' : ''}`}
                onClick={() => {
                  const next = active ? myDietary.filter(t => t !== tag) : [...myDietary, tag];
                  setDietary(next);
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="profile-section-header">
        <Users size={15} />
        <span>your teams</span>
      </div>

      {myTeams.length === 0 && (
        <div className="profile-empty">not on any teams yet — create one below or enter a team code!</div>
      )}

      <div className="team-grid">
        {myTeams.map(team => {
          const isActive = team.id === activeTeamId;
          return (
            <div key={team.id} className={`team-card team-card-mine ${isActive ? 'team-card-active' : ''}`}>
              <div className="team-card-top">
                <span className="team-emoji">{team.emoji}</span>
                <span className="team-card-name">{team.name}</span>
                {isActive
                  ? <span className="team-active-badge">active</span>
                  : <span className="team-count">{team.members.length} members</span>
                }
              </div>
              <div className="team-members-list">
                {team.members.map(m => (
                  <span key={m} className={`team-member-pill ${m === me ? 'team-member-me' : ''}`}>{m}</span>
                ))}
              </div>
              {team.joinCode && <CopyCode code={team.joinCode} />}
              <div className="team-card-actions">
                {!isActive && (
                  <button className="team-action-btn btn-switch" onClick={() => switchToTeamId(team.id)}>
                    switch to this team
                  </button>
                )}
                <button className="team-action-btn btn-leave" onClick={() => leaveTeam(team.id)}>
                  <LogOut size={12} /> leave
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="profile-section-header">
        <Hash size={15} />
        <span>join by code</span>
      </div>
      <div className="join-code-form">
        <input
          className="join-code-input"
          placeholder="enter team code (e.g. ABC123)"
          value={codeInput}
          onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeMsg(null); }}
          onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
          maxLength={8}
        />
        <button className="join-code-btn" onClick={handleJoinByCode} disabled={!codeInput.trim()}>
          join
        </button>
      </div>
      {codeMsg && (
        <div className={`join-code-msg ${codeMsg.ok ? 'join-code-ok' : 'join-code-err'}`}>
          {codeMsg.text}
        </div>
      )}

      <div className="create-team-section">
        {!showCreate ? (
          <button className="create-team-btn" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> create a new team
          </button>
        ) : (
          <div className="create-team-form">
            <div className="create-form-title">new team</div>
            <div className="emoji-picker">
              {TEAM_EMOJIS.map(e => (
                <button
                  key={e}
                  className={`emoji-opt ${newEmoji === e ? 'active' : ''}`}
                  onClick={() => setNewEmoji(e)}
                >{e}</button>
              ))}
            </div>
            <input
              className="team-name-input"
              placeholder="team name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="create-form-actions">
              <button className="btn-cancel-create" onClick={() => { setShowCreate(false); setNewName(''); }}>cancel</button>
              <button className="btn-do-create" onClick={handleCreate} disabled={!newName.trim()}>create</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
