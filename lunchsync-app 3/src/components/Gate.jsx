import React, { useState } from 'react';

export default function Gate({ onPick, teams }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('choose a username to continue'); return; }

    if (code.trim()) {
      const team = (teams || []).find(
        t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
      );
      if (!team) { setError('team code not found — double-check it'); return; }
      onPick(trimmed, team.id);
    } else {
      onPick(trimmed, null);
    }
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-eyebrow">welcome to</div>
        <h1 className="gate-title">LunchSync</h1>
        <div className="gate-sub">your team lunch planner</div>

        <div className="gate-fields">
          <input
            className="gate-input"
            placeholder="username"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <input
            className="gate-input gate-input-secondary"
            placeholder="team code (optional)"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <div className="gate-error">{error}</div>}
          <button
            className="gate-submit"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            let's eat →
          </button>
        </div>

        <div className="gate-foot">no account needed · username saved in your browser</div>
      </div>
    </div>
  );
}
