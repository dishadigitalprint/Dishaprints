// Admin Inventory Management JavaScript
let currentUser = null;
let allInventory = [];
let filteredInventory = [];

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

// Load inventory
async function loadInventory() {
    try {
        const { data, error } = await supabaseClient
            .from('inventory')
            .select('*')
            .order('item_name');

        if (error) throw error;

        allInventory = data || [];
        filteredInventory = [...allInventory];
        renderInventory();
        updateStats();
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventoryTableBody').innerHTML = 
            '<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Error loading inventory</td></tr>';
    }
}

// Render inventory table
function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (filteredInventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No inventory items found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredInventory.map(item => {
        const isLowStock = item.quantity <= item.low_stock_threshold;
        const stockClass = isLowStock ? 'text-red-600 font-bold' : 'text-gray-900';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <p class="font-semibold text-gray-900">${item.item_name}</p>
                        ${item.description ? `<p class="text-sm text-gray-500">${item.description}</p>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">${item.item_type}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="${stockClass}">${item.quantity}</span>
                    ${isLowStock ? '<i class="fas fa-exclamation-triangle text-red-600 ml-2"></i>' : ''}
                </td>
                <td class="px-6 py-4 text-center text-gray-600">${item.unit}</td>
                <td class="px-6 py-4 text-center text-gray-900">₹${item.cost_price || 0}</td>
                <td class="px-6 py-4">
                    ${item.supplier_name ? `
                        <p class="text-sm text-gray-900">${item.supplier_name}</p>
                        <p class="text-xs text-gray-500">${item.supplier_contact || ''}</p>
                    ` : '<span class="text-gray-400">-</span>'}
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="showTransactionModal('${item.id}', '${item.item_name}')" 
                                class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button onclick="editItem('${item.id}')" 
                                class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteItem('${item.id}', '${item.item_name}')" 
                                class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update stats
async function updateStats() {
    document.getElementById('totalItems').textContent = allInventory.length;
    
    const lowStock = allInventory.filter(item => item.quantity <= item.low_stock_threshold);
    document.getElementById('lowStockItems').textContent = lowStock.length;
    
    // Get today's transactions
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabaseClient
            .from('inventory_transactions')
            .select('transaction_type, quantity')
            .gte('created_at', today);

        if (!error && data) {
            const stockIn = data.filter(t => t.transaction_type === 'in').reduce((sum, t) => sum + parseFloat(t.quantity), 0);
            const stockOut = data.filter(t => t.transaction_type === 'out').reduce((sum, t) => sum + parseFloat(t.quantity), 0);
            
            document.getElementById('stockInToday').textContent = Math.round(stockIn);
            document.getElementById('stockOutToday').textContent = Math.round(stockOut);
        }
    } catch (error) {
        console.error('Error loading transaction stats:', error);
    }
}

// Show add item modal
function showAddItemModal() {
    document.getElementById('modalTitle').textContent = 'Add Inventory Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemModal').classList.remove('hidden');
}

// Edit item
async function editItem(itemId) {
    const item = allInventory.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Inventory Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.item_name;
    document.getElementById('itemType').value = item.item_type;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemThreshold').value = item.low_stock_threshold;
    document.getElementById('itemCostPrice').value = item.cost_price || '';
    document.getElementById('itemSellingPrice').value = item.selling_price || '';
    document.getElementById('itemSupplierName').value = item.supplier_name || '';
    document.getElementById('itemSupplierContact').value = item.supplier_contact || '';
    
    document.getElementById('itemModal').classList.remove('hidden');
}

// Save item
document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemData = {
        item_name: document.getElementById('itemName').value,
        item_type: document.getElementById('itemType').value,
        description: document.getElementById('itemDescription').value,
        quantity: parseFloat(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value,
        low_stock_threshold: parseFloat(document.getElementById('itemThreshold').value) || 10,
        cost_price: parseFloat(document.getElementById('itemCostPrice').value) || null,
        selling_price: parseFloat(document.getElementById('itemSellingPrice').value) || null,
        supplier_name: document.getElementById('itemSupplierName').value || null,
        supplier_contact: document.getElementById('itemSupplierContact').value || null,
        updated_at: new Date().toISOString()
    };
    
    const itemId = document.getElementById('itemId').value;
    
    try {
        if (itemId) {
            // Update existing
            const { error } = await supabaseClient
                .from('inventory')
                .update(itemData)
                .eq('id', itemId);
            
            if (error) throw error;
            alert('Item updated successfully!');
        } else {
            // Insert new
            const { error } = await supabaseClient
                .from('inventory')
                .insert([itemData]);
            
            if (error) throw error;
            alert('Item added successfully!');
        }
        
        closeModal();
        await loadInventory();
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item: ' + error.message);
    }
});

// Delete item
async function deleteItem(itemId, itemName) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('inventory')
            .delete()
            .eq('id', itemId);
        
        if (error) throw error;
        
        alert('Item deleted successfully!');
        await loadInventory();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item: ' + error.message);
    }
}

// Show transaction modal
function showTransactionModal(itemId, itemName) {
    document.getElementById('transactionTitle').textContent = `Stock Transaction - ${itemName}`;
    document.getElementById('transactionItemId').value = itemId;
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionModal').classList.remove('hidden');
}

// Record transaction
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemId = document.getElementById('transactionItemId').value;
    const transactionType = document.getElementById('transactionType').value;
    const quantity = parseFloat(document.getElementById('transactionQuantity').value);
    const reason = document.getElementById('transactionReason').value;
    
    try {
        // Get current item
        const { data: item, error: itemError } = await supabaseClient
            .from('inventory')
            .select('quantity')
            .eq('id', itemId)
            .single();
        
        if (itemError) throw itemError;
        
        const previousQuantity = item.quantity;
        let newQuantity = previousQuantity;
        
        if (transactionType === 'in') {
            newQuantity = previousQuantity + quantity;
        } else if (transactionType === 'out') {
            newQuantity = previousQuantity - quantity;
        } else {
            newQuantity = quantity;
        }
        
        // Record transaction
        const { error: transError } = await supabaseClient
            .from('inventory_transactions')
            .insert([{
                inventory_id: itemId,
                transaction_type: transactionType,
                quantity: quantity,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                reason: reason,
                performed_by: currentUser.id
            }]);
        
        if (transError) throw transError;
        
        // Update inventory
        const { error: updateError } = await supabaseClient
            .from('inventory')
            .update({ 
                quantity: newQuantity,
                last_restocked: transactionType === 'in' ? new Date().toISOString() : undefined
            })
            .eq('id', itemId);
        
        if (updateError) throw updateError;
        
        alert('Transaction recorded successfully!');
        closeTransactionModal();
        await loadInventory();
    } catch (error) {
        console.error('Error recording transaction:', error);
        alert('Error recording transaction: ' + error.message);
    }
});

// Close modals
function closeModal() {
    document.getElementById('itemModal').classList.add('hidden');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.add('hidden');
}

// Filters
function applyFilters() {
    const category = document.getElementById('filterCategory').value;
    const stockFilter = document.getElementById('filterStock').value;
    const searchTerm = document.getElementById('searchItem').value.toLowerCase();
    
    filteredInventory = allInventory.filter(item => {
        if (category && item.item_type !== category) return false;
        
        if (stockFilter === 'low' && item.quantity > item.low_stock_threshold) return false;
        if (stockFilter === 'ok' && item.quantity <= item.low_stock_threshold) return false;
        
        if (searchTerm) {
            const matchesName = item.item_name.toLowerCase().includes(searchTerm);
            const matchesDesc = item.description?.toLowerCase().includes(searchTerm);
            const matchesSupplier = item.supplier_name?.toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesDesc && !matchesSupplier) return false;
        }
        
        return true;
    });
    
    renderInventory();
}

document.getElementById('filterCategory').addEventListener('change', applyFilters);
document.getElementById('filterStock').addEventListener('change', applyFilters);
document.getElementById('searchItem').addEventListener('input', applyFilters);

// Refresh
async function refreshInventory() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;

    try {
        await loadInventory();
    } finally {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }
}

// Initialize
loadInventory();
