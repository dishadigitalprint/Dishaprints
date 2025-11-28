/**
 * Checkout Payment Page
 * Handles UPI payment with QR code and screenshot upload
 */

// Load cart and delivery info
let cart = [];
let deliveryInfo = {};
let selectedPaymentMethod = 'upi';
let paymentSettings = {
    upi_id: 'dishaprints@paytm',
    merchant_name: 'Disha Digital Prints',
    cod_charge: 20
};
let razorpayEnabled = false;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Will redirect to login
    }
    
    loadCartData();
    loadDeliveryInfo(); // Load delivery info synchronously
    
    console.log('Delivery info after load:', deliveryInfo);
    
    // Validate delivery info exists AFTER loading
    if (!validateDeliveryInfo()) {
        return; // Will redirect to address page
    }
    
    // Load payment settings from database
    await loadPaymentSettings();
    
    // Check if Razorpay is enabled
    await checkRazorpayAvailability();
    
    renderCartSummary();
    updatePricing();
    attachEventListeners();
    
    // Log page view
    if (typeof activityLogger !== 'undefined') {
        activityLogger.logPageView('checkout-payment.html');
    }
});

function loadCartData() {
    try {
        const cartData = sessionStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
        console.log('Cart loaded:', cart);
        
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'error');
            setTimeout(() => window.location.href = 'order.html', 2000);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    if (!user.phoneVerified || !user.loggedIn) {
        alert('Please login to complete your order');
        window.location.href = `login.html?return=${encodeURIComponent('checkout-address.html')}`;
        return false;
    }
    
    return true;
}

function validateDeliveryInfo() {
    console.log('Validating delivery info:', deliveryInfo);
    
    // Check if deliveryInfo exists and has any meaningful content
    if (!deliveryInfo || Object.keys(deliveryInfo).length === 0) {
        console.log('No delivery info found - empty or missing');
        alert('Please provide delivery address before payment');
        window.location.href = 'checkout-address.html';
        return false;
    }
    
    // Check if it has the required nested structure from checkout-address
    if (!deliveryInfo.contact || !deliveryInfo.delivery) {
        console.log('Missing contact or delivery fields');
        alert('Please provide delivery address before payment');
        window.location.href = 'checkout-address.html';
        return false;
    }
    
    console.log('✓ Delivery info validated successfully');
    return true;
}

function loadDeliveryInfo() {
    try {
        const deliveryData = sessionStorage.getItem('deliveryInfo');
        deliveryInfo = deliveryData ? JSON.parse(deliveryData) : {};
        console.log('Delivery info loaded:', deliveryInfo);
    } catch (error) {
        console.error('Error loading delivery info:', error);
        deliveryInfo = {};
    }
}

async function loadPaymentSettings() {
    try {
        const { data, error} = await supabaseClient
            .from('payment_settings')
            .select('*')
            .single();

        if (error) {
            console.warn('Using default payment settings:', error);
            return;
        }

        if (data) {
            paymentSettings = {
                upi_id: data.upi_id,
                merchant_name: data.merchant_name,
                cod_charge: parseFloat(data.cod_charge) || 20
            };
            console.log('✅ Payment settings loaded:', paymentSettings);
        }
    } catch (error) {
        console.error('Error loading payment settings:', error);
    }
}

/**
 * Check if Razorpay is enabled and show payment option
 */
async function checkRazorpayAvailability() {
    try {
        razorpayEnabled = await RazorpayService.isEnabled();
        
        if (razorpayEnabled) {
            // Show Razorpay option and make it default
            const razorpayOption = document.getElementById('razorpayOption');
            if (razorpayOption) {
                razorpayOption.classList.remove('hidden');
                
                // Set Razorpay as default payment method
                const razorpayRadio = razorpayOption.querySelector('input[type="radio"]');
                if (razorpayRadio) {
                    razorpayRadio.checked = true;
                    selectedPaymentMethod = 'razorpay';
                    
                    // Uncheck UPI
                    document.querySelector('input[value="upi"]').checked = false;
                }
            }
            
            console.log('✅ Razorpay is available');
        } else {
            console.log('ℹ️ Razorpay is not configured');
        }
    } catch (error) {
        console.error('Error checking Razorpay availability:', error);
        razorpayEnabled = false;
    }
}

function renderCartSummary() {
    const container = document.getElementById('cartSummary');
    if (!container || cart.length === 0) return;

    container.innerHTML = cart.map(item => {
        // Handle multi-file upload items
        if (item.type === 'multi-file-upload') {
            return `
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-file-pdf text-primary-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-neutral-900 truncate">${item.name}</p>
                        <p class="text-xs text-neutral-600">${item.files.length} file(s)</p>
                    </div>
                    <p class="text-sm font-semibold text-neutral-900">₹${(item.price || 0).toFixed(2)}</p>
                </div>
            `;
        }
        
        // Handle standard items
        return `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getProductIcon(item.product)} text-primary-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-neutral-900 truncate">${item.productName}</p>
                    <p class="text-xs text-neutral-600">Qty: ${item.quantity}</p>
                </div>
                <p class="text-sm font-semibold text-neutral-900">₹${(item.total || 0).toFixed(2)}</p>
            </div>
        `;
    }).join('');
}

function getProductIcon(product) {
    const icons = {
        'documents': 'fa-file-alt',
        'business-cards': 'fa-id-card',
        'brochures': 'fa-book-open'
    };
    return icons[product] || 'fa-print';
}

function updatePricing() {
    // Calculate subtotal - handle both standard and multi-file items
    const subtotal = cart.reduce((sum, item) => {
        if (item.type === 'multi-file-upload') {
            return sum + (item.subtotal || 0);
        }
        return sum + (item.total || 0);
    }, 0);
    
    const gst = subtotal * 0.05; // 5% GST
    const deliveryCharge = deliveryInfo.deliveryMethod === 'delivery' ? 50 : 0;
    const codCharge = selectedPaymentMethod === 'cod' ? paymentSettings.cod_charge : 0;
    const total = subtotal + gst + deliveryCharge + codCharge;

    // Update display
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('deliveryCharge').textContent = deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : 'Free';
    document.getElementById('totalAmount').textContent = `₹${total.toFixed(2)}`;
    document.getElementById('paymentAmount').textContent = `₹${total.toFixed(2)}`;

    // Show/hide COD charges
    const codRow = document.getElementById('codChargeRow');
    if (selectedPaymentMethod === 'cod') {
        codRow.classList.remove('hidden');
        codRow.classList.add('flex');
        document.getElementById('codChargeAmount').textContent = `₹${codCharge.toFixed(2)}`;
    } else {
        codRow.classList.add('hidden');
        codRow.classList.remove('flex');
    }

    // Update QR code with amount
    updateQRCode(total);
}

function updateQRCode(amount) {
    const upiId = paymentSettings.upi_id;
    const merchantName = paymentSettings.merchant_name;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
    
    document.getElementById('upiQRCode').src = qrUrl;
    
    // Also update the UPI ID display
    const upiIdDisplay = document.querySelector('code.text-sm.font-mono');
    if (upiIdDisplay) {
        upiIdDisplay.textContent = upiId;
    }
}

function attachEventListeners() {
    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
            updatePaymentSections();
            updatePricing();
        });
    });

    // File upload
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('paymentProof');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('border-primary-600', 'bg-primary-50');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('border-primary-600', 'bg-primary-50');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('border-primary-600', 'bg-primary-50');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    });
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    // Place order button
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

function updatePaymentSections() {
    const upiSection = document.getElementById('upiPaymentSection');
    const codSection = document.getElementById('codPaymentSection');
    const storeSection = document.getElementById('storePaymentSection');

    upiSection.classList.add('hidden');
    codSection.classList.add('hidden');
    storeSection.classList.add('hidden');

    if (selectedPaymentMethod === 'upi') {
        upiSection.classList.remove('hidden');
    } else if (selectedPaymentMethod === 'cod') {
        codSection.classList.remove('hidden');
    } else if (selectedPaymentMethod === 'store') {
        storeSection.classList.remove('hidden');
    }
}

function handleFileUpload(file) {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('previewSection').classList.remove('hidden');
        document.getElementById('uploadZone').classList.add('border-accentA-500', 'bg-accentA-50');
    };
    reader.readAsDataURL(file);

    // Store file reference
    window.uploadedPaymentProof = file;
    console.log('Payment proof uploaded:', file.name);
}

function removeFile() {
    document.getElementById('previewSection').classList.add('hidden');
    document.getElementById('uploadZone').classList.remove('border-accentA-500', 'bg-accentA-50');
    document.getElementById('paymentProof').value = '';
    window.uploadedPaymentProof = null;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function copyUPIId() {
    const upiId = paymentSettings.upi_id;
    navigator.clipboard.writeText(upiId).then(() => {
        showToast('UPI ID copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy UPI ID', 'error');
    });
}

async function placeOrder() {
    // Handle Razorpay payments separately
    if (selectedPaymentMethod === 'razorpay' && razorpayEnabled) {
        await handleRazorpayPayment();
        return;
    }
    
    // Validate payment method requirements
    if (selectedPaymentMethod === 'upi') {
        if (!window.uploadedPaymentProof) {
            showToast('Please upload payment screenshot', 'error');
            return;
        }
    }

    // Get user session
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!user.id) {
        showToast('Please login to place order', 'error');
        window.location.href = 'login.html';
        return;
    }

    // Calculate final amount
    const subtotal = cart.reduce((sum, item) => sum + (item.subtotal || item.price || item.total || 0), 0);
    const gst = subtotal * 0.18;
    const deliveryCharge = deliveryInfo.delivery?.deliveryMethod === 'delivery' ? 50 : 0;
    const codCharge = selectedPaymentMethod === 'cod' ? paymentSettings.cod_charge : 0;
    const total = subtotal + gst + deliveryCharge + codCharge;

    const transactionId = document.getElementById('transactionId')?.value || null;

    // Show loading
    showToast('Creating your order...', 'info');

    try {
        // Step 1: Save address to database - flatten the nested structure
        console.log('Full deliveryInfo:', deliveryInfo);
        
        const addressData = {
            name: deliveryInfo.contact?.name || deliveryInfo.name || user.name,
            phone: deliveryInfo.contact?.phone || deliveryInfo.phone || user.phone,
            email: deliveryInfo.contact?.email || deliveryInfo.email || user.email || '',
            address_line1: deliveryInfo.delivery?.address || deliveryInfo.address_line1 || '',
            address_line2: deliveryInfo.delivery?.address2 || deliveryInfo.address_line2 || '',
            city: deliveryInfo.delivery?.city || deliveryInfo.city || '',
            state: deliveryInfo.delivery?.state || deliveryInfo.state || '',
            pincode: deliveryInfo.delivery?.pincode || deliveryInfo.pincode || '',
            landmark: deliveryInfo.delivery?.landmark || deliveryInfo.landmark || '',
            is_default: false
        };
        
        console.log('Address data to save:', addressData);
        
        const addressResult = await SupabaseDB.saveAddress(user.id, addressData);
        let addressId = addressResult.data?.id;
        
        if (!addressId) {
            console.warn('Failed to save address, using null');
        }

        // Step 2: Create order with items
        const orderData = {
            subtotal: subtotal,
            gst: gst,
            deliveryCharge: deliveryCharge,
            codCharge: codCharge,
            total: total,
            paymentMethod: selectedPaymentMethod,
            deliveryMethod: deliveryInfo.delivery?.deliveryMethod || 'delivery',
            paymentScreenshot: window.uploadedPaymentProof ? window.uploadedPaymentProof.name : null,
            notes: null
        };

        const orderResult = await SupabaseDB.createOrder(user.id, addressId, orderData, cart);

        if (orderResult.success) {
            console.log('✅ Order created in database:', orderResult.order);

            // Log activity
            await SupabaseDB.logActivity(
                user.id,
                user.phone,
                user.name,
                'Order placed',
                'checkout-payment.html',
                {
                    order_id: orderResult.order.id,
                    order_number: orderResult.order.order_number,
                    total: total,
                    payment_method: selectedPaymentMethod
                }
            );

            // Track checkout completed
            if (typeof CartTracker !== 'undefined') {
                CartTracker.trackCheckoutCompleted(orderResult.order.order_number);
            }

            // Clear cart and delivery info
            sessionStorage.removeItem('cart');
            sessionStorage.removeItem('deliveryInfo');

            // Show success message
            showToast('Order placed successfully!', 'success');

            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = `order-confirmation.html?orderNumber=${orderResult.order.order_number}`;
            }, 1500);

        } else {
            throw new Error('Failed to create order in database');
        }

    } catch (error) {
        console.error('❌ Error placing order:', error);
        showToast('Failed to place order. Please try again.', 'error');
        
        // Fallback: save locally
        const orderId = generateOrderId();
        const order = {
            orderId: orderId,
            orderDate: new Date().toISOString(),
            status: selectedPaymentMethod === 'upi' ? 'pending_payment_verification' : 'pending',
            paymentMethod: selectedPaymentMethod,
            paymentStatus: selectedPaymentMethod === 'upi' ? 'pending_verification' : 'pending',
            transactionId: transactionId,
            items: cart,
            deliveryInfo: deliveryInfo,
            pricing: {
                subtotal: subtotal,
                gst: gst,
                deliveryCharge: deliveryCharge,
                codCharge: codCharge,
                total: total
            },
            paymentProof: window.uploadedPaymentProof ? window.uploadedPaymentProof.name : null
        };
        
        saveOrderLocally(order);
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('deliveryInfo');
        
        setTimeout(() => {
            window.location.href = `order-confirmation.html?orderId=${orderId}`;
        }, 1500);
    }
}

function generateOrderId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DP${year}-${random}`;
}

function saveOrderLocally(order) {
    // Get existing orders
    let orders = [];
    try {
        const ordersData = localStorage.getItem('orders');
        orders = ordersData ? JSON.parse(ordersData) : [];
    } catch (error) {
        console.error('Error loading orders:', error);
        orders = [];
    }

    // Add new order
    orders.unshift(order);

    // Save back
    localStorage.setItem('orders', JSON.stringify(orders));
    console.log('Order saved locally:', order.orderId);
}

/**
 * Handle Razorpay payment flow
 */
async function handleRazorpayPayment() {
    try {
        // Get user session
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (!user.id) {
            showToast('Please login to place order', 'error');
            window.location.href = 'login.html';
            return;
        }

        // Calculate final amount
        const subtotal = cart.reduce((sum, item) => sum + (item.subtotal || item.price || item.total || 0), 0);
        const gst = subtotal * 0.18;
        const deliveryCharge = deliveryInfo.delivery?.deliveryMethod === 'delivery' ? 50 : 0;
        const total = subtotal + gst + deliveryCharge;

        // Create order in database first
        showToast('Creating order...', 'info');
        
        // Save address - flatten the nested structure
        console.log('Full deliveryInfo:', deliveryInfo);
        
        const addressData = {
            name: deliveryInfo.contact?.name || deliveryInfo.name || user.name,
            phone: deliveryInfo.contact?.phone || deliveryInfo.phone || user.phone,
            email: deliveryInfo.contact?.email || deliveryInfo.email || user.email || '',
            address_line1: deliveryInfo.delivery?.address || deliveryInfo.address_line1 || '',
            address_line2: deliveryInfo.delivery?.address2 || deliveryInfo.address_line2 || '',
            city: deliveryInfo.delivery?.city || deliveryInfo.city || '',
            state: deliveryInfo.delivery?.state || deliveryInfo.state || '',
            pincode: deliveryInfo.delivery?.pincode || deliveryInfo.pincode || '',
            landmark: deliveryInfo.delivery?.landmark || deliveryInfo.landmark || '',
            is_default: false
        };
        
        console.log('Address data to save:', addressData);
        
        const addressResult = await SupabaseDB.saveAddress(user.id, addressData);
        const addressId = addressResult.data?.id;

        // Create order
        const orderData = {
            subtotal: subtotal,
            gst: gst,
            deliveryCharge: deliveryCharge,
            codCharge: 0,
            total: total,
            paymentMethod: 'razorpay',
            deliveryMethod: deliveryInfo.delivery?.deliveryMethod || 'delivery',
            paymentScreenshot: null,
            notes: null
        };

        const orderResult = await SupabaseDB.createOrder(user.id, addressId, orderData, cart);

        if (!orderResult.success) {
            throw new Error('Failed to create order');
        }

        console.log('✅ Order created:', orderResult.order.order_number);

        // Open Razorpay checkout
        await RazorpayService.openCheckout({
            orderId: orderResult.order.id,
            amount: total,
            customerName: deliveryInfo.contact?.name || deliveryInfo.name || user.name,
            email: deliveryInfo.contact?.email || user.email || '',
            contact: deliveryInfo.contact?.phone || deliveryInfo.phone || user.phone,
            description: `Order #${orderResult.order.order_number}`,
            onError: (error) => {
                showToast(`Payment Error: ${error.message}`, 'error');
            }
        });

        // Note: Razorpay service will handle redirect on success
        
    } catch (error) {
        console.error('❌ Razorpay payment error:', error);
        showToast('Payment failed. Please try again.', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300`;
    
    const colors = {
        'info': 'bg-info-600',
        'success': 'bg-accentA-600',
        'error': 'bg-danger-600',
        'warning': 'bg-accentB-600'
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
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('Payment page loaded');
