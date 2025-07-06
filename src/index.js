import { login } from '../src/api/auth.js';
import { showToast } from '../src/utils/toast.js';
import { redirectAfterLogin } from '../src/utils/auth.js';

const API_BASE_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  
  const loginButton = loginForm.querySelector('button[type="submit"]');
  const loginButtonText = document.getElementById('loginButtonText');
  const loginSpinner = document.getElementById('loginSpinner');

  // First, fetch the CSRF token from the server
  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      return true;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    loginButton.disabled = true;
    loginButtonText.textContent = 'Signing in...';
    loginSpinner.classList.remove('hidden');
    
    const formData = new FormData(loginForm);
    const email = formData.get('email').trim();
    const password = formData.get('password');
    
    try {
      // First get the CSRF token
      await fetchCsrfToken();
      
      // Then proceed with login
      await login(formData);
      showToast('Login successful!', 'success');
      setTimeout(() => {
        redirectAfterLogin();
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Invalid email or password', 'error');
    } finally {
      // Re-enable button and reset state
      loginButton.disabled = false;
      loginButtonText.textContent = 'Sign in';
      loginSpinner.classList.add('hidden');
    }
  });
});