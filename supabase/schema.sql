-- CloudCopy Database Schema (canonical, matches live DB)

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    is_online BOOLEAN DEFAULT false,
    subscription_tier TEXT DEFAULT 'free',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
    -- Pricing (in CFA per page/sheet)
    bw_price_per_page INTEGER DEFAULT 25,
    color_price_per_page INTEGER DEFAULT 75,
    bw_double_sided_price INTEGER DEFAULT 40,
    color_double_sided_price INTEGER DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID, -- For linking to Supabase Auth
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    is_pro BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE, -- nullable for Open PIN
    pin_hash TEXT NOT NULL,
    raw_pin TEXT, -- temporary plain PIN for display (cleared after retrieval)
    student_name TEXT NOT NULL,
    user_email TEXT, -- link to student email
    file_path TEXT NOT NULL,
    page_count INTEGER NOT NULL,
    color BOOLEAN DEFAULT false,
    double_sided BOOLEAN DEFAULT false,
    copies INTEGER DEFAULT 1,
    price_cfa INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'printed', 'expired')),
    -- PIN mode: 'open' = any shop, 'locked' = specific shop only
    pin_mode TEXT DEFAULT 'open' CHECK (pin_mode IN ('open', 'locked')),
    -- Student confirmation
    student_confirmed BOOLEAN DEFAULT false,
    -- 2FA fields
    two_fa_code TEXT,
    two_fa_verified BOOLEAN DEFAULT false,
    two_fa_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Shops policies
CREATE POLICY "Shops are viewable by everyone" ON shops FOR SELECT USING (true);
CREATE POLICY "Service can insert shops" ON shops FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update shops" ON shops FOR UPDATE USING (true);

-- Operators policies
CREATE POLICY "Service can insert operators" ON operators FOR INSERT WITH CHECK (true);
CREATE POLICY "Operators are readable" ON operators FOR SELECT USING (true);
CREATE POLICY "Service can update operators" ON operators FOR UPDATE USING (true);

-- Students policies
CREATE POLICY "Service can insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Students are readable" ON students FOR SELECT USING (true);
CREATE POLICY "Service can update students" ON students FOR UPDATE USING (true);

-- Jobs policies
CREATE POLICY "Anyone can create jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Jobs are readable" ON jobs FOR SELECT USING (true);
CREATE POLICY "Jobs can be updated" ON jobs FOR UPDATE USING (true);
