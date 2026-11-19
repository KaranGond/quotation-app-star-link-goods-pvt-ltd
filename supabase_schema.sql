-- ====================================================================
-- ARPIT SOLAR SHOP - PRODUCTION SUPABASE DATABASE SCHEMA
-- Single-Tenant Self-Hosted Solar Quotation System
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create System Types Table
CREATE TABLE IF NOT EXISTS system_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_terms TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_type_id UUID REFERENCES system_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  capacity_kw DECIMAL(10,2),
  phase INTEGER DEFAULT 1,
  base_price DECIMAL(12,2) NOT NULL,
  gst_rate DECIMAL(5,2) DEFAULT 8.9,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Integrated Products Table
CREATE TABLE IF NOT EXISTS integrated_products (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  system_kw DECIMAL(10,2) NOT NULL,
  phase TEXT NOT NULL DEFAULT 'Single',
  price DECIMAL(12,2) NOT NULL,
  inverter_capacity_kw DECIMAL(10,2) NOT NULL,
  module_watt INTEGER NOT NULL,
  module_type TEXT DEFAULT 'TopCon',
  no_of_modules INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Components (Bill of Materials) Table
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_type_id UUID REFERENCES system_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_quantity TEXT DEFAULT '1 Nos',
  default_make TEXT DEFAULT 'Standard',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_email TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  system_type_id UUID REFERENCES system_types(id) ON DELETE SET NULL,
  capacity_kw DECIMAL(10,2),
  phase INTEGER DEFAULT 1,
  brand TEXT,
  base_price DECIMAL(12,2),
  gst_rate DECIMAL(5,2) DEFAULT 8.9,
  gst_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  central_subsidy DECIMAL(12,2),
  state_subsidy DECIMAL(12,2),
  terms JSONB,
  components JSONB,
  savings_data JSONB,
  salesperson TEXT,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  form_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Structure / B2B Catalog Table
CREATE TABLE IF NOT EXISTS structure_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Pcs',
  gst_rate DECIMAL(5,2) DEFAULT 18,
  base_price DECIMAL(12,2) DEFAULT 0,
  stock TEXT DEFAULT 'In Stock',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Company Settings Table (Single-Tenant singleton id = 'default')
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Arpit Solar Shop',
  tagline TEXT DEFAULT 'ILLUMINATING YOUR FUTURE WITH CLEAN ENERGY',
  quote_prefix TEXT DEFAULT 'ASS',
  gstin TEXT DEFAULT '09APKPM6299L1ZW',
  cin TEXT,
  phone TEXT DEFAULT '+91 9005770466',
  alternate_phone TEXT DEFAULT '9044555572',
  email TEXT DEFAULT 'arpitsolarshop@gmail.com',
  head_office TEXT DEFAULT 'Sh16/114/25-K-2, Sharvodaya Nagar, Kadipur Shivpur, Varanasi 221003',
  registered_office TEXT DEFAULT '1st Floor, Maurya Bhawan, Malgodam Road, Ballia 277001',
  warehouse TEXT,
  authorized_signatory TEXT DEFAULT 'Ratnesh Mishra',
  bank_name TEXT DEFAULT 'HDFC Bank',
  bank_branch TEXT DEFAULT 'Shivpur, Varanasi',
  account_name TEXT DEFAULT 'ARPIT SOLAR SHOP',
  account_number TEXT DEFAULT '50200123854806',
  ifsc TEXT DEFAULT 'HDFC0004807',
  upi_id TEXT DEFAULT 'vyapar.173575988777@hdfcbank',
  logo_url TEXT,
  signature_url TEXT,
  stamp_url TEXT,
  qr_code_url TEXT,
  default_terms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Internal Quotes Audit Logging Table
CREATE TABLE IF NOT EXISTS internal_quotes (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  salesperson_name TEXT,
  location TEXT,
  kwp DECIMAL(10,2),
  phase INTEGER,
  module_watt INTEGER,
  qty INTEGER,
  base_price DECIMAL(12,2),
  extra_margin DECIMAL(12,2),
  wire_price DECIMAL(12,2),
  height_price DECIMAL(12,2),
  out_of_vns_price DECIMAL(12,2),
  subtotal DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  total DECIMAL(12,2),
  discount DECIMAL(12,2),
  grand_total DECIMAL(12,2),
  channel TEXT DEFAULT 'whatsapp',
  tax_rate DECIMAL(5,3) DEFAULT 0.089,
  currency TEXT DEFAULT 'INR',
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Better Auth Authentication & Sessions Tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  role TEXT DEFAULT 'user',
  banned BOOLEAN DEFAULT false,
  "banReason" TEXT,
  "banExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "impersonatedBy" TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SEED DATA & CONSTRAINTS
-- ====================================================================

-- Insert Default System Types
INSERT INTO system_types (name, description)
SELECT 'On-grid', 'Grid Connected System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'On-grid');

INSERT INTO system_types (name, description)
SELECT 'Off-grid', 'Battery Based System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'Off-grid');

INSERT INTO system_types (name, description)
SELECT 'Hybrid', 'Hybrid System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'Hybrid');

INSERT INTO system_types (name, description)
SELECT 'VFD/Drive', 'Solar Pump Drive'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'VFD/Drive');

-- Insert Initial Company Row if not exists
INSERT INTO company_settings (
  id, name, tagline, quote_prefix, gstin, phone, alternate_phone, email,
  head_office, registered_office, authorized_signatory,
  bank_name, bank_branch, account_name, account_number, ifsc, upi_id
)
SELECT
  'default', 'Arpit Solar Shop', 'ILLUMINATING YOUR FUTURE WITH CLEAN ENERGY', 'ASS', '09APKPM6299L1ZW',
  '+91 9005770466', '9044555572', 'arpitsolarshop@gmail.com',
  'Sh16/114/25-K-2, Sharvodaya Nagar, Kadipur Shivpur, Varanasi 221003',
  '1st Floor, Maurya Bhawan, Malgodam Road, Ballia 277001',
  'Ratnesh Mishra',
  'HDFC Bank', 'Shivpur, Varanasi', 'ARPIT SOLAR SHOP', '50200123854806', 'HDFC0004807', 'vyapar.173575988777@hdfcbank'
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'default');

-- Create Useful Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_quotations_customer_phone ON quotations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_components_system_type_id ON components(system_type_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_structure_catalog_category ON structure_catalog(category);
