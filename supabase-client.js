// ===== SUPABASE CLIENT =====
// Reemplazá estos valores con los de tu proyecto en https://supabase.com/dashboard

const SUPABASE_URL = 'https://pmebcstaequvgsstoxbt.supabase.co'; // ← reemplazar
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWJjc3RhZXF1dmdzc3RveGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjg2MDYsImV4cCI6MjA5NDgwNDYwNn0.KpWyxf-ntsBJ2GnYvgD_VcNWn2c4D1ymR3LYwB67jfA'; // ← reemplazar

// Cliente Supabase simple (sin SDK, usando fetch directo para máxima compatibilidad)
const supabase = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
  token: null,

  headers() {
    const h = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.token || this.key}`
    };
    return h;
  },

  // Auth
  async signUp(email, password, metadata = {}) {
    const res = await fetch(`${this.url}/auth/v1/signup`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password, data: metadata })
    });
    const data = await res.json();
    if (data.access_token) this.token = data.access_token;
    return data;
  },

  async signIn(email, password) {
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.access_token) {
      this.token = data.access_token;
      localStorage.setItem('sb_token', data.access_token);
      localStorage.setItem('sb_user', JSON.stringify(data.user));
    }
    return data;
  },

  async signOut() {
    await fetch(`${this.url}/auth/v1/logout`, {
      method: 'POST',
      headers: this.headers()
    });
    this.token = null;
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
  },

  getUser() {
    const u = localStorage.getItem('sb_user');
    return u ? JSON.parse(u) : null;
  },

  // DB
  async select(table, query = '') {
    const res = await fetch(`${this.url}/rest/v1/${table}${query}`, {
      headers: { ...this.headers(), 'Prefer': 'return=representation' }
    });
    return await res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...this.headers(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async update(table, data, filter) {
    const res = await fetch(`${this.url}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { ...this.headers(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async delete(table, filter) {
    const res = await fetch(`${this.url}/rest/v1/${table}?${filter}`, {
      method: 'DELETE',
      headers: this.headers()
    });
    return res.ok;
  }
};

// Restaurar sesión al cargar
(function() {
  const token = localStorage.getItem('sb_token');
  if (token) supabase.token = token;
})();
