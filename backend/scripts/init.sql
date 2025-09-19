-- TCG Tactique Database Initialization
-- This script will be executed when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (basic structure for validation)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data for development
INSERT INTO users (username, email, password_hash) VALUES
    ('player1', 'player1@example.com', '$2b$12$dummy_hash_for_testing'),
    ('player2', 'player2@example.com', '$2b$12$dummy_hash_for_testing')
ON CONFLICT (username) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'TCG Tactique database initialization completed successfully';
END
$$;