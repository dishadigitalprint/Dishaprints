/**
 * Admin Activity Dashboard
 * Monitor user activities, cart abandonments, and orders
 */

let activities = [];
let filteredActivities = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }
    
    loadActivities();
    renderActivities();
    updateStats();
    attachEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadActivities();
        renderActivities();
        updateStats();
    }, 30000);
});

function loadActivities() {
    try {
        activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
        filteredActivities = [...activities];
        console.log('Loaded activities:', activities.length);
    } catch (error) {
        console.error('Error loading activities:', error);
        activities = [];
        filteredActivities = [];
    }
}

function renderActivities() {
    const container = document.getElementById('activityLog');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredActivities.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    container.innerHTML = filteredActivities.map(activity => {
        const time = new Date(activity.timestamp);
        const icon = getActivityIcon(activity.action);
        const color = getActivityColor(activity.action);
        
        return `
            <div class="p-6 hover:bg-neutral-50 transition-colors">
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 ${color} rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas ${icon} text-white"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-1">
                            <div>
                                <p class="font-semibold text-neutral-900">${activity.name || 'Guest'}</p>
                                <p class="text-sm text-neutral-600">+91 ${activity.phone}</p>
                            </div>
                            <span class="text-xs text-neutral-500">${formatTime(time)}</span>
                        </div>
                        <p class="text-sm text-neutral-700 mb-2">${activity.action}</p>
                        ${activity.amount ? `<span class="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">₹${activity.amount}</span>` : ''}
                        ${activity.orderId ? `<span class="inline-block px-2 py-1 bg-accentA-100 text-accentA-700 text-xs font-medium rounded ml-2">${activity.orderId}</span>` : ''}
                        <p class="text-xs text-neutral-500 mt-2">
                            <i class="fas fa-globe mr-1"></i>${activity.page || 'Unknown page'}
                        </p>
                    </div>
                    ${activity.action.includes('abandoned') ? `
                        <button onclick="sendFollowUp('${activity.phone}')" class="px-3 py-1 bg-accentB-600 text-white text-xs rounded hover:bg-accentB-700">
                            <i class="fab fa-whatsapp mr-1"></i>Follow Up
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getActivityIcon(action) {
    if (action.includes('logged in')) return 'fa-sign-in-alt';
    if (action.includes('cart')) return 'fa-shopping-cart';
    if (action.includes('Order placed')) return 'fa-check-circle';
    if (action.includes('Payment')) return 'fa-credit-card';
    if (action.includes('abandoned')) return 'fa-exclamation-triangle';
    if (action.includes('Viewing')) return 'fa-eye';
    return 'fa-info-circle';
}

function getActivityColor(action) {
    if (action.includes('logged in')) return 'bg-accentA-600';
    if (action.includes('abandoned')) return 'bg-accentB-600';
    if (action.includes('Order placed')) return 'bg-primary-600';
    if (action.includes('Payment completed')) return 'bg-accentA-600';
    if (action.includes('Payment failed')) return 'bg-danger-600';
    return 'bg-info-500';
}

function formatTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function updateStats() {
    // Unique users
    const uniquePhones = [...new Set(activities.map(a => a.phone))];
    document.getElementById('totalUsers').textContent = uniquePhones.length;
    
    // Active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = activities.filter(a => new Date(a.timestamp) >= today);
    const uniqueToday = [...new Set(activeToday.map(a => a.phone))];
    document.getElementById('activeToday').textContent = uniqueToday.length;
    
    // Cart abandonments
    const abandoned = activities.filter(a => a.action.includes('abandoned'));
    document.getElementById('abandonedCarts').textContent = abandoned.length;
    
    // Orders placed
    const orders = activities.filter(a => a.action.includes('Order placed'));
    document.getElementById('ordersPlaced').textContent = orders.length;
}

function attachEventListeners() {
    // Search
    document.getElementById('searchPhone').addEventListener('input', applyFilters);
    
    // Filters
    document.getElementById('filterAction').addEventListener('change', applyFilters);
    document.getElementById('filterTime').addEventListener('change', applyFilters);
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchPhone').value = '';
        document.getElementById('filterAction').value = 'all';
        document.getElementById('filterTime').value = 'all';
        applyFilters();
    });
    
    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadActivities();
        renderActivities();
        updateStats();
        showToast('Activities refreshed', 'success');
    });
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchPhone').value.toLowerCase();
    const actionFilter = document.getElementById('filterAction').value;
    const timeFilter = document.getElementById('filterTime').value;
    
    filteredActivities = activities.filter(activity => {
        // Search filter
        const matchesSearch = !searchTerm || 
            activity.phone.includes(searchTerm) || 
            (activity.name && activity.name.toLowerCase().includes(searchTerm));
        
        // Action filter
        const matchesAction = actionFilter === 'all' || 
            activity.action.toLowerCase().includes(actionFilter.toLowerCase());
        
        // Time filter
        let matchesTime = true;
        if (timeFilter !== 'all') {
            const activityDate = new Date(activity.timestamp);
            const now = new Date();
            
            if (timeFilter === 'today') {
                matchesTime = activityDate.toDateString() === now.toDateString();
            } else if (timeFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesTime = activityDate >= weekAgo;
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesTime = activityDate >= monthAgo;
            }
        }
        
        return matchesSearch && matchesAction && matchesTime;
    });
    
    renderActivities();
}

async function sendFollowUp(phone) {
    const message = `Hi! I noticed you left some items in your cart at Disha Digital Prints. 🛒\n\nWould you like to complete your order? We're here to help!\n\nReply to this message or call us at +91 9700653332`;
    
    const formattedPhone = whatsappService.formatPhoneNumber(phone);
    const result = await whatsappService.sendTextMessage(formattedPhone, message);
    
    if (result.success) {
        showToast('Follow-up message sent via WhatsApp!', 'success');
    } else {
        showToast('Failed to send message. Please try WhatsApp manually.', 'error');
        // Open WhatsApp with pre-filled message
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
}

function exportToCSV() {
    const csv = [
        ['Timestamp', 'Name', 'Phone', 'Action', 'Amount', 'Order ID', 'Page'],
        ...filteredActivities.map(a => [
            new Date(a.timestamp).toLocaleString('en-IN'),
            a.name || '',
            a.phone,
            a.action,
            a.amount || '',
            a.orderId || '',
            a.page || ''
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Activity log exported!', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium`;
    
    const colors = {
        'info': 'bg-info-500',
        'success': 'bg-accentA-600',
        'error': 'bg-danger-600'
    };
    
    toast.classList.add(colors[type]);
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

console.log('Admin dashboard loaded');
