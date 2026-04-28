-- Users extended profile (for personalized plan generation)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  -- Personalization fields for AI coach
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  age int check (age > 0 and age < 120),
  height_cm int check (height_cm > 0),
  weight_kg numeric(5,2) check (weight_kg > 0),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  running_history_months int check (running_history_months >= 0),
  current_weekly_km numeric(5,2) check (current_weekly_km >= 0),
  -- Strava integration
  strava_athlete_id bigint unique,
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at timestamptz,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Training plan templates
create table if not exists plan_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  distance_type text not null check (distance_type in ('5k', '10k', 'half', 'marathon', '50k')),
  duration_weeks int not null check (duration_weeks > 0),
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  description text,
  weekly_structure jsonb not null,
  created_at timestamptz default now()
);

-- User's active training plans
create table if not exists training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  template_id uuid references plan_templates(id),
  name text not null,
  goal_time interval,
  race_date date,
  start_date date not null,
  status text default 'active' check (status in ('active', 'paused', 'completed')),
  ai_adjustments jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual training sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references training_plans(id) on delete cascade not null,
  week_number int not null check (week_number > 0),
  scheduled_date date not null,
  day_of_week text not null,
  session_type text not null check (session_type in ('easy', 'tempo', 'intervals', 'long-run', 'recovery', 'race')),
  prescribed_workout jsonb not null,
  status text default 'pending' check (status in ('pending', 'completed', 'skipped')),
  created_at timestamptz default now()
);

-- Completed workout logs
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  user_id uuid references profiles(id) on delete cascade not null,
  strava_activity_id bigint unique,
  distance_meters int check (distance_meters > 0),
  duration_seconds int check (duration_seconds > 0),
  avg_pace_seconds_per_km int check (avg_pace_seconds_per_km > 0),
  avg_heart_rate int check (avg_heart_rate > 0),
  feel_rating int check (feel_rating between 1 and 5),
  notes text,
  screenshots jsonb default '[]',
  ai_feedback text,
  logged_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table training_plans enable row level security;
alter table sessions enable row level security;
alter table workout_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Training plans policies
create policy "Users can view own plans"
  on training_plans for select
  using (auth.uid() = user_id);

create policy "Users can create own plans"
  on training_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on training_plans for update
  using (auth.uid() = user_id);

-- Sessions policies
create policy "Users can view own sessions"
  on sessions for select
  using (
    exists (
      select 1 from training_plans
      where training_plans.id = sessions.plan_id
      and training_plans.user_id = auth.uid()
    )
  );

-- Workout logs policies
create policy "Users can view own logs"
  on workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can create own logs"
  on workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on workout_logs for update
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_training_plans_user_id on training_plans(user_id);
create index if not exists idx_sessions_plan_id on sessions(plan_id);
create index if not exists idx_sessions_scheduled_date on sessions(scheduled_date);
create index if not exists idx_workout_logs_user_id on workout_logs(user_id);
create index if not exists idx_workout_logs_strava_id on workout_logs(strava_activity_id);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_training_plans_updated_at before update on training_plans
  for each row execute function update_updated_at_column();
