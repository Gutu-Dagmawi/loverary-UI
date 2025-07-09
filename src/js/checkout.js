import { renderNav, setupNavigation, setupLogoutButton } from '../utils/nav.js';
import { isAuthenticated, getCurrentUser, getCsrfToken, logout } from '../api/auth.js';
import { showToast } from '../utils/toast.js';
import { requireAuth } from '../utils/auth.js';

// Protect this route - members only
(async () => {
  try {
    const isAuthorized = await requireAuth('/login.html', { memberOnly: true });
    if (isAuthorized) {
      initCheckout();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    window.location.href = '/login.html';
  }
})();

function initCheckout() {
  // Initialize navigation
  const navContainer = document.getElementById('nav');
  if (navContainer) {
    navContainer.innerHTML = renderNav({ active: 'checkout', isAuthenticated: isAuthenticated() });
    setupNavigation();
  }

  // Set up logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { logout } = await import('../api/auth.js');
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/login.html';
      }
    });
  }

  // Get book data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookDataParam = urlParams.get('book');
  
  if (bookDataParam) {
    try {
      const bookData = JSON.parse(decodeURIComponent(bookDataParam));
      updateBookInfo(bookData);
    } catch (error) {
      console.error('Error parsing book data:', error);
      showToast('Error loading book information', 'error');
    }
  }

  // Set up form submission
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handleCheckout);
  }
}

function updateBookInfo(bookData) {
  document.title = `Borrow ${bookData.title} | Loverary`;
  const bookTitleElement = document.createElement('div');
  bookTitleElement.className = 'mb-6 p-4 bg-gray-50 rounded-lg';
  
  const bookInfoHtml = `
    <div class="flex items-start space-x-4">
      <img src="http://localhost:8000${bookData.coverImage}" alt="${bookData.title}" class="h-24 w-16 object-cover rounded">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">${bookData.title}</h2>
        <p class="text-sm text-gray-600">by ${bookData.author}</p>
      </div>
    </div>
  `;
  
  bookTitleElement.innerHTML = bookInfoHtml;
  const form = document.querySelector('form');
  if (form) {
    form.insertBefore(bookTitleElement, form.firstChild);
  }
  
  // Pre-fill the book barcode if available
  if (bookData.barcode) {
    const barcodeInput = document.getElementById('book_barcode');
    if (barcodeInput) {
      barcodeInput.value = bookData.barcode;
      barcodeInput.readOnly = true;
    }
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  
  try {
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    `;
    
    const csrfToken = await getCsrfToken();
    const response = await fetch('http://localhost:8000/api/checkout', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken,
      },
      credentials: 'include',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Checkout failed');
    }
    
    showToast('Book checked out successfully!', 'success');
    setTimeout(() => {
      window.location.href = '/loans.html';
    }, 1500);
    
  } catch (error) {
    console.error('Checkout error:', error);
    showToast(error.message || 'Failed to check out book', 'error');
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
}

// Initialize the page when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
