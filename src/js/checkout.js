import { renderNav, setupNavigation, setupLogoutButton } from '../utils/nav.js';
import { isAuthenticated, getCurrentUser, logout } from '../api/auth.js';
import { showToast } from '../utils/toast.js';
import { requireAuth } from '../utils/auth.js';
import { getCsrfToken } from '../api/auth.js';
import { getUserLoans } from '../api/loans.js';

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

async function checkLoanLimit() {
  try {
    const loans = await getUserLoans();
    const activeLoans = loans.filter(loan => !loan.return_date);
    return activeLoans.length >= 3;
  } catch (error) {
    console.error('Error checking loan limit:', error);
    return false;
  }
}

function showLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const mainContent = document.getElementById('main-content');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  if (mainContent) mainContent.classList.add('hidden');
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const mainContent = document.getElementById('main-content');
  if (loadingOverlay) loadingOverlay.classList.add('opacity-0');
  if (mainContent) mainContent.classList.remove('hidden');
  
  // Remove loading overlay from DOM after fade out
  setTimeout(() => {
    if (loadingOverlay) loadingOverlay.remove();
  }, 300);
}

async function initCheckout() {
  try {
    showLoading();
    
    // Check loan limit first
    const hasReachedLimit = await checkLoanLimit();
    if (hasReachedLimit) {
      showToast('You have reached the maximum number of active loans (3). Please return a book before checking out another one.', 'error');
      setTimeout(() => {
        window.location.href = 'loans.html';
      }, 2000);
      return;
    }

    // Initialize navigation
    const navContainer = document.getElementById('nav');
    if (navContainer) {
      navContainer.innerHTML = renderNav({ active: 'checkout', isAuthenticated: isAuthenticated() });
      setupNavigation();
    }

    // Set up logout button
    setupLogoutButton();

    // Set today's date as the default checkout date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkout-date').value = today;

    // Set default due date (2 weeks from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    document.getElementById('due-date').min = today; // Prevent selecting past dates
    document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];

    // Set up form submission
    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', handleCheckout);
    }
    
    // Hide loading and show content with a small delay for a smoother transition
    setTimeout(hideLoading, 500);
  } catch (error) {
    console.error('Error initializing checkout:', error);
    showToast('An error occurred while loading the checkout page. Please try again.', 'error');
    // Still hide loading to show the error message
    hideLoading();
  }
    // Get book data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('book_id');
    const barcode = urlParams.get('barcode');

    // Pre-fill barcode if provided
    if (barcode) {
      const barcodeInput = document.getElementById('book-barcode');
      if (barcodeInput) {
        barcodeInput.value = barcode;
        barcodeInput.readOnly = true;
      }
    }

    // If we have book data in session storage, use that
    const sessionBook = sessionStorage.getItem('currentBook');
    if (sessionBook) {
      try {
        const bookData = JSON.parse(sessionBook);
        updateBookInfo(bookData);
      } catch (e) {
        console.error('Error parsing session book data:', e);
      }
    } else if (bookId || barcode) {
      // Otherwise, use URL parameters
      const bookTitle = urlParams.get('title') || 'Book';
      const bookAuthor = urlParams.get('author') || 'Unknown Author';
      const coverImage = urlParams.get('cover_image') || '';

      updateBookInfo({
        id: bookId,
        barcode: barcode,
        title: bookTitle,
        author: bookAuthor,
        coverImage: coverImage,
      });
    }
}

function updateBookInfo(bookData) {
  if (!bookData) return;

  document.title = `Borrow ${bookData.title} | Loverary`;

  // Find or create the book info container
  let bookInfoContainer = document.getElementById('book-info-container');

  // If container doesn't exist, create it
  if (!bookInfoContainer) {
    bookInfoContainer = document.createElement('div');
    bookInfoContainer.id = 'book-info-container';
    bookInfoContainer.className = 'mb-6 p-4 bg-gray-50 rounded-lg';

    // Insert the container at the beginning of the form
    const form = document.querySelector('form');
    if (form) {
      form.insertBefore(bookInfoContainer, form.firstChild);
    } else {
      return; // No form found, exit
    }
  }

  // Clear any existing content
  bookInfoContainer.innerHTML = '';

  // Create and append the book info HTML
  const bookInfoHtml = `
    <div class="flex items-start space-x-4">
      ${bookData.coverImage ? `<img src="http://localhost:8000${bookData.coverImage}" alt="${bookData.title}" class="h-24 w-16 object-cover rounded">` : ''}
      <div>
        <h2 class="text-lg font-semibold text-gray-900">${bookData.title || 'Book'}</h2>
        ${bookData.author ? `<p class="text-sm text-gray-600">by ${bookData.author}</p>` : ''}
      </div>
    </div>
  `;

  bookInfoContainer.innerHTML = bookInfoHtml;

  // Pre-fill the book barcode if available
  const barcode = bookData.barcode || bookData.id;
  if (barcode) {
    const barcodeInput = document.getElementById('book-barcode');
    if (barcodeInput) {
      barcodeInput.value = barcode;
      barcodeInput.readOnly = true;
    }
  }
}


async function handleCheckout(e) {
  e.preventDefault();
  console.log('Form submission started');

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

    console.log('Sending checkout request...');
    const csrfToken = await getCsrfToken();

    // Get book data from session storage
    const sessionBook = sessionStorage.getItem('currentBook');
    if (!sessionBook) {
      throw new Error('Book information not found. Please go back and try again.');
    }

    const bookData = JSON.parse(sessionBook);
    console.log('Book data from session:', bookData);

    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error('User not authenticated');
    }

    // Prepare the request data
    const requestData = {
      member_id: currentUser.id,
      book_barcode: bookData.barcode, // Use the barcode from the book data
      due_date: formData.get('due-date'),
      checkout_date: formData.get('checkout-date')
    };
    
    console.log('Using barcode for checkout:', bookData.barcode);

    console.log('Sending checkout data:', requestData);
    
    // Get the CSRF token
    const token = await getCsrfToken();

    const response = await fetch(`http://localhost:8000/api/circulation/check-out/${bookData.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': token,
      },
      credentials: 'include',
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    console.log('Response received:', data);

    if (!response.ok) {
      throw new Error(data.message || `Checkout failed with status ${response.status}`);
    }

    // Clear the session book data on successful checkout
    sessionStorage.removeItem('currentBook');

    showToast('Book checked out successfully!', 'success');
    console.log('Checkout successful, redirecting...');

    setTimeout(() => {
      window.location.href = '/loans.html';
    }, 1500);
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error.message || 'Failed to check out book. Please try again.';
    console.error('Error details:', errorMessage);
    showToast(errorMessage, 'error');
  } finally {
    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

// Initialize the page when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
