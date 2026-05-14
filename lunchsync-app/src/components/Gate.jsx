import React, { useState } from 'react';
import { TEAM } from '../data.js';

export default function Gate({ mode, onLogin, onPick, onLogout, error, busy }) {
  const [pass, setPass] = useState('');

  if (mode === 'passphrase') {
    const submit = () => {
      if (pass.trim() && !busy) onLogin(pass.trim());
    };
    return (
      <div className="gate">
        <div className="gate-card">
          <div className="gate-eyebrow">welcome to</div>
          <h1 className="gate-title">LunchSync</h1>
          <div className="gate-sub">team passphrase, please</div>
          <div className="gate-pass-row">
            <input
              type="password"
              className="gate-pass"
              placeholder="passphrase"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
            <button className="gate-pass-btn" onClick={submit} disabled={busy || !pass.trim()}>
              {busy ? '…' : 'enter'}
            </button>
          </div>
          {error && <div className="gate-err">{error}</div>}
          <div className="gate-foot">ask Armand if you don't have it</div>
        </div>
      </div>
    );
  }

  // name mode
  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-eyebrow">welcome to</div>
        <h1 className="gate-title">LunchSync</h1>
        <div className="gate-sub">who's eating?</div>
        <div className="gate-names">
          {TEAM.map(name => (
            <button key={name} className="gate-name" onClick={() => onPick(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="gate-foot">
          pick yourself — we'll remember next time
          {onLogout && <> · <button className="link-btn" onClick={onLogout}>sign out</button></>}
        </div>
      </div>
    </div>
  );
}
