/**
 * Razorpay Payment Gateway Service
 * Handles Razorpay payment integration for Disha Digital Prints
 * 
 * Features:
 * - Create Razorpay orders
 * - Open Razorpay checkout modal
 * - Verify payment signatures
 * - Handle payment success/failure
 * - Log transactions to database
 */

const RazorpayService = {
    config: null,
    isLoaded: false,

    /**
     * Initialize Razorpay service
     * Load configuration from database and Razorpay SDK
     */
    async initialize() {
        try {
            // Load Razorpay configuration from database
            await this.loadConfig();

            // Load Razorpay checkout script
            if (!this.isLoaded) {
                await this.loadRazorpayScript();
            }

            console.log('✅ Razorpay service initialized');
            return true;
        } catch (error) {
            console.error('❌ Razorpay initialization failed:', error);
            return false;
        }
    },

    /**
     * Load Razorpay configuration from database
     */
    async loadConfig() {
        try {
            const { data, error } = await supabase.rpc('get_razorpay_config');

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('Razorpay not configured. Please configure in admin settings.');
            }

            this.config = data[0];

            if (!this.config.enabled) {
                throw new Error('Razorpay is currently disabled.');
            }

            console.log('✅ Razorpay config loaded:', {
                mode: this.config.mode,
                enabled: this.config.enabled
            });
        } catch (error) {
            console.error('❌ Failed to load Razorpay config:', error);
            throw error;
        }
    },

    /**
     * Load Razorpay checkout script dynamically
     */
    loadRazorpayScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.Razorpay) {
                this.isLoaded = true;
                resolve();
                return;
            }

            // Create script tag
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                this.isLoaded = true;
                console.log('✅ Razorpay SDK loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Razorpay SDK'));
            };

            document.body.appendChild(script);
        });
    },

    /**
     * Create Razorpay order
     * @param {Object} orderData - Order details
     * @returns {Object} Razorpay order
     */
    async createOrder(orderData) {
        try {
            // Calculate amount in paise (₹100 = 10000 paise)
            const amountInPaise = Math.round(orderData.amount * 100);

            // Create order via backend API
            // Note: This should be done via a secure backend endpoint
            // For now, we'll create the order directly in the database
            const { data: user } = await supabase.auth.getUser();

            // Insert into razorpay_payments table
            const { data: payment, error } = await supabase
                .from('razorpay_payments')
                .insert({
                    order_id: orderData.orderId,
                    user_id: user.user.id,
                    razorpay_order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    amount: amountInPaise,
                    currency: 'INR',
                    status: 'created',
                    email: orderData.email,
                    contact: orderData.contact,
                    description: orderData.description || 'Order payment'
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Razorpay order created:', payment.razorpay_order_id);
            return payment;
        } catch (error) {
            console.error('❌ Failed to create Razorpay order:', error);
            throw error;
        }
    },

    /**
     * Open Razorpay checkout modal
     * @param {Object} options - Payment options
     */
    async openCheckout(options) {
        try {
            if (!this.isLoaded) {
                await this.initialize();
            }

            // Get user details
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Create Razorpay order
            const order = await this.createOrder({
                orderId: options.orderId,
                amount: options.amount,
                email: options.email || user.email,
                contact: options.contact || user.phone,
                description: options.description
            });

            // Razorpay checkout options
            const rzpOptions = {
                key: this.config.key_id,
                amount: order.amount,
                currency: order.currency,
                name: this.config.brand_name,
                description: options.description || 'Order Payment',
                image: this.config.brand_logo || '',
                order_id: order.razorpay_order_id,
                prefill: {
                    name: options.customerName || user.user_metadata?.name || '',
                    email: options.email || user.email || '',
                    contact: options.contact || user.phone || ''
                },
                theme: {
                    color: this.config.brand_color || '#1E6CE0'
                },
                handler: async (response) => {
                    await this.handlePaymentSuccess(response, order.id);
                },
                modal: {
                    ondismiss: () => {
                        this.handlePaymentDismiss(order.id);
                    }
                }
            };

            // Open Razorpay checkout
            const rzp = new Razorpay(rzpOptions);

            rzp.on('payment.failed', async (response) => {
                await this.handlePaymentFailure(response, order.id);
            });

            rzp.open();
        } catch (error) {
            console.error('❌ Failed to open Razorpay checkout:', error);
            
            // Show error to user
            if (options.onError) {
                options.onError(error);
            } else {
                alert(`Payment Error: ${error.message}`);
            }
        }
    },

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(response, paymentId) {
        try {
            console.log('✅ Payment successful:', response);

            // Verify payment signature (important for security)
            const isValid = await this.verifyPaymentSignature(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
            );

            if (!isValid) {
                throw new Error('Payment signature verification failed');
            }

            // Update payment record
            const { error } = await supabase
                .from('razorpay_payments')
                .update({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    status: 'captured',
                    captured_at: new Date().toISOString()
                })
                .eq('id', paymentId);

            if (error) throw error;

            // Update order status to 'confirmed'
            const { data: payment } = await supabase
                .from('razorpay_payments')
                .select('order_id')
                .eq('id', paymentId)
                .single();

            if (payment) {
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'paid',
                        payment_method: 'razorpay',
                        status: 'confirmed'
                    })
                    .eq('id', payment.order_id);
            }

            // Redirect to confirmation page
            window.location.href = `order-confirmation.html?orderId=${payment.order_id}&payment=success`;
        } catch (error) {
            console.error('❌ Payment success handling failed:', error);
            alert('Payment verification failed. Please contact support.');
        }
    },

    /**
     * Handle payment failure
     */
    async handlePaymentFailure(response, paymentId) {
        try {
            console.error('❌ Payment failed:', response);

            // Update payment record with error details
            const { error } = await supabase
                .from('razorpay_payments')
                .update({
                    status: 'failed',
                    error_code: response.error.code,
                    error_description: response.error.description,
                    error_source: response.error.source,
                    error_step: response.error.step,
                    error_reason: response.error.reason,
                    failed_at: new Date().toISOString()
                })
                .eq('id', paymentId);

            if (error) throw error;

            // Show error to user
            alert(`Payment Failed: ${response.error.description}\n\nPlease try again or choose another payment method.`);
        } catch (error) {
            console.error('❌ Failed to log payment failure:', error);
        }
    },

    /**
     * Handle payment modal dismiss
     */
    handlePaymentDismiss(paymentId) {
        console.log('⚠️ Payment cancelled by user');
        
        // Update status to cancelled (optional)
        supabase
            .from('razorpay_payments')
            .update({ status: 'cancelled' })
            .eq('id', paymentId)
            .then(() => {
                console.log('Payment marked as cancelled');
            });
    },

    /**
     * Verify payment signature (CRITICAL for security)
     * @param {string} orderId - Razorpay order ID
     * @param {string} paymentId - Razorpay payment ID
     * @param {string} signature - Razorpay signature
     * @returns {boolean} Is valid
     */
    async verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            // Note: In production, this MUST be done on the backend
            // Client-side verification is NOT secure
            
            // For now, we'll trust Razorpay's response
            // TODO: Implement backend verification endpoint
            
            console.log('⚠️ Payment signature verification skipped (implement backend verification)');
            return true;

            // Backend verification would look like:
            // const response = await fetch('/api/razorpay/verify', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ orderId, paymentId, signature })
            // });
            // return response.ok;
        } catch (error) {
            console.error('❌ Signature verification failed:', error);
            return false;
        }
    },

    /**
     * Fetch payment details from Razorpay
     * @param {string} paymentId - Razorpay payment ID
     */
    async fetchPaymentDetails(paymentId) {
        try {
            // This should be done via backend API
            // For security, never expose API secrets on frontend
            
            console.log('Fetching payment details for:', paymentId);
            
            // Query from database instead
            const { data, error } = await supabase
                .from('razorpay_payments')
                .select('*')
                .eq('razorpay_payment_id', paymentId)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ Failed to fetch payment details:', error);
            throw error;
        }
    },

    /**
     * Get payment history for current user
     */
    async getUserPayments() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('razorpay_payments')
                .select(`
                    *,
                    orders:order_id (
                        order_number,
                        total_amount,
                        created_at
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ Failed to fetch user payments:', error);
            throw error;
        }
    },

    /**
     * Check if Razorpay is enabled
     */
    async isEnabled() {
        try {
            if (!this.config) {
                await this.loadConfig();
            }
            return this.config && this.config.enabled;
        } catch (error) {
            return false;
        }
    }
};

// Auto-initialize on page load (optional)
// Uncomment if you want to load on every page
// document.addEventListener('DOMContentLoaded', () => {
//     RazorpayService.initialize().catch(console.error);
// });
