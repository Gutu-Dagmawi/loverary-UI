import { getCsrfToken } from './auth';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Fetches loans for a given user ID
 * @returns {Promise<Array>} Array of loan objects
 */
export async function getUserLoans() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/circulation/loans`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch loans');
  }
  
  const data = await response.json();
  return data.loans || [];
}

/**
 * Fetches book details by barcode
 * @param {string} barcode - The barcode of the book copy
 * @returns {Promise<Object>} Book details
 */
export async function getBookByBarcode(barcode) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/book-copies/${barcode}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch book details');
  }
  
  return await response.json();
}

/**
 * Returns a checked out book
 * @param {string} checkOutId - The ID of the check out record
 * @returns {Promise<Object>} The response data from the server
 */
export async function returnBook(checkOutId) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Get CSRF token
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/circulation/check-in/${checkOutId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': csrfToken
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to return book');
  }

  return data;
}