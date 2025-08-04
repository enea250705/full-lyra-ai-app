-- Lyra AI Backend - PostgreSQL Database Schema
-- Complete database schema for personal life operating system

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    google_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    refresh_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily AI Check-ins
CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    mood_emoji VARCHAR(10),
    voice_transcription_url VARCHAR(500),
    ai_reflection TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood Tracking
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_value INTEGER CHECK (mood_value >= 1 AND mood_value <= 10),
    mood_category VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Energy Tracking
CREATE TABLE energy_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    energy_emoji VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sleep Tracking
CREATE TABLE sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Focus Sessions
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    completed BOOLEAN DEFAULT false,
    distraction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Private Journaling
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    voice_url VARCHAR(500),
    encrypted_content BYTEA,
    is_encrypted BOOLEAN DEFAULT false,
    pin_protected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Integration
CREATE TABLE calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'apple'
    access_token VARCHAR(500),
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Awareness
CREATE TABLE bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(255),
    account_number_masked VARCHAR(50),
    nordigen_token VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    category VARCHAR(100),
    transaction_date TIMESTAMP NOT NULL,
    is_debit BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spending_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    daily_limit DECIMAL(10, 2),
    weekly_limit DECIMAL(10, 2),
    monthly_limit DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications System
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_reminder BOOLEAN DEFAULT true,
    mood_reminder_time TIME DEFAULT '09:00',
    journal_reminder BOOLEAN DEFAULT true,
    journal_reminder_time TIME DEFAULT '21:00',
    sleep_reminder BOOLEAN DEFAULT true,
    sleep_reminder_time TIME DEFAULT '22:00',
    finance_reminder BOOLEAN DEFAULT true,
    finance_reminder_frequency VARCHAR(20) DEFAULT 'daily',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'mood', 'journal', 'sleep', 'finance'
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    ai_tone VARCHAR(50) DEFAULT 'friendly',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    features_enabled JSONB DEFAULT '{"mood": true, "energy": true, "sleep": true, "focus": true, "journal": true, "calendar": true, "finance": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emotion Insights (computed data)
CREATE TABLE emotion_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'weekly_summary', 'correlation', 'trend'
    data JSONB NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Fit Integration
CREATE TABLE google_fit_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token VARCHAR(500),
    refresh_token VARCHAR(500),
    token_expires_at TIMESTAMP,
    scope VARCHAR(500), -- Google Fit permissions granted
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Fit Steps Data
CREATE TABLE google_fit_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    distance DECIMAL(10, 2), -- in meters
    calories INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Google Fit Heart Rate Data
CREATE TABLE google_fit_heart_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    bpm INTEGER NOT NULL,
    accuracy INTEGER, -- accuracy level from Google Fit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Fit Activities/Workouts
CREATE TABLE google_fit_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories INTEGER,
    distance DECIMAL(10, 2), -- in meters
    steps INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Fit Sleep Data (supplementing existing sleep_logs)
CREATE TABLE google_fit_sleep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bedtime TIMESTAMP NOT NULL,
    wake_time TIMESTAMP NOT NULL,
    duration_hours DECIMAL(4, 2) NOT NULL,
    sleep_stages JSONB, -- stores light, deep, rem, awake minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Google Fit Weight/Body Composition
CREATE TABLE google_fit_weight (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    weight_kg DECIMAL(5, 2) NOT NULL,
    body_fat_percentage DECIMAL(5, 2),
    muscle_mass_kg DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Fit Data Sync Status
CREATE TABLE google_fit_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'steps', 'heart_rate', 'activities', 'sleep', 'weight'
    last_sync_at TIMESTAMP NOT NULL,
    last_sync_date DATE NOT NULL, -- last date for which data was synced
    sync_status VARCHAR(20) DEFAULT 'success', -- 'success', 'partial', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, data_type)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, created_at);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, created_at);
CREATE INDEX idx_energy_entries_user_date ON energy_entries(user_id, created_at);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, created_at);
CREATE INDEX idx_focus_sessions_user_date ON focus_sessions(user_id, created_at);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, created_at);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX idx_usage_analytics_user_date ON usage_analytics(user_id, created_at);

-- Google Fit Indexes
CREATE INDEX idx_google_fit_connections_user_active ON google_fit_connections(user_id, is_active);
CREATE INDEX idx_google_fit_steps_user_date ON google_fit_steps(user_id, date);
CREATE INDEX idx_google_fit_heart_rate_user_timestamp ON google_fit_heart_rate(user_id, timestamp);
CREATE INDEX idx_google_fit_activities_user_date ON google_fit_activities(user_id, start_time);
CREATE INDEX idx_google_fit_sleep_user_date ON google_fit_sleep(user_id, date);
CREATE INDEX idx_google_fit_weight_user_timestamp ON google_fit_weight(user_id, timestamp);
CREATE INDEX idx_google_fit_sync_status_user_type ON google_fit_sync_status(user_id, data_type);