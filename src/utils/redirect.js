import { isAuthenticated } from '../api/auth';

/**
 * Redirects to login if user is not authenticated
 * @param {string} redirectPath - The path to redirect to after login (default: '/')
 */
export const redirectToLoginIfNotAuthenticated = (redirectPath = '/') => {
  if (!isAuthenticated() && !window.location.pathname.includes('login.html')) {
    // Store the path to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', redirectPath);
    window.location.href = '/login.html';
  }
};

/**
 * Redirects to home if user is already authenticated
 */
export const redirectToHomeIfAuthenticated = () => {
  if (isAuthenticated() && window.location.pathname.includes('login.html')) {
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectTo;
  }
};
