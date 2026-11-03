// =================== AUTH MODULE ===================
const auth = {
    isLoggedIn() {
        return !!localStorage.getItem('chemlab_token');
    },

    getUser() {
        const user = localStorage.getItem('chemlab_user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return localStorage.getItem('chemlab_token');
    },

    setSession(token, user) {
        localStorage.setItem('chemlab_token', token);
        localStorage.setItem('chemlab_user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('chemlab_token');
        localStorage.removeItem('chemlab_user');
        updateAuthUI();
        showPage('dashboard', document.querySelector('.nav-btn'));
    },

    async register(name, email, password) {
        const res = await api.postPublic('/auth/register', { name, email, password });
        if (res.error) return res;
        this.setSession(res.token, res.user);
        updateAuthUI();
        return res;
    },

    async login(email, password) {
        const res = await api.postPublic('/auth/login', { email, password });
        if (res.error) return res;
        this.setSession(res.token, res.user);
        updateAuthUI();
        return res;
    }
};

// =================== AUTH UI ===================
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab(mode);
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
    // Clear form fields
    document.querySelectorAll('#authModal input').forEach(i => i.value = '');
    const errEl = document.getElementById('authError');
    if (errEl) errEl.style.display = 'none';
}

function switchAuthTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    
    // Clear any lingering errors when switching tabs
    const errEl = document.getElementById('authError');
    if (errEl) errEl.style.display = 'none';
}

function showAuthError(msg) {
    const errEl = document.getElementById('authError');
    if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showAuthError('Please fill in all fields.');
    const res = await auth.login(email, password);
    if (res.error) return showAuthError(res.error);
    hideAuthModal();
    loadDashboardData();
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (!name || !email || !password || !confirm) return showAuthError('Please fill in all fields.');
    if (password !== confirm) return showAuthError('Passwords do not match.');
    if (password.length < 6) return showAuthError('Password must be at least 6 characters.');

    const res = await auth.register(name, email, password);
    if (res.error) return showAuthError(res.error);
    hideAuthModal();
    loadDashboardData();
}

function updateAuthUI() {
    const loggedIn = auth.isLoggedIn();
    const user = auth.getUser();
    const userMenu = document.getElementById('userMenu');
    const authBtns = document.getElementById('authButtons');

    if (loggedIn && user) {
        if (userMenu) {
            userMenu.style.display = 'flex';
            document.getElementById('userName').textContent = user.name;
        }
        if (authBtns) authBtns.style.display = 'none';
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authBtns) authBtns.style.display = 'flex';
    }
}
