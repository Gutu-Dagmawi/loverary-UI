import {isAuthenticated} from '../api/auth.js';

let dropdownOpen = false;
const toggleDropdown = () => {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdownOpen = !dropdownOpen;
        if (dropdownOpen) {
            dropdown.classList.remove('hidden');
            // Close dropdown when clicking outside
            const handleClickOutside = (event) => {
                if (!event.target.closest('.user-menu-button') && !event.target.closest('.user-dropdown')) {
                    dropdown.classList.add('hidden');
                    dropdownOpen = false;
                    document.removeEventListener('click', handleClickOutside);
                }
            };
            // Add a small delay to avoid immediate close
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 10);
        } else {
            dropdown.classList.add('hidden');
        }
    }
};

export const setupNavigation = () => {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const userMenuButton = document.querySelector('.user-menu-button');

    // Toggle dropdown on user menu button click
    if (userMenuButton) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    // Update navigation state
    if (isAuthenticated()) {
        // User is logged in
        if (authSection) authSection.classList.add('hidden');
        if (userSection) userSection.classList.remove('hidden');
    } else {
        // User is not logged in
        if (authSection) authSection.classList.remove('hidden');
        if (userSection) userSection.classList.add('hidden');
    }
};

export const updateNavigation = setupNavigation; // For backward compatibility

/**
 * Returns the navigation bar HTML as a string.
 * @param {Object} options
 * @param {string} [options.active] - The active page (e.g., 'home', 'browse', 'genres', 'about')
 * @param {boolean} [options.isAuthenticated] - Whether the user is logged in
 */
export function renderNav({active = 'home', isAuthenticated = false} = {}) {
    return `
    <nav class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <a href="index.html" class="text-2xl font-bold text-orange-500">Loverary</a>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="index.html" class="${active === 'home' ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Home</a>
              <a href="browse.html" class="${active === 'browse' ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Browse</a>
              <a href="#" class="${active === 'genres' ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Genres</a>
              <a href="#" class="${active === 'about' ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">About</a>
              ${isAuthenticated ? `<a href="loans.html" class="${active === 'loans' ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">My Loans</a>` : ''}
            </div>
          </div>
          <div id="authSection" class="${isAuthenticated ? 'hidden' : 'hidden sm:ml-6 sm:flex sm:items-center'}">
            <a href="login.html" class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Sign in</a>
            <a href="signup.html" class="ml-4 bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">Sign up</a>
          </div>
          <div id="userSection" class="${isAuthenticated ? 'hidden sm:ml-6 sm:flex sm:items-center' : 'hidden'}">
            <div class="relative">
              <button type="button" class="user-menu-button flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-200">
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>
              <div class="user-dropdown hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                <button id="logoutButton" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Attaches the logout event listener to the #logoutButton.
 * Call this after injecting the nav.
 */
export function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        // Remove any previous event listeners by cloning
        const newButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newButton, logoutButton);
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const button = e.target.closest('button');
            const originalText = button.innerHTML;
            try {
                button.disabled = true;
                button.innerHTML = 'Signing out...';
                const {logout} = await import('../api/auth.js');
                const {showToast} = await import('../utils/toast.js');
                await logout();
                showToast('Successfully signed out', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                const {showToast} = await import('../utils/toast.js');
                showToast('Failed to sign out. Please try again.', 'error');
                button.disabled = false;
                button.innerHTML = originalText;
            }
        });
    }
}
