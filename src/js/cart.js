/**
 * Shopping Cart Page
 * View, edit, and manage cart items
 */

let cart = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    renderCart();
    updateSummary();
    attachEventListeners();
});

function loadCart() {
    try {
        const cartData = sessionStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        console.log('Cart loaded:', cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyState = document.getElementById('emptyCart');
    const cartCount = document.getElementById('cartCount');

    if (!cart || cart.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        cartCount.textContent = '0';
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    cartCount.textContent = cart.length;

    container.innerHTML = cart.map((item, index) => `
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div class="flex flex-col sm:flex-row gap-4">
                <!-- Product Icon -->
                <div class="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getProductIcon(item.product)} text-primary-600 text-2xl"></i>
                </div>

                <!-- Product Details -->
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h3 class="text-lg font-bold text-neutral-900">${item.productName}</h3>
                            <p class="text-sm text-neutral-600">${getItemDetails(item)}</p>
                        </div>
                        <button onclick="removeItem(${index})" class="text-danger-600 hover:text-danger-700 p-2">
                            <i class="fas fa-trash text-lg"></i>
                        </button>
                    </div>

                    <!-- Configuration Details -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        ${getConfigDetails(item)}
                    </div>

                    <!-- Quantity and Price -->
                    <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
                        <div class="flex items-center gap-3">
                            <span class="text-sm text-neutral-600">Quantity:</span>
                            <div class="flex items-center gap-2">
                                <button onclick="decreaseQuantity(${index})" class="w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-md flex items-center justify-center">
                                    <i class="fas fa-minus text-xs text-neutral-600"></i>
                                </button>
                                <span class="w-12 text-center font-semibold text-neutral-900">${item.quantity || item.copies || 1}</span>
                                <button onclick="increaseQuantity(${index})" class="w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-md flex items-center justify-center">
                                    <i class="fas fa-plus text-xs text-neutral-600"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-primary-600">₹${item.total.toFixed(2)}</p>
                            <p class="text-xs text-neutral-500">Inc. GST</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getProductIcon(product) {
    const icons = {
        'documents': 'fa-file-alt',
        'business-cards': 'fa-id-card',
        'brochures': 'fa-book-open'
    };
    return icons[product] || 'fa-print';
}

function getItemDetails(item) {
    let details = [];
    
    if (item.pages) details.push(`${item.pages} pages`);
    if (item.configuration) {
        const config = item.configuration;
        if (config.printType) details.push(config.printType);
        if (config.sides) details.push(config.sides);
        if (config.binding && config.binding !== 'none') details.push(config.binding);
        if (config.material) details.push(config.material);
        if (config.finish) details.push(config.finish);
    }
    
    return details.slice(0, 3).join(' • ');
}

function getConfigDetails(item) {
    const config = item.configuration || {};
    let html = '';
    
    // Documents
    if (item.product === 'documents') {
        if (config.paperSize) html += `<div class="text-xs"><span class="text-neutral-500">Size:</span> <span class="font-medium text-neutral-900">${config.paperSize}</span></div>`;
        if (config.printType) html += `<div class="text-xs"><span class="text-neutral-500">Type:</span> <span class="font-medium text-neutral-900">${config.printType}</span></div>`;
        if (config.sides) html += `<div class="text-xs"><span class="text-neutral-500">Sides:</span> <span class="font-medium text-neutral-900">${config.sides}</span></div>`;
        if (config.binding) html += `<div class="text-xs"><span class="text-neutral-500">Binding:</span> <span class="font-medium text-neutral-900">${config.binding}</span></div>`;
    }
    
    // Business Cards
    if (item.product === 'business-cards') {
        if (config.material) html += `<div class="text-xs"><span class="text-neutral-500">Material:</span> <span class="font-medium text-neutral-900">${config.material}</span></div>`;
        if (config.finish) html += `<div class="text-xs"><span class="text-neutral-500">Finish:</span> <span class="font-medium text-neutral-900">${config.finish}</span></div>`;
        if (config.corners) html += `<div class="text-xs"><span class="text-neutral-500">Corners:</span> <span class="font-medium text-neutral-900">${config.corners}</span></div>`;
        if (config.sides) html += `<div class="text-xs"><span class="text-neutral-500">Sides:</span> <span class="font-medium text-neutral-900">${config.sides}</span></div>`;
    }
    
    // Brochures
    if (item.product === 'brochures') {
        if (config.size) html += `<div class="text-xs"><span class="text-neutral-500">Size:</span> <span class="font-medium text-neutral-900">${config.size}</span></div>`;
        if (config.pages) html += `<div class="text-xs"><span class="text-neutral-500">Pages:</span> <span class="font-medium text-neutral-900">${config.pages}</span></div>`;
        if (config.fold) html += `<div class="text-xs"><span class="text-neutral-500">Fold:</span> <span class="font-medium text-neutral-900">${config.fold}</span></div>`;
        if (config.finish) html += `<div class="text-xs"><span class="text-neutral-500">Finish:</span> <span class="font-medium text-neutral-900">${config.finish}</span></div>`;
    }
    
    return html || '<div class="text-xs text-neutral-500">Custom configuration</div>';
}

function removeItem(index) {
    if (confirm('Remove this item from cart?')) {
        const removedItem = cart[index];
        cart.splice(index, 1);
        saveCart();
        renderCart();
        updateSummary();
        showToast('Item removed from cart', 'success');
        
        // Track cart activity
        if (typeof CartTracker !== 'undefined') {
            CartTracker.trackItemRemoved(removedItem);
        }
    }
}

function decreaseQuantity(index) {
    const item = cart[index];
    const currentQty = item.quantity || item.copies || 1;
    
    if (currentQty > 1) {
        const newQty = currentQty - 1;
        if (item.quantity) item.quantity = newQty;
        if (item.copies) item.copies = newQty;
        
        // Recalculate price based on product
        recalculateItemPrice(item, newQty);
        
        saveCart();
        renderCart();
        updateSummary();
        
        // Track cart activity
        if (typeof CartTracker !== 'undefined') {
            CartTracker.trackItemUpdated(item);
        }
    }
}

function increaseQuantity(index) {
    const item = cart[index];
    const currentQty = item.quantity || item.copies || 1;
    const newQty = currentQty + 1;
    
    if (item.quantity) item.quantity = newQty;
    if (item.copies) item.copies = newQty;
    
    // Recalculate price based on product
    recalculateItemPrice(item, newQty);
    
    saveCart();
    renderCart();
    updateSummary();
    
    // Track cart activity
    if (typeof CartTracker !== 'undefined') {
        CartTracker.trackItemUpdated(item);
    }
}

function recalculateItemPrice(item, newQty) {
    // Get base price per unit from original pricing
    if (item.pricing && item.pricing.subtotal) {
        const oldQty = item.quantity || item.copies || 1;
        const pricePerUnit = item.pricing.subtotal / oldQty;
        
        item.pricing.subtotal = pricePerUnit * newQty;
        item.pricing.gst = item.pricing.subtotal * 0.05;
        item.pricing.grandTotal = item.pricing.subtotal + item.pricing.gst;
        item.total = item.pricing.grandTotal;
    }
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.pricing?.subtotal || item.total || 0), 0);
    const gst = subtotal * 0.05;
    const deliveryCharge = subtotal >= 500 ? 0 : 50;
    const total = subtotal + gst + deliveryCharge;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('delivery').textContent = deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : 'Free';
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function attachEventListeners() {
    document.getElementById('proceedToCheckout')?.addEventListener('click', function() {
        if (cart.length === 0) {
            showToast('Your cart is empty', 'error');
            return;
        }
        
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        
        if (!user.phoneVerified || !user.loggedIn) {
            if (confirm('Please login to proceed with checkout. Would you like to login now?')) {
                window.location.href = 'login.html?return=' + encodeURIComponent('checkout-address.html');
            }
            return;
        }
        
        // User is logged in, proceed to address page
        window.location.href = 'checkout-address.html';
    });
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const mobileBadge = document.getElementById('mobile-cart-count');
    
    if (badge) badge.textContent = cart.length;
    if (mobileBadge) mobileBadge.textContent = cart.length;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300`;
    
    const colors = {
        'info': 'bg-info-600',
        'success': 'bg-accentA-600',
        'error': 'bg-danger-600',
        'warning': 'bg-accentB-600'
    };
    
    toast.classList.add(colors[type] || colors.info);
    
    const icons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${icons[type]} text-xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('Cart page loaded');
