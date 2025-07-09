import { login, isAuthenticated } from '../src/api/auth.js';
import { showToast } from '../src/utils/toast.js';
import { initAuth } from '../src/utils/auth.js';

const API_BASE_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  if (!isAuthenticated() && !window.location.pathname.endsWith('login.html')) {
    window.location.href = '/login.html';
    return;
  }
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
    
    // Get the form elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember-me');
    
    // Get the current values
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox.checked;
    
    // Create a new FormData with the current values
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('remember', remember);
    
    console.log('Form data being sent:');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Remember me:', remember);
    
    try {
      // First get the CSRF token
      await fetchCsrfToken();
      
      // Then proceed with login
      const data = await login(formData);
      
      // Store the token and user data in localStorage
      localStorage.setItem('auth_token', data.token);
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }
      
      // Show success message
      showToast('Login successful!', 'success');
      
      // Determine redirect URL based on user type
      let redirectTo = '/';
      
      // If user is an admin, redirect to admin dashboard
      if (data.user && data.user.type === 'Admin') {
        redirectTo = '/admin-dashboard.html';
      } 
      // Otherwise, use the stored redirect URL or go to home
      else {
        redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 500);
      
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