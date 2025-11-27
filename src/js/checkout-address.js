/**
 * Checkout Address Page - Disha Digital Prints
 * Handles address form, validation, pincode lookup, GST details, and order summary
 */

class CheckoutAddress {
    constructor() {
        this.cart = this.loadCart();
        this.savedAddresses = this.loadSavedAddresses();
        this.deliveryCharges = 0; // Free delivery for orders above ₹500
        this.minOrderForFreeDelivery = 500;
        this.standardDeliveryCharge = 80;
        this.autocomplete1 = null;
        this.autocomplete2 = null;
        
        this.init();
    }

    init() {
        // Check authentication before anything else
        if (!this.checkAuthentication()) {
            return; // Will redirect to login
        }
        
        // Track checkout started
        if (typeof CartTracker !== 'undefined') {
            CartTracker.trackCheckoutStarted();
        }
        
        this.renderOrderSummary();
        this.updateCartBadge();
        this.loadSavedAddresses();
        this.attachEventListeners();
        this.loadUserDetails();
        
        // Prefill if coming back from payment
        const savedCheckoutData = sessionStorage.getItem('checkoutData');
        if (savedCheckoutData) {
            this.prefillForm(JSON.parse(savedCheckoutData));
        }
    }

    checkAuthentication() {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        
        if (!user.phoneVerified || !user.loggedIn) {
            alert('Please login to continue with checkout');
            window.location.href = `login.html?return=${encodeURIComponent(window.location.pathname)}`;
            return false;
        }
        
        // Log page view for activity tracking
        if (typeof activityLogger !== 'undefined') {
            activityLogger.logPageView('checkout-address.html');
        }
        
        return true;
    }

    loadCart() {
        const cartData = sessionStorage.getItem('cart');
        console.log('Loading cart from sessionStorage:', cartData);
        const cart = cartData ? JSON.parse(cartData) : [];
        console.log('Parsed cart:', cart);
        return cart;
    }

    loadSavedAddresses() {
        const addresses = localStorage.getItem('savedAddresses');
        return addresses ? JSON.parse(addresses) : [];
    }

    saveAddress(address) {
        this.savedAddresses.push(address);
        localStorage.setItem('savedAddresses', JSON.stringify(this.savedAddresses));
    }

    loadUserDetails() {
        const userDetails = localStorage.getItem('userDetails');
        if (userDetails) {
            const user = JSON.parse(userDetails);
            document.getElementById('fullName').value = user.name || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('email').value = user.email || '';
        }
    }

    attachEventListeners() {
        // Mobile menu
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.toggle('hidden');
        });

        // Cart icon
        document.getElementById('cartIcon')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'cart.html';
        });

        // Pincode lookup
        document.getElementById('checkPincode')?.addEventListener('click', () => this.checkPincode());
        document.getElementById('pincode')?.addEventListener('input', (e) => {
            if (e.target.value.length === 6) {
                this.checkPincode();
            }
        });

        // Same as delivery address
        document.getElementById('sameAsDelivery')?.addEventListener('change', (e) => {
            document.getElementById('billingAddressForm').classList.toggle('hidden', e.target.checked);
        });

        // Need GST invoice
        document.getElementById('needGST')?.addEventListener('change', (e) => {
            document.getElementById('gstForm').classList.toggle('hidden', !e.target.checked);
        });

        // Proceed to payment
        document.getElementById('proceedToPayment')?.addEventListener('click', () => this.proceedToPayment());

        // Add new address button
        document.getElementById('addNewAddressBtn')?.addEventListener('click', () => {
            document.getElementById('savedAddressesSection').classList.add('hidden');
        });

        // Form validation
        this.attachFormValidation();
    }

    attachFormValidation() {
        // Phone number validation
        const phoneInput = document.getElementById('phone');
        phoneInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });

        // Pincode validation
        const pincodeInput = document.getElementById('pincode');
        pincodeInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        });

        // GST number validation
        const gstInput = document.getElementById('gstNumber');
        gstInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().slice(0, 15);
        });

        // Email validation
        const emailInput = document.getElementById('email');
        emailInput?.addEventListener('blur', (e) => {
            if (e.target.value && !this.isValidEmail(e.target.value)) {
                this.showToast('Please enter a valid email address', 'error');
                e.target.classList.add('border-danger-500');
            } else {
                e.target.classList.remove('border-danger-500');
            }
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async checkPincode() {
        const pincode = document.getElementById('pincode').value;
        const messageEl = document.getElementById('pincodeMessage');
        
        if (pincode.length !== 6) {
            messageEl.textContent = 'Please enter a valid 6-digit pincode';
            messageEl.className = 'text-xs mt-1 text-danger-500';
            messageEl.classList.remove('hidden');
            return;
        }

        // Show loading
        messageEl.textContent = 'Checking delivery availability...';
        messageEl.className = 'text-xs mt-1 text-info-500';
        messageEl.classList.remove('hidden');

        try {
            // Simulate API call to postal API
            // In production, use: https://api.postalpincode.in/pincode/{pincode}
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock response - Accept all pincodes for now
            const mockCities = {
                '500001': { city: 'Hyderabad', state: 'Telangana', deliverable: true },
                '500002': { city: 'Hyderabad', state: 'Telangana', deliverable: true },
                '560001': { city: 'Bangalore', state: 'Karnataka', deliverable: true },
                '400001': { city: 'Mumbai', state: 'Maharashtra', deliverable: true },
                '110001': { city: 'Delhi', state: 'Delhi', deliverable: true },
                '600001': { city: 'Chennai', state: 'Tamil Nadu', deliverable: true },
                '700001': { city: 'Kolkata', state: 'West Bengal', deliverable: true },
            };

            // Default: Accept all pincodes as deliverable
            const result = mockCities[pincode] || { 
                city: '', 
                state: '', 
                deliverable: true // Always deliverable
            };

            if (result.deliverable) {
                messageEl.textContent = '✓ Delivery available in 3-5 business days';
                messageEl.className = 'text-xs mt-1 text-accentA-600';
                
                // Auto-fill city and state if available
                if (result.city) {
                    document.getElementById('city').value = result.city;
                    document.getElementById('state').value = result.state;
                }
            } else {
                messageEl.textContent = '✗ Sorry, we don\'t deliver to this pincode yet';
                messageEl.className = 'text-xs mt-1 text-danger-500';
            }
        } catch (error) {
            messageEl.textContent = 'Unable to verify pincode. Please continue.';
            messageEl.className = 'text-xs mt-1 text-neutral-500';
        }
    }

    renderOrderSummary() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty', 'error');
            setTimeout(() => window.location.href = 'order.html', 2000);
            return;
        }

        const orderItemsEl = document.getElementById('orderItems');
        const productIcons = {
            'documents': 'fa-file-alt',
            'business-cards': 'fa-id-card',
            'brochures': 'fa-book-open'
        };

        orderItemsEl.innerHTML = this.cart.map(item => {
            // Handle multi-file upload items
            if (item.type === 'multi-file-upload') {
                return `
                    <div class="flex items-start gap-3 pb-3 border-b border-neutral-200 last:border-0">
                        <div class="w-12 h-12 bg-primary-50 rounded-md flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-file-pdf text-primary-600"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-neutral-900">${item.name}</p>
                            <p class="text-xs text-neutral-500 mt-0.5">${item.customerName}</p>
                            <p class="text-xs text-neutral-500">${item.files.length} file(s)</p>
                            <p class="text-sm font-bold text-primary-600 mt-1">₹${(item.price || 0).toFixed(2)}</p>
                        </div>
                    </div>
                `;
            }
            
            // Handle standard items
            const qty = item.quantity || item.copies || item.configuration?.quantity || 1;
            const details = this.getItemDetails(item);
            
            return `
                <div class="flex items-start gap-3 pb-3 border-b border-neutral-200 last:border-0">
                    <div class="w-12 h-12 bg-primary-50 rounded-md flex items-center justify-center flex-shrink-0">
                        <i class="fas ${productIcons[item.product] || 'fa-box'} text-primary-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-900 truncate">${item.productName}</p>
                        <p class="text-xs text-neutral-500 mt-0.5">${details}</p>
                        <p class="text-xs text-neutral-500">Qty: ${qty}</p>
                        <p class="text-sm font-bold text-primary-600 mt-1">₹${(item.total || 0).toFixed(2)}</p>
                    </div>
                </div>
            `;
        }).join('');

        this.updatePricingSummary();
    }

    getItemDetails(item) {
        switch(item.product) {
            case 'documents':
                const pages = item.pages || 0;
                const colorMode = item.configuration?.colorMode === 'color' ? 'Color' : 'B&W';
                const binding = item.configuration?.binding || 'none';
                return `${pages} pages • ${colorMode}${binding !== 'none' ? ` • ${binding}` : ''}`;
            
            case 'business-cards':
                const material = item.configuration?.material || 'standard';
                const finish = item.configuration?.finish || 'matte';
                return `${material} • ${finish} finish`;
            
            case 'brochures':
                const size = item.configuration?.brochureSize || 'A4';
                const foldType = item.detectedFold || item.configuration?.foldType || 'No fold';
                return `${size} • ${foldType}`;
            
            default:
                return 'Custom order';
        }
    }

    updatePricingSummary() {
        // Calculate subtotal handling both standard items and multi-file items
        const subtotal = this.cart.reduce((sum, item) => {
            if (item.type === 'multi-file-upload') {
                return sum + (item.subtotal || 0);
            }
            return sum + (item.total || 0);
        }, 0);
        
        const gst = subtotal * 0.18;
        const deliveryCharge = subtotal >= this.minOrderForFreeDelivery ? 0 : this.standardDeliveryCharge;
        const total = subtotal + gst + deliveryCharge;

        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('gst').textContent = `₹${gst.toFixed(2)}`;
        
        const deliveryEl = document.getElementById('delivery');
        if (deliveryCharge === 0) {
            deliveryEl.textContent = 'FREE';
            deliveryEl.className = 'text-accentA-500 font-medium';
        } else {
            deliveryEl.textContent = `₹${deliveryCharge.toFixed(2)}`;
            deliveryEl.className = 'text-neutral-600';
        }
        
        document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
    }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        console.log('Updating cart badge, cart items:', this.cart.length);
        if (badge) {
            if (this.cart.length > 0) {
                badge.textContent = this.cart.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        } else {
            console.warn('Cart badge element not found');
        }
    }

    validateForm() {
        const requiredFields = [
            { id: 'fullName', label: 'Full Name' },
            { id: 'phone', label: 'Phone Number' },
            { id: 'email', label: 'Email Address' },
            { id: 'pincode', label: 'PIN Code' },
            { id: 'city', label: 'City' },
            { id: 'addressLine1', label: 'Address Line 1' },
            { id: 'state', label: 'State' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                this.showToast(`${field.label} is required`, 'error');
                element.focus();
                element.classList.add('border-danger-500');
                return false;
            }
            element.classList.remove('border-danger-500');
        }

        // Validate phone number
        const phone = document.getElementById('phone').value;
        if (phone.length !== 10) {
            this.showToast('Please enter a valid 10-digit phone number', 'error');
            document.getElementById('phone').focus();
            return false;
        }

        // Validate email
        const email = document.getElementById('email').value;
        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            document.getElementById('email').focus();
            return false;
        }

        // Validate pincode
        const pincode = document.getElementById('pincode').value;
        if (pincode.length !== 6) {
            this.showToast('Please enter a valid 6-digit pincode', 'error');
            document.getElementById('pincode').focus();
            return false;
        }

        // Validate GST if needed
        if (document.getElementById('needGST').checked) {
            const gstNumber = document.getElementById('gstNumber').value;
            const businessName = document.getElementById('businessName').value;
            
            if (!gstNumber || gstNumber.length !== 15) {
                this.showToast('Please enter a valid 15-character GSTIN', 'error');
                document.getElementById('gstNumber').focus();
                return false;
            }
            
            if (!businessName.trim()) {
                this.showToast('Business name is required for GST invoice', 'error');
                document.getElementById('businessName').focus();
                return false;
            }
        }

        // Validate billing address if different
        if (!document.getElementById('sameAsDelivery').checked) {
            const billingFields = ['billingName', 'billingPhone', 'billingAddress', 'billingCity', 'billingState', 'billingPincode'];
            for (const fieldId of billingFields) {
                const element = document.getElementById(fieldId);
                if (!element.value.trim()) {
                    this.showToast('Please complete all billing address fields', 'error');
                    element.focus();
                    return false;
                }
            }
        }

        return true;
    }

    collectFormData() {
        const addressType = document.querySelector('input[name="addressType"]:checked').value;
        
        const data = {
            contact: {
                fullName: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value
            },
            delivery: {
                addressLine1: document.getElementById('addressLine1').value,
                addressLine2: document.getElementById('addressLine2').value,
                landmark: document.getElementById('landmark').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value,
                type: addressType
            },
            billing: null,
            gst: null
        };

        // Save address if requested
        if (document.getElementById('saveAddress').checked) {
            this.saveAddress({
                ...data.delivery,
                name: data.contact.fullName,
                phone: data.contact.phone,
                savedAt: new Date().toISOString()
            });
        }

        // Billing address
        if (!document.getElementById('sameAsDelivery').checked) {
            data.billing = {
                name: document.getElementById('billingName').value,
                phone: document.getElementById('billingPhone').value,
                address: document.getElementById('billingAddress').value,
                city: document.getElementById('billingCity').value,
                state: document.getElementById('billingState').value,
                pincode: document.getElementById('billingPincode').value
            };
        } else {
            data.billing = { ...data.delivery };
        }

        // GST details
        if (document.getElementById('needGST').checked) {
            data.gst = {
                gstin: document.getElementById('gstNumber').value,
                businessName: document.getElementById('businessName').value
            };
        }

        return data;
    }

    proceedToPayment() {
        if (!this.validateForm()) {
            return;
        }

        const checkoutData = this.collectFormData();
        
        // Calculate final pricing - handle both standard and multi-file items
        const subtotal = this.cart.reduce((sum, item) => {
            if (item.type === 'multi-file-upload') {
                return sum + (item.subtotal || 0);
            }
            return sum + (item.total || 0);
        }, 0);
        
        const gst = subtotal * 0.18;
        const deliveryCharge = subtotal >= this.minOrderForFreeDelivery ? 0 : this.standardDeliveryCharge;
        const total = subtotal + gst + deliveryCharge;

        checkoutData.pricing = {
            subtotal,
            gst,
            deliveryCharge,
            total
        };

        // Save to session storage
        sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        sessionStorage.setItem('deliveryInfo', JSON.stringify(checkoutData)); // For payment page
        
        // Save user details for future use
        localStorage.setItem('userDetails', JSON.stringify(checkoutData.contact));

        this.showToast('Address saved successfully!', 'success');
        
        // Redirect to payment page
        setTimeout(() => {
            window.location.href = 'checkout-payment.html';
        }, 1000);
    }

    prefillForm(data) {
        if (data.contact) {
            document.getElementById('fullName').value = data.contact.fullName || '';
            document.getElementById('phone').value = data.contact.phone || '';
            document.getElementById('email').value = data.contact.email || '';
        }

        if (data.delivery) {
            document.getElementById('addressLine1').value = data.delivery.addressLine1 || '';
            document.getElementById('addressLine2').value = data.delivery.addressLine2 || '';
            document.getElementById('landmark').value = data.delivery.landmark || '';
            document.getElementById('city').value = data.delivery.city || '';
            document.getElementById('state').value = data.delivery.state || '';
            document.getElementById('pincode').value = data.delivery.pincode || '';
            
            if (data.delivery.type) {
                document.querySelector(`input[name="addressType"][value="${data.delivery.type}"]`).checked = true;
            }
        }

        if (data.gst) {
            document.getElementById('needGST').checked = true;
            document.getElementById('gstForm').classList.remove('hidden');
            document.getElementById('gstNumber').value = data.gst.gstin || '';
            document.getElementById('businessName').value = data.gst.businessName || '';
        }
    }



    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        toastMessage.textContent = message;
        
        if (type === 'success') {
            toastIcon.className = 'fas fa-check-circle text-accentA-500';
        } else if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle text-danger-500';
        } else {
            toastIcon.className = 'fas fa-info-circle text-info-500';
        }

        toast.classList.remove('hidden');
        setTimeout(() => toast.style.transform = 'translateY(0)', 10);

        setTimeout(() => {
            toast.style.transform = 'translateY(8rem)';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutAddress();
});
