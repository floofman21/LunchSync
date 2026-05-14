import React from 'react';

export default function Header({ me, syncStatus, onSwitchUser, onLogout }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#5c3a1e" strokeWidth="1.5" fill="#fde9c0"/>
            <path d="M10 12 L10 22 M14 12 L14 22 M22 12 L22 22 M18 12 Q22 16 22 22" stroke="#5c3a1e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">LunchSync</div>
          <div className="brand-tag">team meals, finally sorted</div>
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
