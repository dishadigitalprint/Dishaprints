// Main JavaScript for Disha Digital Prints Landing Page

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const header = document.getElementById('header');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            // Toggle mobile menu (implement mobile menu in future)
            console.log('Mobile menu clicked');
        });
    }
    
    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Header shadow on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            header.classList.add('shadow-lg');
        } else {
            header.classList.remove('shadow-lg');
        }
    });
});

// WhatsApp Integration
function openWhatsApp(message = 'Hello, I want to know more about printing services') {
    const phoneNumber = '919700653332';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}

// Price Calculator (placeholder)
function calculatePrice(product, quantity) {
    // This will be implemented with actual pricing logic
    console.log(`Calculating price for ${product}, quantity: ${quantity}`);
}

// Form Validation Helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
}

// Toast Notification (simple)
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    } text-white font-semibold`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('translate-x-0'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Export functions for use in other files
window.DishaDigitalPrints = {
    openWhatsApp,
    calculatePrice,
    validateEmail,
    validatePhone,
    showToast
};
