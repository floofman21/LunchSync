import React from 'react';
import { TEAM } from '../data.js';

export default function Gate({ onPick }) {
  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-eyebrow">it's lunch time at</div>
        <h1 className="gate-title">LunchSync</h1>
        <div className="gate-sub">who's hungry?</div>
        <div className="gate-names">
          {TEAM.map(name => (
            <button key={name} className="gate-name" onClick={() => onPick(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className="gate-foot">tap yourself · we'll remember 👋</div>
      </div>
    </div>
  );
}
