// crumb-signature.jsx — production React Native components for Crumb's signature moments.
// Two exports: <CrumbIcon /> (the logo mark) and <CrumbDrop /> (the signature animation).
// Requires: react-native-svg, expo-haptics. Colors pull from theme.js (swap palette there).

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from './theme';

/* ============================================================
   CrumbIcon — the logo mark (plate ring + crumb dot)
   Use in the header, splash, empty states, anywhere brand shows.
   ============================================================ */
export function CrumbIcon({ size = 32, disc = theme.colors.espresso, crumb = theme.colors.honey, bg = theme.colors.bg }) {
  // Matches the final app icon: a bitten disc (lower-left) with two crumbs (upper-right).
  // disc = filled body, crumb = the two pieces, bg = surface behind it (to carve the bite).
  // On the app tile: disc white, crumb white, bg persimmon. Inline on white: disc espresso,
  // crumb persimmon, bg white.
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx="45" cy="56" r="27" fill={disc} />
      {/* the bite — a background-colored circle carving the upper-right */}
      <Circle cx="74" cy="40" r="15" fill={bg} />
      {/* two crumbs */}
      <Circle cx="72" cy="32" r="5" fill={crumb} />
      <Circle cx="80" cy="55" r="6.5" fill={crumb} />
    </Svg>
  );
}

/* ============================================================
   CrumbDrop — the SIGNATURE animation.
   A crumb falls from above and settles with a soft bounce + a light haptic.
   Fire it on any "decided / locked-in" moment.

   Usage A (imperative — recommended):
     const dropRef = useRef();
     <CrumbDrop ref={dropRef} />
     // later, when a lunch locks in:
     dropRef.current.play();

   Usage B (auto-play once on mount):
     <CrumbDrop autoPlay />
   ============================================================ */
export const CrumbDrop = forwardRef(function CrumbDrop(
  { size = 18, color = theme.colors.honey, autoPlay = false, onDone, style },
  ref
) {
  const translateY = useRef(new Animated.Value(-70)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(0.5)).current;
  const scaleY = useRef(new Animated.Value(0.5)).current;

  const play = () => {
    // reset
    translateY.setValue(-70);
    opacity.setValue(0);
    scaleX.setValue(0.5);
    scaleY.setValue(0.5);

    // light haptic the instant it lands feels best ~ at the bounce
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 360);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 1, duration: 360, useNativeDriver: true }),
      // the drop: fall, then a small settle bounce
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0, duration: 380,
          easing: Easing.bezier(0.34, 1.3, 0.64, 1), useNativeDriver: true,
        }),
        // squash on impact
        Animated.parallel([
          Animated.timing(scaleX, { toValue: 1.12, duration: 90, useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.88, duration: 90, useNativeDriver: true }),
        ]),
        // recover
        Animated.parallel([
          Animated.spring(scaleX, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
          Animated.spring(scaleY, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        ]),
      ]),
    ]).start(({ finished }) => finished && onDone && onDone());
  };

  useImperativeHandle(ref, () => ({ play }));
  useEffect(() => { if (autoPlay) play(); /* eslint-disable-next-line */ }, []);

  return (
    <View style={[{ height: size * 1.4, alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      <Animated.View
        style={{
          width: size, height: size, borderRadius: size / 2, backgroundColor: color,
          opacity,
          transform: [{ translateY }, { scaleX }, { scaleY }],
        }}
      />
    </View>
  );
});

/* ============================================================
   DecidedCard — reference: how to use CrumbDrop on a lock-in.
   Shows "it's decided" + the spot, with the crumb dropping above it.
   ============================================================ */
export function DecidedCard({ spot = 'Cuantos Tacos' }) {
  const dropRef = useRef();
  useEffect(() => { const t = setTimeout(() => dropRef.current?.play(), 250); return () => clearTimeout(t); }, []);
  return (
    <View style={styles.decided}>
      <CrumbDrop ref={dropRef} />
      <Text style={styles.decidedStatus}>it's decided</Text>
      <Text style={styles.decidedSpot}>{spot}</Text>
    </View>
  );
}

/* ============================================================
   CrumbScatter — secondary moment: a tiny celebratory scatter
   when everyone's RSVP'd. A handful of crumbs pop outward.
   ============================================================ */
export function CrumbScatter({ count = 7, color = theme.colors.honey, onDone }) {
  const crumbs = useRef(
    Array.from({ length: count }, () => ({
      tx: new Animated.Value(0), ty: new Animated.Value(0),
      op: new Animated.Value(0), sc: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2, dist: 26 + Math.random() * 34,
    }))
  ).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const anims = crumbs.map((c) =>
      Animated.parallel([
        Animated.timing(c.tx, { toValue: Math.cos(c.angle) * c.dist, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(c.ty, { toValue: Math.sin(c.angle) * c.dist, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(c.op, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.delay(180),
          Animated.timing(c.op, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
        Animated.spring(c.sc, { toValue: 1, friction: 5, useNativeDriver: true }),
      ])
    );
    Animated.stagger(20, anims).start(({ finished }) => finished && onDone && onDone());
    // eslint-disable-next-line
  }, []);

  return (
    <View style={styles.scatterWrap} pointerEvents="none">
      {crumbs.map((c, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: color,
            opacity: c.op,
            transform: [{ translateX: c.tx }, { translateY: c.ty }, { scale: c.sc }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  decided: {
    alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.card,
    paddingVertical: 28, paddingHorizontal: 20, ...theme.shadow.sm,
  },
  decidedStatus: { fontSize: 13, fontWeight: '600', color: theme.colors.muted, marginTop: 4 },
  decidedSpot: { fontSize: 22, fontWeight: '600', color: theme.colors.espresso, marginTop: 4 },
  scatterWrap: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
});
