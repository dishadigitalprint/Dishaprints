// Admin Orders Management JavaScript
let currentUser = null;
let allOrders = [];
let filteredOrders = [];

// Secure admin authentication
(async function() {
    currentUser = await AUTH.requireAdmin();
    if (!currentUser) return;
    init();
})();

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
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
    return date.toLocaleString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric',
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

// Get payment status badge
function getPaymentBadge(status) {
    const badges = {
        'pending': 'bg-orange-100 text-orange-800',
        'paid': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
}

// Load all orders
async function loadOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                users (name, phone, email),
                addresses (
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    pincode
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allOrders = data || [];
        filteredOrders = [...allOrders];
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersContainer').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading orders</p>';
    }
}

// Render orders
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No orders found</p>';
        return;
    }

    container.innerHTML = filteredOrders.map(order => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-bold text-gray-900">${order.order_number}</h3>
                        <span class="px-3 py-1 text-sm rounded-full ${getStatusBadge(order.status)}">
                            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span class="px-3 py-1 text-sm rounded-full ${getPaymentBadge(order.payment_status)}">
                            ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600">
                        <p><i class="fas fa-user mr-2"></i>${order.users?.name || 'Guest'}</p>
                        <p><i class="fas fa-phone mr-2"></i>+91 ${order.users?.phone || 'N/A'}</p>
                        <p><i class="fas fa-clock mr-2"></i>${formatDate(order.created_at)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-gray-900">${formatCurrency(order.total_amount)}</p>
                    <p class="text-sm text-gray-600">${order.payment_method || 'COD'}</p>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="viewOrder('${order.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <i class="fas fa-eye mr-2"></i>View Details
                </button>
                <button onclick="updateStatus('${order.id}', '${order.status}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    <i class="fas fa-edit mr-2"></i>Update Status
                </button>
                <button onclick="printInvoice('${order.id}')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                    <i class="fas fa-print mr-2"></i>Print
                </button>
            </div>
        </div>
    `).join('');
}

// View order details
async function viewOrder(orderId) {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                users (name, phone, email),
                addresses (
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    pincode
                ),
                order_items (*)
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

        const order = data;
        const modalContent = document.getElementById('modalContent');
        document.getElementById('modalOrderNumber').textContent = order.order_number;
        
        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Customer Info -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Customer Information</h4>
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><strong>Name:</strong> ${order.users?.name || 'N/A'}</p>
                        <p><strong>Phone:</strong> +91 ${order.users?.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> ${order.users?.email || 'N/A'}</p>
                    </div>
                </div>

                <!-- Delivery Address -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Delivery Address</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        ${order.addresses ? `
                            <p><strong>${order.addresses.full_name}</strong></p>
                            <p>${order.addresses.address_line1}</p>
                            ${order.addresses.address_line2 ? `<p>${order.addresses.address_line2}</p>` : ''}
                            <p>${order.addresses.city}, ${order.addresses.state} - ${order.addresses.pincode}</p>
                            <p>Phone: ${order.addresses.phone}</p>
                        ` : '<p class="text-gray-500">No address provided</p>'}
                    </div>
                </div>

                <!-- Order Items -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Order Items</h4>
                    <div class="border border-gray-200 rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                                    <th class="px-4 py-3 text-center text-sm font-semibold text-gray-900">Quantity</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${order.order_items.map(item => `
                                    <tr>
                                        <td class="px-4 py-3 text-sm">${item.product_name}</td>
                                        <td class="px-4 py-3 text-sm text-center">${item.quantity}</td>
                                        <td class="px-4 py-3 text-sm text-right">${formatCurrency(item.unit_price)}</td>
                                        <td class="px-4 py-3 text-sm text-right font-semibold">${formatCurrency(item.total_price)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot class="bg-gray-50">
                                <tr>
                                    <td colspan="3" class="px-4 py-3 text-right text-sm font-semibold">Total:</td>
                                    <td class="px-4 py-3 text-right text-lg font-bold">${formatCurrency(order.total_amount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Order Status -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Order Status</h4>
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><strong>Order Status:</strong> <span class="px-3 py-1 text-sm rounded-full ${getStatusBadge(order.status)}">${order.status}</span></p>
                        <p><strong>Payment Status:</strong> <span class="px-3 py-1 text-sm rounded-full ${getPaymentBadge(order.payment_status)}">${order.payment_status}</span></p>
                        <p><strong>Payment Method:</strong> ${order.payment_method || 'COD'}</p>
                        <p><strong>Order Date:</strong> ${formatDate(order.created_at)}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('orderModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Error loading order details');
    }
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

// Update order status
async function updateStatus(orderId, currentStatus) {
    const statuses = ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled'];
    const statusNames = ['Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled'];
    
    const options = statuses.map((s, i) => 
        `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${statusNames[i]}</option>`
    ).join('');
    
    const newStatus = prompt(`Select new status:\n${statuses.join(', ')}`);
    
    if (newStatus && statuses.includes(newStatus)) {
        try {
            const { error } = await supabaseClient
                .from('orders')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            alert('Order status updated successfully!');
            await loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating order status');
        }
    }
}

// Print invoice
function printInvoice(orderId) {
    alert('Print invoice feature coming soon!');
    // Will implement actual invoice printing later
}

// Refresh orders
async function refreshOrders() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;

    try {
        await loadOrders();
    } finally {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const paymentFilter = document.getElementById('filterPayment').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchTerm = document.getElementById('searchOrder').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        // Status filter
        if (statusFilter && order.status !== statusFilter) return false;
        
        // Payment filter
        if (paymentFilter && order.payment_status !== paymentFilter) return false;
        
        // Date filter
        if (dateFilter !== 'all') {
            const orderDate = new Date(order.created_at);
            const now = new Date();
            
            if (dateFilter === 'today') {
                if (orderDate.toDateString() !== now.toDateString()) return false;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (orderDate < weekAgo) return false;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (orderDate < monthAgo) return false;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const matchesOrder = order.order_number.toLowerCase().includes(searchTerm);
            const matchesPhone = order.users?.phone?.includes(searchTerm);
            const matchesName = order.users?.name?.toLowerCase().includes(searchTerm);
            
            if (!matchesOrder && !matchesPhone && !matchesName) return false;
        }
        
        return true;
    });

    renderOrders();
}

// Event listeners
document.getElementById('filterStatus').addEventListener('change', applyFilters);
document.getElementById('filterPayment').addEventListener('change', applyFilters);
document.getElementById('filterDate').addEventListener('change', applyFilters);
document.getElementById('searchOrder').addEventListener('input', applyFilters);

// Close modal on outside click
document.getElementById('orderModal').addEventListener('click', (e) => {
    if (e.target.id === 'orderModal') {
        closeModal();
    }
});

// Initialize
loadOrders();
