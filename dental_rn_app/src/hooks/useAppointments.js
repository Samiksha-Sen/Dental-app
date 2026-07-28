import { useCallback, useEffect, useMemo, useState } from 'react';
import { TREATMENT_TYPES, DOCTORS, ROOMS, PRIORITIES } from '../theme/appointmentTokens';

// ============================================================================
// Appointments module — local/dummy data only. There is no `appointments`
// table in Supabase yet, so this hook mirrors the shape/ergonomics of
// usePatients()/useScanHistory() (loading flag, create/update helpers) so
// swapping in a real backend later only means changing what's inside these
// functions, not every screen that consumes them.
// ============================================================================

const PATIENT_POOL = [
  { name: 'Ananya Verma', age: 34, gender: 'Female' },
  { name: 'Rohit Malhotra', age: 41, gender: 'Male' },
  { name: 'Ishita Kapoor', age: 27, gender: 'Female' },
  { name: 'Devansh Bhatt', age: 52, gender: 'Male' },
  { name: 'Sneha Reddy', age: 19, gender: 'Female' },
  { name: 'Kabir Chawla', age: 63, gender: 'Male' },
  { name: 'Meera Iyer', age: 8, gender: 'Female' },
  { name: 'Aditya Joshi', age: 46, gender: 'Male' },
  { name: 'Priyanka Nair', age: 31, gender: 'Female' },
  { name: 'Vikram Shah', age: 58, gender: 'Male' },
  { name: 'Tanvi Desai', age: 24, gender: 'Female' },
  { name: 'Rahul Kulkarni', age: 37, gender: 'Male' },
  { name: 'Sanya Mehta', age: 29, gender: 'Female' },
  { name: 'Yash Trivedi', age: 71, gender: 'Male' },
  { name: 'Neha Agarwal', age: 15, gender: 'Female' },
  { name: 'Arjun Pillai', age: 44, gender: 'Male' },
];

const NOTES_BY_TREATMENT = {
  'Consultation': 'Initial consultation to assess symptoms and plan next steps.',
  'Check-up': 'Routine 6-month check-up and professional cleaning.',
  'Root Canal': 'Follow-up root canal session — monitor for sensitivity.',
  'Implant': 'Implant placement review, verify osseointegration progress.',
  'Cosmetic': 'Cosmetic whitening/veneer consultation per patient request.',
  'Emergency': 'Same-day emergency slot — acute pain reported by patient.',
};

const DURATION_BY_TREATMENT = {
  'Consultation': 20,
  'Check-up': 30,
  'Root Canal': 60,
  'Implant': 90,
  'Cosmetic': 45,
  'Emergency': 30,
};

const AI_XRAY_STATUSES = [
  'Not Required',
  'Pending Review',
  'Analyzed — No Caries Detected',
  'Analyzed — Caries Detected',
];

function pad2(n) { return String(n).padStart(2, '0'); }

function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function minutesToLabel(mins) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateAppointment({ date, startMinutes, nowMinutes, isToday, idSeed }) {
  const patient = randomOf(PATIENT_POOL);
  const treatment = randomOf(TREATMENT_TYPES);
  const duration = DURATION_BY_TREATMENT[treatment];
  const priority = treatment === 'Emergency' ? 'Emergency' : randomOf(PRIORITIES.filter((p) => p !== 'Emergency'));

  let status = 'Upcoming';
  if (isToday) {
    if (startMinutes + duration < nowMinutes - 15) {
      status = Math.random() < 0.88 ? 'Completed' : 'Missed';
    } else if (startMinutes <= nowMinutes && startMinutes + duration >= nowMinutes) {
      status = Math.random() < 0.5 ? 'In Progress' : 'Checked In';
    } else {
      status = 'Upcoming';
    }
  }
  // Sprinkle a few cancellations for realism, but never on already-completed slots.
  if (status === 'Upcoming' && Math.random() < 0.07) {
    status = 'Cancelled';
  }

  return {
    id: `APT-${10000 + idSeed}`,
    patientName: patient.name,
    patientId: `PT-${30000 + idSeed}`,
    age: patient.age,
    gender: patient.gender,
    phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
    doctor: randomOf(DOCTORS),
    treatment,
    date: toDateKey(date),
    startMinutes,
    time: minutesToLabel(startMinutes),
    duration,
    room: randomOf(ROOMS),
    priority,
    status,
    notes: NOTES_BY_TREATMENT[treatment],
    aiXrayStatus: treatment === 'Emergency' || treatment === 'Root Canal' ? randomOf(AI_XRAY_STATUSES) : 'Not Required',
    reminder: true,
  };
}

function generateDummyAppointments() {
  const list = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slotStarts = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) slotStarts.push(m);

  let seed = 1;
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const isToday = dayOffset === 0;

    const slotsForDay = [...slotStarts].sort(() => Math.random() - 0.5).slice(0, isToday ? 9 + Math.floor(Math.random() * 4) : 6 + Math.floor(Math.random() * 4));

    slotsForDay
      .sort((a, b) => a - b)
      .forEach((startMinutes) => {
        list.push(generateAppointment({ date, startMinutes, nowMinutes, isToday, idSeed: seed }));
        seed += 1;
      });
  }

  return list.sort((a, b) => (a.date + a.startMinutes).localeCompare(b.date + String(b.startMinutes).padStart(4, '0')));
}

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppointments(generateDummyAppointments());
      setLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const summary = useMemo(() => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todays = appointments.filter((a) => a.date === todayKey);
    const upcomingThisWeek = appointments.filter((a) => a.date >= todayKey && a.date < toDateKey(weekEnd) && a.status !== 'Cancelled');
    const completedToday = todays.filter((a) => a.status === 'Completed');
    const cancelled = appointments.filter((a) => a.status === 'Cancelled');

    return {
      todayCount: todays.length,
      upcomingWeekCount: upcomingThisWeek.length,
      completedTodayCount: completedToday.length,
      cancelledCount: cancelled.length,
    };
  }, [appointments, todayKey]);

  const createAppointment = useCallback((data) => {
    const newAppt = {
      id: `APT-${Math.floor(10000 + Math.random() * 89999)}`,
      status: 'Upcoming',
      ...data,
    };
    setAppointments((prev) => [newAppt, ...prev].sort((a, b) => (a.date + String(a.startMinutes || 0).padStart(4, '0')).localeCompare(b.date + String(b.startMinutes || 0).padStart(4, '0'))));
    return newAppt;
  }, []);

  const updateAppointmentStatus = useCallback((id, status) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const editAppointment = useCallback((id, patch) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  return {
    appointments,
    loading,
    todayKey,
    summary,
    createAppointment,
    updateAppointmentStatus,
    editAppointment,
  };
}

export { minutesToLabel, toDateKey };
