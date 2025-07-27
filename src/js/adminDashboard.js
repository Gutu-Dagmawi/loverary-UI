import { API_BASE_URL, getAuthHeaders } from '../api/auth.js';

console.log('adminDashboard.js loaded');
console.log('API_BASE_URL:', API_BASE_URL);

/**
 * Fetches data from the specified API endpoint
 * @param {string} endpoint - The API endpoint to fetch data from
 * @returns {Promise<number>} - The total count from the API response
 */
async function fetchDataCount(endpoint) {
  // Add a leading slash to the endpoint if it doesn't have one
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}api${normalizedEndpoint}`;

  console.log(`Making request to: ${url}`);

  try {
    const headers = getAuthHeaders();
    console.log('Using headers:', headers);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'include', // Important for cookies/sessions
    });

    console.log(`Response status for ${url}:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from ${url}:`, errorText);
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Data received from ${url}:`, data);
    return data.total || data.length || 0;
  } catch (error) {
    console.error(`Error in fetchDataCount for ${endpoint}:`, error);
    return 0; // Return 0 if there's an error
  }
}

/**
 * Updates the dashboard stats with real data
 */
export async function updateDashboardStats() {
  console.log('Updating dashboard stats...');
  try {
    // Fetch all data in parallel with correct endpoint paths
    const [totalBooks, activeUsers, activeLoans, overdueLoans] = await Promise.all([
      fetchDataCount('books'),
      fetchDataCount('members'),
      fetchDataCount('circulation/activeLoans'),
      fetchDataCount('circulation/allOverdue'),
    ]);

    console.log('Fetched data:', { totalBooks, activeUsers, activeLoans, overdueLoans });

    // Update the DOM with the fetched data
    const updateElement = (id, value) => {
      const element = document.querySelector(id);
      if (element) {
        element.textContent = value.toLocaleString();
        console.log(`Updated ${id} with value:`, value);
      } else {
        console.error(`Element not found: ${id}`);
      }
    };

    updateElement('#totalBooks', totalBooks);
    updateElement('#activeUsers', activeUsers);
    updateElement('#activeLoans', activeLoans);
    updateElement('#overdueLoans', overdueLoans);
  } catch (error) {
    console.error('Error in updateDashboardStats:', error);
  } finally {
    console.log('Finished updating dashboard stats');
  }
}

// Initialize the dashboard when the DOM is loaded
function initializeDashboard() {
  console.log('Initializing dashboard...');
  console.log('Current path:', window.location.pathname);

  if (window.location.pathname.includes('admin-dashboard.html')) {
    console.log('Admin dashboard detected, updating stats...');
    updateDashboardStats().catch((error) => {
      console.error('Failed to update dashboard stats:', error);
    });
  } else {
    console.log('Not on admin dashboard, skipping initialization');
  }
}

// Check if the DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM is already loaded
  initializeDashboard();
}
