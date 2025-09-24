-- Initial database setup for Pet QR System
-- This script sets up the basic structure for multi-tenant architecture

-- Create main database (if not exists)
-- CREATE DATABASE pet_qr_system;

-- Create shared schema for tenant management
CREATE SCHEMA IF NOT EXISTS shared;

-- Create basic tenant table in shared schema
CREATE TABLE IF NOT EXISTS shared.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255),
    tier VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard' or 'enterprise'
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create global users table (for system access)
CREATE TABLE IF NOT EXISTS shared.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_id INTEGER REFERENCES shared.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'super_admin', 'tenant_admin', 'user'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demo tenant for development
INSERT INTO shared.tenants (name, subdomain, tier, settings)
VALUES (
    'Demo Pet Store',
    'demo',
    'standard',
    '{"theme": {"primary": "#6366F1", "secondary": "#10B981"}, "features": {"analytics": true}}'
) ON CONFLICT (subdomain) DO NOTHING;

-- Create demo admin user (password: 'demo123')
-- Note: In production, use proper password hashing
INSERT INTO shared.users (email, password_hash, tenant_id, role)
SELECT
    'admin@demo.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBNz8B8.pB3.pq', -- demo123
    t.id,
    'tenant_admin'
FROM shared.tenants t
WHERE t.subdomain = 'demo'
ON CONFLICT (email) DO NOTHING;

-- Create a sample tenant schema for demo
CREATE SCHEMA IF NOT EXISTS tenant_demo;

-- Function to create tenant schema structure
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

    -- Create pets table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.pets (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            breed VARCHAR(255),
            age INTEGER,
            sex VARCHAR(10),
            color VARCHAR(100),
            size VARCHAR(50),
            weight VARCHAR(50),
            microchip_id VARCHAR(255),
            is_spayed_neutered BOOLEAN DEFAULT false,
            birthday DATE,
            description TEXT,
            photos JSONB DEFAULT ''[]'',
            medical_info JSONB DEFAULT ''{}'',,
            owner_id INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);

    -- Create tenant users table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.tenant_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            language VARCHAR(10) DEFAULT ''en'',
            privacy_settings JSONB DEFAULT ''{"show_email": false, "show_phone": true}'',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);

    -- Create QR codes table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.qr_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(255) UNIQUE NOT NULL,
            pin VARCHAR(4) NOT NULL,
            pet_id INTEGER REFERENCES %I.pets(id) ON DELETE SET NULL,
            status VARCHAR(20) DEFAULT ''inactive'', -- ''inactive'', ''active'', ''expired''
            batch_id VARCHAR(255),
            print_data JSONB,
            activated_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name, schema_name);

    -- Create scan events table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.scan_events (
            id SERIAL PRIMARY KEY,
            qr_code_id INTEGER REFERENCES %I.qr_codes(id) ON DELETE CASCADE,
            ip_address INET,
            user_agent TEXT,
            location_data JSONB,
            scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name, schema_name);

    -- Create support tickets table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.support_tickets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES %I.tenant_users(id) ON DELETE SET NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT ''open'', -- ''open'', ''in_progress'', ''closed''
            priority VARCHAR(20) DEFAULT ''medium'', -- ''low'', ''medium'', ''high''
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name, schema_name);

    -- Add foreign key for pets.owner_id
    EXECUTE format('
        ALTER TABLE %I.pets
        ADD CONSTRAINT fk_pets_owner
        FOREIGN KEY (owner_id) REFERENCES %I.tenant_users(id) ON DELETE CASCADE
    ', schema_name, schema_name);

    -- Create indexes for performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_pets_owner ON %I.pets(owner_id)', schema_name, schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_qr_codes_code ON %I.qr_codes(code)', schema_name, schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_qr_codes_status ON %I.qr_codes(status)', schema_name, schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_scan_events_qr_code ON %I.scan_events(qr_code_id)', schema_name, schema_name);

    RAISE NOTICE 'Tenant schema % created successfully', schema_name;
END;
$$ LANGUAGE plpgsql;

-- Create demo tenant schema
SELECT create_tenant_schema('tenant_demo');

-- Insert sample data for demo tenant
INSERT INTO tenant_demo.tenant_users (email, password_hash, first_name, last_name, phone, privacy_settings)
VALUES (
    'john.smith@email.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBNz8B8.pB3.pq', -- demo123
    'John',
    'Smith',
    '+1 (555) 123-4567',
    '{"show_email": true, "show_phone": true}'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample pet
INSERT INTO tenant_demo.pets (
    name, breed, age, sex, color, size, weight, microchip_id,
    is_spayed_neutered, description, photos, medical_info, owner_id
)
SELECT
    'Max',
    'Golden Retriever',
    3,
    'Male',
    'Golden',
    'Large',
    '65 lbs (29.5 kg)',
    '982000123456789',
    true,
    'Friendly and energetic dog who loves playing fetch and swimming. He''s very social and gets along well with children and other pets.',
    '["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=250&fit=crop"]',
    '{"vaccinations": "Up to date (2024)", "vet": "Dr. Sarah Johnson, Happy Pets Clinic"}',
    u.id
FROM tenant_demo.tenant_users u
WHERE u.email = 'john.smith@email.com';

-- Insert sample QR code
INSERT INTO tenant_demo.qr_codes (code, pin, pet_id, status, activated_at)
SELECT
    'QR123456789',
    '1234',
    p.id,
    'active',
    NOW()
FROM tenant_demo.pets p
WHERE p.name = 'Max';

COMMENT ON SCHEMA shared IS 'Shared schema for tenant management and global users';
COMMENT ON SCHEMA tenant_demo IS 'Demo tenant schema for development and testing';