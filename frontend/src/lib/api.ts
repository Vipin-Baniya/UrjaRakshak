const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async health() {
    const res = await fetch(`${API_URL}/health`);
    return res.json();
  },
  
  async analyzeGrid(data: any) {
    const res = await fetch(`${API_URL}/api/v1/analysis/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
