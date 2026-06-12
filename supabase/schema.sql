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
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    student_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    page_count INTEGER NOT NULL,
    color BOOLEAN DEFAULT false,
    double_sided BOOLEAN DEFAULT false,
    copies INTEGER DEFAULT 1,
    price_cfa INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'printed', 'expired')),
    -- PIN mode: 'open' = any shop, 'locked' = specific shop only
    pin_mode TEXT DEFAULT 'open' CHECK (pin_mode IN ('open', 'locked')),
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
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Open read access for shops (students need to see them)
CREATE POLICY "Shops are viewable by everyone" ON shops FOR SELECT USING (true);

-- Jobs are insertable by everyone (students upload without login)
CREATE POLICY "Anyone can create jobs" ON jobs FOR INSERT WITH CHECK (true);
