const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  components: {
    database: { status: string };
    physics_engine: { status: string };
  };
}

export interface PhysicsInfo {
  engine: string;
  purpose: string;
  parameters: Record<string, any>;
}

export interface AnalysisRequest {
  substation_id: string;
  input_energy_mwh: number;
  output_energy_mwh: number;
  components: Array<{
    component_id: string;
    component_type: string;
    rated_capacity_kva: number;
    efficiency_rating?: number;
    age_years?: number;
  }>;
}

export const api = {
  async health(): Promise<HealthResponse> {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getPhysicsInfo(): Promise<PhysicsInfo> {
    const res = await fetch(`${API_URL}/api/v1/physics/info`);
    if (!res.ok) throw new Error('Failed to fetch physics info');
    return res.json();
  },

  async analyzeGrid(data: AnalysisRequest) {
    const res = await fetch(`${API_URL}/api/v1/analysis/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Analysis failed');
    }
    return res.json();
  },

  getApiUrl() {
    return API_URL;
  }
};
