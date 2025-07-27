// Re-export all auth functions
export * from './auth';

/**
 * A utility function to make authenticated API requests
 * @param {string} endpoint - The API endpoint (e.g., '/books')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:8000/api${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include', // Important for cookies if using httpOnly tokens
  });

  const data = await response.json();

  if (!response.ok) {
    // If we get a 401 Unauthorized, clear the token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html';
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

/**
 * A wrapper for making GET requests
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * A wrapper for making POST requests
 */
export const post = (endpoint, body = {}, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * A wrapper for making PUT requests
 */
export const put = (endpoint, body = {}, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * A wrapper for making DELETE requests
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
};
