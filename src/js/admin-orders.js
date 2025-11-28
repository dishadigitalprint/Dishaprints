// Admin Orders Management JavaScript
let currentUser = null;
let allOrders = [];
let filteredOrders = [];

// Secure admin authentication
(async function() {
    currentUser = await AUTH.requireAdmin();
    if (!currentUser) return;
    await loadOrders();
    setupEventListeners();
})();

// Initialize event listeners
function setupEventListeners() {
    // Add any event listeners here
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => filterOrders(btn.dataset.filter));
    });
}

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

// Render order items - handles both old order_items and new order_data structures
function renderOrderItems(order) {
    // Check if this is a multi-file upload order with order_data in customer_notes
    if (order.customer_notes) {
        try {
            const orderData = JSON.parse(order.customer_notes);
            
            // Check if orderData has files array (new multi-file upload format)
            if (orderData.files && Array.isArray(orderData.files)) {
                const files = orderData.files;
                const summary = orderData.pricingSummary || {};
                
                // Debug: Log first file to see what fields are available
                if (files.length > 0) {
                    console.log('First file object:', files[0]);
                    console.log('Available fields:', Object.keys(files[0]));
                }
                
                // If files don't have URLs, try to get them from order_items
                if (files.length > 0 && !files[0].filePath && !files[0].fileUrl && order.order_items) {
                    console.log('Files missing URLs, checking order_items...');
                    // Match files with order_items by fileName
                    files.forEach(file => {
                        const matchingItem = order.order_items.find(item => 
                            item.file_name === file.name || item.product_name?.includes(file.name)
                        );
                        if (matchingItem) {
                            file.fileUrl = matchingItem.file_url;
                            console.log(`Matched ${file.name} with URL:`, file.fileUrl);
                        }
                    });
                }
                
                return `
                    <div class="space-y-4">
                        <!-- Customer Info from order_data -->
                        ${orderData.customerName || orderData.jobDescription ? `
                            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                ${orderData.customerName ? `<p><strong>Customer Name:</strong> ${orderData.customerName}</p>` : ''}
                                ${orderData.jobDescription ? `<p><strong>Job Description:</strong> ${orderData.jobDescription}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        <!-- Files Table -->
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-900">File Name</th>
                                        <th class="px-3 py-2 text-center font-semibold text-gray-900">Pages</th>
                                        <th class="px-3 py-2 text-center font-semibold text-gray-900">Qty</th>
                                        <th class="px-3 py-2 text-center font-semibold text-gray-900">Mode</th>
                                        <th class="px-3 py-2 text-center font-semibold text-gray-900">Paper</th>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-900">Binding</th>
                                        <th class="px-3 py-2 text-left font-semibold text-gray-900">Cover</th>
                                        <th class="px-3 py-2 text-right font-semibold text-gray-900">Total</th>
                                        <th class="px-3 py-2 text-center font-semibold text-gray-900">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${files.map(file => `
                                        <tr>
                                            <td class="px-3 py-2">
                                                <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                                                <span class="font-medium">${file.name}</span>
                                            </td>
                                            <td class="px-3 py-2 text-center">${file.pages}</td>
                                            <td class="px-3 py-2 text-center">${file.quantity}</td>
                                            <td class="px-3 py-2 text-center">
                                                <span class="px-2 py-1 text-xs rounded ${
                                                    file.printMode === 'bw' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }">${file.printMode === 'bw' ? 'B&W' : 'Color'}</span>
                                            </td>
                                            <td class="px-3 py-2 text-center capitalize">${file.paperQuality}</td>
                                            <td class="px-3 py-2 capitalize">${file.binding}</td>
                                            <td class="px-3 py-2 capitalize">${file.cover}</td>
                                            <td class="px-3 py-2 text-right font-semibold">${formatCurrency(file.total)}</td>
                                            <td class="px-3 py-2 text-center">
                                                <button onclick="downloadFile('${file.fileUrl || file.filePath || file.storageUrl || file.url}')" 
                                                        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        title="Download file">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pricing Summary -->
                        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div class="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span class="font-semibold">${formatCurrency(summary.subtotal || order.subtotal || 0)}</span>
                            </div>
                            ${summary.bulkDiscount > 0 ? `
                                <div class="flex justify-between text-sm text-green-600">
                                    <span>Bulk Discount:</span>
                                    <span class="font-semibold">-${formatCurrency(summary.bulkDiscount)}</span>
                                </div>
                            ` : ''}
                            <div class="flex justify-between text-sm">
                                <span>GST (${summary.gstRate || 18}%):</span>
                                <span class="font-semibold">${formatCurrency(summary.gst || order.gst || 0)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span>Delivery:</span>
                                <span class="font-semibold ${summary.deliveryCharge === 0 ? 'text-green-600' : ''}">
                                    ${summary.deliveryCharge === 0 ? 'FREE' : formatCurrency(summary.deliveryCharge || order.delivery_charge || 0)}
                                </span>
                            </div>
                            <div class="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                                <span>Grand Total:</span>
                                <span>${formatCurrency(summary.grandTotal || order.total)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Error parsing customer_notes JSON:', e);
        }
    }
    
    // Check old order_data field (if it exists)
    if (order.order_data && typeof order.order_data === 'object') {
        const orderData = order.order_data;
        
        // Check if order_data has files array (new multi-file upload format)
        if (orderData.files && Array.isArray(orderData.files)) {
            const files = orderData.files;
            const summary = orderData.pricingSummary || {};
            
            return `
                <div class="space-y-4">
                    <!-- Customer Info from order_data -->
                    ${orderData.customerName || orderData.jobDescription ? `
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            ${orderData.customerName ? `<p><strong>Customer Name:</strong> ${orderData.customerName}</p>` : ''}
                            ${orderData.jobDescription ? `<p><strong>Job Description:</strong> ${orderData.jobDescription}</p>` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Files Table -->
                    <div class="border border-gray-200 rounded-lg overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-3 py-2 text-left font-semibold text-gray-900">File Name</th>
                                    <th class="px-3 py-2 text-center font-semibold text-gray-900">Pages</th>
                                    <th class="px-3 py-2 text-center font-semibold text-gray-900">Qty</th>
                                    <th class="px-3 py-2 text-center font-semibold text-gray-900">Mode</th>
                                    <th class="px-3 py-2 text-center font-semibold text-gray-900">Paper</th>
                                    <th class="px-3 py-2 text-left font-semibold text-gray-900">Binding</th>
                                    <th class="px-3 py-2 text-left font-semibold text-gray-900">Cover</th>
                                    <th class="px-3 py-2 text-right font-semibold text-gray-900">Total</th>
                                    <th class="px-3 py-2 text-center font-semibold text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${files.map(file => `
                                    <tr>
                                        <td class="px-3 py-2">
                                            <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                                            <span class="font-medium">${file.name}</span>
                                        </td>
                                        <td class="px-3 py-2 text-center">${file.pages}</td>
                                        <td class="px-3 py-2 text-center">${file.quantity}</td>
                                        <td class="px-3 py-2 text-center">
                                            <span class="px-2 py-1 text-xs rounded ${
                                                file.printMode === 'bw' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                            }">${file.printMode === 'bw' ? 'B&W' : 'Color'}</span>
                                        </td>
                                        <td class="px-3 py-2 text-center capitalize">${file.paperQuality}</td>
                                        <td class="px-3 py-2 capitalize">${file.binding}</td>
                                        <td class="px-3 py-2 capitalize">${file.cover}</td>
                                        <td class="px-3 py-2 text-right font-semibold">${formatCurrency(file.total)}</td>
                                        <td class="px-3 py-2 text-center">
                                            <button onclick="downloadFile('${file.filePath || file.fileUrl || file.storageUrl || file.url}')" 
                                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    title="Download file">
                                                <i class="fas fa-download"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pricing Summary -->
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span class="font-semibold">${formatCurrency(summary.subtotal || 0)}</span>
                        </div>
                        ${summary.bulkDiscount > 0 ? `
                            <div class="flex justify-between text-sm text-green-600">
                                <span>Bulk Discount:</span>
                                <span class="font-semibold">-${formatCurrency(summary.bulkDiscount)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between text-sm">
                            <span>GST (${summary.gstRate || 18}%):</span>
                            <span class="font-semibold">${formatCurrency(summary.gst || 0)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Delivery:</span>
                            <span class="font-semibold ${summary.deliveryCharge === 0 ? 'text-green-600' : ''}">
                                ${summary.deliveryCharge === 0 ? 'FREE' : formatCurrency(summary.deliveryCharge)}
                            </span>
                        </div>
                        <div class="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                            <span>Grand Total:</span>
                            <span>${formatCurrency(summary.grandTotal || ((order.subtotal || 0) + (order.gst || 0) + (order.delivery_charge || 0)))}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Fallback to old order_items format
    if (order.order_items && order.order_items.length > 0) {
        return `
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
                            <td class="px-4 py-3 text-right text-lg font-bold">${formatCurrency((order.subtotal || 0) + (order.gst || 0) + (order.delivery_charge || 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }
    
    return '<p class="text-gray-500 text-center py-4">No order items found</p>';
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
                    name,
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
                    <p class="text-2xl font-bold text-gray-900">${formatCurrency((order.subtotal || 0) + (order.gst || 0) + (order.delivery_charge || 0))}</p>
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
                    name,
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
                            <p><strong>${order.addresses.name}</strong></p>
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
                    ${renderOrderItems(order)}
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

// Download file function
async function downloadFile(fileUrl) {
    try {
        if (!fileUrl) {
            alert('File URL not available');
            return;
        }

        console.log('Downloading file:', fileUrl);

        // If it's a storage path, get the public URL
        let downloadUrl = fileUrl;
        if (!fileUrl.startsWith('http')) {
            // It's a storage path, get public URL from Supabase
            const { data, error } = supabaseClient.storage
                .from('order-files')
                .getPublicUrl(fileUrl);
            
            if (error) {
                console.error('Error getting public URL:', error);
                alert('Failed to get download link. Please contact support.');
                return;
            }
            
            downloadUrl = data.publicUrl;
            console.log('Public URL:', downloadUrl);
        }

        // For Supabase Storage files, we need to fetch and download
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch file');
        }
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileUrl.split('/').pop(); // Use filename from path
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        console.log('Download initiated for:', downloadUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download file. Please try again or contact support.');
    }
}

// Make it globally available
window.downloadFile = downloadFile;

// Initialize
loadOrders();
