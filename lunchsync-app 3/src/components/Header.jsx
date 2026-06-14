import React from 'react';

export default function Header({ me, onSwitchUser, activeTeam }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark">
          {/* Crumb logo: bitten disc + two crumbs, espresso + persimmon on white */}
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
            <circle cx="45" cy="56" r="27" fill="#241410"/>
            <circle cx="74" cy="40" r="15" fill="#FFFFFF"/>
            <circle cx="72" cy="32" r="5" fill="#F26430"/>
            <circle cx="80" cy="55" r="6.5" fill="#F26430"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">Crumb</div>
          <div className="brand-tag">
            {activeTeam ? `${activeTeam.emoji} ${activeTeam.name}` : 'good plans, no nagging.'}
          </div>
        </div>
      </div>
      <div className="header-actions">
        <button className="me-chip" onClick={onSwitchUser} title="not you? switch">
          <span className="me-dot"/>
          <span>you're <strong>{me}</strong></span>
        </button>
      </div>
    </header>
  );
}
