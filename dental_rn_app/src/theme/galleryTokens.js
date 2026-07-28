// X-ray Gallery module-only design tokens. Separate file so the shared
// theme/tokens.js (consumed everywhere else) is never touched.
import { colors } from './tokens';
import { DOCTORS } from './appointmentTokens';

export const AI_STATUSES = ['Analysed', 'Pending', 'Processing', 'Rejected', 'Requires Review'];

export const aiStatusMeta = {
  'Analysed': { color: colors.success, bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.22)' },
  'Pending': { color: colors.textMuted, bg: 'rgba(148,163,184,0.14)', border: 'rgba(148,163,184,0.28)' },
  'Processing': { color: colors.cyanLight, bg: 'rgba(14,165,183,0.10)', border: 'rgba(14,165,183,0.22)' },
  'Rejected': { color: colors.danger, bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.22)' },
  'Requires Review': { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.22)' },
};

export const SCAN_TYPES = ['Panoramic X-ray', 'Periapical X-ray', 'Bitewing X-ray'];

// No `doctor` column exists on scans yet — reusing the same clinician roster
// the Appointments module already introduced keeps both modules consistent
// instead of inventing a second, disconnected list of dummy doctor names.
export const GALLERY_DOCTORS = DOCTORS;

export const DIAGNOSIS_OPTIONS = ['Caries Detected', 'No Caries Detected', 'Unanalysed'];

export const SORT_OPTIONS = ['Newest First', 'Oldest First'];
