/**
 * Cart Tracking Utility
 * Tracks all cart activities to database for follow-up and analytics
 */

const CartTracker = {
    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('cartSessionId');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('cartSessionId', sessionId);
        }
        return sessionId;
    },

    // Get current user info
    getUserInfo() {
        try {
            const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
            return {
                user_id: userSession.id || null,
                phone: userSession.phone || null,
                name: userSession.name || null,
                email: userSession.email || null
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            return {
                user_id: null,
                phone: null,
                name: null,
                email: null
            };
        }
    },

    // Get current cart
    getCurrentCart() {
        try {
            return JSON.parse(sessionStorage.getItem('cart') || '[]');
        } catch (error) {
            console.error('Error getting cart:', error);
            return [];
        }
    },

    // Calculate cart value
    getCartValue(cart) {
        return cart.reduce((sum, item) => sum + (item.total || 0), 0);
    },

    /**
     * Track cart activity
     * @param {string} action - item_added, item_removed, item_updated, checkout_started, checkout_completed, cart_abandoned, cart_cleared
     * @param {object} itemDetails - Details of the item being added/removed (optional)
     */
    async trackActivity(action, itemDetails = null) {
        try {
            const sessionId = this.getSessionId();
            const userInfo = this.getUserInfo();
            const cart = this.getCurrentCart();
            const cartValue = this.getCartValue(cart);

            const activityData = {
                session_id: sessionId,
                user_id: userInfo.user_id,
                phone: userInfo.phone,
                name: userInfo.name,
                email: userInfo.email,
                action: action,
                cart_snapshot: cart.length > 0 ? cart : null,
                cart_value: cartValue,
                item_count: cart.length,
                item_details: itemDetails,
                page_url: window.location.href,
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString()
            };

            // For item-specific actions, add product details
            if (itemDetails) {
                activityData.product_type = itemDetails.product || itemDetails.productType;
                activityData.product_name = itemDetails.productName;
            }

            // Save to database
            const { data, error } = await supabaseClient
                .from('cart_history')
                .insert([activityData]);

            if (error) {
                console.error('❌ Error tracking cart activity:', error);
                return { success: false, error };
            }

            console.log(`✅ Cart activity tracked: ${action}`, data);
            return { success: true, data };

        } catch (error) {
            console.error('❌ Error in trackActivity:', error);
            return { success: false, error };
        }
    },

    /**
     * Track item added to cart
     */
    async trackItemAdded(item) {
        return await this.trackActivity('item_added', item);
    },

    /**
     * Track item removed from cart
     */
    async trackItemRemoved(item) {
        return await this.trackActivity('item_removed', item);
    },

    /**
     * Track item quantity updated
     */
    async trackItemUpdated(item) {
        return await this.trackActivity('item_updated', item);
    },

    /**
     * Track checkout started
     */
    async trackCheckoutStarted() {
        return await this.trackActivity('checkout_started');
    },

    /**
     * Track checkout completed
     */
    async trackCheckoutCompleted() {
        return await this.trackActivity('checkout_completed');
    },

    /**
     * Track cart abandoned
     */
    async trackCartAbandoned() {
        return await this.trackActivity('cart_abandoned');
    },

    /**
     * Track cart cleared
     */
    async trackCartCleared() {
        return await this.trackActivity('cart_cleared');
    },

    /**
     * Setup automatic abandonment detection
     * Tracks when user leaves checkout page without completing
     */
    setupAbandonmentTracking() {
        // Track when user leaves checkout page
        if (window.location.pathname.includes('checkout')) {
            window.addEventListener('beforeunload', () => {
                const cart = this.getCurrentCart();
                if (cart.length > 0) {
                    // Use sendBeacon for reliability on page unload
                    const sessionId = this.getSessionId();
                    const userInfo = this.getUserInfo();
                    const cartValue = this.getCartValue(cart);

                    // Note: This is a backup - main tracking happens on navigation
                    console.log('User leaving checkout with items in cart');
                }
            });
        }

        // Track abandonment after 15 minutes of inactivity
        let abandonmentTimer;
        const resetAbandonmentTimer = () => {
            clearTimeout(abandonmentTimer);
            abandonmentTimer = setTimeout(() => {
                const cart = this.getCurrentCart();
                if (cart.length > 0 && !window.location.pathname.includes('order-confirmation')) {
                    this.trackCartAbandoned();
                }
            }, 15 * 60 * 1000); // 15 minutes
        };

        // Reset timer on user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetAbandonmentTimer, { passive: true });
        });

        resetAbandonmentTimer();
    }
};

// Export for global use
window.CartTracker = CartTracker;

console.log('🛒 Cart Tracker initialized');
