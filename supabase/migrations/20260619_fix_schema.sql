-- Fix CloudCopy schema: add missing columns and fix constraints
-- Run this against live Supabase to sync the DB with the codebase

-- 1. Make shop_id nullable on jobs (Open PIN mode has no shop)
ALTER TABLE jobs ALTER COLUMN shop_id DROP NOT NULL;

-- 2. Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS raw_pin TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pin_mode TEXT DEFAULT 'open';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS two_fa_code TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS two_fa_verified BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS two_fa_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Add RLS policies that were missing

-- Allow service role to insert shops (operators registering their shop)
DO $$ BEGIN
  CREATE POLICY "Service can insert shops" ON shops FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow service role to update shops (toggle online/offline)
DO $$ BEGIN
  CREATE POLICY "Service can update shops" ON shops FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow service role to insert operators
DO $$ BEGIN
  CREATE POLICY "Service can insert operators" ON operators FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow operators to be read (for role checking)
DO $$ BEGIN
  CREATE POLICY "Operators are readable" ON operators FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow service to update operators
DO $$ BEGIN
  CREATE POLICY "Service can update operators" ON operators FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on students and add policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service can insert students" ON students FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students are readable" ON students FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service can update students" ON students FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow jobs to be read and updated
DO $$ BEGIN
  CREATE POLICY "Jobs are readable" ON jobs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Jobs can be updated" ON jobs FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
