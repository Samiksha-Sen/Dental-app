import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme/tokens';

const GRADIENT_KEYS = ['primary', 'violet', 'cyan', 'success', 'danger'];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic per-name colour so the same patient always gets the same
// avatar wash — a stand-in for a real photo (none is stored for dummy data).
export default function PatientAvatar({ name = '', size = 44 }) {
  const initials = name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const key = GRADIENT_KEYS[hashString(name) % GRADIENT_KEYS.length];
  return (
    <LinearGradient
      colors={gradients[key]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.txt, { fontSize: size * 0.36 }]}>{initials}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#fff', fontWeight: '800' },
});
