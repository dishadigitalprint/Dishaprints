// Brochures Order Configuration with Auto Fold Detection

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
    'image/jpeg': '.jpg',
    'image/png': '.png'
};

// Pricing Configuration - Will be loaded from database
let BASE_PRICE_PER_UNIT = 8; // Default fallback
let GST_RATE = 0.05; // Default fallback
let configLoaded = false;

// State Management
const orderState = {
    uploadedFiles: [],
    configuration: {
        brochureSize: 'a4',
        pages: 4,
        foldType: 'bi-fold',
        paperQuality: '130gsm',
        finish: 'matte',
        quantity: 50
    },
    detectedFold: null,
    pricing: {
        basePrice: 400,
        paperPrice: 0,
        subtotal: 400,
        gst: 20,
        grandTotal: 420
    }
};

// DOM Elements
const configSection = document.getElementById('configuration-section');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadedFilesList = document.getElementById('uploaded-files-list');
const clickUpload = document.getElementById('click-upload');
const foldDetectionAlert = document.getElementById('fold-detection-alert');

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
            type: file.type
        };
        
        orderState.uploadedFiles.push(fileObj);
        renderUploadedFileCard(fileObj);
        validFilesCount++;
    });
    
    // Show configuration section if files uploaded
    if (validFilesCount > 0) {
        showConfigSection();
        detectFoldType();
        showToast(`${validFilesCount} file(s) uploaded successfully`, 'success');
    }
}

// Auto-detect fold type based on file characteristics
function detectFoldType() {
    // Simplified fold detection based on file name patterns
    // In production, this would analyze actual PDF dimensions and page count
    
    const firstFile = orderState.uploadedFiles[0];
    if (!firstFile) return;
    
    const fileName = firstFile.name.toLowerCase();
    let detectedFold = 'bi-fold'; // Default
    
    if (fileName.includes('trifold') || fileName.includes('tri-fold') || fileName.includes('letter')) {
        detectedFold = 'tri-fold';
    } else if (fileName.includes('zfold') || fileName.includes('z-fold') || fileName.includes('zigzag')) {
        detectedFold = 'z-fold';
    } else if (fileName.includes('flyer') || fileName.includes('single') || fileName.includes('poster')) {
        detectedFold = 'none';
    } else if (fileName.includes('bifold') || fileName.includes('bi-fold') || fileName.includes('half')) {
        detectedFold = 'bi-fold';
    }
    
    orderState.detectedFold = detectedFold;
    
    // Show detection alert
    const foldNames = {
        'bi-fold': 'Bi-fold (Half Fold)',
        'tri-fold': 'Tri-fold (Letter Fold)',
        'z-fold': 'Z-fold (Zigzag)',
        'none': 'No Fold (Flyer)'
    };
    
    document.getElementById('detected-fold-message').textContent = 
        `We detected a ${foldNames[detectedFold]} design based on your file. You can change this below.`;
    foldDetectionAlert.classList.remove('hidden');
    
    // Set the fold type dropdown
    document.getElementById('fold-type').value = detectedFold;
    orderState.configuration.foldType = detectedFold;
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
    
    let iconClass = 'fa-file';
    let iconColor = 'neutral';
    
    if (fileObj.type === 'application/pdf') {
        iconClass = 'fa-file-pdf';
        iconColor = 'danger';
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
                    <p class="text-xs text-neutral-600">${fileObj.size}</p>
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
        foldDetectionAlert.classList.add('hidden');
    }
}

function showConfigSection() {
    configSection.classList.remove('hidden');
    setTimeout(() => {
        configSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    updatePriceSummary();
}

// ===== CONFIGURATION HANDLERS =====

document.getElementById('brochure-size').addEventListener('change', (e) => {
    orderState.configuration.brochureSize = e.target.value;
    updatePriceSummary();
});

document.getElementById('pages').addEventListener('change', (e) => {
    orderState.configuration.pages = parseInt(e.target.value);
    updatePriceSummary();
});

document.getElementById('fold-type').addEventListener('change', (e) => {
    orderState.configuration.foldType = e.target.value;
    
    const foldNames = {
        'bi-fold': 'Bi-fold',
        'tri-fold': 'Tri-fold',
        'z-fold': 'Z-fold',
        'none': 'No Fold'
    };
    
    document.getElementById('summary-fold').textContent = foldNames[e.target.value];
    updatePriceSummary();
});

document.getElementById('paper-quality').addEventListener('change', (e) => {
    orderState.configuration.paperQuality = e.target.value;
    updatePriceSummary();
});

document.getElementById('finish').addEventListener('change', (e) => {
    orderState.configuration.finish = e.target.value;
    updatePriceSummary();
});

document.getElementById('quantity').addEventListener('change', (e) => {
    orderState.configuration.quantity = parseInt(e.target.value);
    updatePriceSummary();
});

// Quantity controls
const quantityOptions = [50, 100, 250, 500, 1000, 2500];

document.getElementById('decrease-qty').addEventListener('click', () => {
    const qtySelect = document.getElementById('quantity');
    const currentIndex = quantityOptions.indexOf(orderState.configuration.quantity);
    if (currentIndex > 0) {
        qtySelect.value = quantityOptions[currentIndex - 1];
        orderState.configuration.quantity = quantityOptions[currentIndex - 1];
        updatePriceSummary();
    }
});

document.getElementById('increase-qty').addEventListener('click', () => {
    const qtySelect = document.getElementById('quantity');
    const currentIndex = quantityOptions.indexOf(orderState.configuration.quantity);
    if (currentIndex < quantityOptions.length - 1) {
        qtySelect.value = quantityOptions[currentIndex + 1];
        orderState.configuration.quantity = quantityOptions[currentIndex + 1];
        updatePriceSummary();
    }
});

// ===== PRICE CALCULATION =====

function updatePriceSummary() {
    if (!configLoaded) return;
    
    const config = orderState.configuration;
    
    // Base price per unit
    const pricePerUnit = BASE_PRICE_PER_UNIT;
    
    // Get price modifiers from database
    const paperModifier = ConfigLoader.getPriceModifier('brochures', 'paper_type', config.paperQuality);
    const finishModifier = ConfigLoader.getPriceModifier('brochures', 'finish', config.finish);
    
    // Paper upcharge per unit
    const paperUpcharge = paperModifier + finishModifier;
    
    // Calculate base price
    const basePrice = (pricePerUnit * config.quantity);
    const paperPrice = (paperUpcharge * config.quantity);
    
    // Calculate totals
    const subtotal = basePrice + paperPrice;
    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;
    
    // Store in state
    orderState.pricing = {
        basePrice,
        paperPrice,
        subtotal,
        gst,
        grandTotal
    };
    
    // Update display
    document.getElementById('summary-quantity').textContent = `${config.quantity} brochures`;
    document.getElementById('base-price').textContent = `₹${basePrice.toFixed(2)}`;
    document.getElementById('paper-price').textContent = `₹${paperPrice.toFixed(2)}`;
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
    
    // Store order data
    const orderData = {
        productType: 'brochures',
        files: orderState.uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        configuration: orderState.configuration,
        detectedFold: orderState.detectedFold,
        pricing: orderState.pricing,
        timestamp: Date.now()
    };
    
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    showToast('Redirecting to checkout...', 'success');
    setTimeout(() => {
        window.location.href = 'checkout-address.html';
    }, 1000);
});

document.getElementById('add-to-cart').addEventListener('click', () => {
    if (orderState.uploadedFiles.length === 0) {
        showToast('Please upload at least one file', 'error');
        return;
    }
    
    // Get existing cart
    let cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    
    // Add current order with consistent structure
    const cartItem = {
        id: Date.now(),
        product: 'brochures',
        productName: 'Brochures',
        files: orderState.uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        configuration: { ...orderState.configuration },
        detectedFold: orderState.detectedFold,
        quantity: orderState.configuration.quantity,
        pricing: { ...orderState.pricing },
        total: orderState.pricing.grandTotal,
        addedAt: new Date().toISOString()
    };
    
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
    
    updateCartBadge();
    showToast('Added to cart successfully! Redirecting to products...', 'success');
    
    // Redirect to order selector to continue shopping
    setTimeout(() => {
        window.location.href = 'order.html';
    }, 1500);
});

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

// ===== TOAST NOTIFICATION =====

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

// ===== MOBILE MENU =====

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// ===== INITIALIZE =====

async function initializeBrochuresPage() {
    console.log('🔄 Initializing Brochures page...');
    
    // Load configuration from database
    const result = await ConfigLoader.initializeForProduct('brochures');
    
    if (result.success) {
        // Update pricing constants from database
        BASE_PRICE_PER_UNIT = ConfigLoader.getBasePrice('brochures');
        GST_RATE = ConfigLoader.getGSTRate('brochures');
        
        // Populate dropdowns with database config
        const brochureSizeSelect = document.getElementById('brochure-size');
        const pagesSelect = document.getElementById('pages');
        const foldTypeSelect = document.getElementById('fold-type');
        const paperQualitySelect = document.getElementById('paper-quality');
        const finishSelect = document.getElementById('finish');
        const quantitySelect = document.getElementById('quantity');
        
        // Populate dropdowns
        if (paperQualitySelect) ConfigLoader.populateDropdown(paperQualitySelect, 'brochures', 'paper_type');
        if (finishSelect) ConfigLoader.populateDropdown(finishSelect, 'brochures', 'finish');
        
        // Set default values
        orderState.configuration.brochureSize = brochureSizeSelect?.value || 'a4';
        orderState.configuration.pages = parseInt(pagesSelect?.value) || 4;
        orderState.configuration.foldType = foldTypeSelect?.value || 'bi-fold';
        orderState.configuration.paperQuality = paperQualitySelect?.value || '130gsm';
        orderState.configuration.finish = finishSelect?.value || 'matte';
        orderState.configuration.quantity = parseInt(quantitySelect?.value) || 50;
        
        configLoaded = true;
        console.log('✅ Configuration loaded successfully');
        console.log(`Base Price: ₹${BASE_PRICE_PER_UNIT} per brochure, GST: ${(GST_RATE * 100).toFixed(2)}%`);
    } else {
        console.error('❌ Failed to load configuration, using defaults');
        configLoaded = true; // Allow fallback
        showToast('Using default pricing. Admin configuration not available.', 'warning');
    }
    
    updateCartBadge();
    updatePriceSummary();
}

// Initialize on page load
initializeBrochuresPage();

console.log('Brochures page initialized with fold detection');
