-- ============================================================
-- Dashboard & Categories Migration
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Categories table (Steam, Xbox, PC, Vinny, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Steam', 'steam', 'Steam gaming platform subscriptions', 1),
  ('Xbox', 'xbox', 'Xbox gaming platform subscriptions', 2),
  ('PC', 'pc', 'PC gaming subscriptions', 3),
  ('Vinny', 'vinny', 'Vinny platform subscriptions', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Add missing columns to subscribers table
-- ============================================================
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS circle_status TEXT DEFAULT 'active'
  CHECK (circle_status IN ('active', 'inactive', 'suspended'));
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- Subscriber Logs table for tracking changes
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriber_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('subscribed', 'unsubscribed', 'updated', 'suspended')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscribers_category ON subscribers(category_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_circle_status ON subscribers(circle_status);
CREATE INDEX IF NOT EXISTS idx_subscriber_logs_subscriber ON subscriber_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_logs_created ON subscriber_logs(created_at);
