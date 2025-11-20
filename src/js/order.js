// Product Selection Page - No file upload logic needed here
// Handles mobile menu toggle and cart badge

// Update cart badge
function updateCartBadge() {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const count = cart.length;
    
    const badge = document.getElementById('cart-badge');
    const mobileCount = document.getElementById('mobile-cart-count');
    
    if (count > 0) {
        badge.classList.remove('hidden');
        badge.textContent = count;
        if (mobileCount) mobileCount.textContent = count;
    } else {
        badge.classList.add('hidden');
        if (mobileCount) mobileCount.textContent = '0';
    }
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Initialize
updateCartBadge();
console.log('Product selection page initialized');
