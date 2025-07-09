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
  
  books.forEach(book => {
    const availableCopies = book.book_copies ? 
      book.book_copies.filter(copy => copy.is_available).length : 0;
    const canBorrow = availableCopies > 0;
    
    const bookCard = document.createElement('div');
    bookCard.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative group';
    
    // Click handler for the book card - navigates to checkout page
    const handleCardClick = (e) => {
      // Prevent default and stop propagation immediately
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const bookId = book.book_id || book.id || book.bookId;
      if (bookId) {
        // Find the first available book copy
        const availableCopy = book.book_copies?.find(copy => copy.is_available);
        const bookBarcode = availableCopy?.barcode || '';
        
        console.log('Navigating to checkout for book ID:', bookId, 'Barcode:', bookBarcode);
        const url = new URL('checkout.html', window.location.origin);
        url.searchParams.set('book_id', bookId);
        if (bookBarcode) url.searchParams.set('barcode', bookBarcode);
        if (book.title) url.searchParams.set('title', book.title);
        if (book.author_id) url.searchParams.set('author', book.author_id);
        if (book.cover_image_url) url.searchParams.set('cover_image', book.cover_image_url);
        
        const bookData = {
          id: bookId,
          barcode: bookBarcode,
          title: book.title,
          author: book.author_id,
          coverImage: book.cover_image_url,
          canBorrow: canBorrow
        };
        sessionStorage.setItem('currentBook', JSON.stringify(bookData));
        
        // Use a small timeout to ensure all event propagation is stopped
        setTimeout(() => {
          window.location.href = url.toString();
        }, 50);
      }
    };
    
    // Add the click handler with capture phase to ensure it runs first
    bookCard.addEventListener('click', handleCardClick, true);
    
    const coverImage = book.cover_image_url 
      ? `<div class="relative w-full h-64 overflow-hidden">
          <img src="http://localhost:8000${book.cover_image_url}" alt="${book.title}" class="w-full h-full object-cover transition-all duration-300 group-hover:scale-105">
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <button class="borrow-button ${canBorrow ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'} text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${canBorrow ? 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' : 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'}" />
              </svg>
              ${canBorrow ? 'Borrow Now' : 'Reserve'}
            </button>
          </div>
        </div>`
      : `<div class="relative w-full h-64 bg-gray-100 flex items-center justify-center group">
          <div class="absolute inset-0 flex flex-col items-center justify-center p-4 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="text-gray-500 text-sm group-hover:opacity-50 transition-opacity">No cover image</p>
          </div>
        </div>`;
    
    // Status indicator for available copies
    const statusHTML = `
      <div class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${canBorrow ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">
        ${availableCopies} ${availableCopies === 1 ? 'copy' : 'copies'} ${canBorrow ? 'available' : 'left'}
      </div>
    `;
    
    // Add the status indicator to the book card
    bookCard.innerHTML = `
      <div class="relative">
        ${coverImage}
        ${statusHTML}
      </div>
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
