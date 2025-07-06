/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
export const showToast = (message, type = 'info', duration = 5000) => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  const toastId = `toast-${Date.now()}`;
  toast.id = toastId;
  
  // Set toast classes based on type
  const typeClasses = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700',
  };

  toast.className = `border-l-4 p-4 rounded shadow-lg max-w-xs transition-all duration-300 transform translate-x-full opacity-0 ${typeClasses[type] || typeClasses.info}`;
  
  // Add message
  const messageElement = document.createElement('div');
  messageElement.className = 'text-sm';
  messageElement.textContent = message;
  toast.appendChild(messageElement);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'absolute top-1 right-1 text-gray-500 hover:text-gray-700';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => removeToast(toastId);
  toast.appendChild(closeButton);

  // Add to container
  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  }, 10);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }

  // Function to remove toast with animation
  function removeToast(id) {
    const toastToRemove = document.getElementById(id);
    if (toastToRemove) {
      toastToRemove.classList.remove('translate-x-0', 'opacity-100');
      toastToRemove.classList.add('translate-x-full', 'opacity-0');
      
      // Remove from DOM after animation
      setTimeout(() => {
        toastToRemove.remove();
        // Remove container if no more toasts
        if (toastContainer && toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }
  }
};
