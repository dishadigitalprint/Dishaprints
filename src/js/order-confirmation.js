/**
 * Order Confirmation Page
 * Shows order success message and details
 */

let order = null;

document.addEventListener('DOMContentLoaded', function() {
    createConfetti();
    loadOrderDetails();
    renderOrderSummary();
    updatePaymentStatus();
});

function loadOrderDetails() {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
        console.error('No order ID provided');
        window.location.href = 'order.html';
        return;
    }

    // Load order from localStorage
    try {
        const ordersData = localStorage.getItem('orders');
        const orders = ordersData ? JSON.parse(ordersData) : [];
        order = orders.find(o => o.orderId === orderId);
        
        if (!order) {
            console.error('Order not found:', orderId);
            window.location.href = 'order.html';
            return;
        }

        console.log('Order loaded:', order);
        
        // Display order ID
        document.getElementById('orderId').textContent = order.orderId;
        document.getElementById('trackOrderLink').href = `track-order.html?id=${order.orderId}`;
        
        // Display customer email if available
        if (order.deliveryInfo?.contact?.email) {
            document.getElementById('customerEmail').textContent = order.deliveryInfo.contact.email;
        }
        
    } catch (error) {
        console.error('Error loading order:', error);
        window.location.href = 'order.html';
    }
}

function renderOrderSummary() {
    if (!order) return;

    const container = document.getElementById('orderSummary');
    
    let html = '<div class="space-y-4">';
    
    // Items
    html += '<div class="border-b border-neutral-200 pb-4">';
    html += '<p class="font-semibold text-neutral-900 mb-3">Items Ordered</p>';
    order.items.forEach(item => {
        const itemTotal = item.total || item.subtotal || item.price || 0;
        html += `
            <div class="flex items-start gap-3 mb-3">
                <div class="w-10 h-10 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getProductIcon(item.product)} text-primary-600"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-neutral-900">${item.productName}</p>
                    <p class="text-xs text-neutral-600">${getItemDetails(item)}</p>
                    <p class="text-xs text-neutral-600">Quantity: ${item.quantity}</p>
                </div>
                <p class="text-sm font-semibold text-neutral-900">₹${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });
    html += '</div>';
    
    // Pricing
    html += '<div class="space-y-2">';
    html += `
        <div class="flex justify-between text-sm">
            <span class="text-neutral-600">Subtotal</span>
            <span class="font-medium text-neutral-900">₹${(order.pricing?.subtotal || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm">
            <span class="text-neutral-600">GST (18%)</span>
            <span class="font-medium text-neutral-900">₹${(order.pricing?.gst || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm">
            <span class="text-neutral-600">Delivery Charges</span>
            <span class="font-medium text-neutral-900">${(order.pricing?.deliveryCharge || 0) > 0 ? '₹' + order.pricing.deliveryCharge.toFixed(2) : 'Free'}</span>
        </div>
    `;
    
    if ((order.pricing?.codCharge || 0) > 0) {
        html += `
            <div class="flex justify-between text-sm">
                <span class="text-neutral-600">COD Charges</span>
                <span class="font-medium text-neutral-900">₹${order.pricing.codCharge.toFixed(2)}</span>
            </div>
        `;
    }
    
    html += `
        <div class="flex justify-between text-base font-bold pt-3 border-t border-neutral-200">
            <span class="text-neutral-900">Total Amount</span>
            <span class="text-primary-600">₹${order.pricing.total.toFixed(2)}</span>
        </div>
    `;
    html += '</div>';
    
    // Delivery Info
    if (order.deliveryInfo?.contact) {
        html += '<div class="border-t border-neutral-200 pt-4 mt-4">';
        html += '<p class="font-semibold text-neutral-900 mb-2">Delivery Address</p>';
        html += `
            <p class="text-sm text-neutral-900">${order.deliveryInfo.contact.fullName}</p>
            <p class="text-sm text-neutral-600">${order.deliveryInfo.contact.phone}</p>
            <p class="text-sm text-neutral-600">${order.deliveryInfo.delivery.address || ''}</p>
            <p class="text-sm text-neutral-600">${order.deliveryInfo.delivery.city || ''}, ${order.deliveryInfo.delivery.state || ''} - ${order.deliveryInfo.delivery.pincode || ''}</p>
        `;
        html += '</div>';
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

function updatePaymentStatus() {
    if (!order) return;

    const alertContainer = document.getElementById('paymentStatusAlert');
    const stepsContainer = document.getElementById('nextSteps');
    
    let alertHtml = '';
    let stepsHtml = '';

    switch (order.paymentMethod) {
        case 'upi':
            if (order.paymentStatus === 'pending_verification') {
                alertHtml = `
                    <div class="bg-accentB-100 border-2 border-accentB-300 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-clock text-accentB-700 text-2xl"></i>
                            <div class="text-left">
                                <p class="font-semibold text-accentB-900">Payment Under Verification</p>
                                <p class="text-sm text-accentB-800">We're verifying your UPI payment. This usually takes 10-15 minutes.</p>
                            </div>
                        </div>
                    </div>
                `;
                
                stepsHtml = `
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-accentB-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                        <div>
                            <p class="font-medium text-neutral-900">Payment Verification</p>
                            <p class="text-sm text-neutral-600">Our team will verify your payment screenshot within 10-15 minutes</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">2</div>
                        <div>
                            <p class="font-medium text-neutral-900">Order Processing</p>
                            <p class="text-sm text-neutral-600">Once verified, we'll start printing your order</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">3</div>
                        <div>
                            <p class="font-medium text-neutral-900">Quality Check & Delivery</p>
                            <p class="text-sm text-neutral-600">We'll notify you when your order is ready</p>
                        </div>
                    </div>
                `;
            }
            break;
            
        case 'cod':
            alertHtml = `
                <div class="bg-info-100 border-2 border-info-300 rounded-lg p-4">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-money-bill-wave text-info-700 text-2xl"></i>
                        <div class="text-left">
                            <p class="font-semibold text-info-900">Cash on Delivery Selected</p>
                            <p class="text-sm text-info-800">Please keep ₹${order.pricing.total.toFixed(2)} ready when we deliver your order.</p>
                        </div>
                    </div>
                </div>
            `;
            
            stepsHtml = `
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                    <div>
                        <p class="font-medium text-neutral-900">Order Processing</p>
                        <p class="text-sm text-neutral-600">We're preparing your order for printing</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">2</div>
                    <div>
                        <p class="font-medium text-neutral-900">Quality Check</p>
                        <p class="text-sm text-neutral-600">Every print is checked for quality</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">3</div>
                    <div>
                        <p class="font-medium text-neutral-900">Delivery & Payment</p>
                        <p class="text-sm text-neutral-600">Pay ₹${order.pricing.total.toFixed(2)} in cash to our delivery person</p>
                    </div>
                </div>
            `;
            break;
            
        case 'store':
            alertHtml = `
                <div class="bg-accentA-100 border-2 border-accentA-300 rounded-lg p-4">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-store text-accentA-700 text-2xl"></i>
                        <div class="text-left">
                            <p class="font-semibold text-accentA-900">Pay at Store Selected</p>
                            <p class="text-sm text-accentA-800">Visit our store to collect and pay for your order.</p>
                        </div>
                    </div>
                </div>
            `;
            
            stepsHtml = `
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">1</div>
                    <div>
                        <p class="font-medium text-neutral-900">Order Processing</p>
                        <p class="text-sm text-neutral-600">We're preparing your order for printing</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">2</div>
                    <div>
                        <p class="font-medium text-neutral-900">Ready for Pickup</p>
                        <p class="text-sm text-neutral-600">We'll notify you when your order is ready</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 text-neutral-600 text-xs font-bold">3</div>
                    <div>
                        <p class="font-medium text-neutral-900">Pickup & Payment</p>
                        <p class="text-sm text-neutral-600">Visit our store and pay ₹${order.pricing.total.toFixed(2)} at the counter</p>
                    </div>
                </div>
            `;
            break;
    }
    
    alertContainer.innerHTML = alertHtml;
    stepsContainer.innerHTML = stepsHtml;
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
    
    if (item.configuration) {
        const config = item.configuration;
        
        // Documents
        if (config.paperSize) details.push(config.paperSize);
        if (config.printType) details.push(config.printType);
        if (config.sides) details.push(config.sides);
        if (config.binding && config.binding !== 'none') details.push(config.binding);
        
        // Business Cards
        if (config.material) details.push(config.material);
        if (config.finish) details.push(config.finish);
        if (config.corners) details.push(config.corners + ' corners');
        
        // Brochures
        if (config.size) details.push(config.size);
        if (config.pages) details.push(config.pages + ' pages');
        if (config.fold) details.push(config.fold);
    }
    
    return details.join(' • ');
}

function copyOrderId() {
    const orderId = document.getElementById('orderId').textContent;
    navigator.clipboard.writeText(orderId).then(() => {
        showToast('Order ID copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy Order ID', 'error');
    });
}

function createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#1E6CE0', '#22C55E', '#FB923C', '#3B82F6', '#EF4444'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => confetti.remove(), 5000);
    }
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

console.log('Order confirmation page loaded');
