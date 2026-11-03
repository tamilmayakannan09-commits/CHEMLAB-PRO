// =================== API HELPER ===================
// Central API wrapper with JWT token management

const API_BASE = '/api';

const api = {
    // Get the stored JWT token
    getToken() {
        return localStorage.getItem('chemlab_token');
    },

    // Build headers with optional auth
    _headers(withAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (withAuth) {
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Generic request handler
    async _request(method, url, data = null, withAuth = true) {
        const options = {
            method,
            headers: this._headers(withAuth)
        };
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        try {
            const response = await fetch(`${API_BASE}${url}`, options);
            const json = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid — logout
                    auth.logout();
                    return { error: 'Session expired. Please login again.' };
                }
                return { error: json.error || 'An error occurred.' };
            }
            return json;
        } catch (err) {
            console.error('API Error:', err);
            return { error: 'Network error. Is the server running?' };
        }
    },

    get(url) { return this._request('GET', url); },
    post(url, data) { return this._request('POST', url, data); },
    put(url, data) { return this._request('PUT', url, data); },
    patch(url, data) { return this._request('PATCH', url, data); },
    delete(url) { return this._request('DELETE', url); },

    // Auth-specific (no token needed)
    postPublic(url, data) { return this._request('POST', url, data, false); },

    // AI Chemistry Assistant chat
    chatAI(message) { return this._request('POST', '/ai/chat', { message }, false); }
};

// =================== SAVE CALCULATION HELPER ===================
async function saveCalculationToDb(calcData) {
    if (!auth.isLoggedIn()) return; // Only save when logged in
    try {
        await api.post('/calculations', calcData);
    } catch (e) {
        console.warn('Could not save calculation:', e);
    }
}
