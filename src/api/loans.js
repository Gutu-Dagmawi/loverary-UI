import { getCsrfToken } from './auth';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Fetches loans for a given user ID
 * @returns {Promise<Array>} Array of loan objects
 */
export async function getUserLoans() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/api/circulation/loans`, {
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to fetch loans');
  }
  return data.loans || [];
}

/**
 * Returns a checked out book
 * @param {string} checkOutId - The ID of the check out record
 * @returns {Promise<Object>} The response data from the server
 */
export async function returnBook(checkOutId) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Get CSRF token first
  const csrfToken = await getCsrfToken();
  
  // Get XSRF token from cookies
  const getXsrfToken = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };
  const xsrfToken = getXsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/circulation/check-in/${checkOutId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': xsrfToken
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to return book');
  }

  return data;
}