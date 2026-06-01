import React, { useState } from 'react';
import { Users, Plus, LogOut, LogIn, Star, Salad } from 'lucide-react';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'dairy-free', 'nut-free'];

const TEAM_EMOJIS = ['🍕', '🌮', '🍜', '🥗', '🍣', '🌯', '🍔', '🥘'];

export default function ProfileView({ me, teams, lunches, createTeam, joinTeam, leaveTeam, dietary, setDietary }) {
  const myDietary = (dietary || {})[me] || [];
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍕');

  const myTeams = teams.filter(t => t.members.includes(me));
  const otherTeams = teams.filter(t => !t.members.includes(me));
  const lunchesAttended = lunches.filter(l => l.rsvps[me] === 'yes').length;
  const initial = me ? me[0].toUpperCase() : '?';

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTeam(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('🍕');
    setShowCreate(false);
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
                  const next = active
                    ? myDietary.filter(t => t !== tag)
                    : [...myDietary, tag];
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
        <div className="profile-empty">not on any teams yet — join one below!</div>
      )}

      <div className="team-grid">
        {myTeams.map(team => (
          <div key={team.id} className="team-card team-card-mine">
            <div className="team-card-top">
              <span className="team-emoji">{team.emoji}</span>
              <span className="team-card-name">{team.name}</span>
              <span className="team-count">{team.members.length} members</span>
            </div>
            <div className="team-members-list">
              {team.members.map(m => (
                <span key={m} className={`team-member-pill ${m === me ? 'team-member-me' : ''}`}>{m}</span>
              ))}
            </div>
            {team.id !== 'team_main' && (
              <button className="team-action-btn btn-leave" onClick={() => leaveTeam(team.id)}>
                <LogOut size={12} /> leave
              </button>
            )}
          </div>
        ))}
      </div>

      {otherTeams.length > 0 && (
        <>
          <div className="profile-section-header">
            <Star size={15} />
            <span>discover teams</span>
          </div>
          <div className="team-grid">
            {otherTeams.map(team => (
              <div key={team.id} className="team-card team-card-other">
                <div className="team-card-top">
                  <span className="team-emoji">{team.emoji}</span>
                  <span className="team-card-name">{team.name}</span>
                  <span className="team-count">{team.members.length} members</span>
                </div>
                <div className="team-members-list">
                  {team.members.map(m => (
                    <span key={m} className="team-member-pill">{m}</span>
                  ))}
                </div>
                <button className="team-action-btn btn-join" onClick={() => joinTeam(team.id)}>
                  <LogIn size={12} /> join
                </button>
              </div>
            ))}
          </div>
        </>
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
