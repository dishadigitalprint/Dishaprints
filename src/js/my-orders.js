/**
 * My Orders Page - Static functionality
 * Will be replaced with dynamic data from database later
 */

// Filter functionality
document.getElementById('searchInput')?.addEventListener('input', filterOrders);
document.getElementById('statusFilter')?.addEventListener('change', filterOrders);
document.getElementById('dateFilter')?.addEventListener('change', filterOrders);
document.getElementById('productFilter')?.addEventListener('change', filterOrders);

function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const productFilter = document.getElementById('productFilter').value;
    
    const orders = document.querySelectorAll('#ordersList > div');
    let visibleCount = 0;
    
    orders.forEach(order => {
        const orderText = order.textContent.toLowerCase();
        const matchesSearch = orderText.includes(searchTerm);
        
        // Get status from badge
        const statusBadge = order.querySelector('[class*="bg-accent"], [class*="bg-info"], [class*="bg-neutral"]');
        let orderStatus = 'all';
        if (statusBadge) {
            const statusText = statusBadge.textContent.toLowerCase();
            if (statusText.includes('delivered')) orderStatus = 'delivered';
            else if (statusText.includes('processing')) orderStatus = 'processing';
            else if (statusText.includes('ready')) orderStatus = 'ready';
            else if (statusText.includes('pending')) orderStatus = 'pending';
            else if (statusText.includes('cancelled')) orderStatus = 'cancelled';
        }
        const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
        
        // Get product type from icon/title
        let orderProduct = 'all';
        if (orderText.includes('document')) orderProduct = 'documents';
        else if (orderText.includes('business card')) orderProduct = 'business-cards';
        else if (orderText.includes('brochure')) orderProduct = 'brochures';
        const matchesProduct = productFilter === 'all' || orderProduct === productFilter;
        
        if (matchesSearch && matchesStatus && matchesProduct) {
            order.classList.remove('hidden');
            visibleCount++;
        } else {
            order.classList.add('hidden');
        }
    });
    
    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    const ordersList = document.getElementById('ordersList');
    if (visibleCount === 0) {
        ordersList.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        ordersList.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
}

// Mock invoice download
document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Invoice')) {
        btn.addEventListener('click', function() {
            const orderCard = this.closest('.bg-white');
            const orderNumber = orderCard.querySelector('h3').textContent;
            showToast(`Downloading invoice for ${orderNumber}`, 'success');
        });
    }
    
    if (btn.textContent.includes('Reorder')) {
        btn.addEventListener('click', function() {
            const orderCard = this.closest('.bg-white');
            const orderNumber = orderCard.querySelector('h3').textContent;
            if (confirm(`Reorder items from ${orderNumber}?`)) {
                showToast('Items added to cart!', 'success');
                setTimeout(() => window.location.href = 'order.html', 1500);
            }
        });
    }
    
    if (btn.textContent.includes('Pay Now')) {
        btn.addEventListener('click', function() {
            showToast('Redirecting to payment gateway...', 'info');
            setTimeout(() => window.location.href = 'checkout-payment.html', 1500);
        });
    }
    
    if (btn.textContent.includes('Cancel')) {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this order?')) {
                showToast('Order cancelled successfully', 'success');
                this.closest('.bg-white').style.opacity = '0.5';
            }
        });
    }
    
    if (btn.textContent.includes('Contact')) {
        btn.addEventListener('click', function() {
            window.open('https://wa.me/919876543210', '_blank');
        });
    }
    
    if (btn.textContent.includes('Directions')) {
        btn.addEventListener('click', function() {
            showToast('Opening Google Maps...', 'info');
            setTimeout(() => {
                window.open('https://maps.google.com', '_blank');
            }, 500);
        });
    }
});

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

console.log('My Orders page loaded');
