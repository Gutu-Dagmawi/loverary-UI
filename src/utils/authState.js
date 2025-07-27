/**
 * Clears all authentication-related data from storage
 * This should be called when the application starts to ensure users must log in
 */
export const clearAuthState = () => {
  // Clear auth token from localStorage
  localStorage.removeItem('auth_token');
  
  // Clear user data from localStorage
  localStorage.removeItem('current_user');
  
  // Clear any session-specific data
  sessionStorage.clear();
  
  // Clear any cookies that might be used for authentication
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    if (name.trim() === 'XSRF-TOKEN' || name.trim() === 'laravel_session') {
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  console.log('Authentication state cleared');
};

/**
 * Checks if this is the first visit after the server started
 * @returns {boolean} True if this is the first visit after server start
 */
export const isFirstVisitAfterServerStart = () => {
  const lastVisit = localStorage.getItem('last_server_start_visit');
  const currentTime = new Date().getTime();
  
  // If this is the first visit or it's been more than 5 minutes since the last visit
  // (to handle page refreshes)
  if (!lastVisit || (currentTime - parseInt(lastVisit, 10)) > 5 * 60 * 1000) {
    localStorage.setItem('last_server_start_visit', currentTime.toString());
    return true;
  }
  
  return false;
};
