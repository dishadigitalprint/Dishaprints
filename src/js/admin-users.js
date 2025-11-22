/**
 * Admin User Management - Disha Digital Prints
 * Add, edit, and manage users and admins
 */

let allUsers = [];
let currentEditingUserId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    displayAdminInfo();
    await loadUsers();
    setupEventListeners();
});

function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!user.loggedIn || user.role !== 'admin') {
        alert('Admin access required');
        window.location.href = 'login.html';
    }
}

function displayAdminInfo() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    document.getElementById('adminName').textContent = user.name || 'Admin';
    document.getElementById('adminPhone').textContent = user.phone || '';
}

function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    
    // Role filter
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    
    // Form submit
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
}

async function loadUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allUsers = data || [];
        updateStats();
        filterUsers();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

function updateStats() {
    const total = allUsers.length;
    const regular = allUsers.filter(u => u.role === 'user').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    
    document.getElementById('totalUsers').textContent = total;
    document.getElementById('regularUsers').textContent = regular;
    document.getElementById('adminUsers').textContent = admins;
}

function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    
    let filtered = allUsers;
    
    // Filter by role
    if (roleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(searchTerm) ||
            u.email?.toLowerCase().includes(searchTerm) ||
            u.phone.includes(searchTerm)
        );
    }
    
    renderUsersTable(filtered);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 block text-gray-300"></i>
                    <p class="text-lg font-medium">No users found</p>
                    <p class="text-sm">Try adjusting your filters or add a new user</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-${user.role === 'admin' ? 'purple' : 'blue'}-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-${user.role === 'admin' ? 'user-shield' : 'user'} text-${user.role === 'admin' ? 'purple' : 'blue'}-600"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-900">${user.name}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-700">${user.phone}</td>
            <td class="px-6 py-4 text-gray-700">${user.email || '<span class="text-gray-400">Not provided</span>'}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                }">
                    ${user.role === 'admin' ? 'Admin' : 'User'}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    user.phone_verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                }">
                    ${user.phone_verified ? 'Verified' : 'Unverified'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${formatDate(user.created_at)}
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="editUser('${user.id}')" 
                        class="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        title="Edit user">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleUserRole('${user.id}')" 
                        class="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                        title="Toggle role">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="deleteUser('${user.id}', '${user.name}')" 
                        class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        title="Delete user">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showAddUserModal() {
    currentEditingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('phoneVerified').checked = true;
    document.getElementById('userModal').classList.remove('hidden');
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentEditingUserId = userId;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userPhone').value = user.phone;
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('phoneVerified').checked = user.phone_verified;
    
    document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
    currentEditingUserId = null;
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;
    const phoneVerified = document.getElementById('phoneVerified').checked;
    
    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    try {
        if (userId) {
            // Update existing user
            const { error } = await supabaseClient
                .from('users')
                .update({
                    name,
                    phone,
                    email,
                    role,
                    phone_verified: phoneVerified,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (error) throw error;
            showToast('User updated successfully', 'success');
        } else {
            // Create new user
            // Check if phone already exists
            const { data: existing } = await supabaseClient
                .from('users')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();
            
            if (existing) {
                showToast('Phone number already registered', 'error');
                return;
            }
            
            const { error } = await supabaseClient
                .from('users')
                .insert([{
                    name,
                    phone,
                    email,
                    role,
                    phone_verified: phoneVerified
                }]);
            
            if (error) throw error;
            showToast('User created successfully', 'success');
        }
        
        closeUserModal();
        await loadUsers();
        
    } catch (error) {
        console.error('Error saving user:', error);
        showToast('Failed to save user: ' + error.message, 'error');
    }
}

async function toggleUserRole(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = user.role === 'admin' 
        ? `Remove admin privileges from ${user.name}?`
        : `Grant admin privileges to ${user.name}?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        showToast(`User role changed to ${newRole}`, 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user role:', error);
        showToast('Failed to update user role', 'error');
    }
}

async function deleteUser(userId, userName) {
    const currentUser = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    // Prevent deleting yourself
    if (userId === currentUser.id) {
        showToast('You cannot delete your own account', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        showToast('User deleted successfully', 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user: ' + error.message, 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userSession');
        window.location.href = 'login.html';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    
    // Set icon and color based on type
    const icons = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        info: 'fa-info-circle text-blue-500'
    };
    
    icon.className = `fas ${icons[type] || icons.info}`;
    msg.textContent = message;
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}