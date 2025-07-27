import { isAuthenticated, isAdmin, getCurrentUser, getCsrfToken } from '../api/auth.js';

// DOM Elements
const booksTableBody = document.getElementById('booksTableBody');
const addBookBtn = document.getElementById('addBookBtn');
const bookForm = document.getElementById('bookForm');
const bookCopiesContainer = document.getElementById('bookCopiesContainer');
const addCopyBtn = document.getElementById('addCopyBtn');
const deleteBookBtn = document.getElementById('deleteBookBtn');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/';

// State
let currentPage = 1;
const itemsPerPage = 10;
let totalBooks = 0;
let currentBookId = null;
let copyCounter = 0;

// Check if we're on a book form page
const isBookFormPage = window.location.pathname.includes('book-');

// Initialize the application
async function init() {
  console.log('Initializing application...');
  
  try {
    // Check authentication
    await checkAdminAuth();
    
    // Initialize the appropriate page
    if (isBookFormPage) {
      initBookFormPage();
    } else {
      initBookListPage();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showAlert('An error occurred while initializing the application.', 'error');
  }
}

// Check if user is authenticated and is an admin
async function checkAdminAuth() {
  console.log('Checking admin authentication...');
  
  if (!isAuthenticated()) {
    console.log('User not authenticated, redirecting to login...');
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = 'login.html';
    return false;
  }
  
  if (!isAdmin()) {
    console.log('User is not an admin, redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return false;
  }
  
  return true;
}

// Initialize the book list page
function initBookListPage() {
  console.log('Initializing book list page...');
  
  // Set up event listeners
  if (addBookBtn) {
    addBookBtn.href = 'admin-book-create.html';
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Load books
  loadBooks();
}

// Initialize the book form page
function initBookFormPage() {
  console.log('Initializing book form page...');
  
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  // Set up form submission
  if (bookForm) {
    bookForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Set up add copy button
  if (addCopyBtn) {
    addCopyBtn.addEventListener('click', addBookCopy);
  }
  
  // Set up delete button if it exists
  if (deleteBookBtn) {
    deleteBookBtn.addEventListener('click', handleDeleteBook);
  }
  
  // Load book data if in edit mode
  if (bookId) {
    loadBook(bookId);
  } else {
    // Add mode - set up one empty copy
    addBookCopy();
  }
}

// Load a single book's data
async function loadBook(bookId) {
  try {
    console.log(`Loading book with ID: ${bookId}`);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}books/${bookId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load book');
    }
    
    const { data: book } = await response.json();
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    // Populate form fields
    document.getElementById('bookId').value = book.id || '';
    document.getElementById('title').value = book.title || '';
    document.getElementById('isbn').value = book.isbn || '';
    document.getElementById('author_id').value = book.author_id || '';
    document.getElementById('category').value = book.category || '';
    document.getElementById('language').value = book.language || '';
    document.getElementById('pages').value = book.pages || '';
    document.getElementById('publication_year').value = book.publication_year || '';
    document.getElementById('availability_status').checked = book.availability_status !== false;
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('edition').value = book.edition || '';
    document.getElementById('summary').value = book.summary || '';
    
    // Show current cover image if exists
    if (book.cover_image) {
      const currentCover = document.getElementById('currentCover');
      if (currentCover) {
        currentCover.innerHTML = `
          <p class="text-sm text-gray-500">Current Cover:</p>
          <img src="${book.cover_image}" alt="Book Cover" class="mt-2 h-40 object-cover rounded">
        `;
      }
    }
    
    // Load book copies
    if (book.copies && book.copies.length > 0) {
      bookCopiesContainer.innerHTML = ''; // Clear any existing copies
      book.copies.forEach(copy => {
        addBookCopy(copy);
      });
    }
    
  } catch (error) {
    console.error('Error loading book:', error);
    showAlert(`Error loading book: ${error.message}`, 'error');
    window.location.href = 'admin-books.html';
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const formData = new FormData(form);
    const bookId = formData.get('bookId');
    const url = bookId ? `${API_BASE_URL}books/${bookId}` : `${API_BASE_URL}books`;
    const method = bookId ? 'PUT' : 'POST';
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    
    // Handle file upload if exists
    const coverImageInput = document.getElementById('cover_image');
    const coverImageFile = coverImageInput.files[0];
    
    // Create form data for file upload
    const formDataToSend = new FormData();
    
    if (coverImageFile) {
      formDataToSend.append('cover_image', coverImageFile);
    }
    
    // Collect book copies data
    const copies = [];
    const copyElements = bookCopiesContainer.querySelectorAll('.book-copy');
    copyElements.forEach(copyEl => {
      const copyId = copyEl.dataset.copyId;
      const copyData = {
        id: copyId.startsWith('new-') ? null : copyId,
        barcode: formData.get(`copies[${copyId}][barcode]`),
        status: formData.get(`copies[${copyId}][status]`),
        condition: formData.get(`copies[${copyId}][condition]`),
        acquisition_date: formData.get(`copies[${copyId}][acquisition_date]`),
        notes: formData.get(`copies[${copyId}][notes]`)
      };
      copies.push(copyData);
    });
    
    // Add other fields to form data
    formDataToSend.append('title', formData.get('title') || '');
    formDataToSend.append('isbn', formData.get('isbn') || '');
    formDataToSend.append('author_id', formData.get('author_id') || '');
    formDataToSend.append('category', formData.get('category') || '');
    formDataToSend.append('language', formData.get('language') || '');
    formDataToSend.append('pages', formData.get('pages') || '');
    formDataToSend.append('publication_year', formData.get('publication_year') || '');
    formDataToSend.append('availability_status', formData.get('availability_status') === 'on' ? '1' : '0');
    formDataToSend.append('publisher', formData.get('publisher') || '');
    formDataToSend.append('edition', formData.get('edition') || '');
    formDataToSend.append('summary', formData.get('summary') || '');
    formDataToSend.append('copies', JSON.stringify(copies));
    
    // Get CSRF token
    const csrfToken = await getCsrfToken();
    
    // Send request
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
      },
      body: formDataToSend,
      credentials: 'include'
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || 'Failed to save book');
    }
    
    // Show success message and redirect
    showAlert(`Book ${bookId ? 'updated' : 'created'} successfully!`, 'success');
    setTimeout(() => {
      window.location.href = 'admin-books.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error saving book:', error);
    showAlert(`Error: ${error.message || 'Failed to save book. Please try again.'}`, 'error');
    
    // Reset button state
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = bookId ? 'Update Book' : 'Save Book';
    }
  }
}

// Add a new book copy field
function addBookCopy(copyData = null) {
  copyCounter++;
  const copyId = copyData ? copyData.id : `new-${Date.now()}-${copyCounter}`;
  
  const copyElement = document.createElement('div');
  copyElement.className = 'book-copy bg-gray-50 p-4 rounded-md mb-4';
  copyElement.dataset.copyId = copyId;
  
  copyElement.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <h4 class="font-medium">Book Copy #${copyCounter}</h4>
      <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('.book-copy').remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Barcode *</label>
        <input type="text" name="copies[${copyId}][barcode]" 
               value="${copyData ? copyData.barcode || '' : ''}"
               required
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Status *</label>
        <select name="copies[${copyId}][status]" 
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="available" ${copyData && copyData.status === 'available' ? 'selected' : ''}>Available</option>
          <option value="checked_out" ${copyData && copyData.status === 'checked_out' ? 'selected' : ''}>Checked Out</option>
          <option value="lost" ${copyData && copyData.status === 'lost' ? 'selected' : ''}>Lost</option>
          <option value="damaged" ${copyData && copyData.status === 'damaged' ? 'selected' : ''}>Damaged</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Condition *</label>
        <select name="copies[${copyId}][condition]" 
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="new" ${copyData && copyData.condition === 'new' ? 'selected' : ''}>New</option>
          <option value="good" ${copyData && copyData.condition === 'good' ? 'selected' : ''} ${!copyData ? 'selected' : ''}>Good</option>
          <option value="fair" ${copyData && copyData.condition === 'fair' ? 'selected' : ''}>Fair</option>
          <option value="poor" ${copyData && copyData.condition === 'poor' ? 'selected' : ''}>Poor</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Acquisition Date *</label>
        <input type="date" name="copies[${copyId}][acquisition_date]" 
               value="${copyData && copyData.acquisition_date ? copyData.acquisition_date.split('T')[0] : new Date().toISOString().split('T')[0]}"
               required
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700">Notes</label>
        <textarea name="copies[${copyId}][notes]" rows="2"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">${copyData ? copyData.notes || '' : ''}</textarea>
      </div>
    </div>
  `;
  
  bookCopiesContainer.appendChild(copyElement);
}

// Handle book deletion
async function handleDeleteBook() {
  if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
    return;
  }
  
  const bookId = document.getElementById('bookId').value;
  if (!bookId) return;
  
  try {
    const token = localStorage.getItem('auth_token');
    const csrfToken = await getCsrfToken();
    
    const response = await fetch(`${API_BASE_URL}books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete book');
    }
    
    showAlert('Book deleted successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'admin-books.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error deleting book:', error);
    showAlert(`Error: ${error.message || 'Failed to delete book. Please try again.'}`, 'error');
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  // Remove any existing alerts
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} fixed top-4 right-4 p-4 rounded-md shadow-lg text-white ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the application when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Make functions available globally for inline event handlers
window.addBookCopy = addBookCopy;
