import { isAuthenticated, isAdmin } from '../api/auth';

/**
 * Checks if the current page is an admin page
 * @returns {boolean} True if current page is an admin page
 */
const isAdminPage = () => {
  return window.location.pathname.includes('admin-') || 
         window.location.pathname.includes('admin/');
};

/**
 * Redirects to login if user is not authenticated
 * @param {string} redirectPath - The path to redirect to after login (default: '/')
 * @param {boolean} adminOnly - If true, only allows admin users
 */
export const redirectToLoginIfNotAuthenticated = (redirectPath = '/', adminOnly = false) => {
  // Don't redirect if already on login page to prevent loops
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  if (!isAuthenticated()) {
    // Store the path to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', redirectPath);
    window.location.replace('/login.html');
    throw new Error('Redirecting to login');
  }

  // If admin access is required but user is not admin
  if (adminOnly && !isAdmin()) {
    console.warn('Admin access required. Redirecting to home.');
    window.location.replace('/');
    throw new Error('Admin access required');
  }
};

/**
 * Redirects to home if user is already authenticated
 * @param {boolean} adminOnly - If true, only allows admin users to stay
 */
export const redirectToHomeIfAuthenticated = (adminOnly = false) => {
  if (!isAuthenticated()) {
    return;
  }

  // If on login page, redirect to appropriate page
  if (window.location.pathname.includes('login.html')) {
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.replace(redirectTo);
    throw new Error('Redirecting from login');
  }

  // If admin access is required but user is not admin
  if (adminOnly && !isAdmin()) {
    console.warn('Admin access required. Redirecting to home.');
    window.location.replace('/');
    throw new Error('Admin access required');
  }
};

/**
 * Ensures admin access, redirects to home if not admin
 */
export const ensureAdminAccess = () => {
  if (!isAdmin()) {
    console.warn('Admin access required. Redirecting to home.');
    window.location.replace('/');
    throw new Error('Admin access required');
  }
};
