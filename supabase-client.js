// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://pmebcstaequvgsstoxbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWJjc3RhZXF1dmdzc3RveGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjg2MDYsImV4cCI6MjA5NDgwNDYwNn0.KpWyxf-ntsBJ2GnYvgD_VcNWn2c4D1ymR3LYwB67jfA';

const STORAGE_KEYS = { TOKEN: 'sb_token', USER: 'sb_user' };

const supabase = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,

  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.token ?? this.key}`,
      ...extra
    };
  },

  async _fetch(path, options = {}) {
    const res = await fetch(`${this.url}${path}`, options);
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err });
    }
    return res.status === 204 ? true : res.json();
  },

  // ── Auth ──────────────────────────────────────────────
  async signUp(email, password, metadata = {}) {
    const data = await this._fetch('/auth/v1/signup', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password, data: metadata })
    });
    if (data.access_token) this.token = data.access_token;
    return data;
  },

  async signIn(email, password) {
    const data = await this._fetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password })
    });
    this.token = data.access_token;
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    return data;
  },

  async signOut() {
    try {
      await this._fetch('/auth/v1/logout', { method: 'POST', headers: this.headers() });
    } finally {
      this.token = null;
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // ── Database ──────────────────────────────────────────
  async select(table, query = '') {
    return this._fetch(`/rest/v1/${table}${query}`, {
      headers: this.headers({ 'Prefer': 'return=representation' })
    });
  },

  async insert(table, data) {
    return this._fetch(`/rest/v1/${table}`, {
      method: 'POST',
      headers: this.headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    });
  },

  async update(table, data, filter) {
    return this._fetch(`/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: this.headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(data)
    });
  },

  async delete(table, filter) {
    return this._fetch(`/rest/v1/${table}?${filter}`, {
      method: 'DELETE',
      headers: this.headers()
    });
  }
};
