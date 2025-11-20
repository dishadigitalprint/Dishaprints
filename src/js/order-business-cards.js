// Business Cards Order Configuration and Upload Handler
// Supports both file upload and template selection

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
    'image/png': '.png',
    'application/postscript': '.ai'
};

// Pricing Configuration - Will be loaded from database
let BASE_PRICE = 300; // Default fallback
let GST_RATE = 0.05; // Default fallback
let configLoaded = false;

// Template Data
const TEMPLATES = [
    { id: 1, name: 'Modern Corporate', category: 'corporate', preview: 'template-1.jpg' },
    { id: 2, name: 'Executive Blue', category: 'corporate', preview: 'template-2.jpg' },
    { id: 3, name: 'Professional Gray', category: 'corporate', preview: 'template-3.jpg' },
    { id: 4, name: 'Classic Black', category: 'corporate', preview: 'template-4.jpg' },
    { id: 5, name: 'Colorful Creative', category: 'creative', preview: 'template-5.jpg' },
    { id: 6, name: 'Artistic Designer', category: 'creative', preview: 'template-6.jpg' },
    { id: 7, name: 'Vibrant Bold', category: 'creative', preview: 'template-7.jpg' },
    { id: 8, name: 'Clean Minimalist', category: 'minimalist', preview: 'template-8.jpg' },
    { id: 9, name: 'Simple White', category: 'minimalist', preview: 'template-9.jpg' },
    { id: 10, name: 'Elegant Minimal', category: 'minimalist', preview: 'template-10.jpg' },
    { id: 11, name: 'Bold Typography', category: 'bold', preview: 'template-11.jpg' },
    { id: 12, name: 'Striking Red', category: 'bold', preview: 'template-12.jpg' },
    { id: 13, name: 'Dark Contrast', category: 'bold', preview: 'template-13.jpg' },
    { id: 14, name: 'Tech Startup', category: 'corporate', preview: 'template-14.jpg' },
    { id: 15, name: 'Geometric Pattern', category: 'creative', preview: 'template-15.jpg' },
    { id: 16, name: 'Luxury Gold', category: 'bold', preview: 'template-16.jpg' },
    { id: 17, name: 'Fresh Green', category: 'creative', preview: 'template-17.jpg' },
    { id: 18, name: 'Pastel Soft', category: 'minimalist', preview: 'template-18.jpg' },
    { id: 19, name: 'Corporate Pro', category: 'corporate', preview: 'template-19.jpg' },
    { id: 20, name: 'Modern Edge', category: 'bold', preview: 'template-20.jpg' }
];

// State Management
const orderState = {
    designMethod: null, // 'upload' or 'template'
    uploadedFiles: [],
    selectedTemplate: null,
    configuration: {
        cardSize: 'standard',
        material: '300gsm',
        finish: 'matte',
        corners: 'sharp',
        printSides: 'single',
        quantity: 100
    },
    pricing: {
        basePrice: 300,
        materialPrice: 0,
        subtotal: 300,
        gst: 15,
        grandTotal: 315
    }
};

// DOM Elements
const designMethodSection = document.getElementById('design-method-section');
const uploadSection = document.getElementById('upload-section');
const templateGallerySection = document.getElementById('template-gallery-section');
const configSection = document.getElementById('configuration-section');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const designPreviewSection = document.getElementById('design-preview-section');
const templateGrid = document.getElementById('template-grid');

// ===== DESIGN METHOD SELECTION =====

document.getElementById('upload-design-btn').addEventListener('click', () => {
    orderState.designMethod = 'upload';
    designMethodSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
});

document.getElementById('choose-template-btn').addEventListener('click', () => {
    orderState.designMethod = 'template';
    designMethodSection.classList.add('hidden');
    templateGallerySection.classList.remove('hidden');
    renderTemplates('all');
});

document.getElementById('back-to-method').addEventListener('click', () => {
    uploadSection.classList.add('hidden');
    designMethodSection.classList.remove('hidden');
    orderState.designMethod = null;
});

document.getElementById('back-to-method-gallery').addEventListener('click', () => {
    templateGallerySection.classList.add('hidden');
    designMethodSection.classList.remove('hidden');
    orderState.designMethod = null;
});

// ===== TEMPLATE GALLERY =====

function renderTemplates(category) {
    const filteredTemplates = category === 'all' 
        ? TEMPLATES 
        : TEMPLATES.filter(t => t.category === category);

    templateGrid.innerHTML = filteredTemplates.map(template => `
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer template-card" data-template-id="${template.id}">
            <div class="aspect-[3/2] bg-gradient-to-br from-primary-100 to-info-100 flex items-center justify-center">
                <i class="fas fa-image text-4xl text-primary-300"></i>
            </div>
            <div class="p-4">
                <h4 class="text-sm font-semibold text-neutral-900 mb-1">${template.name}</h4>
                <span class="text-xs text-neutral-600 capitalize">${template.category}</span>
            </div>
        </div>
    `).join('');

    // Add click handlers to template cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const templateId = parseInt(card.dataset.templateId);
            selectTemplate(templateId);
        });
    });
}

// Template category filter
document.querySelectorAll('.template-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.template-category-btn').forEach(b => {
            b.classList.remove('active', 'bg-primary-600', 'text-white');
            b.classList.add('bg-white', 'border', 'border-neutral-200', 'text-neutral-700');
        });
        btn.classList.add('active', 'bg-primary-600', 'text-white');
        btn.classList.remove('bg-white', 'border', 'border-neutral-200', 'text-neutral-700');

        // Render templates for selected category
        const category = btn.dataset.category;
        renderTemplates(category);
    });
});

function selectTemplate(templateId) {
    const template = TEMPLATES.find(t => t.id === templateId);
    orderState.selectedTemplate = template;

    // Hide gallery, show config
    templateGallerySection.classList.add('hidden');
    configSection.classList.remove('hidden');

    // Render template preview
    renderTemplatePreview(template);
    updatePriceSummary();

    showToast(`Template "${template.name}" selected`, 'success');
}

function renderTemplatePreview(template) {
    designPreviewSection.innerHTML = `
        <div class="bg-neutral-50 rounded-md border border-neutral-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-neutral-900">Selected Template</h3>
                <button id="change-template" class="text-xs text-primary-600 hover:text-primary-700 transition-colors">
                    <i class="fas fa-edit mr-1"></i>Change
                </button>
            </div>
            <div class="aspect-[16/9] bg-gradient-to-br from-primary-100 to-info-100 rounded-md flex items-center justify-center mb-3">
                <div class="text-center">
                    <i class="fas fa-address-card text-5xl text-primary-400 mb-3"></i>
                    <p class="text-sm font-medium text-neutral-700">${template.name}</p>
                    <p class="text-xs text-neutral-600 capitalize">${template.category} Design</p>
                </div>
            </div>
            <button id="customize-template" class="w-full h-10 bg-info-600 text-white rounded-md text-sm font-medium hover:bg-info-700 transition-colors duration-200">
                <i class="fas fa-paint-brush mr-2"></i>Customize Template
            </button>
        </div>
    `;

    // Add change template handler
    document.getElementById('change-template').addEventListener('click', () => {
        configSection.classList.add('hidden');
        templateGallerySection.classList.remove('hidden');
        orderState.selectedTemplate = null;
    });

    // Add customize handler (placeholder for future feature)
    document.getElementById('customize-template').addEventListener('click', () => {
        showToast('Template customization coming soon!', 'info');
    });
}

// ===== FILE UPLOAD HANDLERS =====

dropzone.addEventListener('click', () => {
    fileInput.click();
});

document.getElementById('click-upload').addEventListener('click', (e) => {
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
        validFilesCount++;
    });
    
    // Show configuration section if files uploaded
    if (validFilesCount > 0) {
        uploadSection.classList.add('hidden');
        configSection.classList.remove('hidden');
        renderUploadedFiles();
        updatePriceSummary();
        showToast(`${validFilesCount} file(s) uploaded successfully`, 'success');
    }
}

function renderUploadedFiles() {
    designPreviewSection.innerHTML = `
        <div class="bg-neutral-50 rounded-md border border-neutral-200 p-5">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-neutral-900">Uploaded Design Files</h3>
                <button id="upload-more" class="text-xs text-primary-600 hover:text-primary-700 transition-colors">
                    <i class="fas fa-plus mr-1"></i>Add More
                </button>
            </div>
            <div class="space-y-3" id="uploaded-files-list">
                ${orderState.uploadedFiles.map(file => `
                    <div class="flex items-center justify-between bg-white rounded p-3 border border-neutral-200" data-file-id="${file.id}">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                                <i class="fas fa-file-image text-primary-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-neutral-900">${file.name}</p>
                                <p class="text-xs text-neutral-600">${file.size}</p>
                            </div>
                        </div>
                        <button class="remove-file text-neutral-500 hover:text-danger-600 transition-colors" data-file-id="${file.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add upload more handler
    document.getElementById('upload-more').addEventListener('click', () => {
        fileInput.click();
    });

    // Add remove handlers
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', () => {
            const fileId = parseFloat(btn.dataset.fileId);
            removeFile(fileId);
        });
    });
}

function removeFile(fileId) {
    orderState.uploadedFiles = orderState.uploadedFiles.filter(f => f.id !== fileId);
    
    if (orderState.uploadedFiles.length === 0) {
        configSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    } else {
        renderUploadedFiles();
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== CONFIGURATION HANDLERS =====

document.getElementById('card-size').addEventListener('change', (e) => {
    orderState.configuration.cardSize = e.target.value;
    updatePriceSummary();
});

document.getElementById('material').addEventListener('change', (e) => {
    orderState.configuration.material = e.target.value;
    updatePriceSummary();
});

document.getElementById('finish').addEventListener('change', (e) => {
    orderState.configuration.finish = e.target.value;
    updatePriceSummary();
});

document.getElementById('corners').addEventListener('change', (e) => {
    orderState.configuration.corners = e.target.value;
    updatePriceSummary();
});

document.getElementById('print-sides').addEventListener('change', (e) => {
    orderState.configuration.printSides = e.target.value;
    updatePriceSummary();
});

document.getElementById('quantity').addEventListener('change', (e) => {
    orderState.configuration.quantity = parseInt(e.target.value);
    updatePriceSummary();
});

// Quantity controls
const quantityOptions = [100, 250, 500, 1000, 2000];

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
    
    // Base price from config
    const basePrice = BASE_PRICE;
    
    // Get price modifiers from database
    const materialModifier = ConfigLoader.getPriceModifier('business_cards', 'material', config.material);
    const finishModifier = ConfigLoader.getPriceModifier('business_cards', 'finish', config.finish);
    const cornersModifier = ConfigLoader.getPriceModifier('business_cards', 'corners', config.corners);
    const sidesModifier = ConfigLoader.getPriceModifier('business_cards', 'sides', config.printSides);
    
    // Total material/options price
    const materialPrice = materialModifier + finishModifier + cornersModifier + sidesModifier;
    
    // Calculate totals
    const subtotal = basePrice + materialPrice;
    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;
    
    // Store in state
    orderState.pricing = {
        basePrice,
        materialPrice,
        subtotal,
        gst,
        grandTotal
    };
    
    // Update display
    document.getElementById('summary-quantity').textContent = `${config.quantity} cards`;
    document.getElementById('base-price').textContent = `₹${basePrice.toFixed(2)}`;
    document.getElementById('material-price').textContent = `₹${materialPrice.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
}

// ===== CHECKOUT & CART ACTIONS =====

document.getElementById('proceed-checkout').addEventListener('click', () => {
    if (!orderState.selectedTemplate && orderState.uploadedFiles.length === 0) {
        showToast('Please select a template or upload your design', 'error');
        return;
    }
    
    // Store order data
    const orderData = {
        productType: 'business-cards',
        designMethod: orderState.designMethod,
        files: orderState.uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        selectedTemplate: orderState.selectedTemplate,
        configuration: orderState.configuration,
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
    if (!orderState.selectedTemplate && orderState.uploadedFiles.length === 0) {
        showToast('Please select a template or upload your design', 'error');
        return;
    }
    
    // Get existing cart
    let cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    
    // Add current order with consistent structure
    const cartItem = {
        id: Date.now(),
        product: 'business-cards',
        productName: 'Business Cards',
        designMethod: orderState.designMethod,
        files: orderState.uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        selectedTemplate: orderState.selectedTemplate,
        configuration: { ...orderState.configuration },
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

async function initializeBusinessCardsPage() {
    console.log('🔄 Initializing Business Cards page...');
    
    // Load configuration from database
    const result = await ConfigLoader.initializeForProduct('business_cards');
    
    if (result.success) {
        // Update pricing constants from database
        BASE_PRICE = ConfigLoader.getBasePrice('business_cards');
        GST_RATE = ConfigLoader.getGSTRate('business_cards');
        
        // Populate dropdowns with database config
        const cardSizeSelect = document.getElementById('card-size');
        const materialSelect = document.getElementById('material');
        const finishSelect = document.getElementById('finish');
        const cornersSelect = document.getElementById('corners');
        const printSidesSelect = document.getElementById('print-sides');
        const quantitySelect = document.getElementById('quantity');
        
        // Populate dropdowns
        if (materialSelect) ConfigLoader.populateDropdown(materialSelect, 'business_cards', 'material');
        if (finishSelect) ConfigLoader.populateDropdown(finishSelect, 'business_cards', 'finish');
        if (cornersSelect) ConfigLoader.populateDropdown(cornersSelect, 'business_cards', 'corners');
        if (printSidesSelect) ConfigLoader.populateDropdown(printSidesSelect, 'business_cards', 'sides');
        
        // Set default values
        orderState.configuration.cardSize = cardSizeSelect?.value || 'standard';
        orderState.configuration.material = materialSelect?.value || 'standard';
        orderState.configuration.finish = finishSelect?.value || 'matte';
        orderState.configuration.corners = cornersSelect?.value || 'square';
        orderState.configuration.printSides = printSidesSelect?.value || 'single';
        orderState.configuration.quantity = parseInt(quantitySelect?.value) || 100;
        
        configLoaded = true;
        console.log('✅ Configuration loaded successfully');
        console.log(`Base Price: ₹${BASE_PRICE}, GST: ${(GST_RATE * 100).toFixed(2)}%`);
    } else {
        console.error('❌ Failed to load configuration, using defaults');
        configLoaded = true; // Allow fallback
        showToast('Using default pricing. Admin configuration not available.', 'warning');
    }
    
    updateCartBadge();
    updatePriceSummary();
}

// Initialize on page load
initializeBusinessCardsPage();

console.log('Business Cards page initialized');
