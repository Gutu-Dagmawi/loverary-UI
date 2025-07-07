import { isAuthenticated } from '../api/auth.js';

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
