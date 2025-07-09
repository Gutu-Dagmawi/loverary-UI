import { isAuthenticated, isAdmin, getCurrentUser } from '../api/auth';

/**
 * Protects routes that require authentication
 * @param {string} redirectTo - The path to redirect to if not authenticated (default: '/login.html')
 * @param {boolean} adminOnly - If true, only admin users are allowed
 * @param {boolean} memberOnly - If true, only member users are allowed (takes precedence over adminOnly)
 * @returns {boolean} - True if access is granted, false otherwise
 */
export const requireAuth = async (redirectTo = '/login.html', { adminOnly = false, memberOnly = false } = {}) => {
  // Wait for DOM to be fully loaded
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve));
  }

  if (!isAuthenticated()) {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return false;
  }

  const user = getCurrentUser();
  if (!user) {
    localStorage.removeItem('auth_token');
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return false;
  }
  
  // Check member-only access
  if (memberOnly && isAdmin()) {
    console.log('Admin access not allowed to member routes');
    window.location.href = '/admin-dashboard.html';
    return false;
  }
  
  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    console.log('Admin access required');
    window.location.href = '/login.html';
    return false;
  }

  return true;
};

/**
 * Redirects to the stored URL after successful login
 * If no stored URL is found, redirects to the home page
 */
export const redirectAfterLogin = () => {
  const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
  sessionStorage.removeItem('redirectAfterLogin');
  window.location.href = redirectTo;
};

/**
 * Initialize authentication state for the page
 * @param {boolean} requireAuth - Whether to require authentication for the current page
 * @param {string} redirectTo - The path to redirect to if not authenticated (default: '/login.html')
 */
export const initAuth = (requireAuth = false, redirectTo = '/login.html') => {
  if (requireAuth && !isAuthenticated()) {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return false;
  }
  
  // Update UI based on authentication state
  const authSection = document.getElementById('authSection');
  const userSection = document.getElementById('userSection');
  
  if (isAuthenticated()) {
    // User is logged in
    if (authSection) authSection.classList.add('hidden');
    if (userSection) userSection.classList.remove('hidden');
  } else {
    // User is not logged in
    if (authSection) authSection.classList.remove('hidden');
    if (userSection) userSection.classList.add('hidden');
  }
  
  return isAuthenticated();
};
