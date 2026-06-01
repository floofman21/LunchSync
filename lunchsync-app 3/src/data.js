export const TEAM = ['Armand', 'Connor', 'Dan', 'Elina', 'Heather', 'Mike', 'Nate', 'Pip'];

export const SEED_RESTAURANTS = [
  'Allday Pizza', 'Bird Bird Biscuit', 'Cuantos Tacos', "Curra's",
  'Don Vegas Tacos', 'Favorites Pizza', 'House Park BBQ', 'Meat & Bread',
  "Phoebe's Downtown", 'Taco Joint', 'Two Goose', 'Umarell'
];

export function generateLunches() {
  const lunches = [];
  const start = new Date('2026-05-13T12:15:00');
  for (let i = 0; i < 26; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 21);
    const iso = d.toISOString().split('T')[0];
    lunches.push({
      id: `lunch_${iso}`,
      date: iso,
      time: '12:15',
      restaurant: i === 0 ? 'Two Goose' : null,
      rsvps: i === 0
        ? { Armand: 'yes', Connor: 'yes', Heather: 'yes', Mike: 'yes', Dan: 'no', Elina: 'no', Nate: 'no', Pip: 'no' }
        : {},
      proposedRestaurants: {},
      notes: ''
    });
  }
  return lunches;
}

export function defaultState() {
  return {
    version: 1,
    lunches: generateLunches(),
    restaurants: SEED_RESTAURANTS.map(name => ({ name, addedBy: 'system' })),
    teams: [
      {
        id: 'team_main',
        name: 'Main Crew',
        emoji: '🥪',
        members: [...TEAM],
        createdBy: 'system'
      }
    ]
  };
}

export const fmtDate = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
export const fmtDateLong = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};
export const isPast = (iso) => new Date(iso + 'T23:59:59') < new Date();
export const isToday = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toDateString() === new Date().toDateString();
};
export const daysUntil = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
};
