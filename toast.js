function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastWrap') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'ph-check-circle';
    if (type === 'error') iconClass = 'ph-warning-circle';
    if (type === 'info') iconClass = 'ph-info';
    
    toast.innerHTML = `
        <i class="ph ${iconClass}"></i>
        <span class="toast-msg">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastWrap';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}
