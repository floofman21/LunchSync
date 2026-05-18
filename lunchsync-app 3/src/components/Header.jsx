import React from 'react';

export default function Header({ me, syncStatus, onSwitchUser }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark">🥪</div>
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
