import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { LayoutDashboard, ScanLine, CalendarDays, Users, Settings, TriangleAlert } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { isSupabaseConfigured } from '../../src/services/supabaseClient';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function PortalLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Local-test bypass: only engages when Supabase has no real credentials
  // configured (.env not set up yet), so the portal — including the AI Scan
  // screen — can still be exercised without a working auth backend. This
  // self-disables the moment EXPO_PUBLIC_SUPABASE_URL/ANON_KEY are set, at
  // which point the normal session-based redirect below takes over.
  const devBypass = !isSupabaseConfigured && !session;

  if (!session && !devBypass) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      {devBypass && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.warningBg,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(217,119,6,0.25)',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          <TriangleAlert color={colors.warning} size={16} />
          <Text style={{ color: colors.warning, fontSize: typography.caption.fontSize, fontWeight: '600', flex: 1 }}>
            Local test mode — Supabase isn't configured, so sign-in is bypassed. Patient/EHR data won't persist. Set EXPO_PUBLIC_SUPABASE_URL/ANON_KEY to enable real accounts.
          </Text>
        </View>
      )}
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.glassBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarTestID: 'tab-dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarTestID: 'tab-scan',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarTestID: 'tab-appointments',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarTestID: 'tab-patients',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarTestID: 'tab-settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size ?? 22} />,
        }}
      />
      </Tabs>
    </>
  );
}
