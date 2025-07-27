import { isAuthenticated, isAdmin, getCurrentUser, getCsrfToken } from '../api/auth.js';

// DOM Elements
const booksTableBody = document.getElementById('booksTableBody');
const addBookBtn = document.getElementById('addBookBtn');
const bookModal = document.getElementById('bookModal');
const bookForm = document.getElementById('bookForm');

// State variables
let copyCounter = 0; // Tracks the number of book copies in the form
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

// API Base URL
const API_BASE_URL = 'http://localhost:8000/api/';

// State
let books = [];
let isEditMode = false;

// Debug function to log localStorage contents
const debugLocalStorage = () => {
  console.log('--- localStorage Contents ---');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}:`, localStorage.getItem(key));
  }
  console.log('----------------------------');};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');
  debugLocalStorage();
  
  // Check if we have a token but no user data
  const token = localStorage.getItem('auth_token');
  const user = getCurrentUser();
  console.log('Initial auth check - Token:', !!token, 'User:', user);
  
  if (token && !user) {
    console.log('Token exists but no user data. Attempting to fetch user...');
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Fetched user data:', userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        console.error('Failed to fetch user data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }
  
  await checkAdminAuth();
  await loadBooks();
  setupEventListeners();
});

// Renamed function to avoid naming conflict with the DOM element
const closeModalHandler = () => {
  bookModal.classList.add('hidden');
  bookForm.reset();
  isEditMode = false;
};

// Functions
async function checkAdminAuth() {
  console.log('checkAdminAuth called');
  try {
    console.log('Checking authentication...');
    const authenticated = isAuthenticated();
    const admin = isAdmin();
    console.log('isAuthenticated:', authenticated, 'isAdmin:', admin);
    
    if (!authenticated || !admin) {
      console.log('User not authenticated or not an admin, redirecting to login...');
      // Store the current URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = 'login.html';
      return false;
    }
    
    // Get current user info
    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
      console.error('User information not found in localStorage');
      throw new Error('User information not found');
    }
    
    // Verify with the server that the user is still authenticated and is an admin
    const token = localStorage.getItem('auth_token');
    console.log('Auth token exists:', !!token);
    
    console.log('Verifying user with server...');
    const response = await fetch(`${API_BASE_URL}user`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' // Important for cookies/session
    });
    
    console.log('Server response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Session expired: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('User data from server:', data);
    
    if (!data || !data.type || data.type.toLowerCase() !== 'admin') {
      console.error('User is not an admin:', data);
      throw new Error('Admin access required');
    }
    
    console.log('Admin authentication successful');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    // Clear auth data and redirect to login
    console.log('Clearing auth data and redirecting to login...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = 'login.html';
    return false;
  }
}



// Helper function to get availability status
const getAvailabilityStatus = (book) => {
  if (!book.book_copies || book.book_copies.length === 0) return 'No copies';
  const availableCopies = book.book_copies.filter(copy => copy.is_available).length;
  return `${availableCopies} of ${book.book_copies.length} available`;
};

// Helper function to get locations
const getLocations = (book) => {
  if (!book.book_copies || book.book_copies.length === 0) return 'N/A';
  const locations = [...new Set(book.book_copies.map(copy => copy.location))];
  return locations.join(', ');
};

async function loadBooks(page = 1) {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log(`Fetching books from API (page ${page})...`);
    const response = await fetch(`${API_BASE_URL}books?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to load books: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Books API response:', responseData);
    
    // Handle paginated response
    books = responseData.data || [];
    const pagination = responseData.pagination || {};
    
    console.log(`Loaded ${books.length} books (page ${pagination.current_page} of ${pagination.total || '?'})`);
    renderBooks(books, pagination);
  } catch (error) {
    console.error('Error loading books:', error);
    showAlert('Failed to load books. Please try again.', 'error');
  }
}

function renderBooks(booksToRender, pagination = {}) {
  console.log('Rendering books:', booksToRender);
  
  // Debug: Log the first book's structure if available
  if (booksToRender.length > 0) {
    console.log('First book structure:', JSON.stringify(booksToRender[0], null, 2));
  }
  
  // Clear existing content
  booksTableBody.innerHTML = '';
  
  if (!Array.isArray(booksToRender) || booksToRender.length === 0) {
    booksTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
          No books found. Add your first book!
        </td>
      </tr>
    `;
    return;
  }
  
  // Render each book
  booksTableBody.innerHTML = booksToRender.map(book => `
    <tr class="hover:bg-gray-50">
      <!-- Cover Image -->
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center">
          ${book.cover_image_url ? `
            <img class="h-16 w-12 object-cover rounded" 
                 src="http://localhost:8000${book.cover_image_url}" 
                 alt="${book.title}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/48x64?text=No+Cover'"
                 style="max-height: 64px;">
          ` : `
            <div class="h-16 w-12 bg-gray-100 flex items-center justify-center rounded border border-gray-200">
              <span class="text-gray-400 text-xs text-center px-1">No cover</span>
            </div>
          `}
        </div>
      </td>
      
      <!-- Title and Book ID -->
      <td class="px-4 py-3">
        <div class="text-sm font-medium text-gray-900">${book.title || 'N/A'}</div>
        <div class="text-xs text-gray-500">ID: ${book.id || book.book_id || 'N/A'}</div>
      </td>
      
      <!-- Author and ISBN -->
      <td class="px-4 py-3">
        <div class="text-sm text-gray-900">Author ID: ${book.author_id || 'N/A'}</div>
        <div class="text-xs text-gray-500">${book.isbn || 'No ISBN'}</div>
      </td>
      
      <!-- Stock/Availability -->
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${book.book_copies && book.book_copies.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${book.book_copies ? book.book_copies.length : '0'} available
        </span>
      </td>
      
      <!-- Actions -->
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="editBook('${book.id || book.book_id}')" class="text-indigo-600 hover:text-indigo-900 mr-4">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteBook('${book.id || book.book_id}')" class="text-red-600 hover:text-red-900">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Update pagination controls if available
  updatePaginationControls(pagination);
}

function setupEventListeners() {
  // Modal Controls
  addBookBtn.addEventListener('click', () => openModal());
  closeModal.addEventListener('click', closeModalHandler);
  cancelBtn.addEventListener('click', closeModalHandler);
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === bookModal) {
      closeModal();
    }
  });

  // Form Submission
  bookForm.addEventListener('submit', handleFormSubmit);
}

// Function to add book copy fields
function addBookCopy() {
  const bookCopiesContainer = document.getElementById('bookCopiesContainer');
  const copyCount = bookCopiesContainer.querySelectorAll('.book-copy').length;
  const copyDiv = document.createElement('div');
  copyDiv.className = 'book-copy border p-2 rounded text-xs mb-2';
  copyDiv.innerHTML = `
    <div class="flex justify-between items-center mb-1">
      <span class="font-medium">Copy #${copyCount + 1}</span>
      <button type="button" class="remove-copy text-red-500 hover:text-red-700" onclick="this.closest('.book-copy').remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div>
        <label class="block text-xs text-gray-600 mb-0.5">Barcode *</label>
        <input type="text" name="book_copies[${copyCount}][barcode]" required maxlength="100" 
               class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-0.5">Condition</label>
        <input type="text" name="book_copies[${copyCount}][condition]" maxlength="255" 
               class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-0.5">Location</label>
        <input type="text" name="book_copies[${copyCount}][location]" maxlength="255" 
               class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
      </div>
    </div>
  `;
  bookCopiesContainer.appendChild(copyDiv);
}

// Function to handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const bookId = formData.get('id');
  const url = bookId ? `${API_BASE_URL}books/${bookId}` : `${API_BASE_URL}books`;
  const method = bookId ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Accept': 'application/json',
      },
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save book');
    }
    
    // Close modal and refresh books list
    document.getElementById('bookModal').classList.add('hidden');
    await loadBooks();
    
    // Show success message
    alert(`Book ${bookId ? 'updated' : 'added'} successfully!`);
    
  } catch (error) {
    console.error('Error saving book:', error);
    alert(`Error: ${error.message}`);
  }
}

async function openModal(bookId = null) {
  try {
    // First ensure we have a fresh CSRF token
    await getCsrfToken();
    
    isEditMode = !!bookId;
    const bookForm = document.getElementById('bookForm');
    
    // Reset form and set default values
    console.log('Resetting form');
    bookForm.reset();
    document.getElementById('bookId').value = '';
    document.getElementById('availability_status').checked = true;
    
    // Make sure modal is ready
    if (bookModal) {
      bookModal.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error in openModal:', error);
    throw error; // Re-throw to handle in the calling function
  }
  
  if (isEditMode) {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Get CSRF token using the centralized function
      await getCsrfToken();
      
      const response = await fetch(`${API_BASE_URL}books/${bookId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }

      const responseData = await response.json();
      console.log('Fetched book data:', responseData);
      
      // Extract book data from the response
      const book = responseData.data;
      if (!book) {
        throw new Error('No book data found in response');
      }
      
      // Clear any existing book copies
      const bookCopiesContainer = document.getElementById('bookCopiesContainer');
      bookCopiesContainer.innerHTML = '';
      
      // Populate form fields
      console.log('Setting book ID:', book.book_id);
      document.getElementById('bookId').value = book.book_id || '';
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
      
      // bookCopiesContainer is already cleared above
      
      // Add book copies if they exist
      if (book.book_copies && Array.isArray(book.book_copies) && book.book_copies.length > 0) {
        book.book_copies.forEach((copy, index) => {
          const copyDiv = document.createElement('div');
          copyDiv.className = 'book-copy border p-2 rounded text-xs';
          copyDiv.innerHTML = `
            <div class="flex justify-between items-center mb-1">
              <span class="font-medium">Copy #${index + 1}</span>
              <button type="button" class="remove-copy text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-0.5">Barcode *</label>
                <input type="text" name="book_copies[${index}][barcode]" required maxlength="100" 
                      value="${copy.barcode || ''}"
                      class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-0.5">Condition</label>
                <input type="text" name="book_copies[${index}][condition]" maxlength="255" 
                      value="${copy.condition || ''}"
                      class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-0.5">Location</label>
                <input type="text" name="book_copies[${index}][location]" maxlength="255" 
                      value="${copy.location || ''}"
                      class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
              </div>
            </div>
          `;
          
          // Add remove functionality
          const removeBtn = copyDiv.querySelector('.remove-copy');
          removeBtn.addEventListener('click', () => {
            copyDiv.remove();
          });
          
          bookCopiesContainer.appendChild(copyDiv);
        });
        copyCounter = book.book_copies.length;
      } else {
        // Add one empty copy if none exist
        addBookCopy();
      }
      
      document.getElementById('modalTitle').textContent = 'Edit Book';
    } catch (error) {
      console.error('Error loading book details:', error);
      alert('Failed to load book details. Please try again.');
      return;
    }
  } else {
    // Reset form for new book
    bookForm.reset();
    document.getElementById('availability_status').checked = true; // Default to available
    document.getElementById('modalTitle').textContent = 'Add New Book';
    
    // Reset book copies container to just one empty copy
    const bookCopiesContainer = document.getElementById('bookCopiesContainer');
    bookCopiesContainer.innerHTML = `
      <div class="book-copy border p-2 rounded text-xs">
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium">Copy #1</span>
          <button type="button" class="remove-copy text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Barcode *</label>
            <input type="text" name="book_copies[0][barcode]" required maxlength="100" 
                  class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Condition</label>
            <input type="text" name="book_copies[0][condition]" maxlength="255" 
                  class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Location</label>
            <input type="text" name="book_copies[0][location]" maxlength="255" 
                  class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
        </div>
      </div>
    `;
    
    // Add remove functionality to the first copy
    const removeBtn = bookCopiesContainer.querySelector('.remove-copy');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const copyDiv = removeBtn.closest('.book-copy');
        if (copyDiv) {
          copyDiv.remove();
        }
      });
    }
    
    copyCounter = 1; // Reset counter
  }
  
  // Modal visibility is now handled earlier
  console.log('Modal should be visible now');
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const bookForm = document.getElementById('bookForm');
  const addBookBtn = document.getElementById('addBookBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const addCopyBtn = document.getElementById('addCopyBtn');
  
  // Add event listeners
  if (addBookBtn) {
    addBookBtn.addEventListener('click', () => openModal());
  }
  
  if (addCopyBtn) {
    addCopyBtn.addEventListener('click', addBookCopy);
  }
  
  if (closeModal) {
    closeModal.addEventListener('click', () => bookModal.classList.add('hidden'));
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => bookModal.classList.add('hidden'));
  }
  
  if (bookForm) {
    bookForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Initial load of books
  loadBooks();
  
  // Add initial book copy
  addCopyBtn.addEventListener('click', addBookCopy);
  
  // Open modal for adding new book
  addBookBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add New Book';
    bookForm.reset();
    document.getElementById('bookId').value = '';
    document.getElementById('availability_status').checked = true; // Default to available
    
    // Reset book copies container to just one copy
    bookCopiesContainer.innerHTML = `
      <div class="book-copy border p-2 rounded text-xs">
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium">Copy #1</span>
          <button type="button" class="remove-copy text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Barcode *</label>
            <input type="text" name="book_copies[0][barcode]" required maxlength="100" 
                   class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Condition</label>
            <input type="text" name="book_copies[0][condition]" maxlength="255" 
                   class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-0.5">Location</label>
            <input type="text" name="book_copies[0][location]" maxlength="255" 
                   class="text-xs block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7">
          </div>
        </div>
      </div>
    `;
    
    copyCounter = 1; // Reset counter
    bookModal.classList.remove('hidden');
  });
  
  // Close modal
  function closeBookModal() {
    bookModal.classList.add('hidden');
  }
  
  closeModal.addEventListener('click', closeBookModal);
  cancelBtn.addEventListener('click', closeBookModal);
  
  // Handle form submission
  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(bookForm);
    const bookId = formData.get('id');
    const url = bookId ? `/api/books/${bookId}` : '/api/books';
    const method = bookId ? 'PUT' : 'POST';
    
    // Convert form data to JSON structure expected by the backend
    const bookData = {
      title: formData.get('title'),
      isbn: formData.get('isbn'),
      author_id: formData.get('author_id') || null,
      category: formData.get('category'),
      language: formData.get('language'),
      pages: parseInt(formData.get('pages')),
      publication_year: formData.get('publication_year') ? parseInt(formData.get('publication_year')) : null,
      availability_status: formData.get('availability_status') === 'on',
      publisher: formData.get('publisher') || null,
      edition: formData.get('edition') || null,
      summary: formData.get('summary') || null,
      book_copies: []
    };
    
    // Process book copies
    const barcodes = formData.getAll('book_copies[][barcode]');
    const conditions = formData.getAll('book_copies[][condition]');
    const locations = formData.getAll('book_copies[][location]');
    
    barcodes.forEach((barcode, index) => {
      if (barcode) { // Only add if barcode is provided
        bookData.book_copies.push({
          barcode,
          condition: conditions[index] || null,
          location: locations[index] || null,
          is_available: true
        });
      }
    });
    
    // Validate at least one book copy is provided
    if (bookData.book_copies.length === 0) {
      alert('Please add at least one book copy with a barcode');
      return;
    }
    
    // Create FormData for file upload
    const jsonData = new FormData();
    jsonData.append('data', JSON.stringify(bookData));
    
    // Add cover image if provided
    const coverImage = document.getElementById('cover_image').files[0];
    if (coverImage) {
      jsonData.append('cover_image', coverImage);
    }
    
    try {
      // Get CSRF token and include it in the headers
      const csrfToken = await getCsrfToken();
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
        },
        body: jsonData,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save book');
      }
      
      console.log('Book saved:', result);
      
      // Refresh the books list
      await loadBooks();
      
      // Close the modal
      closeBookModal();
      
      // Show success message
      alert(`Book ${bookId ? 'updated' : 'added'} successfully!`);
      
    } catch (error) {
      console.error('Error saving book:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Load initial books
  loadBooks();
});

async function deleteBook(bookId) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  
  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE_URL}books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'X-XSRF-TOKEN': csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete book');
    }

    await loadBooks();
    showAlert('Book deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting book:', error);
    showAlert('Failed to delete book. Please try again.', 'error');
  }
}

function showAlert(message, type = 'info') {
  // You can implement a toast notification system here
  alert(`${type.toUpperCase()}: ${message}`);
}

// Pagination controls
function updatePaginationControls(pagination) {
  const paginationContainer = document.getElementById('paginationControls');
  if (!paginationContainer) return;
  
  const { current_page, per_page, total, has_more } = pagination;
  const totalPages = Math.ceil(total / per_page);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = `
    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div class="flex flex-1 justify-between sm:hidden">
        <button 
          onclick="loadBooks(${current_page - 1})" 
          ${current_page <= 1 ? 'disabled' : ''}
          class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Previous
        </button>
        <span class="px-4 py-2 text-sm text-gray-700">
          Page ${current_page} of ${totalPages}
        </span>
        <button 
          onclick="loadBooks(${current_page + 1})" 
          ${!has_more ? 'disabled' : ''}
          class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing <span class="font-medium">${(current_page - 1) * per_page + 1}</span>
            to <span class="font-medium">${Math.min(current_page * per_page, total)}</span>
            of <span class="font-medium">${total}</span> results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button 
              onclick="loadBooks(${current_page - 1})" 
              ${current_page <= 1 ? 'disabled' : ''}
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span class="sr-only">Previous</span>
              <i class="fas fa-chevron-left"></i>
            </button>
            
            ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(
                current_page - 2 + i,
                totalPages - 4 + Math.max(0, 4 - (totalPages - current_page))
              ));
              return `
                <button 
                  onclick="loadBooks(${pageNum})"
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                    ${current_page === pageNum ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' 
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'}"
                >
                  ${pageNum}
                </button>
              `;
            }).join('')}
            
            <button 
              onclick="loadBooks(${current_page + 1})" 
              ${!has_more ? 'disabled' : ''}
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span class="sr-only">Next</span>
              <i class="fas fa-chevron-right"></i>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
}

// Make functions available globally for inline event handlers
window.editBook = openModal;
window.deleteBook = deleteBook;
window.loadBooks = loadBooks;
window.addBookCopy = addBookCopy;
