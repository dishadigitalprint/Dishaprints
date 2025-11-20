// Admin Customers Management JavaScript
let currentUser = null;
let allCustomers = [];
let filteredCustomers = [];

// Secure admin authentication
(async function() {
    currentUser = await AUTH.requireAdmin();
    if (!currentUser) return;
    init();
})();

function logout() {
    AUTH.logout();
}

function _logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getStatusBadge(status) {
    const badges = {
        'active': 'bg-green-100 text-green-800',
        'at-risk': 'bg-orange-100 text-orange-800',
        'inactive': 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
}

// Load customers
async function loadCustomers() {
    try {
        const { data, error } = await supabaseClient
            .from('customer_lifetime_value')
            .select('*');

        if (error) throw error;

        allCustomers = data || [];
        filteredCustomers = [...allCustomers];
        applySorting();
        renderCustomers();
        updateStats();
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customersContainer').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading customers</p>';
    }
}

// Update stats
function updateStats() {
    document.getElementById('totalCustomers').textContent = allCustomers.length;
    
    const active = allCustomers.filter(c => c.customer_status === 'active');
    const atRisk = allCustomers.filter(c => c.customer_status === 'at-risk');
    
    document.getElementById('activeCustomers').textContent = active.length;
    document.getElementById('atRiskCustomers').textContent = atRisk.length;
    
    const totalLTV = allCustomers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
    document.getElementById('totalLTV').textContent = formatCurrency(totalLTV);
}

// Render customers
function renderCustomers() {
    const container = document.getElementById('customersContainer');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No customers found</p>';
        return;
    }

    container.innerHTML = filteredCustomers.map(customer => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${customer.name || 'Guest'}</h3>
                            <p class="text-sm text-gray-600">+91 ${customer.phone}</p>
                            ${customer.email ? `<p class="text-sm text-gray-600">${customer.email}</p>` : ''}
                        </div>
                        <span class="px-3 py-1 text-sm rounded-full ${getStatusBadge(customer.customer_status)}">
                            ${customer.customer_status.replace('-', ' ').toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-4 mb-4">
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <p class="text-2xl font-bold text-gray-900">${customer.total_orders || 0}</p>
                            <p class="text-xs text-gray-600">Total Orders</p>
                        </div>
                        <div class="text-center p-3 bg-blue-50 rounded-lg">
                            <p class="text-2xl font-bold text-blue-600">${formatCurrency(customer.lifetime_value || 0)}</p>
                            <p class="text-xs text-gray-600">Lifetime Value</p>
                        </div>
                        <div class="text-center p-3 bg-green-50 rounded-lg">
                            <p class="text-2xl font-bold text-green-600">${formatCurrency(customer.avg_order_value || 0)}</p>
                            <p class="text-xs text-gray-600">Avg Order</p>
                        </div>
                        <div class="text-center p-3 bg-purple-50 rounded-lg">
                            <p class="text-sm font-bold text-purple-600">${customer.last_order_date ? formatDate(customer.last_order_date) : 'Never'}</p>
                            <p class="text-xs text-gray-600">Last Order</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="viewCustomer('${customer.user_id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <i class="fas fa-eye mr-2"></i>View Details
                </button>
                <button onclick="showNoteModal('${customer.user_id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    <i class="fas fa-sticky-note mr-2"></i>Add Note
                </button>
                <button onclick="viewOrders('${customer.user_id}')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    <i class="fas fa-shopping-cart mr-2"></i>Orders
                </button>
            </div>
        </div>
    `).join('');
}

// View customer details
async function viewCustomer(userId) {
    try {
        // Load customer orders and notes
        const [ordersResult, notesResult] = await Promise.all([
            supabaseClient
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false }),
            supabaseClient
                .from('customer_notes')
                .select('*, created_by_user:users!customer_notes_created_by_fkey(name)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
        ]);

        if (ordersResult.error) throw ordersResult.error;
        if (notesResult.error) throw notesResult.error;

        const customer = allCustomers.find(c => c.user_id === userId);
        const orders = ordersResult.data || [];
        const notes = notesResult.data || [];

        document.getElementById('modalCustomerName').textContent = customer.name || 'Customer Details';
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Customer Info -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Customer Information</h4>
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><strong>Name:</strong> ${customer.name || 'N/A'}</p>
                        <p><strong>Phone:</strong> +91 ${customer.phone}</p>
                        <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                        <p><strong>Customer Since:</strong> ${formatDate(customer.customer_since)}</p>
                        <p><strong>Status:</strong> <span class="px-2 py-1 text-xs rounded-full ${getStatusBadge(customer.customer_status)}">${customer.customer_status}</span></p>
                    </div>
                </div>

                <!-- Stats -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Statistics</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg text-center">
                            <p class="text-2xl font-bold text-gray-900">${customer.total_orders}</p>
                            <p class="text-sm text-gray-600">Total Orders</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg text-center">
                            <p class="text-2xl font-bold text-blue-600">${formatCurrency(customer.lifetime_value || 0)}</p>
                            <p class="text-sm text-gray-600">Lifetime Value</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg text-center">
                            <p class="text-2xl font-bold text-green-600">${formatCurrency(customer.avg_order_value || 0)}</p>
                            <p class="text-sm text-gray-600">Average Order</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Orders -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Recent Orders (${orders.length})</h4>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${orders.length > 0 ? orders.slice(0, 10).map(order => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="font-semibold text-gray-900">${order.order_number}</p>
                                    <p class="text-sm text-gray-600">${formatDate(order.created_at)}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-gray-900">${formatCurrency(order.total_amount)}</p>
                                    <span class="text-xs px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${order.status}</span>
                                </div>
                            </div>
                        `).join('') : '<p class="text-center text-gray-500 py-4">No orders yet</p>'}
                    </div>
                </div>

                <!-- Customer Notes -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">Notes (${notes.length})</h4>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${notes.length > 0 ? notes.map(note => `
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="flex items-start justify-between mb-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${note.priority === 'high' ? 'bg-red-100 text-red-800' : note.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                                        ${note.note_type} - ${note.priority} priority
                                    </span>
                                    <span class="text-xs text-gray-500">${formatDate(note.created_at)}</span>
                                </div>
                                <p class="text-gray-700">${note.note}</p>
                                <p class="text-xs text-gray-500 mt-2">By: ${note.created_by_user?.name || 'Admin'}</p>
                            </div>
                        `).join('') : '<p class="text-center text-gray-500 py-4">No notes yet</p>'}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('customerModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading customer details:', error);
        alert('Error loading customer details');
    }
}

// View customer orders
function viewOrders(userId) {
    window.location.href = `admin-orders.html?customer=${userId}`;
}

// Show add note modal
function showNoteModal(userId) {
    document.getElementById('noteCustomerId').value = userId;
    document.getElementById('noteForm').reset();
    document.getElementById('noteModal').classList.remove('hidden');
}

// Save note
document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const noteData = {
        user_id: document.getElementById('noteCustomerId').value,
        note: document.getElementById('noteText').value,
        note_type: document.getElementById('noteType').value,
        priority: document.getElementById('notePriority').value,
        created_by: currentUser.id
    };
    
    try {
        const { error } = await supabaseClient
            .from('customer_notes')
            .insert([noteData]);
        
        if (error) throw error;
        
        alert('Note added successfully!');
        closeNoteModal();
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Error saving note: ' + error.message);
    }
});

// Close modals
function closeModal() {
    document.getElementById('customerModal').classList.add('hidden');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.add('hidden');
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();
    
    filteredCustomers = allCustomers.filter(customer => {
        if (statusFilter && customer.customer_status !== statusFilter) return false;
        
        if (searchTerm) {
            const matchesName = customer.name?.toLowerCase().includes(searchTerm);
            const matchesPhone = customer.phone?.includes(searchTerm);
            const matchesEmail = customer.email?.toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesPhone && !matchesEmail) return false;
        }
        
        return true;
    });
    
    applySorting();
    renderCustomers();
}

// Apply sorting
function applySorting() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredCustomers.sort((a, b) => {
        switch (sortBy) {
            case 'ltv_desc':
                return (b.lifetime_value || 0) - (a.lifetime_value || 0);
            case 'ltv_asc':
                return (a.lifetime_value || 0) - (b.lifetime_value || 0);
            case 'orders_desc':
                return (b.total_orders || 0) - (a.total_orders || 0);
            case 'recent':
                return new Date(b.last_order_date) - new Date(a.last_order_date);
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            default:
                return 0;
        }
    });
}

// Event listeners
document.getElementById('filterStatus').addEventListener('change', applyFilters);
document.getElementById('sortBy').addEventListener('change', () => {
    applySorting();
    renderCustomers();
});
document.getElementById('searchCustomer').addEventListener('input', applyFilters);

// Refresh
async function refreshCustomers() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;

    try {
        await loadCustomers();
    } finally {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }
}

// Close modal on outside click
document.getElementById('customerModal').addEventListener('click', (e) => {
    if (e.target.id === 'customerModal') closeModal();
});

document.getElementById('noteModal').addEventListener('click', (e) => {
    if (e.target.id === 'noteModal') closeNoteModal();
});

// Initialize
loadCustomers();
