// API base URL - direct to backend
const API_BASE_URL = 'http://localhost:8000/';

/**
 * Gets the CSRF token by first fetching the CSRF cookie if needed
 * @returns {Promise<string>} - The CSRF token
 */
const getCsrfToken = async () => {
  // First, get the CSRF cookie
  const csrfResponse = await fetch(`${API_BASE_URL}sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!csrfResponse.ok) {
    throw new Error('Failed to get CSRF token');
  }

  // Get the CSRF token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };
  
  const csrfToken = getCookie('XSRF-TOKEN');
  if (!csrfToken) {
    throw new Error('CSRF token not found in cookies');
  }
  
  return decodeURIComponent(csrfToken);
};

/**
 * Sends a login request to the server
 * @param {FormData} formData - Form data containing email and password
 * @returns {Promise<Object>} - Response data with token
 */
export const login = async (formData) => {
  try {
    const csrfToken = await getCsrfToken();

    // Get form data
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember') === 'true' || formData.get('remember') === true;
    
    // Create login data object
    const loginData = {
      email: email,
      password: password,
      remember: remember
    };
    
    // Debug log the data being sent
    console.log('Prepared login data:', {
      email: email ? `${email.substring(0, 2)}...` : 'empty',
      password: password ? '***' : 'empty',
      remember: remember
    });

    // Then make the login request
    const response = await fetch(`${API_BASE_URL}api/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
      },
      credentials: 'include',
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      // Update navigation after successful login
      try {
        const { updateNavigation } = await import('../utils/nav.js');
        updateNavigation();
      } catch (error) {
        console.error('Failed to update navigation after login:', error);
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
/**
 * Sends a logout request to the server
 * @returns {Promise<Object>} - Response data
 */
export const logout = async () => {
  try {
    const csrfToken = await getCsrfToken();
    const authToken = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken,
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      credentials: 'include',
    });

    localStorage.removeItem('authToken');

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Logout failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.removeItem('authToken');
    throw error;
  }
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Gets the authentication token
 * @returns {string|null} - The auth token or null if not authenticated
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};
