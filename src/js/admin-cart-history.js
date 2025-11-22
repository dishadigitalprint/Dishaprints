/**
 * Admin Cart History Page - Disha Digital Prints
 * View and manage abandoned carts for follow-up
 */

let allCartHistory = [];
let filteredHistory = [];
let currentStatusFilter = 'all';
let currentTempFilter = null;
let autoRefreshInterval = null;
let autoRefreshEnabled = true;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    loadAutoRefreshSetting();
    await loadCartHistory();
    setupEventListeners();
    startAutoRefresh();
});

function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!user.loggedIn || user.role !== 'admin') {
        alert('Admin access required');
        window.location.href = 'login.html';
    }
}

function setupEventListeners() {
    // Auto-refresh toggle
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.checked = autoRefreshEnabled;
        autoRefreshToggle.addEventListener('change', toggleAutoRefresh);
    }
}

function loadAutoRefreshSetting() {
    const saved = localStorage.getItem('adminAutoRefresh');
    autoRefreshEnabled = saved !== null ? saved === 'true' : true;
}

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    if (autoRefreshEnabled) {
        // Auto-refresh every 5 minutes
        autoRefreshInterval = setInterval(() => {
            loadCartHistory(true); // Silent refresh
        }, 300000); // 5 minutes = 300,000ms
        
        updateRefreshStatus(true);
    } else {
        updateRefreshStatus(false);
    }
}

function toggleAutoRefresh(event) {
    autoRefreshEnabled = event.target.checked;
    localStorage.setItem('adminAutoRefresh', autoRefreshEnabled);
    
    if (autoRefreshEnabled) {
        startAutoRefresh();
        showToast('Auto-refresh enabled (every 5 minutes)', 'success');
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        updateRefreshStatus(false);
        showToast('Auto-refresh disabled', 'info');
    }
}

function updateRefreshStatus(enabled) {
    const statusElement = document.getElementById('refreshStatus');
    if (statusElement) {
        if (enabled) {
            statusElement.innerHTML = '<i class="fas fa-sync-alt fa-spin text-accentA-600 mr-2"></i>Auto-refresh: ON (5 min)';
            statusElement.className = 'text-xs text-accentA-600';
        } else {
            statusElement.innerHTML = '<i class="fas fa-pause text-secondary-text mr-2"></i>Auto-refresh: OFF';
            statusElement.className = 'text-xs text-secondary-text';
        }
    }
}

async function loadCartHistory(silent = false) {
    try {
        if (!silent) {
            showLoading();
        }

        // Fetch cart history data grouped by session
        // Get the latest cart snapshot for each session with items
        const { data, error } = await supabaseClient
            .from('cart_history')
            .select('*')
            .in('action', ['item_added', 'item_removed', 'item_updated', 'cart_abandoned'])
            .not('cart_snapshot', 'is', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by session_id and keep the most recent entry for each session
        const sessionMap = new Map();
        
        (data || []).forEach(entry => {
            const sessionId = entry.session_id;
            const existing = sessionMap.get(sessionId);
            
            // Keep the most recent entry for each session
            if (!existing || new Date(entry.created_at) > new Date(existing.created_at)) {
                // Only include sessions with items in cart
                if (entry.cart_snapshot && entry.cart_snapshot.length > 0) {
                    sessionMap.set(sessionId, {
                        session_id: sessionId,
                        user_id: entry.user_id,
                        user_name: entry.name || 'Guest',
                        user_phone: entry.phone || 'N/A',
                        user_email: entry.email,
                        cart_snapshot: entry.cart_snapshot,
                        cart_value: entry.cart_value || 0,
                        total_items: entry.item_count || entry.cart_snapshot.length,
                        last_activity: entry.created_at,
                        last_action: entry.action,
                        follow_up_status: entry.action === 'cart_abandoned' ? 'abandoned' : 'active',
                        last_contact_date: null
                    });
                }
            }
        });

        allCartHistory = Array.from(sessionMap.values());
        filterAndRender();
        updateKPIs();
        updateFilterCounts();

    } catch (error) {
        console.error('Error loading cart history:', error);
        showError('Failed to load cart history: ' + error.message);
    }
}

function filterAndRender() {
    // Apply filters
    filteredHistory = allCartHistory.filter(item => {
        // Status filter
        if (currentStatusFilter !== 'all') {
            const followUpStatus = item.follow_up_status || 'abandoned';
            if (followUpStatus !== currentStatusFilter) return false;
        }

        // Temperature filter
        if (currentTempFilter) {
            if (item.lead_temperature !== currentTempFilter) return false;
        }

        return true;
    });

    renderCartHistory();
}

function renderCartHistory() {
    const tbody = document.getElementById('cartHistoryTable');

    if (filteredHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-secondary-text">
                    <i class="fas fa-shopping-cart text-5xl mb-4 text-neutral-300"></i>
                    <p class="text-lg font-medium">No cart history found</p>
                    <p class="text-sm mt-2">Try adjusting your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredHistory.map(cart => {
        const leadTemp = getLeadTemperature(cart);
        const tempIcon = getTempIcon(leadTemp);
        const statusBadge = getStatusBadge(cart.follow_up_status);
        
        return `
            <tr class="hover:bg-neutral-50 transition-base">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <i class="fas fa-user text-primary-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-primary-text">${cart.user_name || 'Guest'}</p>
                            <a href="tel:${cart.user_phone}" class="text-xs text-primary-600 hover:underline">
                                ${cart.user_phone}
                            </a>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <button onclick="viewCartDetails('${cart.session_id}')" class="text-left">
                        <p class="text-sm font-medium text-primary-text">${cart.total_items} items</p>
                        <p class="text-xs text-secondary-text hover:text-primary-600 transition-base">
                            <i class="fas fa-eye mr-1"></i>View details
                        </p>
                    </button>
                </td>
                <td class="px-6 py-4">
                    <p class="text-base font-mono font-semibold text-primary-text">₹${formatNumber(cart.cart_value)}</p>
                </td>
                <td class="px-6 py-4">
                    <div>
                        <p class="text-sm text-primary-text">${formatTimeAgo(cart.last_activity)}</p>
                        <p class="text-xs text-secondary-text">${formatDateTime(cart.last_activity)}</p>
                        <span class="inline-flex items-center gap-1 mt-1 text-xs">
                            ${tempIcon} <span class="${getTempColor(leadTemp)}">${leadTemp}</span>
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${statusBadge}
                    ${cart.last_contact_date ? `
                        <p class="text-xs text-secondary-text mt-1">
                            Last: ${formatDateTime(cart.last_contact_date)}
                        </p>
                    ` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="contactCustomer('${cart.session_id}')" 
                                class="btn btn-primary h-button-sm px-3 text-xs"
                                title="Contact customer">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button onclick="viewHistory('${cart.session_id}')" 
                                class="btn btn-ghost h-button-sm px-3 text-xs"
                                title="View activity history">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getLeadTemperature(cart) {
    const hoursSinceActivity = (Date.now() - new Date(cart.last_activity)) / (1000 * 60 * 60);
    
    if (hoursSinceActivity < 24) return 'hot';
    if (hoursSinceActivity < 72) return 'warm';
    return 'cold';
}

function getTempIcon(temp) {
    const icons = {
        hot: '<i class="fas fa-fire text-danger-500"></i>',
        warm: '<i class="fas fa-sun text-accentB-500"></i>',
        cold: '<i class="fas fa-snowflake text-info-500"></i>'
    };
    return icons[temp] || '';
}

function getTempColor(temp) {
    const colors = {
        hot: 'text-danger-600 font-semibold',
        warm: 'text-accentB-600 font-medium',
        cold: 'text-info-600'
    };
    return colors[temp] || '';
}

function getStatusBadge(status) {
    const badges = {
        abandoned: '<span class="badge badge-warn">Abandoned</span>',
        contacted: '<span class="badge badge-info">Contacted</span>',
        converted: '<span class="badge badge-success">Converted</span>',
        not_interested: '<span class="badge badge-error">Not Interested</span>'
    };
    return badges[status] || badges.abandoned;
}

function updateKPIs() {
    const totalAbandoned = allCartHistory.filter(c => !c.follow_up_status || c.follow_up_status === 'abandoned').length;
    const totalValue = allCartHistory.reduce((sum, c) => sum + (c.cart_value || 0), 0);
    const converted = allCartHistory.filter(c => c.follow_up_status === 'converted').length;
    const recoveredValue = allCartHistory
        .filter(c => c.follow_up_status === 'converted')
        .reduce((sum, c) => sum + (c.cart_value || 0), 0);
    
    const conversionRate = allCartHistory.length > 0 
        ? ((converted / allCartHistory.length) * 100).toFixed(1)
        : 0;

    document.getElementById('kpi-abandoned').textContent = totalAbandoned;
    document.getElementById('kpi-value').textContent = `₹${formatNumber(totalValue)}`;
    document.getElementById('kpi-conversion').textContent = `${conversionRate}%`;
    document.getElementById('kpi-recovered').textContent = `₹${formatNumber(recoveredValue)}`;
}

function updateFilterCounts() {
    const counts = {
        all: allCartHistory.length,
        abandoned: allCartHistory.filter(c => !c.follow_up_status || c.follow_up_status === 'abandoned').length,
        contacted: allCartHistory.filter(c => c.follow_up_status === 'contacted').length,
        converted: allCartHistory.filter(c => c.follow_up_status === 'converted').length,
        not_interested: allCartHistory.filter(c => c.follow_up_status === 'not_interested').length
    };

    Object.keys(counts).forEach(status => {
        const badge = document.getElementById(`count-${status}`);
        if (badge) badge.textContent = counts[status];
    });
}

function filterByStatus(status) {
    currentStatusFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.status === status);
    });
    
    filterAndRender();
}

function filterByTemp(temp) {
    if (currentTempFilter === temp) {
        currentTempFilter = null; // Toggle off
    } else {
        currentTempFilter = temp;
    }
    
    // Update active temp filter
    document.querySelectorAll('.temp-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.temp === temp && currentTempFilter);
    });
    
    filterAndRender();
}

async function viewCartDetails(sessionId) {
    try {
        // Fetch cart items for this session
        const { data, error } = await supabase
            .from('cart_history')
            .select('*')
            .eq('session_id', sessionId)
            .eq('activity_type', 'item_added')
            .order('activity_time', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const cartSnapshot = data[0].cart_snapshot;
            showCartDetailsModal(cartSnapshot);
        }
    } catch (error) {
        console.error('Error fetching cart details:', error);
        alert('Failed to load cart details');
    }
}

function showCartDetailsModal(cartSnapshot) {
    const items = cartSnapshot.items || [];
    
    const modalHtml = `
        <div class="space-y-4 max-h-96 overflow-y-auto">
            ${items.map(item => `
                <div class="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-primary-text">${item.productName}</p>
                        <div class="text-xs text-secondary-text mt-1 space-y-1">
                            ${item.material ? `<p>Material: ${item.material}</p>` : ''}
                            ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                            ${item.paperSize ? `<p>Size: ${item.paperSize}</p>` : ''}
                            ${item.pages ? `<p>Pages: ${item.pages}</p>` : ''}
                            ${item.binding ? `<p>Binding: ${item.binding}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-mono font-semibold text-primary-text">₹${formatNumber(item.totalPrice)}</p>
                        <p class="text-xs text-secondary-text">Qty: ${item.quantity}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="mt-6 pt-4 border-t border-subtle">
            <div class="flex justify-between items-center">
                <span class="text-base font-semibold text-primary-text">Total</span>
                <span class="text-xl font-mono font-bold text-primary-600">
                    ₹${formatNumber(cartSnapshot.totalValue || 0)}
                </span>
            </div>
        </div>
    `;
    
    document.getElementById('contactModalContent').innerHTML = modalHtml;
    document.getElementById('contactModal').classList.remove('hidden');
}

async function contactCustomer(sessionId) {
    try {
        // Find cart record
        const cart = allCartHistory.find(c => c.session_id === sessionId);
        if (!cart) return;

        const modalHtml = `
            <div class="space-y-6">
                <div class="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <i class="fas fa-user text-2xl text-primary-600"></i>
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-primary-text">${cart.user_name || 'Guest'}</p>
                        <a href="tel:${cart.user_phone}" class="text-base text-primary-600 hover:underline">
                            <i class="fas fa-phone mr-2"></i>${cart.user_phone}
                        </a>
                        <p class="text-sm text-secondary-text mt-1">
                            Cart Value: <span class="font-mono font-semibold">₹${formatNumber(cart.cart_value)}</span>
                        </p>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-primary-text mb-2">Contact Notes</label>
                    <textarea id="contactNotes" rows="4" 
                              class="input w-full" 
                              placeholder="Enter notes about the call..."></textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium text-primary-text mb-2">Follow-up Status</label>
                    <select id="followUpStatus" class="input w-full">
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted to Order</option>
                        <option value="not_interested">Not Interested</option>
                    </select>
                </div>

                <div class="flex gap-4">
                    <button onclick="saveContactRecord('${sessionId}')" class="btn btn-primary h-button-md px-6 flex-1">
                        <i class="fas fa-save mr-2"></i>Save Contact Record
                    </button>
                    <button onclick="closeContactModal()" class="btn btn-ghost h-button-md px-6">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.getElementById('contactModalContent').innerHTML = modalHtml;
        document.getElementById('contactModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error opening contact form:', error);
        alert('Failed to open contact form');
    }
}

async function saveContactRecord(sessionId) {
    try {
        const notes = document.getElementById('contactNotes').value;
        const status = document.getElementById('followUpStatus').value;

        if (!notes.trim()) {
            alert('Please enter contact notes');
            return;
        }

        // Update all cart_history records for this session
        const { error } = await supabase
            .from('cart_history')
            .update({
                follow_up_status: status,
                contact_notes: notes,
                last_contact_date: new Date().toISOString()
            })
            .eq('session_id', sessionId);

        if (error) throw error;

        showToast('Contact record saved successfully', 'success');
        closeContactModal();
        await loadCartHistory();

    } catch (error) {
        console.error('Error saving contact record:', error);
        showToast('Failed to save contact record', 'error');
    }
}

async function viewHistory(sessionId) {
    try {
        const { data, error } = await supabase
            .from('cart_history')
            .select('*')
            .eq('session_id', sessionId)
            .order('activity_time', { ascending: false });

        if (error) throw error;

        const historyHtml = `
            <div class="space-y-4 max-h-96 overflow-y-auto">
                ${data.map(activity => `
                    <div class="flex gap-4 p-4 bg-neutral-50 rounded-lg">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                ${getActivityIcon(activity.activity_type)}
                            </div>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-primary-text">${getActivityLabel(activity.activity_type)}</p>
                            <p class="text-xs text-secondary-text mt-1">${formatDateTime(activity.activity_time)}</p>
                            ${activity.contact_notes ? `
                                <p class="text-xs text-secondary-text mt-2 p-2 bg-white rounded">
                                    <i class="fas fa-comment mr-1"></i>${activity.contact_notes}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('contactModalContent').innerHTML = historyHtml;
        document.getElementById('contactModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading activity history:', error);
        alert('Failed to load activity history');
    }
}

function getActivityIcon(type) {
    const icons = {
        item_added: '<i class="fas fa-plus text-accentA-600"></i>',
        item_removed: '<i class="fas fa-minus text-danger-600"></i>',
        item_updated: '<i class="fas fa-edit text-info-600"></i>',
        checkout_started: '<i class="fas fa-shopping-bag text-primary-600"></i>',
        checkout_completed: '<i class="fas fa-check text-accentA-600"></i>',
        cart_abandoned: '<i class="fas fa-clock text-accentB-600"></i>'
    };
    return icons[type] || '<i class="fas fa-circle text-neutral-400"></i>';
}

function getActivityLabel(type) {
    const labels = {
        item_added: 'Item Added to Cart',
        item_removed: 'Item Removed from Cart',
        item_updated: 'Cart Item Updated',
        checkout_started: 'Checkout Started',
        checkout_completed: 'Order Completed',
        cart_abandoned: 'Cart Abandoned'
    };
    return labels[type] || type;
}

function closeContactModal() {
    document.getElementById('contactModal').classList.add('hidden');
}

function refreshData() {
    loadCartHistory();
}

function showLoading() {
    const tbody = document.getElementById('cartHistoryTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-12 text-center text-secondary-text">
                <i class="fas fa-spinner fa-spin text-3xl mb-4 text-neutral-400"></i>
                <p>Loading cart history...</p>
            </td>
        </tr>
    `;
}

function showError(message) {
    const tbody = document.getElementById('cartHistoryTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-12 text-center text-danger-600">
                <i class="fas fa-exclamation-circle text-3xl mb-4"></i>
                <p>${message}</p>
            </td>
        </tr>
    `;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0);
}

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = Date.now();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const bgColors = {
        success: 'bg-accentA-500',
        error: 'bg-danger-500',
        info: 'bg-info-500'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-base`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <p class="font-medium">${message}</p>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
}

// Add styles for filter tabs
const style = document.createElement('style');
style.textContent = `
    .filter-tab {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #6B7280;
        background: white;
        border: 1px solid #E5E7EB;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
    }
    .filter-tab:hover {
        border-color: #1E6CE0;
        color: #1E6CE0;
    }
    .filter-tab.active {
        background: #1E6CE0;
        color: white;
        border-color: #1E6CE0;
    }
    .temp-filter {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #6B7280;
        background: white;
        border: 1px solid #E5E7EB;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .temp-filter:hover {
        border-color: #1E6CE0;
    }
    .temp-filter.active {
        border-color: #1E6CE0;
        background: #EFF6FF;
    }
`;
document.head.appendChild(style);
