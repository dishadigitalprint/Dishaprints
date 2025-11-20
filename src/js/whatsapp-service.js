/**
 * WhatsApp Business Integration
 * Handles OTP verification and admin notifications via WhatsApp
 */

class WhatsAppService {
    constructor() {
        // WhatsApp Business API Configuration (will be loaded from database)
        this.config = {
            phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
            accessToken: 'YOUR_ACCESS_TOKEN',
            apiVersion: 'v18.0',
            businessPhoneNumber: '+919876543210',
            adminPhoneNumber: '+919876543210',
            silentNotifications: true,
            enableLoginNotifications: true,
            enableCartNotifications: true,
            enableOrderNotifications: true,
            enablePaymentNotifications: true
        };
        
        this.configLoaded = false;
        this.apiUrl = '';
        
        // Load config from database
        this.loadConfig();
    }
    
    /**
     * Load WhatsApp configuration from database
     */
    async loadConfig() {
        try {
            if (typeof supabase === 'undefined') {
                console.warn('Supabase not available, using default WhatsApp config');
                return;
            }
            
            const { data, error } = await supabase
                .from('whatsapp_config')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error) {
                console.error('Error loading WhatsApp config:', error);
                return;
            }
            
            if (data) {
                this.config = {
                    phoneNumberId: data.phone_number_id,
                    accessToken: data.access_token,
                    apiVersion: data.api_version || 'v18.0',
                    businessPhoneNumber: data.business_phone_number,
                    adminPhoneNumber: data.admin_phone_number,
                    silentNotifications: data.silent_notifications !== false,
                    enableLoginNotifications: data.enable_login_notifications !== false,
                    enableCartNotifications: data.enable_cart_notifications !== false,
                    enableOrderNotifications: data.enable_order_notifications !== false,
                    enablePaymentNotifications: data.enable_payment_notifications !== false
                };
                
                this.apiUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
                this.configLoaded = true;
                
                console.log('✅ WhatsApp config loaded from database');
            }
        } catch (error) {
            console.error('Error loading WhatsApp config:', error);
        }
    }

    /**
     * Send OTP via WhatsApp
     * @param {string} phoneNumber - User's phone number with country code (e.g., +919876543210)
     * @param {string} otp - 6-digit OTP
     */
    async sendOTP(phoneNumber, otp) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: 'otp_verification', // Template created in Meta Business Manager
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: otp }
                            ]
                        }
                    ]
                }
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('OTP sent successfully via WhatsApp:', result);
                return { success: true, messageId: result.messages[0].id };
            } else {
                console.error('Failed to send OTP:', result);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error sending WhatsApp OTP:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send plain text message (for admin notifications)
     */
    async sendTextMessage(phoneNumber, message) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('Message sent successfully:', result);
                return { success: true, messageId: result.messages[0].id };
            } else {
                console.error('Failed to send message:', result);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify admin about user activity (silent notification)
     */
    async notifyAdmin(activity, silent = null) {
        // Use config setting if not explicitly specified
        const isSilent = silent !== null ? silent : this.config.silentNotifications;
        
        // Format message based on notification type
        let icon = isSilent ? '🔕' : '🔔';
        let prefix = isSilent ? '[Silent]' : '';
        
        let message = `${icon} ${prefix} *Disha Digital Prints*\n\n`;
        
        // Customize message based on action type
        if (activity.action.includes('logged in')) {
            message += `👤 *New Login*\n` +
                      `📱 ${activity.name} (${activity.phone})\n` +
                      `⏰ ${new Date(activity.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
        } else if (activity.action.includes('Added item to cart')) {
            message += `🛒 *Item Added to Cart*\n` +
                      `👤 ${activity.name} (${activity.phone})\n` +
                      `💰 Cart Value: ₹${activity.amount || 0}\n` +
                      `📦 Items: ${activity.itemCount || 1}\n` +
                      `⏰ ${new Date(activity.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
        } else {
            // General format for other actions
            message += `⚡ *${activity.action}*\n` +
                      `👤 ${activity.name} (${activity.phone})\n` +
                      `⏰ ${new Date(activity.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n` +
                      (activity.amount ? `💰 Amount: ₹${activity.amount}\n` : '') +
                      (activity.orderId ? `🆔 Order: ${activity.orderId}\n` : '');
        }
        
        // Add silent mode indicator
        if (isSilent) {
            message += `\n_No sound notification_`;
        }

        return await this.sendTextMessage(this.config.adminPhoneNumber, message);
    }

    /**
     * Send order confirmation to customer
     */
    async sendOrderConfirmation(phoneNumber, orderDetails) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: 'order_confirmation', // Template created in Meta Business Manager
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: orderDetails.orderId },
                                { type: 'text', text: orderDetails.amount },
                                { type: 'text', text: orderDetails.items }
                            ]
                        }
                    ]
                }
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            const result = await response.json();
            return response.ok ? { success: true } : { success: false, error: result.error };
        } catch (error) {
            console.error('Error sending order confirmation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Format phone number for WhatsApp (remove spaces, hyphens)
     */
    formatPhoneNumber(phone) {
        // Remove all non-numeric characters except +
        let formatted = phone.replace(/[^\d+]/g, '');
        
        // Add +91 if not present and number starts with 6-9 (Indian mobile)
        if (!formatted.startsWith('+') && /^[6-9]\d{9}$/.test(formatted)) {
            formatted = '+91' + formatted;
        }
        
        return formatted;
    }

    /**
     * Validate Indian phone number
     */
    validatePhoneNumber(phone) {
        const cleaned = phone.replace(/[^\d]/g, '');
        // Indian mobile: starts with 6-9, 10 digits
        return /^[6-9]\d{9}$/.test(cleaned);
    }
}

// Export singleton instance
const whatsappService = new WhatsAppService();

// Activity Logger for Admin Notifications
class ActivityLogger {
    constructor() {
        this.activities = this.loadActivities();
        this.currentUser = this.getCurrentUser();
    }

    loadActivities() {
        try {
            return JSON.parse(localStorage.getItem('adminActivities') || '[]');
        } catch {
            return [];
        }
    }

    saveActivities() {
        localStorage.setItem('adminActivities', JSON.stringify(this.activities));
    }

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('userSession') || '{}');
        } catch {
            return {};
        }
    }

    async log(action, additionalData = {}) {
        if (!this.currentUser.phone) return;

        const activity = {
            phone: this.currentUser.phone,
            name: this.currentUser.name || 'Guest',
            action: action,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            ...additionalData
        };

        // Save locally
        this.activities.unshift(activity);
        if (this.activities.length > 100) {
            this.activities = this.activities.slice(0, 100); // Keep last 100 activities
        }
        this.saveActivities();

        // Send WhatsApp notification to admin for important actions
        // Silent notifications: login, cart additions
        // Normal notifications: orders, payments
        const silentActions = [
            'User logged in',
            'Added item to cart',
            'Viewing'
        ];
        
        const normalActions = [
            'Order placed',
            'Payment completed',
            'Payment failed'
        ];
        
        const moderateActions = [
            'Cart abandoned'
        ];

        // Check if notifications are enabled for this action type
        const config = whatsappService.config;
        let shouldNotify = false;
        
        if (action.includes('logged in') && config.enableLoginNotifications) {
            shouldNotify = true;
        } else if (action.includes('Added item to cart') && config.enableCartNotifications) {
            shouldNotify = true;
        } else if (action.includes('Order placed') && config.enableOrderNotifications) {
            shouldNotify = true;
        } else if ((action.includes('Payment completed') || action.includes('Payment failed')) && config.enablePaymentNotifications) {
            shouldNotify = true;
        } else if (action.includes('Cart abandoned')) {
            shouldNotify = true; // Always notify about abandonment
        }
        
        if (!shouldNotify) {
            console.log('Notification disabled for action:', action);
            return;
        }
        
        // Determine notification type
        if (silentActions.some(a => action.includes(a))) {
            // Silent notification (no sound)
            await whatsappService.notifyAdmin(activity, true);
        } else if (normalActions.some(a => action.includes(a))) {
            // Normal notification (with sound)
            await whatsappService.notifyAdmin(activity, false);
        } else if (moderateActions.some(a => action.includes(a))) {
            // Use default setting from config
            await whatsappService.notifyAdmin(activity);
        }

        console.log('Activity logged:', activity);
    }

    // Specific activity methods
    async logLogin() {
        await this.log('User logged in');
    }

    async logPageView(pageName) {
        await this.log(`Viewing ${pageName} page`);
    }

    async logAddToCart(amount, itemCount = 1) {
        await this.log('Added item to cart', { amount, itemCount });
    }

    async logCartAbandonment(cartTotal) {
        await this.log('Cart abandoned - did not checkout', { amount: cartTotal });
    }

    async logOrderPlaced(orderId, amount) {
        await this.log('Order placed', { orderId, amount });
    }

    async logPaymentCompleted(orderId, amount) {
        await this.log('Payment completed', { orderId, amount });
    }

    async logPaymentFailed(orderId, amount, reason) {
        await this.log('Payment failed', { orderId, amount, reason });
    }
}

// Export singleton instance
const activityLogger = new ActivityLogger();

// Initialize activity tracking on page load
document.addEventListener('DOMContentLoaded', function() {
    // Log page view
    const pageName = document.title.split('-')[0].trim();
    activityLogger.logPageView(pageName);

    // Track cart abandonment (if user leaves checkout pages without completing)
    if (window.location.pathname.includes('checkout') || window.location.pathname.includes('cart')) {
        let abandonmentTimer;
        
        const resetTimer = () => {
            clearTimeout(abandonmentTimer);
            abandonmentTimer = setTimeout(() => {
                const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
                if (cart.length > 0) {
                    const total = cart.reduce((sum, item) => sum + item.total, 0);
                    activityLogger.logCartAbandonment(total);
                }
            }, 300000); // 5 minutes of inactivity
        };

        // Reset timer on user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        resetTimer();
    }
});

console.log('WhatsApp Business integration loaded');
