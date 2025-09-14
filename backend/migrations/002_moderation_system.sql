-- 002_moderation_system.sql
-- Complete Admin Moderation System Database Schema

-- A) MODERATION STATUS ENUM
CREATE TYPE moderation_status AS ENUM ('DRAFT','PENDING_REVIEW','AUTO_APPROVED','APPROVED','REJECTED','SUSPENDED');

-- Add moderation columns to existing tables
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS moderation_status moderation_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- B) ROLE UPGRADE REQUESTS
CREATE TYPE role_request_status AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE IF NOT EXISTS role_upgrade_requests (
  id TEXT PRIMARY KEY DEFAULT 'req-' || generate_random_uuid(),
  user_id TEXT NOT NULL,
  org_id TEXT NULL,
  requested_role TEXT NOT NULL,   -- 'exporter' | 'transporter' | 'abattoir'
  kyc_level INT DEFAULT 0,
  attachments JSONB,              -- [{document_id, type, url}]
  business_license TEXT NULL,     -- URL to business license
  certification_docs JSONB,       -- certifications and permits
  status role_request_status NOT NULL DEFAULT 'PENDING',
  reviewer_id TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rur_status ON role_upgrade_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rur_user ON role_upgrade_requests(user_id);

-- C) DISEASE ZONES & POLYGON CHANGES
CREATE TYPE disease_zone_status AS ENUM ('ACTIVE','SUSPENDED');
CREATE TABLE IF NOT EXISTS disease_zones (
  id TEXT PRIMARY KEY DEFAULT 'dz-' || generate_random_uuid(),
  name TEXT NOT NULL,
  authority TEXT,                 -- e.g., 'DAFF', 'Provincial Vet'
  status disease_zone_status NOT NULL DEFAULT 'ACTIVE',
  region TEXT NOT NULL,           -- Province or region
  disease_type TEXT,              -- e.g., 'foot_and_mouth', 'bird_flu'
  restrictions JSONB,             -- {movement: false, slaughter: true, etc}
  polygon_geojson JSONB,          -- GeoJSON polygon data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE dz_change_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TABLE IF NOT EXISTS disease_zone_changes (
  id TEXT PRIMARY KEY DEFAULT 'dzc-' || generate_random_uuid(),
  disease_zone_id TEXT REFERENCES disease_zones(id) ON DELETE CASCADE,
  proposed_polygon JSONB NOT NULL, -- new GeoJSON polygon
  change_reason TEXT,
  proposer_id TEXT NOT NULL,
  status dz_change_status NOT NULL DEFAULT 'PENDING',
  reviewer_id TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dzc_status ON disease_zone_changes(status, created_at DESC);

-- D) FEES & FEATURE FLAGS
CREATE TYPE fee_config_status AS ENUM ('DRAFT','ACTIVE','ARCHIVED');
CREATE TABLE IF NOT EXISTS fee_configs (
  id TEXT PRIMARY KEY DEFAULT 'fc-' || generate_random_uuid(),
  label TEXT NOT NULL,                    -- e.g., 'ZA Standard Fees v2.1'
  platform_commission_pct NUMERIC(6,3) NOT NULL,   -- e.g. 10.000(%)
  seller_payout_fee_pct NUMERIC(6,3) NOT NULL,     -- e.g. 2.500(%)
  buyer_processing_fee_pct NUMERIC(6,3) NOT NULL,  -- e.g. 1.500(%)
  escrow_fee_minor BIGINT NOT NULL,                 -- e.g. 2500 for R25.00
  minimum_order_value BIGINT DEFAULT 10000,        -- R100.00 minimum
  maximum_order_value BIGINT DEFAULT 100000000,    -- R1M maximum
  status fee_config_status NOT NULL DEFAULT 'DRAFT',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_fee_configs_status ON fee_configs(status, activated_at DESC);

CREATE TYPE flag_status AS ENUM ('DRAFT','ACTIVE','DISABLED');
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,               -- 'enable_exotics', 'guest_checkout', etc.
  label TEXT NOT NULL,
  description TEXT,
  status flag_status NOT NULL DEFAULT 'ACTIVE',
  rollout JSONB,                      -- {"default":true,"percent":100,"audiences":["ZA"]}
  config JSONB,                       -- additional configuration
  updated_by TEXT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- E) MODERATION EVENTS LOG
CREATE TABLE IF NOT EXISTS moderation_events (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,      -- 'listing','document','role','fee','disease_zone','flag'
  entity_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  actor_id TEXT NOT NULL,         -- admin user ID
  reason TEXT,
  metadata JSONB,                 -- additional context
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_events_entity ON moderation_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_events_actor ON moderation_events (actor_id, created_at DESC);

-- F) ADMIN NOTIFICATIONS QUEUE
CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY DEFAULT 'an-' || generate_random_uuid(),
  recipient_id TEXT NOT NULL,     -- admin user ID
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'role_request', 'listing_pending', 'disease_change'
  entity_type TEXT,
  entity_id TEXT,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient ON admin_notifications(recipient_id, read_at, created_at DESC);

-- G) SYSTEM NOTIFICATIONS FOR USERS
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY DEFAULT 'un-' || generate_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'role_approved', 'listing_rejected', 'disease_alert'
  action_url TEXT,                -- deep link to relevant page
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications ON user_notifications(user_id, read_at, created_at DESC);

-- H) INSERT DEFAULT DATA

-- Default fee configuration
INSERT INTO fee_configs (label, platform_commission_pct, seller_payout_fee_pct, buyer_processing_fee_pct, escrow_fee_minor, status, created_by, activated_at)
VALUES ('StockLot Standard Fees', 10.000, 2.500, 1.500, 2500, 'ACTIVE', 'system', now())
ON CONFLICT (id) DO NOTHING;

-- Default feature flags
INSERT INTO feature_flags (key, label, description, status, rollout) VALUES
('enable_exotic_animals', 'Enable Exotic Animals', 'Allow exotic livestock listings and transactions', 'ACTIVE', '{"default": true, "percent": 100}'),
('guest_checkout', 'Guest Checkout', 'Allow non-registered users to purchase livestock', 'ACTIVE', '{"default": true, "percent": 100}'),
('enable_auctions', 'Enable Auctions', 'Allow auction-style livestock sales', 'DRAFT', '{"default": false, "percent": 0}'),
('mobile_payments', 'Mobile Payments', 'Enable mobile payment methods', 'ACTIVE', '{"default": true, "percent": 100}'),
('ai_recommendations', 'AI Recommendations', 'Show AI-powered livestock recommendations', 'DRAFT', '{"default": false, "percent": 25}'),
('bulk_orders', 'Bulk Order Discounts', 'Enable bulk purchase discounts', 'ACTIVE', '{"default": true, "percent": 100}'),
('seller_verification', 'Enhanced Seller Verification', 'Require additional verification for new sellers', 'ACTIVE', '{"default": true, "percent": 100}'),
('real_time_chat', 'Real-time Chat', 'Enable real-time messaging between buyers and sellers', 'ACTIVE', '{"default": true, "percent": 100}')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  updated_at = now();

-- Sample disease zones for South Africa
INSERT INTO disease_zones (name, authority, region, disease_type, restrictions, polygon_geojson) VALUES
('Western Cape FMD Control Zone', 'Western Cape Veterinary Services', 'Western Cape', 'foot_and_mouth', 
 '{"movement": false, "slaughter": true, "vaccination_required": true}',
 '{"type": "Polygon", "coordinates": [[[18.5, -33.5], [19.0, -33.5], [19.0, -34.0], [18.5, -34.0], [18.5, -33.5]]]}'),
('KwaZulu-Natal Avian Flu Zone', 'DAFF KZN', 'KwaZulu-Natal', 'avian_influenza',
 '{"movement": false, "slaughter": false, "quarantine_required": true}',
 '{"type": "Polygon", "coordinates": [[[30.0, -29.0], [31.0, -29.0], [31.0, -30.0], [30.0, -30.0], [30.0, -29.0]]]}')
ON CONFLICT (id) DO NOTHING;

-- Create functions for database triggers
CREATE OR REPLACE FUNCTION generate_random_uuid() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_disease_zones_updated_at BEFORE UPDATE ON disease_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;