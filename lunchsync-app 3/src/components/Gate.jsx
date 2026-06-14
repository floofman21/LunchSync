import React, { useState } from 'react';

export default function Gate({ onPick, teams }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('what should we call you?'); return; }

    if (code.trim()) {
      const team = (teams || []).find(
        t => t.joinCode?.toLowerCase() === code.trim().toLowerCase()
      );
      if (!team) { setError("hmm, that code didn't match. double-check it?"); return; }
      onPick(trimmed, team.id);
    } else {
      onPick(trimmed, null);
    }
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-logo">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <circle cx="45" cy="56" r="27" fill="#fff"/>
            <circle cx="74" cy="40" r="15" fill="#F26430"/>
            <circle cx="72" cy="32" r="5" fill="#fff"/>
            <circle cx="80" cy="55" r="6.5" fill="#fff"/>
          </svg>
        </div>
        <h1 className="gate-title">Crumb</h1>
        <div className="gate-sub">good plans, no nagging.</div>

        <div className="gate-fields">
          <input
            className="gate-input"
            placeholder="what should we call you?"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <input
            className="gate-input gate-input-secondary"
            placeholder="join with a code (optional)"
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
