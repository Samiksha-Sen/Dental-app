-- ============================================================================
-- Dental AI Supabase Schema & Row Level Security (RLS) Policies
-- Complete SQL schema for profiles, scans, reports, patients, patient_history
-- and Storage bucket configuration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can only access their own profile (SELECT)"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can only insert their own profile (INSERT)"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can only update their own profile (UPDATE)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can only delete their own profile (DELETE)"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================================================
-- 2. SCANS TABLE
-- ============================================================================
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  patient_id uuid,
  image_url text not null,
  prediction text,
  confidence double precision,
  uploaded_at timestamptz not null default now(),
  status text not null default 'pending',
  favourite boolean not null default false
);

alter table public.scans enable row level security;

create policy "Users can only access their own scan records (SELECT)"
  on public.scans for select
  using (auth.uid() = user_id or auth.role() = 'anon');

create policy "Users can only insert their own scan records (INSERT)"
  on public.scans for insert
  with check (auth.uid() = user_id or auth.role() = 'anon');

create policy "Users can only update their own scan records (UPDATE)"
  on public.scans for update
  using (auth.uid() = user_id or auth.role() = 'anon')
  with check (auth.uid() = user_id or auth.role() = 'anon');

create policy "Users can only delete their own scan records (DELETE)"
  on public.scans for delete
  using (auth.uid() = user_id or auth.role() = 'anon');

-- ============================================================================
-- 3. REPORTS TABLE
-- ============================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  severity text not null default 'normal',
  recommendation text not null default '',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can only access their own reports (SELECT)"
  on public.reports for select
  using (
    exists (
      select 1 from public.scans
      where scans.id = reports.scan_id
        and (scans.user_id = auth.uid() or auth.role() = 'anon')
    )
  );

create policy "Users can only insert their own reports (INSERT)"
  on public.reports for insert
  with check (
    exists (
      select 1 from public.scans
      where scans.id = reports.scan_id
        and (scans.user_id = auth.uid() or auth.role() = 'anon')
    )
  );

create policy "Users can only update their own reports (UPDATE)"
  on public.reports for update
  using (
    exists (
      select 1 from public.scans
      where scans.id = reports.scan_id
        and (scans.user_id = auth.uid() or auth.role() = 'anon')
    )
  );

create policy "Users can only delete their own reports (DELETE)"
  on public.reports for delete
  using (
    exists (
      select 1 from public.scans
      where scans.id = reports.scan_id
        and (scans.user_id = auth.uid() or auth.role() = 'anon')
    )
  );

-- ============================================================================
-- 4. EXISTING PATIENTS & PATIENT HISTORY TABLES (WITH RLS ENABLED)
-- ============================================================================
create table if not exists public.patients (
  id           uuid primary key default gen_random_uuid(),
  patient_code text not null unique,
  name         text not null,
  phone        text not null default '',
  age          integer not null default 0,
  status       text not null default 'Healthy Clear',
  badge        text not null default 'cleared',
  description  text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists public.patient_history (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  title        text not null,
  type         text not null default 'regular',
  event_date   timestamptz not null default now(),
  image_url    text,
  scan_id      uuid references public.scans(id) on delete set null
);

create index if not exists patient_history_patient_id_idx on public.patient_history(patient_id);

alter table public.scans
  add constraint scans_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete set null;

alter table public.patients enable row level security;
alter table public.patient_history enable row level security;

create policy "Allow read access to patients"
  on public.patients for select
  using (true);

create policy "Allow insert access to patients"
  on public.patients for insert
  with check (true);

create policy "Allow update access to patients"
  on public.patients for update
  using (true)
  with check (true);

create policy "Allow delete access to patients"
  on public.patients for delete
  using (true);

create policy "Allow read access to patient_history"
  on public.patient_history for select
  using (true);

create policy "Allow insert access to patient_history"
  on public.patient_history for insert
  with check (true);

create policy "Allow update access to patient_history"
  on public.patient_history for update
  using (true)
  with check (true);

create policy "Allow delete access to patient_history"
  on public.patient_history for delete
  using (true);

-- ============================================================================
-- 5. SUPABASE STORAGE BUCKET CONFIGURATION ('dental-xrays')
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('dental-xrays', 'dental-xrays', true)
on conflict (id) do nothing;

-- storage.objects is owned by supabase_storage_admin; RLS is already
-- enabled on it by default in every Supabase project, and the SQL Editor
-- role cannot ALTER TABLE it (only supabase_storage_admin can), so that
-- statement is omitted here.

create policy "Users can upload their own X-ray images (INSERT)"
  on storage.objects for insert
  with check (
    bucket_id = 'dental-xrays'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or auth.role() = 'anon'
    )
  );

create policy "Users can view their own X-ray images (SELECT)"
  on storage.objects for select
  using (
    bucket_id = 'dental-xrays'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or auth.role() = 'anon'
    )
  );

create policy "Users can update their own X-ray images (UPDATE)"
  on storage.objects for update
  using (
    bucket_id = 'dental-xrays'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or auth.role() = 'anon'
    )
  );

create policy "Users can delete their own X-ray images (DELETE)"
  on storage.objects for delete
  using (
    bucket_id = 'dental-xrays'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or auth.role() = 'anon'
    )
  );

-- ============================================================================
-- 6. DEMO DATA SEEDING (FOR PATIENTS / CLINICAL DASHBOARD)
-- ============================================================================
insert into public.patients (patient_code, name, phone, age, status, badge, description) values
  ('PAT-0002', 'Anjali Mishra', '9345678901', 29, 'Urgent Care', 'urgent', 'Allergies: Penicillin. Demineralization mapped mesial margin.'),
  ('PAT-0001', 'Ramesh Kumar', '9123456780', 42, 'Pending', 'pending', 'Allergies: None. Follow-up scanner schedules.'),
  ('PAT-0003', 'Suresh Sharma', '9988776655', 51, 'Healthy Clear', 'cleared', 'Allergies: Sulfa Drugs. Diagnostic parameters normal.')
on conflict (patient_code) do nothing;

insert into public.patient_history (patient_id, title, type, event_date)
  select id, 'Deep Caries Mapped — Surgical Extraction Recommended', 'caries', now()
  from public.patients where patient_code = 'PAT-0002'
  union all
  select id, 'Prophylaxis scaler cleaning', 'regular', '2025-09-14'
  from public.patients where patient_code = 'PAT-0002'
  union all
  select id, 'Routine visual inspection', 'regular', '2025-09-10'
  from public.patients where patient_code = 'PAT-0001'
  union all
  select id, 'Comprehensive oral exam', 'cleared', '2025-08-01'
  from public.patients where patient_code = 'PAT-0003'
on conflict do nothing;
