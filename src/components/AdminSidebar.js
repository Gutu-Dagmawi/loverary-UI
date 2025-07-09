// Admin Sidebar Component
export function renderAdminSidebar(activePage = 'dashboard') {
  // Define navigation items with their properties
  const navItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt', href: 'admin-dashboard.html' },
    { id: 'books', title: 'Books', icon: 'book', href: 'admin-books.html' },
    { id: 'users', title: 'Users', icon: 'users', href: '#' },
    { id: 'loans', title: 'Loans', icon: 'exchange-alt', href: '#' },
    { id: 'settings', title: 'Settings', icon: 'cog', href: '#' },
  ];

  // Generate the sidebar HTML
  return `
    <div class="sidebar bg-white shadow-md">
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-800">Loverary Admin</h1>
        <p class="text-sm text-gray-500">Administration Panel</p>
      </div>
      
      <nav class="p-4 space-y-1">
        ${navItems.map(item => `
          <a href="${item.href}" 
             class="nav-link ${activePage === item.id ? 'active' : ''}"
             data-page="${item.id}">
            <i class="fas fa-${item.icon}"></i>
            <span>${item.title}</span>
          </a>
        `).join('')}
        
        <div class="border-t border-gray-200 mt-4 pt-4">
          <a href="#" id="logoutButton" class="nav-link text-red-600 hover:bg-red-50 hover:text-red-700">
            <i class="fas fa-sign-out-alt"></i>
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
