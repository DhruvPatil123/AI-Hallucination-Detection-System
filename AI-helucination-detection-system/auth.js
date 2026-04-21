// ============================================================
// Nexa AI AHDS — Authentication Module
// ============================================================

const AUTH_REDIRECT_KEY = 'ahds_redirect_after_login';

function getAbsolutePageUrl(page, query = '') {
  const url = new URL(page, window.location.href);
  url.search = query;
  return url.toString();
}

function storeAuthRedirect(targetUrl) {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, targetUrl);
}

async function requireAuthNavigation(targetUrl) {
  const absoluteTarget = new URL(targetUrl, window.location.href).toString();

  if (!isSupabaseConfigured()) {
    window.location.href = absoluteTarget;
    return true;
  }

  const session = await getSession();
  if (session) {
    window.location.href = absoluteTarget;
    return true;
  }

  storeAuthRedirect(absoluteTarget);
  window.location.href = getAbsolutePageUrl('auth.html');
  return false;
}

function wireProtectedLinks() {
  document.querySelectorAll('[data-requires-auth]').forEach(link => {
    if (link.dataset.authBound === 'true') return;
    link.dataset.authBound = 'true';

    link.addEventListener('click', async (event) => {
      const href = link.getAttribute('href');
      const target = link.dataset.authTarget || href;
      if (!target || target === '#') return;

      event.preventDefault();
      await requireAuthNavigation(target);
    });
  });
}

// ==================== AUTH FUNCTIONS ====================

async function signUp(email, password, fullName) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || '' }
    }
  });
  return { data, error };
}

async function signIn(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

async function signInWithProvider(provider) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAbsolutePageUrl('auth.html')
    }
  });
  return { data, error };
}

async function signOut() {
  if (!supabase) { window.location.href = 'index.html'; return { error: null }; }
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = 'index.html';
  }
  return { error };
}

async function getSession() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (e) {
    console.warn('[AHDS] getSession failed:', e);
    return null;
  }
}

async function getUser() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (e) {
    console.warn('[AHDS] getUser failed:', e);
    return null;
  }
}

async function getProfile(userId) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

async function resetPassword(email) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAbsolutePageUrl('auth.html', '?mode=reset')
  });
  return { data, error };
}

async function updatePassword(password) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };
  const { data, error } = await supabase.auth.updateUser({
    password
  });
  return { data, error };
}

// ==================== AUTH GUARD ====================
// Call this on protected pages (demo.html, dashboard.html)

async function requireAuth() {
  if (!isSupabaseConfigured()) {
    console.warn('[AHDS] Supabase not configured — auth guard skipped.');
    return null;
  }

  const session = await getSession();
  if (!session) {
    // Store the intended destination
    sessionStorage.setItem(AUTH_REDIRECT_KEY, window.location.href);
    window.location.href = getAbsolutePageUrl('auth.html');
    return null;
  }
  return session;
}

// ==================== UI HELPERS ====================

// Update the header/topbar to show auth state
async function updateAuthUI() {
  if (!isSupabaseConfigured()) return;

  const session = await getSession();
  const user = session?.user;

  // Find all auth-aware containers
  const authContainers = document.querySelectorAll('.header-action, .topbar-right');

  authContainers.forEach(container => {
    if (!container) return;

    if (user) {
      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      // Check if we already injected auth UI
      if (container.querySelector('.user-menu')) return;

      // Create user menu
      const userMenu = document.createElement('div');
      userMenu.className = 'user-menu';
      userMenu.innerHTML = `
        <button class="user-avatar-btn" id="user-avatar-btn" title="${user.email}">
          <span class="user-avatar">${initial}</span>
          <span class="user-name">${displayName}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <div class="dropdown-header">
            <div style="font-weight:600; color:var(--text-white); font-size:.85rem;">${displayName}</div>
            <div style="font-size:.72rem; color:var(--text-slate);">${user.email}</div>
          </div>
          <div class="dropdown-divider"></div>
          <a href="dashboard.html" class="dropdown-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a href="demo.html" class="dropdown-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Live Demo
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item sign-out-btn" onclick="signOut()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      `;

      // Remove existing login/signup buttons
      const existingAuthBtns = container.querySelectorAll('.auth-login-btn, .auth-signup-btn');
      existingAuthBtns.forEach(b => b.remove());

      container.appendChild(userMenu);

      // Dropdown toggle
      const avatarBtn = userMenu.querySelector('#user-avatar-btn');
      const dropdown = userMenu.querySelector('#user-dropdown');
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));

    } else {
      // Not logged in — show login/signup buttons
      if (container.querySelector('.auth-login-btn')) return;

      const loginBtn = document.createElement('a');
      loginBtn.href = 'auth.html';
      loginBtn.className = 'btn btn-outline auth-login-btn';
      loginBtn.style.cssText = 'font-size:0.85rem; padding:0.5rem 1.2rem;';
      loginBtn.textContent = 'Log In';

      const signupBtn = document.createElement('a');
      signupBtn.href = 'auth.html?mode=signup';
      signupBtn.className = 'btn btn-shimmer auth-signup-btn';
      signupBtn.style.cssText = 'font-size:0.85rem; padding:0.5rem 1.2rem;';
      signupBtn.textContent = 'Sign Up';

      container.appendChild(loginBtn);
      container.appendChild(signupBtn);
    }
  });
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
    </div>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function syncOAuthButtons() {
  if (!isSupabaseConfigured()) return;

  const oauthButtons = document.querySelectorAll('[data-oauth-provider]');
  if (!oauthButtons.length) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    if (!response.ok) throw new Error('Failed to load auth provider settings.');

    const settings = await response.json();
    const external = settings?.external || {};
    let visibleCount = 0;

    oauthButtons.forEach(button => {
      const provider = button.dataset.oauthProvider;
      const enabled = Boolean(external[provider]);
      button.classList.toggle('hidden', !enabled);
      button.disabled = !enabled;
      if (enabled) visibleCount++;
    });

    const divider = document.querySelector('.auth-divider');
    if (divider) {
      divider.classList.toggle('hidden', visibleCount === 0);
    }
  } catch (error) {
    console.warn('[AHDS] Unable to load Supabase auth settings.', error);
  }
}

// ==================== INIT ====================

// Listen for auth state changes
if (supabase && isSupabaseConfigured()) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      updateAuthUI();

      // Redirect to the originally requested protected page when present.
      const redirect = sessionStorage.getItem(AUTH_REDIRECT_KEY);
      if (redirect) {
        sessionStorage.removeItem(AUTH_REDIRECT_KEY);
        window.location.href = redirect;
        return;
      }

      // When sign-in starts from auth.html directly, send the user home.
      // The home page (index.html) shows the full dashboard entry point.
      const mode = new URLSearchParams(window.location.search).get('mode');
      if (window.location.pathname.includes('auth.html') && mode !== 'reset') {
        window.location.href = 'index.html';
      }
    } else if (event === 'SIGNED_OUT') {
      updateAuthUI();
    }
  });
}

// Update UI on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  syncOAuthButtons();
  wireProtectedLinks();
});
