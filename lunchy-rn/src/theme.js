// theme.js — AppName design tokens (Honey & Espresso).
// Import from here everywhere. Never hardcode a color, radius, or spacing value in a
// component — if you need a new one, add it here so the system stays consistent.

export const theme = {
  colors: {
    // surfaces
    bg: '#F7F3EC',        // warm cream page background (never pure white)
    surface: '#FFFFFF',   // card surface
    cream: '#FAF7F1',     // inset / secondary surface
    line: '#ECE4D6',      // hairline dividers only

    // brand
    honey: '#C9A36A',     // THE accent. Use sparingly (~4x/screen).
    honeyDeep: '#B08948', // pressed/active honey
    cocoa: '#8A5A3C',     // secondary brand brown
    espresso: '#1F1B16',  // dark hero surface + primary text on light

    // text
    ink: '#2B2722',       // body text
    muted: '#9A9086',     // sub-labels, meta, inactive

    // RSVP semantics ONLY (don't reuse as decoration)
    sage: '#7D8A5F',      // "yes" / in
    // honey doubles as "maybe"
    // cocoa doubles as "can't"

    // text-on-dark
    onDark: '#FAF7F1',
    onDarkMuted: 'rgba(250,247,241,0.6)',
  },

  // spacing scale (use these, not arbitrary numbers)
  space: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32,
    screen: 20, // default screen horizontal padding
  },

  radius: {
    chip: 14, card: 20, hero: 26, pill: 999, tile: 14,
  },

  // soft layered shadows — the premium signal. Use sm for chips/rows, md for hero/feature.
  // (iOS reads shadow*, Android reads elevation — both included.)
  shadow: {
    sm: {
      shadowColor: '#1F1B16',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#1F1B16',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  },

  // type ramp. weight 600 is the workhorse; 700 only for the single screen headline.
  type: {
    h1:    { fontSize: 26, fontWeight: '600', letterSpacing: -0.6, color: '#1F1B16' },
    h2:    { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, color: '#1F1B16' },
    date:  { fontSize: 25, fontWeight: '600', letterSpacing: -0.5 },
    body:  { fontSize: 15, fontWeight: '400', color: '#2B2722' },
    label: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: '#9A9086' },
    meta:  { fontSize: 13, fontWeight: '400', color: '#9A9086' },
    eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', color: '#C9A36A' },
  },
};

export default theme;
