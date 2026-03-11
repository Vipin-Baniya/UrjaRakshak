-- UrjaRakshak v2.1 — Complete Database Schema for Supabase / PostgreSQL
-- Run this once on a fresh database. Safe to re-run (IF NOT EXISTS).

-- ── Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    role            VARCHAR(50)  NOT NULL DEFAULT 'viewer',  -- admin|analyst|viewer
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    is_verified     BOOLEAN      NOT NULL DEFAULT false,
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
    status              VARCHAR(50)  NOT NULL DEFAULT 'active',
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
    is_active           BOOLEAN NOT NULL DEFAULT true,
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

-- ═══════════════════════════════════════════════════════════════════════════
-- v2.2 — GHI + AI + Inspections
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Grid Health Snapshots ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grid_health_snapshots (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id    UUID REFERENCES grid_sections(id) ON DELETE CASCADE,
    analysis_id        UUID REFERENCES analyses(id) ON DELETE SET NULL,
    substation_id      VARCHAR(100) NOT NULL,

    -- GHI result
    ghi_score          DECIMAL(6,2)  NOT NULL,
    classification     VARCHAR(20)   NOT NULL,
    action_required    BOOLEAN       DEFAULT false,
    interpretation     TEXT,
    confidence_in_ghi  DECIMAL(5,4),

    -- Subscores (0–1)
    pbs                DECIMAL(6,4),   -- Physics Balance Score
    ass                DECIMAL(6,4),   -- Anomaly Stability Score
    cs                 DECIMAL(6,4),   -- Confidence Score
    tss                DECIMAL(6,4),   -- Trend Stability Score
    dis                DECIMAL(6,4),   -- Data Integrity Score

    -- Risk classification
    inspection_priority VARCHAR(20),
    inspection_category VARCHAR(30),
    urgency             VARCHAR(100),

    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghi_created_at     ON grid_health_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghi_substation      ON grid_health_snapshots(substation_id);
CREATE INDEX IF NOT EXISTS idx_ghi_score           ON grid_health_snapshots(ghi_score);
CREATE INDEX IF NOT EXISTS idx_ghi_classification  ON grid_health_snapshots(classification);

ALTER TABLE grid_health_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role access ghi"
    ON grid_health_snapshots FOR ALL USING (true);

-- ── AI Interpretations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_interpretations (
    id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id                         UUID REFERENCES analyses(id) ON DELETE SET NULL,
    grid_section_id                     UUID REFERENCES grid_sections(id) ON DELETE SET NULL,
    substation_id                       VARCHAR(100) NOT NULL,

    -- Model metadata
    model_name                          VARCHAR(100) NOT NULL,
    model_version                       VARCHAR(50),
    prompt_hash                         VARCHAR(64),

    -- Structured output
    risk_level                          VARCHAR(20),
    inspection_priority                 VARCHAR(20),
    primary_infrastructure_hypothesis   TEXT,
    recommended_actions                 JSONB,
    confidence_commentary               TEXT,
    trend_assessment                    TEXT,
    estimated_investigation_scope       VARCHAR(30),

    -- Audit
    token_usage                         INTEGER DEFAULT 0,
    error                               TEXT,
    created_at                          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_created_at   ON ai_interpretations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_substation   ON ai_interpretations(substation_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_level   ON ai_interpretations(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_hash  ON ai_interpretations(prompt_hash);

ALTER TABLE ai_interpretations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role access ai"
    ON ai_interpretations FOR ALL USING (true);

-- ── Inspections ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id     UUID REFERENCES grid_sections(id) ON DELETE CASCADE,
    analysis_id         UUID REFERENCES analyses(id) ON DELETE SET NULL,
    anomaly_result_id   UUID REFERENCES anomaly_results(id) ON DELETE SET NULL,
    ghi_snapshot_id     UUID REFERENCES grid_health_snapshots(id) ON DELETE SET NULL,
    substation_id       VARCHAR(100) NOT NULL,

    -- Classification
    priority            VARCHAR(20)  NOT NULL,
    category            VARCHAR(30),
    urgency             VARCHAR(100),

    -- Workflow
    status              VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Content
    description         TEXT,
    recommended_actions JSONB,
    findings            TEXT,
    resolution_notes    TEXT,
    resolution          VARCHAR(50),

    -- Lifecycle
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inspection_substation ON inspections(substation_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status     ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspection_priority   ON inspections(priority);
CREATE INDEX IF NOT EXISTS idx_inspection_created_at ON inspections(created_at DESC);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role access inspections"
    ON inspections FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- v2.3 — Multi-Tenancy + Streaming + Stability + Drift + Aging + Audit
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Organizations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                 VARCHAR(80)  UNIQUE NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    plan                 VARCHAR(50)  NOT NULL DEFAULT 'free',
    api_key_hash         VARCHAR(64),
    max_substations      INTEGER DEFAULT 5,
    max_analyses_per_day INTEGER DEFAULT 50,
    contact_email        VARCHAR(255),
    is_active            BOOLEAN DEFAULT true NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_slug     ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_api_key  ON organizations(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_org_active   ON organizations(is_active);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role orgs" ON organizations FOR ALL USING (true);

-- ── Organization Members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_role  VARCHAR(30) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orgmember_org  ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_orgmember_user ON organization_members(user_id);
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role orgmembers" ON organization_members FOR ALL USING (true);

-- ── Live Meter Events ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_meter_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID REFERENCES organizations(id) ON DELETE CASCADE,
    meter_id       VARCHAR(100) NOT NULL,
    substation_id  VARCHAR(100) NOT NULL,
    event_ts       TIMESTAMP NOT NULL,
    received_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    energy_kwh     FLOAT NOT NULL,
    voltage_v      FLOAT,
    current_a      FLOAT,
    power_factor   FLOAT,
    source         VARCHAR(50) DEFAULT 'api',
    is_anomaly     BOOLEAN DEFAULT false,
    anomaly_score  FLOAT,
    z_score        FLOAT
);
CREATE INDEX IF NOT EXISTS idx_live_meter_id    ON live_meter_events(meter_id);
CREATE INDEX IF NOT EXISTS idx_live_substation  ON live_meter_events(substation_id);
CREATE INDEX IF NOT EXISTS idx_live_event_ts    ON live_meter_events(event_ts DESC);
CREATE INDEX IF NOT EXISTS idx_live_received_at ON live_meter_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_is_anomaly  ON live_meter_events(is_anomaly);
ALTER TABLE live_meter_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role live_events" ON live_meter_events FOR ALL USING (true);

-- ── Meter Stability Scores ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meter_stability_scores (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           UUID REFERENCES organizations(id) ON DELETE CASCADE,
    meter_id         VARCHAR(100) NOT NULL,
    substation_id    VARCHAR(100) NOT NULL,
    window_size      INTEGER DEFAULT 30,
    rolling_mean_kwh FLOAT,
    rolling_std_kwh  FLOAT,
    rolling_cv       FLOAT,
    stability_score  FLOAT,
    trend_slope      FLOAT,
    trend_direction  VARCHAR(10),
    anomaly_rate_30d FLOAT,
    p5_kwh           FLOAT,
    p95_kwh          FLOAT,
    total_readings   INTEGER DEFAULT 0,
    last_reading_kwh FLOAT,
    last_reading_ts  TIMESTAMP,
    computed_at      TIMESTAMP DEFAULT NOW(),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(meter_id, substation_id)
);
CREATE INDEX IF NOT EXISTS idx_mstab_meter_id   ON meter_stability_scores(meter_id);
CREATE INDEX IF NOT EXISTS idx_mstab_substation ON meter_stability_scores(substation_id);
CREATE INDEX IF NOT EXISTS idx_mstab_score      ON meter_stability_scores(stability_score);
CREATE INDEX IF NOT EXISTS idx_mstab_computed_at ON meter_stability_scores(computed_at DESC);
ALTER TABLE meter_stability_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role mstab" ON meter_stability_scores FOR ALL USING (true);

-- ── Model Drift Logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_drift_logs (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id       UUID REFERENCES model_versions(id) ON DELETE SET NULL,
    model_name             VARCHAR(100) NOT NULL,
    reference_anomaly_rate FLOAT,
    current_anomaly_rate   FLOAT,
    drift_magnitude        FLOAT,
    psi_score              FLOAT,
    ks_statistic           FLOAT,
    ks_pvalue              FLOAT,
    drift_level            VARCHAR(20),
    requires_retraining    BOOLEAN DEFAULT false,
    retrained              BOOLEAN DEFAULT false,
    retrain_triggered_at   TIMESTAMP,
    reference_window_days  INTEGER DEFAULT 30,
    evaluation_window_days INTEGER DEFAULT 7,
    n_reference_samples    INTEGER,
    n_evaluation_samples   INTEGER,
    detected_at            TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drift_model       ON model_drift_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_drift_detected_at ON model_drift_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_level       ON model_drift_logs(drift_level);
ALTER TABLE model_drift_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role drift" ON model_drift_logs FOR ALL USING (true);

-- ── Transformer Aging Records ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transformer_aging_records (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id               UUID REFERENCES organizations(id) ON DELETE CASCADE,
    component_id         UUID REFERENCES components(id) ON DELETE CASCADE,
    substation_id        VARCHAR(100) NOT NULL,
    transformer_tag      VARCHAR(100) NOT NULL,
    rated_kva            FLOAT,
    rated_voltage_kv     FLOAT,
    install_year         INTEGER,
    designed_life_years  FLOAT DEFAULT 30.0,
    top_oil_temp_c       FLOAT,
    ambient_temp_c       FLOAT,
    hot_spot_temp_c      FLOAT,
    load_factor          FLOAT,
    thermal_aging_factor FLOAT,
    life_consumed_pct    FLOAT,
    estimated_rul_years  FLOAT,
    failure_probability  FLOAT,
    health_index         FLOAT,
    condition_class      VARCHAR(20),
    maintenance_flag     BOOLEAN DEFAULT false,
    replacement_flag     BOOLEAN DEFAULT false,
    computed_at          TIMESTAMP DEFAULT NOW(),
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(substation_id, transformer_tag)
);
CREATE INDEX IF NOT EXISTS idx_txaging_substation   ON transformer_aging_records(substation_id);
CREATE INDEX IF NOT EXISTS idx_txaging_tag          ON transformer_aging_records(transformer_tag);
CREATE INDEX IF NOT EXISTS idx_txaging_condition    ON transformer_aging_records(condition_class);
CREATE INDEX IF NOT EXISTS idx_txaging_failure_prob ON transformer_aging_records(failure_probability DESC);
CREATE INDEX IF NOT EXISTS idx_txaging_computed     ON transformer_aging_records(computed_at DESC);
ALTER TABLE transformer_aging_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role txaging" ON transformer_aging_records FOR ALL USING (true);

-- ── Audit Ledger (Append-Only) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_ledger (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_no   INTEGER NOT NULL,
    org_id        UUID,
    user_id       UUID,
    user_email    VARCHAR(255),
    user_role     VARCHAR(50),
    event_type    VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50),
    resource_id   VARCHAR(100),
    substation_id VARCHAR(100),
    summary       TEXT,
    metadata_json JSONB,
    entry_hash    VARCHAR(64) NOT NULL,
    prev_hash     VARCHAR(64),
    recorded_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address    VARCHAR(45)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_sequence    ON audit_ledger(sequence_no);
CREATE INDEX IF NOT EXISTS idx_audit_recorded_at ON audit_ledger(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type  ON audit_ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_org_id      ON audit_ledger(org_id);
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role audit" ON audit_ledger FOR ALL USING (true);

