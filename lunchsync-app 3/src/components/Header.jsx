import React from 'react';

export default function Header({ me, syncStatus, onSwitchUser, activeTeam }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 74 74" fill="none">
            <circle cx="37" cy="37" r="24" stroke="#1F1B16" strokeWidth="7"/>
            <circle cx="37" cy="13" r="6.5" fill="#C9A36A"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">AppName</div>
          <div className="brand-tag">
            {activeTeam ? `${activeTeam.emoji} ${activeTeam.name}` : 'team meals, finally sorted'}
          </div>
        </div>
      </div>
      <div className="header-actions">
        <div className="sync-dot" title={syncStatus === 'offline' ? 'connection lost' : syncStatus === 'syncing' ? 'saving…' : 'in sync'}>
          <span className={`sync-dot-light ${syncStatus}`}/>
          <span>{syncStatus === 'offline' ? 'offline' : syncStatus === 'syncing' ? 'syncing' : 'live'}</span>
        </div>
        <button className="me-chip" onClick={onSwitchUser} title="not you? switch">
          <span className="me-dot"/>
          <span>you're <strong>{me}</strong></span>
        </button>
      </div>
    </header>
  );
}
