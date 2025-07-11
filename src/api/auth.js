// API base URL - direct to backend (no trailing slash)
export const API_BASE_URL = 'http://localhost:8000/';

/**
 * Gets the authentication headers with the bearer token
 * @returns {Object} - Headers object with authorization and content type
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Gets the CSRF token by first fetching the CSRF cookie if needed
 * @returns {Promise<string>} - The CSRF token
 */
export const getCsrfToken = async () => {
  // First, get the CSRF cookie
  const csrfResponse = await fetch(`${API_BASE_URL}sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
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
 * Sends an admin login request to the server
 * @param {FormData} formData - Form data containing email and password
 * @returns {Promise<Object>} - Response data with admin token
 */
export const adminLogin = async (formData) => {
  try {
    const csrfToken = await getCsrfToken();

    // Get form data
    const email = formData.get('email');
    const password = formData.get('password');

    // Create login data object
    const loginData = {
      email: email,
      password: password,
    };

    // Debug log the data being sent
    console.log('Prepared admin login data:', {
      email: email ? `${email.substring(0, 2)}...` : 'empty',
      password: password ? '***' : 'empty',
    });

    // Make the admin login request
    const response = await fetch(`${API_BASE_URL}api/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
      },
      credentials: 'include',
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

    if (data.token && data.user) {
      // Verify the user is actually an admin
      if (data.user.type !== 'Admin') {
        // Clear any partial data if user is not an admin
        localStorage.removeItem('adminToken');
        localStorage.removeItem('currentAdmin');
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store the admin data - using the same token key as regular users
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      console.log('Admin user logged in:', data.user);
    } else {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
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

    // Create login data object
    const loginData = {
      email: email,
      password: password,
    };

    // Debug log the data being sent
    console.log('Prepared login data:', {
      email: email ? `${email.substring(0, 2)}...` : 'empty',
      password: password ? '***' : 'empty',
    });

    // Then make the login request
    const response = await fetch(`${API_BASE_URL}api/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
      },
      credentials: 'include',
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('User logged in:', data.user);
      }
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
    const authToken = getAuthToken();

    const response = await fetch(`${API_BASE_URL}api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken,
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      credentials: 'include',
    });

    // Clear all possible authentication data from localStorage
    const authKeys = ['auth_token', 'authToken', 'adminToken', 'currentUser', 'currentAdmin'];
    authKeys.forEach((key) => localStorage.removeItem(key));

    // Clear session storage as well
    sessionStorage.clear();

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Logout failed');
    }

    // Redirect to login page after successful logout
    window.location.href = '/login.html';

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if the server request fails
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();

    // Redirect to login page on error as well
    window.location.href = '/login.html';

    throw error;
  }
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * Gets the authentication token
 * @returns {string|null} - The auth token or null if not authenticated
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Gets the current user object from localStorage
 * @returns {Object|null} - The user object or null if not set
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

/**
 * Gets the current admin user (alias for getCurrentUser for backward compatibility)
 * @returns {Object|null} - The user object or null if not set
 */
export const getCurrentAdmin = () => {
  return getCurrentUser();
};

/**
 * Checks if the current user is an admin
 * @returns {boolean} - True if user is an admin, false otherwise
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  console.log('isAdmin check - User:', user);
  if (!user || !user.type) {
    console.log('No user or user type found');
    return false;
  }
  const isAdminUser = user.type.toLowerCase() === 'admin';
  console.log(`User type: "${user.type}", isAdmin:`, isAdminUser);
  return isAdminUser;
};
