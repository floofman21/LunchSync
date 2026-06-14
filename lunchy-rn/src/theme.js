// theme.js — AppName design tokens (Honey & Espresso).
// Import from here everywhere. Never hardcode a color, radius, or spacing value in a
// component — if you need a new one, add it here so the system stays consistent.

export const theme = {
  colors: {
    // surfaces — clean white, warm-tinted secondary surfaces
    bg: '#FFFFFF',        // page background — true white
    surface: '#FFFFFF',   // card surface
    cream: '#FFF1EA',     // inset / secondary surface (faint persimmon wash, NOT beige)
    line: '#F2E7E1',      // hairline dividers only

    // brand — Persimmon
    honey: '#F26430',     // THE accent (persimmon). Use sparingly (~4x/screen). Name kept for compatibility.
    honeyDeep: '#D04E1E', // pressed/active persimmon
    cocoa: '#A8472A',     // deep warm secondary (rust)
    espresso: '#241410',  // dark hero surface + primary text on light

    // text
    ink: '#241410',       // body text
    muted: '#9A8478',     // sub-labels, meta, inactive

    // RSVP semantics ONLY (don't reuse as decoration)
    sage: '#7D8A5F',      // "yes" / in
    // persimmon doubles as "maybe"
    // cocoa/rust doubles as "can't"

    // text-on-dark
    onDark: '#FFF7F2',
    onDarkMuted: 'rgba(255,247,242,0.6)',
  },

  // brand gradient (from the app icon: lighter top-left -> deeper bottom-right).
  // For react-native use with expo-linear-gradient: colors={theme.gradient.persimmon}
  gradient: {
    persimmon: ['#F57642', '#D04E1E'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
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
      shadowColor: '#241410',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#241410',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  },

  // type ramp. weight 600 is the workhorse; 700 only for the single screen headline.
  type: {
    h1:    { fontSize: 26, fontWeight: '600', letterSpacing: -0.6, color: '#241410' },
    h2:    { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, color: '#241410' },
    date:  { fontSize: 25, fontWeight: '600', letterSpacing: -0.5 },
    body:  { fontSize: 15, fontWeight: '400', color: '#241410' },
    label: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: '#9A8478' },
    meta:  { fontSize: 13, fontWeight: '400', color: '#9A8478' },
    eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', color: '#F26430' },
  },
};

export default theme;
