// Appointment-module-only design tokens. Kept separate from theme/tokens.js
// so the existing token file (consumed everywhere else) is never touched.
import { colors } from './tokens';

export const TREATMENT_TYPES = ['Consultation', 'Check-up', 'Root Canal', 'Implant', 'Cosmetic', 'Emergency'];

export const treatmentColors = {
  'Consultation': '#2563EB', // blue
  'Check-up': colors.success, // green
  'Root Canal': colors.warning, // orange
  'Implant': '#7C3AED', // purple
  'Cosmetic': '#DB2777', // pink
  'Emergency': colors.danger, // red
  'Cancelled': colors.textMuted, // grey
};

export const APPOINTMENT_STATUSES = ['Upcoming', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'Missed'];

export const statusColors = {
  'Upcoming': { color: colors.cyanLight, bg: 'rgba(14,165,183,0.10)', border: 'rgba(14,165,183,0.22)' },
  'Checked In': { color: '#4F46E5', bg: 'rgba(79,70,229,0.10)', border: 'rgba(79,70,229,0.22)' },
  'In Progress': { color: colors.warning, bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.22)' },
  'Completed': { color: colors.success, bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.22)' },
  'Cancelled': { color: colors.textMuted, bg: 'rgba(148,163,184,0.14)', border: 'rgba(148,163,184,0.28)' },
  'Missed': { color: colors.danger, bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.22)' },
};

export const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

export const priorityColors = {
  'Low': colors.success,
  'Medium': colors.warning,
  'High': '#EA580C',
  'Emergency': colors.danger,
};

export const DOCTORS = ['Dr. Meera Nair', 'Dr. Arjun Rao', 'Dr. Kavya Singh', 'Dr. Rohan Gupta', 'Dr. Priya Desai'];

export const ROOMS = ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'];

export const CALENDAR_VIEWS = ['Month', 'Week', 'Day', 'Agenda'];
