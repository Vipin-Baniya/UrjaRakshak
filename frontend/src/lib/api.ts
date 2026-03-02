/**
 * UrjaRakshak API Client
 * Centralised fetch wrapper for all backend calls.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('urjarakshak_token')
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Public endpoints ──────────────────────────────────────────────────────

export const api = {
  getApiUrl: () => BASE,

  health: () => fetcher<any>('/health'),

  getPhysicsInfo: () => fetcher<any>('/api/v1/physics/info').catch(() => null),

  /** Live dashboard data — no auth required */
  getDashboard: () => fetcher<DashboardData>('/api/v1/upload/dashboard'),

  // ── Auth ─────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    fetcher<{ access_token: string; token_type: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, role = 'analyst') =>
    fetcher<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  // ── Analysis ─────────────────────────────────────────────────────────
  validate: (payload: AnalysisPayload) =>
    fetcher<any>('/api/v1/analysis/validate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  getStatsSummary: () =>
    fetcher<any>('/api/v1/analysis/stats/summary', { headers: authHeaders() }),

  listAnalyses: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams(params as any).toString()
    return fetcher<any>(`/api/v1/analysis/${qs ? '?' + qs : ''}`, { headers: authHeaders() })
  },

  // ── Upload ───────────────────────────────────────────────────────────
  uploadMeterData: (file: File, substationId: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('substation_id', substationId)
    const token = getToken()
    return fetch(`${BASE}/api/v1/upload/meter-data`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.detail || `HTTP ${res.status}`)
      }
      return res.json() as Promise<UploadResult>
    })
  },

  listBatches: () =>
    fetcher<any>('/api/v1/upload/batches', { headers: authHeaders() }),

  getBatch: (id: string, anomaliesOnly = false) =>
    fetcher<any>(
      `/api/v1/upload/batches/${id}?anomalies_only=${anomaliesOnly}`,
      { headers: authHeaders() }
    ),
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  has_data: boolean
  latest_analysis: {
    substation_id: string
    input_energy_mwh: number
    output_energy_mwh: number
    technical_loss_pct: number
    residual_pct: number
    confidence_score: number
    balance_status: string
    requires_review: boolean
    created_at: string
  } | null
  latest_batch: {
    batch_id: string
    filename: string
    substation_id: string
    row_count: number
    anomalies_detected: number
    total_energy_kwh: number
    residual_pct: number
    confidence_score: number
    created_at: string
  } | null
  aggregates: {
    total_analyses: number
    avg_residual_pct: number
    avg_confidence_pct: number
    pending_review: number
    total_anomaly_checks: number
    anomalies_flagged: number
    anomaly_flag_rate_pct: number
    total_batches_uploaded: number
    total_meter_readings: number
    total_meter_anomalies: number
    meter_anomaly_rate_pct: number
  }
  by_status: Record<string, number>
  high_risk_substations: Array<{ substation: string; avg_residual_pct: number; analyses: number }>
  trend: Array<{ ts: string; residual_pct: number; confidence: number; substation: string }>
}

export interface UploadResult {
  batch_id: string
  status: string
  filename: string
  substation_id: string
  rows_received: number
  rows_parsed: number
  rows_skipped: number
  summary: {
    total_energy_kwh: number
    residual_pct: number
    confidence_score: number
    anomalies_detected: number
    anomaly_rate_pct: number
  }
  anomaly_sample: Array<{
    meter_id: string
    timestamp: string
    energy_kwh: number
    expected_kwh: number
    z_score: number
    anomaly_score: number
    reason: string
  }>
  ethics_note: string
}

export interface AnalysisPayload {
  substation_id: string
  input_energy_mwh: number
  output_energy_mwh: number
  time_window_hours?: number
  components: Array<{
    component_id: string
    component_type: string
    rated_capacity_kva?: number
    efficiency_rating?: number
    age_years?: number
    voltage_kv?: number
    resistance_ohms?: number
    length_km?: number
  }>
}
