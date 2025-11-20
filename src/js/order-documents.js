// A4 Document Order Configuration and Upload Handler
// Follows Edu Dashboard Design Tokens

// Check authentication before anything else
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!user.phoneVerified || !user.loggedIn) {
        alert('Please login to place orders');
        window.location.href = `login.html?return=${encodeURIComponent(window.location.pathname)}`;
        return false;
    }
    return true;
}

// Run auth check immediately
if (!checkAuthentication()) {
    throw new Error('Authentication required');
}

// Design Token Constants
const TRANSITION_FAST = 120;
const TRANSITION_BASE = 200;
const TRANSITION_SLOW = 320;

// File Upload Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png'
};

// Pricing Configuration - Will be loaded from database
let BASE_PRICE_PER_PAGE = 2; // Default fallback
let GST_RATE = 0.05; // Default fallback
let configLoaded = false;

// State Management
const orderState = {
    uploadedFiles: [],
    configuration: {
        paperSize: 'a4',
        colorMode: 'bw',
        printSides: 'single',
        quantity: 1,
        paperQuality: '70gsm',
        binding: 'none'
    },
    totalPages: 0,
    pricing: {
        basePrice: 0,
        bindingPrice: 0,
        subtotal: 0,
        gst: 0,
        grandTotal: 0
    }
};

// DOM Elements
const configSection = document.getElementById('configuration-section');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadedFilesList = document.getElementById('uploaded-files-list');
const clickUpload = document.getElementById('click-upload');

// ===== FILE UPLOAD HANDLERS =====

dropzone.addEventListener('click', () => {
    fileInput.click();
});

clickUpload.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-primary-600', 'bg-primary-100');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-primary-600', 'bg-primary-100');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-primary-600', 'bg-primary-100');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

function handleFiles(files) {
    let validFilesCount = 0;

    files.forEach(file => {
        // Validate file type
        if (!ALLOWED_TYPES[file.type]) {
            showToast(`File type not supported: ${file.name}`, 'error');
            return;
        }
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            showToast(`File too large (max 50MB): ${file.name}`, 'error');
            return;
        }
        
        // Add to state
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            pages: estimatePages(file),
            type: file.type
        };
        
        orderState.uploadedFiles.push(fileObj);
        renderUploadedFileCard(fileObj);
        validFilesCount++;
    });
    
    // Show configuration section if files uploaded
    if (validFilesCount > 0) {
        calculateTotalPages();
        showConfigSection();
        showToast(`${validFilesCount} file(s) uploaded successfully`, 'success');
    }
}

function estimatePages(file) {
    // Simple estimation based on file size
    // For PDFs: ~50KB per page average
    // For images: 1 page per image
    // For DOCs: ~30KB per page average
    if (file.type === 'application/pdf') {
        return Math.max(1, Math.ceil(file.size / (50 * 1024)));
    } else if (file.type.includes('word')) {
        return Math.max(1, Math.ceil(file.size / (30 * 1024)));
    } else if (file.type.includes('image')) {
        return 1;
    }
    return 1;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function renderUploadedFileCard(fileObj) {
    const fileCard = document.createElement('div');
    fileCard.className = 'bg-neutral-50 rounded-md border border-neutral-200 p-5 mb-4';
    fileCard.dataset.id = fileObj.id;
    
    // Determine icon based on file type
    let iconClass = 'fa-file';
    let iconColor = 'neutral';
    
    if (fileObj.type === 'application/pdf') {
        iconClass = 'fa-file-pdf';
        iconColor = 'danger';
    } else if (fileObj.type.includes('word')) {
        iconClass = 'fa-file-word';
        iconColor = 'info';
    } else if (fileObj.type.includes('image')) {
        iconClass = 'fa-file-image';
        iconColor = 'accentA';
    }
    
    fileCard.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-${iconColor}-100 rounded flex items-center justify-center">
                    <i class="fas ${iconClass} text-${iconColor}-600"></i>
                </div>
                <div>
                    <p class="text-sm font-semibold text-neutral-900">${fileObj.name}</p>
                    <p class="text-xs text-neutral-600">${fileObj.size} • ${fileObj.pages} pages (estimated)</p>
                </div>
            </div>
            <button class="remove-file text-neutral-500 hover:text-danger-600 transition-colors duration-${TRANSITION_FAST}" data-id="${fileObj.id}" aria-label="Remove file">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    uploadedFilesList.appendChild(fileCard);
    
    // Add remove handler
    fileCard.querySelector('.remove-file').addEventListener('click', () => {
        removeFile(fileObj.id);
    });
}

function removeFile(fileId) {
    orderState.uploadedFiles = orderState.uploadedFiles.filter(f => f.id !== fileId);
    const fileCard = uploadedFilesList.querySelector(`[data-id="${fileId}"]`);
    if (fileCard) {
        fileCard.remove();
    }
    
    if (orderState.uploadedFiles.length === 0) {
        configSection.classList.add('hidden');
        uploadedFilesList.innerHTML = '';
    } else {
        calculateTotalPages();
        updatePriceSummary();
    }
}

function calculateTotalPages() {
    orderState.totalPages = orderState.uploadedFiles.reduce((sum, file) => sum + file.pages, 0);
    document.getElementById('total-pages').textContent = orderState.totalPages;
}

function showConfigSection() {
    configSection.classList.remove('hidden');
    setTimeout(() => {
        configSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    updatePriceSummary();
}

// ===== CONFIGURATION HANDLERS =====

document.getElementById('paper-size').addEventListener('change', (e) => {
    orderState.configuration.paperSize = e.target.value;
    updatePriceSummary();
});

document.getElementById('color-mode').addEventListener('change', (e) => {
    orderState.configuration.colorMode = e.target.value;
    updatePriceSummary();
});

document.getElementById('print-sides').addEventListener('change', (e) => {
    orderState.configuration.printSides = e.target.value;
    updatePriceSummary();
});

document.getElementById('paper-quality').addEventListener('change', (e) => {
    orderState.configuration.paperQuality = e.target.value;
    updatePriceSummary();
});

document.getElementById('quantity').addEventListener('input', (e) => {
    orderState.configuration.quantity = parseInt(e.target.value) || 1;
    document.getElementById('summary-quantity').textContent = orderState.configuration.quantity;
    updatePriceSummary();
});

document.querySelectorAll('input[name="binding"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        orderState.configuration.binding = e.target.value;
        updatePriceSummary();
    });
});

// ===== QUANTITY CONTROLS =====

document.getElementById('decrease-qty').addEventListener('click', () => {
    const qtyInput = document.getElementById('quantity');
    const currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
        orderState.configuration.quantity = currentQty - 1;
        document.getElementById('summary-quantity').textContent = currentQty - 1;
        updatePriceSummary();
    }
});

document.getElementById('increase-qty').addEventListener('click', () => {
    const qtyInput = document.getElementById('quantity');
    const currentQty = parseInt(qtyInput.value);
    if (currentQty < 1000) {
        qtyInput.value = currentQty + 1;
        orderState.configuration.quantity = currentQty + 1;
        document.getElementById('summary-quantity').textContent = currentQty + 1;
        updatePriceSummary();
    }
});

// ===== PRICE CALCULATION =====

function updatePriceSummary() {
    if (orderState.uploadedFiles.length === 0 || !configLoaded) {
        return;
    }
    
    const config = orderState.configuration;
    
    // Get base price from config
    let pricePerPage = BASE_PRICE_PER_PAGE;
    
    // Add price modifiers from config
    pricePerPage += ConfigLoader.getPriceModifier('documents', 'color', config.colorMode);
    pricePerPage += ConfigLoader.getPriceModifier('documents', 'paper_type', config.paperQuality);
    pricePerPage += ConfigLoader.getPriceModifier('documents', 'sides', config.printSides);
    
    // Calculate base price (per page × total pages × quantity)
    const basePrice = pricePerPage * orderState.totalPages * config.quantity;
    
    // Binding price (per copy)
    const bindingModifier = ConfigLoader.getPriceModifier('documents', 'binding', config.binding);
    const bindingPrice = bindingModifier * config.quantity;
    
    // Calculate totals
    const subtotal = basePrice + bindingPrice;
    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;
    
    // Store in state
    orderState.pricing = {
        basePrice,
        bindingPrice,
        subtotal,
        gst,
        grandTotal
    };
    
    // Update display
    document.getElementById('base-price').textContent = `₹${basePrice.toFixed(2)}`;
    document.getElementById('binding-price').textContent = `₹${bindingPrice.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
}

// ===== CHECKOUT & CART ACTIONS =====

document.getElementById('proceed-checkout').addEventListener('click', () => {
    if (orderState.uploadedFiles.length === 0) {
        showToast('Please upload at least one file', 'error');
        return;
    }
    
    // Store order data in sessionStorage
    const orderData = {
        productType: 'documents',
        files: orderState.uploadedFiles.map(f => ({ 
            name: f.name, 
            size: f.size, 
            pages: f.pages 
        })),
        configuration: orderState.configuration,
        totalPages: orderState.totalPages,
        pricing: orderState.pricing,
        timestamp: Date.now()
    };
    
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Redirect to checkout
    showToast('Redirecting to checkout...', 'success');
    setTimeout(() => {
        window.location.href = 'checkout-address.html';
    }, 1000);
});

function resetOrderForm() {
    // Clear uploaded files
    orderState.uploadedFiles = [];
    uploadedFilesList.innerHTML = '';
    
    // Reset configuration to defaults
    orderState.configuration = {
        paperSize: 'a4',
        colorMode: 'bw',
        printSides: 'single',
        quantity: 1,
        paperQuality: '70gsm',
        binding: 'none'
    };
    
    // Reset form inputs
    document.getElementById('paper-size').value = 'a4';
    document.getElementById('color-mode').value = 'bw';
    document.getElementById('print-sides').value = 'single';
    document.getElementById('paper-quality').value = '70gsm';
    document.getElementById('quantity').value = 1;
    document.querySelector('input[name="binding"][value="none"]').checked = true;
    
    // Hide configuration section
    configSection.classList.add('hidden');
    
    // Reset file input
    fileInput.value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TOAST NOTIFICATION SYSTEM =====

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-7 right-7 z-50 px-6 py-4 rounded-md shadow-lg text-white font-medium transition-all duration-${TRANSITION_BASE}`;
    
    const colors = {
        'info': 'bg-info-500',
        'success': 'bg-accentA-600',
        'error': 'bg-danger-600',
        'warning': 'bg-accentB-500'
    };
    
    toast.classList.add(colors[type] || colors.info);
    
    // Add icon based on type
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
        setTimeout(() => toast.remove(), TRANSITION_BASE);
    }, 3000);
}

// ===== MOBILE MENU TOGGLE =====

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// ===== CART BADGE UPDATE =====

function updateCartBadge() {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const count = cart.length;
    
    const badge = document.getElementById('cart-badge');
    const mobileCount = document.getElementById('mobile-cart-count');
    
    if (badge) {
        if (count > 0) {
            badge.classList.remove('hidden');
            badge.textContent = count;
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (mobileCount) {
        mobileCount.textContent = count > 0 ? count : '0';
    }
    
    console.log(`Cart updated: ${count} items`);
}

// ===== ADD TO CART FUNCTIONALITY =====

function addToCart() {
    if (orderState.uploadedFiles.length === 0) {
        showToast('Please upload files before adding to cart', 'error');
        return;
    }

    if (orderState.totalPages === 0) {
        showToast('No pages detected in uploaded files', 'error');
        return;
    }

    // Get cart from session storage
    let cart = sessionStorage.getItem('cart');
    cart = cart ? JSON.parse(cart) : [];

    // Create cart item
    const cartItem = {
        id: Date.now(),
        product: 'documents',
        productName: 'A4 Documents',
        files: orderState.uploadedFiles.map(f => ({ name: f.name, pages: f.pages })),
        configuration: { ...orderState.configuration },
        pages: orderState.totalPages,
        copies: orderState.configuration.quantity,
        pricing: { ...orderState.pricing },
        total: orderState.pricing.grandTotal,
        addedAt: new Date().toISOString()
    };

    // Add to cart
    cart.push(cartItem);
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Track cart activity
    if (typeof CartTracker !== 'undefined') {
        CartTracker.trackItemAdded(cartItem);
    }
    
    // Send silent WhatsApp notification to admin
    if (typeof activityLogger !== 'undefined') {
        const cartTotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
        activityLogger.logAddToCart(cartTotal, cart.length);
    }

    // Update badge
    updateCartBadge();

    // Show success message with action info
    showToast(`Added ${orderState.totalPages} pages to cart! Redirecting to products...`, 'success');

    // Redirect to order selector to continue shopping
    setTimeout(() => {
        window.location.href = 'order.html';
    }, 1500);
}

// Attach Add to Cart button handler
document.getElementById('add-to-cart')?.addEventListener('click', addToCart);

// ===== INITIALIZE =====

async function initializeDocumentsPage() {
    console.log('🔄 Initializing Order Documents page...');
    
    // Load configuration from database
    const result = await ConfigLoader.initializeForProduct('documents');
    
    if (result.success) {
        // Update pricing constants from database
        BASE_PRICE_PER_PAGE = ConfigLoader.getBasePrice('documents');
        GST_RATE = ConfigLoader.getGSTRate('documents');
        
        // Populate dropdowns with database config
        const paperSizeSelect = document.getElementById('paper-size');
        const colorModeSelect = document.getElementById('color-mode');
        const printSidesSelect = document.getElementById('print-sides');
        const paperQualitySelect = document.getElementById('paper-quality');
        
        // Populate dropdowns
        if (paperSizeSelect) ConfigLoader.populateDropdown(paperSizeSelect, 'documents', 'paper_size');
        if (colorModeSelect) ConfigLoader.populateDropdown(colorModeSelect, 'documents', 'color');
        if (printSidesSelect) ConfigLoader.populateDropdown(printSidesSelect, 'documents', 'sides');
        if (paperQualitySelect) ConfigLoader.populateDropdown(paperQualitySelect, 'documents', 'paper_type');
        
        // Populate binding options (radio buttons)
        const bindingContainer = document.querySelector('[name="binding"]')?.closest('.grid');
        if (bindingContainer) {
            const bindingOptions = ConfigLoader.getConfigOptions('documents', 'binding');
            if (bindingOptions.length > 0) {
                bindingContainer.innerHTML = bindingOptions.map((opt, index) => `
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="binding" value="${opt.value}" ${index === 0 ? 'checked' : ''} class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <span class="text-sm text-neutral-900">${opt.label}</span>
                        ${opt.priceModifier > 0 ? `<span class="text-xs text-neutral-600">(+₹${opt.priceModifier})</span>` : ''}
                    </label>
                `).join('');
                
                // Re-attach event listeners
                document.querySelectorAll('input[name="binding"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        orderState.configuration.binding = e.target.value;
                        updatePriceSummary();
                    });
                });
            }
        }
        
        // Set default values from first option
        orderState.configuration.paperSize = paperSizeSelect?.value || 'a4';
        orderState.configuration.colorMode = colorModeSelect?.value || 'bw';
        orderState.configuration.printSides = printSidesSelect?.value || 'single';
        orderState.configuration.paperQuality = paperQualitySelect?.value || '80gsm';
        orderState.configuration.binding = document.querySelector('input[name="binding"]:checked')?.value || 'none';
        
        configLoaded = true;
        console.log('✅ Configuration loaded successfully');
        console.log(`Base Price: ₹${BASE_PRICE_PER_PAGE} per page, GST: ${(GST_RATE * 100).toFixed(2)}%`);
    } else {
        console.error('❌ Failed to load configuration, using defaults');
        configLoaded = true; // Allow fallback
        showToast('Using default pricing. Admin configuration not available.', 'warning');
    }
    
    updateCartBadge();
    
    // Check if there's a pending cart notification
    if (sessionStorage.getItem('showCartNotification') === 'true') {
        showToast('Continue shopping or proceed to checkout', 'info');
        sessionStorage.removeItem('showCartNotification');
    }
}

// Initialize on page load
initializeDocumentsPage();

console.log('Order Documents page initialized with Edu Dashboard design tokens');
