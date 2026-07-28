import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/tokens';

// Nests a plain Stack inside the Dashboard tab so the three stat-card detail
// pages (ai-scans, severe-caries, patients) push/pop with a back button while
// the bottom tab bar (defined in the parent (portal)/_layout.js) stays put.
export default function DashboardLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
