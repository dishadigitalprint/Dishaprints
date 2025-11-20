/**
 * Track Order Page - Static functionality
 * Will be replaced with dynamic data from database later
 */

// Check for order ID in URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');

if (orderId) {
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('searchSection').classList.add('hidden');
}

// Track button handler
document.getElementById('trackBtn')?.addEventListener('click', function() {
    const inputOrderId = document.getElementById('orderIdInput').value.trim();
    
    if (!inputOrderId) {
        showToast('Please enter an order ID', 'error');
        return;
    }
    
    // Validate order ID format (DP followed by year and number)
    const orderIdPattern = /^DP\d{4}-\d{4}$/;
    if (!orderIdPattern.test(inputOrderId)) {
        showToast('Invalid order ID format. Example: DP2024-0145', 'error');
        return;
    }
    
    // Simulate tracking
    showToast('Loading order details...', 'info');
    
    setTimeout(() => {
        // In real implementation, this would fetch from database
        window.location.href = `track-order.html?id=${inputOrderId}`;
    }, 1000);
});

// Enter key support for search
document.getElementById('orderIdInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('trackBtn').click();
    }
});

// Mock invoice download
document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Download Invoice')) {
        btn.addEventListener('click', function() {
            showToast('Downloading invoice...', 'success');
        });
    }
    
    if (btn.textContent.includes('Contact Support')) {
        btn.addEventListener('click', function() {
            window.open('https://wa.me/919876543210', '_blank');
        });
    }
    
    if (btn.textContent.includes('Reorder Items')) {
        btn.addEventListener('click', function() {
            if (confirm('Add these items to your cart?')) {
                showToast('Items added to cart!', 'success');
                setTimeout(() => window.location.href = 'order.html', 1500);
            }
        });
    }
    
    if (btn.textContent.includes('Get Directions')) {
        btn.addEventListener('click', function() {
            showToast('Opening Google Maps...', 'info');
            setTimeout(() => {
                window.open('https://maps.google.com/?q=Hitech+City+Hyderabad', '_blank');
            }, 500);
        });
    }
    
    if (btn.textContent.includes('Call Store')) {
        btn.addEventListener('click', function() {
            window.location.href = 'tel:+919876543210';
        });
    }
});

// Simulate progress updates (in real app, this would be websocket or polling)
function simulateProgressUpdate() {
    const progressBar = document.querySelector('.bg-primary-600.h-full');
    const progressText = document.querySelector('.text-xs.text-neutral-500');
    
    if (!progressBar) return;
    
    let currentProgress = 65;
    
    const interval = setInterval(() => {
        if (currentProgress >= 100) {
            clearInterval(interval);
            showToast('Your order is ready for pickup!', 'success');
            return;
        }
        
        currentProgress += Math.random() * 5;
        if (currentProgress > 100) currentProgress = 100;
        
        progressBar.style.width = `${currentProgress}%`;
        if (progressText) {
            progressText.textContent = `Approximately ${Math.floor(currentProgress)}% complete`;
        }
    }, 10000); // Update every 10 seconds
}

// Start simulation if on detail page
if (orderId) {
    setTimeout(simulateProgressUpdate, 2000);
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

console.log('Track Order page loaded', orderId ? `with order ID: ${orderId}` : 'without order ID');
