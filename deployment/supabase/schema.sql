-- UrjaRakshak v2.1 — Complete Database Schema for Supabase / PostgreSQL
-- Run this once on a fresh database. Safe to re-run (IF NOT EXISTS).

-- ── Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'viewer',  -- admin|analyst|viewer
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Grid Sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grid_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    substation_id   VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255),
    region          VARCHAR(100),
    capacity_mva    DECIMAL(10,2),
    voltage_kv      DECIMAL(8,2),
    location_lat    DECIMAL(10,7),
    location_lng    DECIMAL(10,7),
    status          VARCHAR(50)  NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Components ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS components (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id     UUID NOT NULL REFERENCES grid_sections(id) ON DELETE CASCADE,
    component_id        VARCHAR(100) NOT NULL,
    component_type      VARCHAR(50)  NOT NULL,
    rated_capacity_kva  DECIMAL(10,2),
    efficiency_rating   DECIMAL(5,4),
    age_years           INTEGER,
    resistance_ohms     DECIMAL(10,6),
    length_km           DECIMAL(10,3),
    voltage_kv          DECIMAL(8,2),
    load_factor         DECIMAL(5,4),
    metadata_json       JSONB,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(grid_section_id, component_id)
);

-- ── Analyses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id         UUID REFERENCES grid_sections(id) ON DELETE SET NULL,
    substation_id           VARCHAR(100) NOT NULL,
    input_energy_mwh        DECIMAL(12,4) NOT NULL,
    output_energy_mwh       DECIMAL(12,4) NOT NULL,
    time_window_hours       DECIMAL(8,2) NOT NULL DEFAULT 24.0,
    expected_loss_mwh       DECIMAL(12,4),
    actual_loss_mwh         DECIMAL(12,4),
    residual_mwh            DECIMAL(12,4),
    residual_percentage     DECIMAL(8,4),
    balance_status          VARCHAR(50) NOT NULL,
    confidence_score        DECIMAL(5,4),
    measurement_quality     VARCHAR(20),
    physics_result_json     JSONB,
    attribution_result_json JSONB,
    requires_review         BOOLEAN NOT NULL DEFAULT false,
    reviewed                BOOLEAN NOT NULL DEFAULT false,
    review_notes            TEXT,
    refusal_reason          TEXT,
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Anomaly Results ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id     UUID REFERENCES grid_sections(id) ON DELETE SET NULL,
    analysis_id         UUID REFERENCES analyses(id) ON DELETE SET NULL,
    substation_id       VARCHAR(100) NOT NULL,
    is_anomaly          BOOLEAN NOT NULL DEFAULT false,
    anomaly_score       DECIMAL(5,4) NOT NULL,
    confidence          DECIMAL(5,4) NOT NULL,
    method_used         VARCHAR(50),
    primary_reason      TEXT,
    feature_contributions JSONB,
    recommended_action  TEXT,
    reviewed            BOOLEAN NOT NULL DEFAULT false,
    action_taken        TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Model Versions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name          VARCHAR(100) NOT NULL,
    version             VARCHAR(50)  NOT NULL,
    model_type          VARCHAR(100),
    n_training_samples  INTEGER,
    contamination_rate  DECIMAL(5,4),
    training_score_mean DECIMAL(8,6),
    training_score_std  DECIMAL(8,6),
    metadata_json       JSONB,
    is_active           BOOLEAN NOT NULL DEFAULT false,
    trained_at          TIMESTAMP,
    deployed_at         TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Performance Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analyses_created_at      ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_substation_id   ON analyses(substation_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status          ON analyses(balance_status);
CREATE INDEX IF NOT EXISTS idx_analyses_residual_pct    ON analyses(residual_percentage);
CREATE INDEX IF NOT EXISTS idx_anomaly_created_at       ON anomaly_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_substation_id    ON anomaly_results(substation_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_score            ON anomaly_results(anomaly_score DESC);
CREATE INDEX IF NOT EXISTS idx_components_section       ON components(grid_section_id);
CREATE INDEX IF NOT EXISTS idx_components_type          ON components(component_type);

-- ── Row Level Security (RLS) ──────────────────────────────────────────────
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE components     ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (for backend API using service key)
CREATE POLICY IF NOT EXISTS "Service role full access to users"           ON users           FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access to grid_sections"   ON grid_sections   FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access to analyses"        ON analyses        FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access to components"      ON components      FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access to anomaly_results" ON anomaly_results FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access to model_versions"  ON model_versions  FOR ALL USING (true);

-- ── Meter Upload Batches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meter_upload_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255) NOT NULL,
    substation_id   VARCHAR(100) NOT NULL,
    row_count       INTEGER      NOT NULL,
    anomalies_detected INTEGER   DEFAULT 0,
    total_energy_kwh DECIMAL(14,4),
    residual_pct    DECIMAL(8,4),
    confidence_score DECIMAL(5,4),
    status          VARCHAR(50)  NOT NULL DEFAULT 'processing',
    error_message   TEXT,
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP
);

-- ── Meter Readings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meter_readings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        UUID NOT NULL REFERENCES meter_upload_batches(id) ON DELETE CASCADE,
    meter_id        VARCHAR(100) NOT NULL,
    substation_id   VARCHAR(100) NOT NULL,
    timestamp       TIMESTAMP    NOT NULL,
    energy_kwh      DECIMAL(12,4) NOT NULL,
    anomaly_score   DECIMAL(5,4),
    is_anomaly      BOOLEAN      DEFAULT false,
    z_score         DECIMAL(8,4),
    expected_kwh    DECIMAL(12,4),
    residual_kwh    DECIMAL(12,4),
    anomaly_reason  VARCHAR(255),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_substation_id ON meter_upload_batches(substation_id);
CREATE INDEX IF NOT EXISTS idx_batch_created_at    ON meter_upload_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_batch_id    ON meter_readings(batch_id);
CREATE INDEX IF NOT EXISTS idx_reading_meter_id    ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_reading_timestamp   ON meter_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_reading_is_anomaly  ON meter_readings(is_anomaly);

ALTER TABLE meter_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings        ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role access batches"  ON meter_upload_batches FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Service role access readings" ON meter_readings        FOR ALL USING (true);
