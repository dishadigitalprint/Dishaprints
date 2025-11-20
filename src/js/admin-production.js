// Admin Production Queue JavaScript
let currentUser = null;
let allJobs = [];
let filteredJobs = [];

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

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const badges = {
        'queued': 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'quality-check': 'bg-purple-100 text-purple-800',
        'completed': 'bg-green-100 text-green-800',
        'on-hold': 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityBadge(priority) {
    if (priority >= 2) return 'bg-red-100 text-red-800 border-2 border-red-600';
    if (priority >= 1) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
}

function getPriorityText(priority) {
    if (priority >= 2) return 'URGENT';
    if (priority >= 1) return 'HIGH';
    return 'Normal';
}

// Load production queue
async function loadQueue() {
    try {
        const { data, error } = await supabaseClient
            .from('production_status')
            .select('*');

        if (error) throw error;

        allJobs = data || [];
        filteredJobs = [...allJobs];
        renderQueue();
        updateStats();
    } catch (error) {
        console.error('Error loading production queue:', error);
        document.getElementById('queueContainer').innerHTML = 
            '<p class="text-center text-red-500 py-8">Error loading production queue</p>';
    }
}

// Update stats
async function updateStats() {
    const queued = allJobs.filter(j => j.status === 'queued');
    const inProgress = allJobs.filter(j => j.status === 'in-progress');
    const qualityCheck = allJobs.filter(j => j.status === 'quality-check');
    const onHold = allJobs.filter(j => j.status === 'on-hold');
    
    document.getElementById('queuedJobs').textContent = queued.length;
    document.getElementById('inProgressJobs').textContent = inProgress.length;
    document.getElementById('qualityCheckJobs').textContent = qualityCheck.length;
    document.getElementById('onHoldJobs').textContent = onHold.length;
    
    // Get completed today
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabaseClient
            .from('production_queue')
            .select('id')
            .eq('status', 'completed')
            .gte('actual_completion', today);

        if (!error && data) {
            document.getElementById('completedToday').textContent = data.length;
        }
    } catch (error) {
        console.error('Error loading completed jobs:', error);
    }
}

// Render queue
function renderQueue() {
    const container = document.getElementById('queueContainer');
    
    if (filteredJobs.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No jobs in queue</p>';
        return;
    }

    container.innerHTML = filteredJobs.map(job => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${job.priority >= 2 ? 'border-l-4 border-l-red-600' : job.priority >= 1 ? 'border-l-4 border-l-orange-600' : ''}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-bold text-gray-900">${job.order_number}</h3>
                        <span class="px-3 py-1 text-sm rounded-full ${getStatusBadge(job.status)}">
                            ${job.status.replace('-', ' ').toUpperCase()}
                        </span>
                        ${job.priority > 0 ? `
                            <span class="px-3 py-1 text-sm rounded-full ${getPriorityBadge(job.priority)}">
                                ${getPriorityText(job.priority)}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-600"><i class="fas fa-user mr-2"></i><strong>Customer:</strong> ${job.customer_name}</p>
                            <p class="text-gray-600"><i class="fas fa-phone mr-2"></i>+91 ${job.customer_phone}</p>
                        </div>
                        <div>
                            <p class="text-gray-600"><i class="fas fa-box mr-2"></i><strong>Product:</strong> ${job.product_name}</p>
                            <p class="text-gray-600"><i class="fas fa-hashtag mr-2"></i><strong>Quantity:</strong> ${job.quantity}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                            <p class="text-gray-600"><i class="fas fa-calendar mr-2"></i><strong>Order Date:</strong></p>
                            <p class="text-gray-900">${formatDate(job.order_date)}</p>
                        </div>
                        ${job.assigned_to ? `
                            <div>
                                <p class="text-gray-600"><i class="fas fa-user-check mr-2"></i><strong>Assigned To:</strong></p>
                                <p class="text-gray-900">${job.assigned_to}</p>
                            </div>
                        ` : '<div></div>'}
                        ${job.estimated_completion ? `
                            <div>
                                <p class="text-gray-600"><i class="fas fa-clock mr-2"></i><strong>Est. Completion:</strong></p>
                                <p class="text-gray-900">${formatDate(job.estimated_completion)}</p>
                            </div>
                        ` : '<div></div>'}
                    </div>
                    
                    ${job.notes ? `
                        <div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p class="text-sm text-gray-700"><i class="fas fa-sticky-note mr-2"></i>${job.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="updateJob('${job.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <i class="fas fa-edit mr-2"></i>Update
                </button>
                <button onclick="viewOrder('${job.order_id}')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    <i class="fas fa-eye mr-2"></i>View Order
                </button>
                <button onclick="markCompleted('${job.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    <i class="fas fa-check mr-2"></i>Mark Complete
                </button>
            </div>
        </div>
    `).join('');
}

// Update job
async function updateJob(jobId) {
    try {
        const { data, error } = await supabaseClient
            .from('production_queue')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) throw error;

        const job = data;
        document.getElementById('jobId').value = job.id;
        document.getElementById('jobStatus').value = job.status;
        document.getElementById('jobPriority').value = job.priority;
        document.getElementById('jobAssignee').value = job.assigned_to || '';
        document.getElementById('jobNotes').value = job.notes || '';
        
        if (job.estimated_completion) {
            const date = new Date(job.estimated_completion);
            document.getElementById('jobEstimated').value = date.toISOString().slice(0, 16);
        }
        
        document.getElementById('jobModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading job:', error);
        alert('Error loading job details');
    }
}

// Save job updates
document.getElementById('jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const jobId = document.getElementById('jobId').value;
    const jobData = {
        status: document.getElementById('jobStatus').value,
        priority: parseInt(document.getElementById('jobPriority').value),
        assigned_to: document.getElementById('jobAssignee').value || null,
        estimated_completion: document.getElementById('jobEstimated').value || null,
        notes: document.getElementById('jobNotes').value || null,
        updated_at: new Date().toISOString()
    };
    
    if (jobData.status === 'completed') {
        jobData.actual_completion = new Date().toISOString();
    }
    
    try {
        const { error } = await supabaseClient
            .from('production_queue')
            .update(jobData)
            .eq('id', jobId);
        
        if (error) throw error;
        
        alert('Job updated successfully!');
        closeModal();
        await loadQueue();
    } catch (error) {
        console.error('Error updating job:', error);
        alert('Error updating job: ' + error.message);
    }
});

// Mark as completed
async function markCompleted(jobId) {
    if (!confirm('Mark this job as completed?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('production_queue')
            .update({
                status: 'completed',
                actual_completion: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        
        if (error) throw error;
        
        alert('Job marked as completed!');
        await loadQueue();
    } catch (error) {
        console.error('Error completing job:', error);
        alert('Error completing job: ' + error.message);
    }
}

// View order
function viewOrder(orderId) {
    window.location.href = `admin-orders.html?order=${orderId}`;
}

// Close modal
function closeModal() {
    document.getElementById('jobModal').classList.add('hidden');
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
    
    filteredJobs = allJobs.filter(job => {
        if (statusFilter && job.status !== statusFilter) return false;
        
        if (priorityFilter === 'high' && job.priority < 1) return false;
        if (priorityFilter === 'normal' && job.priority >= 1) return false;
        
        if (searchTerm) {
            const matchesOrder = job.order_number.toLowerCase().includes(searchTerm);
            const matchesCustomer = job.customer_name.toLowerCase().includes(searchTerm);
            const matchesPhone = job.customer_phone.includes(searchTerm);
            
            if (!matchesOrder && !matchesCustomer && !matchesPhone) return false;
        }
        
        return true;
    });
    
    renderQueue();
}

document.getElementById('filterStatus').addEventListener('change', applyFilters);
document.getElementById('filterPriority').addEventListener('change', applyFilters);
document.getElementById('searchOrder').addEventListener('input', applyFilters);

// Refresh
async function refreshQueue() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    
    icon.classList.add('fa-spin');
    btn.disabled = true;

    try {
        await loadQueue();
    } finally {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }
}

// Close modal on outside click
document.getElementById('jobModal').addEventListener('click', (e) => {
    if (e.target.id === 'jobModal') closeModal();
});

// Initialize
loadQueue();

// Auto-refresh every 2 minutes
setInterval(loadQueue, 2 * 60 * 1000);
