import { isAuthenticated } from './auth';

/**
 * Fetches all books from the API
 * @returns {Promise<Array>} Array of book objects
 * @throws {Error} If user is not authenticated or there's an error fetching books
 */
export const fetchBooks = async () => {
  if (!isAuthenticated()) {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login.html';
    return [];
  }

  try {
    const response = await fetch('http://localhost:8000/api/books', {
      credentials: 'include', // Include cookies for session
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('auth_token');
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/login.html';
      return [];
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    // Handle different response formats
    let books = [];
    if (data.success && data.data) {
      books = data.data;
    } else if (Array.isArray(data)) {
      // In case the API returns the array directly
      books = data;
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Failed to load books. Invalid response format.');
    }
    
    // Log the structure of the first book for debugging
    if (books.length > 0) {
      console.log('First book in response:', books[0]);
      console.log('First book keys:', Object.keys(books[0]));
    }
    
    return books;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

/**
 * Renders books to the specified container
 * @param {HTMLElement} container - The container to render books into
 * @param {Array} books - Array of book objects
 */
export const renderBooks = (container, books) => {
  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500">No books found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  
  console.log('Rendering books. First book structure:', books[0]);
  console.log('All book IDs:', books.map(b => b.book_id || b.id || 'No ID found'));
  
  books.forEach((book, index) => {
    console.log(`\n--- Book ${index + 1} ---`);
    console.log('Book object:', book);
    console.log('Available keys:', Object.keys(book));
    console.log('Book ID (book_id):', book.book_id);
    console.log('Book ID (id):', book.id);
    
    // Debug: Check if book_id exists
    if (!book.book_id && !book.id) {
      console.error('Book is missing both book_id and id:', book);
    }
    
    const bookCard = document.createElement('div');
    bookCard.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer';
    bookCard.addEventListener('click', (e) => {
      // Prevent default in case this is inside a link
      e.preventDefault();
      e.stopPropagation();
      
      console.log('\n--- Book Card Clicked ---');
      console.log('Book object:', book);
      console.log('All properties:', Object.entries(book));
      
      // Try all possible ID fields
      const bookId = book.book_id || book.id || book.bookId;
      console.log('Found IDs - book_id:', book.book_id, 'id:', book.id, 'bookId:', book.bookId);
      console.log('Using book ID:', bookId);
      
      // Ensure we have a valid book_id before navigating
      if (bookId === undefined || bookId === null || bookId === 'undefined' || bookId === 'null') {
        const errorMsg = 'No valid book ID found in book object. Available keys: ' + Object.keys(book).join(', ');
        console.error(errorMsg);
        alert('Error: Could not load book details. ' + errorMsg);
        return;
      }
      
      // Ensure the ID is a number (not undefined or null)
      const numericId = Number(bookId);
      if (isNaN(numericId) || numericId <= 0) {
        const errorMsg = `Invalid book ID (not a positive number): ${bookId} (type: ${typeof bookId})`;
        console.error(errorMsg);
        alert('Error: ' + errorMsg);
        return;
      }
      
      console.log('Navigating to book detail with ID:', numericId, '(type:', typeof numericId + ')');
      const url = new URL(`book-detail.html`, window.location.origin);
      url.searchParams.set('id', numericId);
      console.log('Full URL:', url.toString());
      window.location.href = url.toString();
    });
    
    const coverImage = book.cover_image_url 
      ? `<img src="http://localhost:8000${book.cover_image_url}" alt="${book.title}" class="w-full h-64 object-cover">`
      : `<div class="w-full h-64 bg-gray-200 flex items-center justify-center">
           <span class="text-gray-400">No cover image</span>
         </div>`;
    
    const availableCopies = book.book_copies ? 
      book.book_copies.filter(copy => copy.is_available).length : 0;
    
    bookCard.innerHTML = `
      ${coverImage}
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">${book.title}</h3>
        <p class="text-sm text-gray-600 mb-2">${book.author_id || 'Unknown Author'}</p>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">${book.publication_year || 'N/A'}</span>
          <span class="text-sm font-medium ${availableCopies > 0 ? 'text-green-600' : 'text-red-600'}">
            ${availableCopies} ${availableCopies === 1 ? 'copy' : 'copies'} available
          </span>
        </div>
      </div>
    `;
    
    container.appendChild(bookCard);
  });
};

/**
 * Initializes the books display
 */
export const initBooks = async () => {
  const container = document.getElementById('booksContainer');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <p class="text-gray-500">Loading books...</p>
    </div>
  `;

  try {
    const books = await fetchBooks();
    
    // If books is empty and we're not redirected, it means we're not authenticated
    // but the redirection is already handled in fetchBooks
    if (books && books.length > 0) {
      renderBooks(container, books);
    }
  } catch (error) {
    // Only show error if it's not an authentication error (auth errors are handled by redirect)
    if (!error.message.includes('401') && !error.message.includes('auth')) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-600">${error.message || 'Error loading books. Please try again later.'}</p>
        </div>
      `;
    }
  }
};
