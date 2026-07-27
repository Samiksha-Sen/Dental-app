// Light, professional clinical-SaaS palette. Key names are kept stable
// across the dark->light redesign so every screen/component that already
// consumes `colors.X` keeps working without prop-level changes.
export const colors = {
  bg: '#F6F8FA',
  bgElevated: '#FFFFFF',
  bgCard: '#FFFFFF',

  primary: '#0F766E',
  primaryViolet: '#1D4ED8',
  primaryPurple: '#2563EB',

  cyan: '#0891B2',
  cyanLight: '#0EA5B7',

  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',

  glassFill: 'rgba(15,23,42,0.03)',
  glassFillStrong: 'rgba(15,23,42,0.06)',
  glassBorder: 'rgba(15,23,42,0.09)',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  successBg: 'rgba(5,150,105,0.10)',
  warningBg: 'rgba(217,119,6,0.10)',
  dangerBg: 'rgba(220,38,38,0.10)',
};

export const gradients = {
  primary: ['#14B8A6', colors.primary],
  violet: ['#3B82F6', colors.primaryViolet],
  cyan: ['#22D3EE', colors.cyan],
  success: ['#34D399', colors.success],
  danger: ['#F87171', colors.danger],
  bg: ['#FFFFFF', colors.bg],
};

export const badgeColors = {
  urgent: { color: colors.danger, bg: colors.dangerBg, border: 'rgba(220,38,38,0.20)' },
  pending: { color: colors.warning, bg: colors.warningBg, border: 'rgba(217,119,6,0.20)' },
  cleared: { color: colors.success, bg: colors.successBg, border: 'rgba(5,150,105,0.20)' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '800' },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600' },
  caption: { fontSize: 11, fontWeight: '500' },
};

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  }),
};
