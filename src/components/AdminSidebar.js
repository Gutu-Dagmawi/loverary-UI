// Admin Sidebar Component
export function renderAdminSidebar(activePage = 'dashboard') {
  // Define navigation items with their properties
  const navItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt', href: 'admin-dashboard.html' },
    { id: 'books', title: 'Books', icon: 'book', href: 'admin-books.html' },
    { id: 'users', title: 'Users', icon: 'users', href: 'admin-users.html' },
    { id: 'loans', title: 'Loans', icon: 'exchange-alt', href: 'admin-loans.html' },
    { id: 'settings', title: 'Settings', icon: 'cog', href: '#' },
  ];

  // Generate the sidebar HTML
  return `
    <div class="sidebar bg-white shadow-md transform transition-transform duration-300 ease-in-out md:translate-x-0 -translate-x-full">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Loverary Admin</h1>
          <p class="text-sm text-gray-500">Administration Panel</p>
        </div>
        <button class="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none" id="close-sidebar">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-120px)]">
        ${navItems.map(item => `
          <a href="${item.href}" 
             class="flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
               activePage === item.id 
                 ? 'bg-blue-50 text-blue-700' 
                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
             }"
             data-page="${item.id}">
            <i class="fas fa-${item.icon} w-5 text-center mr-3"></i>
            <span>${item.title}</span>
          </a>
        `).join('')}
        
        <div class="border-t border-gray-200 mt-4 pt-4">
          <a href="#" id="logoutButton" class="flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-200">
            <i class="fas fa-sign-out-alt w-5 text-center mr-3"></i>
            <span>Logout</span>
          </a>
        </div>
      </nav>
    </div>
  `;
}

// Function to initialize the sidebar
export function initAdminSidebar(activePage = 'dashboard') {
  // Create a container for the sidebar if it doesn't exist
  let sidebarContainer = document.getElementById('admin-sidebar-container');
  
  if (!sidebarContainer) {
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'admin-sidebar-container';
    document.body.insertBefore(sidebarContainer, document.body.firstChild);
  }
  
  // Render the sidebar
  sidebarContainer.innerHTML = renderAdminSidebar(activePage);
  
  const sidebar = sidebarContainer.querySelector('.sidebar');
  const closeButton = sidebarContainer.querySelector('#close-sidebar');
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  
  // Toggle sidebar on mobile menu button click
  if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener('click', () => {
      sidebar.classList.toggle('translate-x-0');
      sidebar.classList.toggle('-translate-x-full');
    });
  }
  
  // Close sidebar when clicking the close button
  if (closeButton && sidebar) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    });
  }
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth >= 768) return;
    
    const isClickInsideSidebar = sidebar?.contains(e.target);
    const isClickOnMenuButton = mobileMenuButton?.contains(e.target);
    
    if (!isClickInsideSidebar && !isClickOnMenuButton && sidebar) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    }
  });
  
  // Close sidebar when clicking a nav link on mobile
  const navLinks = sidebarContainer.querySelectorAll('a[href^="/"], a[href^="."]');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
      }
    });
  });
  
  // Add event listener for logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { logout } = await import('../api/auth.js');
        await logout();
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });
  }
  
  return sidebarContainer;
}

// Auto-initialize if loaded directly in a script tag
if (typeof window !== 'undefined' && document.currentScript?.getAttribute('data-auto-init') !== 'false') {
  const activePage = document.currentScript?.getAttribute('data-active-page') || 'dashboard';
  initAdminSidebar(activePage);
}
