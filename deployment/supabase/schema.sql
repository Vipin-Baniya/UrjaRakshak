-- UrjaRakshak Database Schema for Supabase

-- Grid Sections Table
CREATE TABLE IF NOT EXISTS grid_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    substation_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    capacity_mva DECIMAL(10,2),
    location JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyses Table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id UUID REFERENCES grid_sections(id) ON DELETE CASCADE,
    input_energy_mwh DECIMAL(10,2) NOT NULL,
    output_energy_mwh DECIMAL(10,2) NOT NULL,
    residual_mwh DECIMAL(10,2),
    residual_percentage DECIMAL(5,2),
    confidence_score DECIMAL(3,2),
    status VARCHAR(50) NOT NULL,
    physics_result JSONB,
    attribution_result JSONB,
    requires_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Components Table
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_section_id UUID REFERENCES grid_sections(id) ON DELETE CASCADE,
    component_id VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    rated_capacity_kva DECIMAL(10,2),
    efficiency_rating DECIMAL(3,2),
    age_years INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(grid_section_id, component_id)
);

-- Indexes for Performance
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_grid_section ON analyses(grid_section_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_components_grid_section ON components(grid_section_id);

-- Row Level Security (RLS)
ALTER TABLE grid_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth setup)
CREATE POLICY "Allow read access to grid_sections" ON grid_sections FOR SELECT USING (true);
CREATE POLICY "Allow read access to analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Allow read access to components" ON components FOR SELECT USING (true);
