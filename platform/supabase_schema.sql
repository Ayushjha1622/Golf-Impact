-- GOLF CHARITY PLATFORM - DATABASE SCHEMA
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Charities Table
create table public.charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  logo_url text,
  website_url text,
  is_featured boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Users Profiles Table (Linked to Auth.Users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  subscription_status text check (subscription_status in ('active', 'inactive', 'renewal_pending')) default 'inactive',
  charity_id uuid references public.charities(id),
  charity_percent int default 10 check (charity_percent >= 10),
  stripe_customer_id text,
  created_at timestamp with time zone default now()
);

-- 4. Scores Table (Rolling Engine)
create table public.scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  score int check (score between 1 and 45) not null,
  course_name text,
  played_at timestamp with time zone default now()
);

-- 5. Draws Table (Prize Engine)
create table public.draws (
  id uuid primary key default uuid_generate_v4(),
  draw_date timestamp with time zone default now(),
  winning_numbers int[] not null, -- Array of 5 numbers
  total_revenue decimal(12,2),
  status text check (status in ('pending', 'published')) default 'pending',
  published_at timestamp with time zone,
  jackpot_rollover boolean default false
);

-- 6. Winners Table (Verification Flow)
create table public.winners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  draw_id uuid references public.draws(id),
  tier text not null,
  proof_url text,
  payment_status text default 'pending',
  prize_amount decimal(12,2),
  created_at timestamp with time zone default now()
);


-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;

-- Policies
create policy "Users can view their own data" on public.users for select using (auth.uid() = id);
create policy "Users can view all charities" on public.charities for select using (true);
create policy "Users can manage their own scores" on public.scores for all using (auth.uid() = user_id);

-- Trigger for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Additional RLS for winners and draws
alter table public.winners enable row level security;
alter table public.draws enable row level security;

create policy "Users can view their own wins" on public.winners for select using (auth.uid() = user_id);
create policy "Users can insert own winner claims" on public.winners for insert with check (auth.uid() = user_id);
create policy "Anyone can view published draws" on public.draws for select using (status = 'published');

-- Update policy so users can update their own profile (charity selection)
create policy "Users can update their own data" on public.users for update using (auth.uid() = id);

-- Storage: Create proofs bucket (run via Supabase Dashboard > Storage if preferred)
-- insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true);

-- Storage policy: authenticated users can upload their own proof
-- create policy "Users can upload proofs" on storage.objects for insert with check (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Anyone can view proofs" on storage.objects for select using (bucket_id = 'proofs');

-- 8. Draw Entries Table (Eligibility Engine)
create table if not exists public.draw_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

alter table public.draw_entries enable row level security;
create policy "Users can view their own draw entries" on public.draw_entries for select using (auth.uid() = user_id);
create policy "Users can insert their own draw entries" on public.draw_entries for insert with check (auth.uid() = user_id);

-- 9. Charity Choices Table
create table if not exists public.charity_choices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  charity_id uuid references public.charities(id) not null,
  percent int default 10,
  unique (user_id)
);

alter table public.charity_choices enable row level security;
create policy "Users can view their own charity choices" on public.charity_choices for select using (auth.uid() = user_id);
create policy "Users can insert/update their own charity choices" on public.charity_choices for all using (auth.uid() = user_id);

-- 10. Settings Table (For Jackpot Rollover Logic)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

-- 11. Leaderboard View
create or replace view leaderboard_view as
select 
user_id,
avg(score) as avg_score,
count(*) as total_scores
from scores
group by user_id
having count(*) >= 5
order by avg_score desc;
