// Admin Dashboard JavaScript
let currentUser = null;

// Secure admin authentication check
(async function() {
    currentUser = await AUTH.requireAdmin();
    if (!currentUser) return; // Redirected by requireAdmin
    
    // Display current date
    const currentDateEl = document.getElementById('current-date');
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Display admin info
    document.getElementById('admin-name').textContent = currentUser.name || 'Admin';
    document.getElementById('admin-phone').textContent = currentUser.phone || '';
    
    // Initialize dashboard
    initDashboard();
})();

// Logout function
function logout() {
    AUTH.logout();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge class
function getStatusBadge(status) {
    const badges = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'processing': 'bg-purple-100 text-purple-800',
        'ready': 'bg-green-100 text-green-800',
        'completed': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
}

// Load Today's Summary
async function loadTodaysSummary() {
    try {
        const { data, error } = await supabaseClient
            .from('todays_summary')
            .select('*')
            .single();

        if (error) throw error;

        if (data) {
            document.getElementById('today-orders').textContent = data.total_orders || 0;
            document.getElementById('today-revenue').textContent = formatCurrency(data.total_revenue || 0);
            document.getElementById('pending-orders').textContent = data.pending_orders || 0;
            
            // Update sidebar badge
            const badge = document.getElementById('sidebar-pending-badge');
            if (badge) {
                badge.textContent = data.pending_orders || 0;
                badge.style.display = data.pending_orders > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error loading today\'s summary:', error);
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                id,
                order_number,
                user_id,
                status,
                subtotal,
                gst,
                delivery_charge,
                created_at,
                users (name, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const container = document.getElementById('recent-orders-list');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">No orders yet</p>';
            return;
        }

        container.innerHTML = data.map(order => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-900">${order.order_number}</span>
                        <span class="px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}">
                            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">
                        ${order.users?.name || 'Guest'} • ${formatDate(order.created_at)}
                    </p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-gray-900">${formatCurrency((order.subtotal || 0) + (order.gst || 0) + (order.delivery_charge || 0))}</p>
                    <a href="admin-orders.html?order=${order.id}" class="text-xs text-blue-600 hover:text-blue-700">
                        View Details →
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recent-orders-list').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading orders</p>';
    }
}

// Load Order Status Breakdown
async function loadOrderStatusBreakdown() {
    try {
        // Get today's date at midnight in ISO format
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        const { data, error } = await supabaseClient
            .from('orders')
            .select('status, subtotal, gst, delivery_charge')
            .gte('created_at', todayISO);

        if (error) throw error;

        // Count orders by status
        const statusCounts = {};
        const statusTotals = {};
        
        data.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
            const totalAmount = (order.subtotal || 0) + (order.gst || 0) + (order.delivery_charge || 0);
            statusTotals[order.status] = (statusTotals[order.status] || 0) + totalAmount;
        });

        const statusOrder = ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled'];
        const statusIcons = {
            'pending': 'fa-clock',
            'confirmed': 'fa-check-circle',
            'processing': 'fa-cog',
            'ready': 'fa-box',
            'completed': 'fa-check-double',
            'cancelled': 'fa-times-circle'
        };

        const container = document.getElementById('order-status-breakdown');
        
        const hasData = Object.keys(statusCounts).length > 0;
        if (!hasData) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">No orders today</p>';
            return;
        }

        container.innerHTML = statusOrder
            .filter(status => statusCounts[status])
            .map(status => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i class="fas ${statusIcons[status]} text-gray-600"></i>
                        <div>
                            <p class="font-semibold text-gray-900 capitalize">${status}</p>
                            <p class="text-xs text-gray-500">${formatCurrency(statusTotals[status] || 0)}</p>
                        </div>
                    </div>
                    <span class="text-2xl font-bold text-gray-900">${statusCounts[status]}</span>
                </div>
            `).join('');
    } catch (error) {
        console.error('Error loading order status breakdown:', error);
        document.getElementById('order-status-breakdown').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading data</p>';
    }
}

// Load Low Stock Items
async function loadLowStockItems() {
    try {
        const { data, error } = await supabaseClient
            .from('low_stock_alert')
            .select('*')
            .limit(5);

        if (error) throw error;

        // Update count
        document.getElementById('low-stock-count').textContent = data?.length || 0;
        
        // Update sidebar badge
        const sidebarBadge = document.getElementById('sidebar-low-stock-badge');
        if (sidebarBadge && data && data.length > 0) {
            sidebarBadge.textContent = data.length;
            sidebarBadge.classList.remove('hidden');
        }

        const container = document.getElementById('low-stock-list');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">All items are well stocked</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fas fa-exclamation-triangle text-orange-600"></i>
                        <span class="font-semibold text-gray-900">${item.item_name}</span>
                    </div>
                    <p class="text-sm text-gray-600">${item.category} • ${item.unit}</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-bold text-orange-600">${item.current_quantity}</p>
                    <p class="text-xs text-gray-500">Min: ${item.low_stock_threshold}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading low stock items:', error);
        document.getElementById('low-stock-list').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading inventory</p>';
    }
}

// Refresh all data
async function refreshData() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;

    try {
        await Promise.all([
            loadTodaysSummary(),
            loadRecentOrders(),
            loadOrderStatusBreakdown(),
            loadLowStockItems()
        ]);
    } finally {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }
}

// Initialize dashboard
async function initDashboard() {
    await Promise.all([
        loadTodaysSummary(),
        loadRecentOrders(),
        loadOrderStatusBreakdown(),
        loadLowStockItems()
    ]);
}

// Load dashboard on page load
initDashboard();

// Auto-refresh every 5 minutes
setInterval(initDashboard, 5 * 60 * 1000);
