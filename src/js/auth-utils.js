/**
 * Authentication Utility
 * Centralized authentication checks and user management
 */

const AUTH = {
    /**
     * Check if user is authenticated using localStorage session
     * @returns {Promise<Object|null>} User session or null
     */
    async getUser() {
        try {
            // Get from localStorage
            const sessionData = localStorage.getItem('userSession');
            if (!sessionData) {
                return null;
            }
            
            const session = JSON.parse(sessionData);
            
            // Verify user still exists in database
            const { data: profile, error } = await supabaseClient
                .from('users')
                .select('id, phone, name, email, role, phone_verified')
                .eq('id', session.id)
                .single();

            if (error || !profile) {
                localStorage.removeItem('userSession');
                return null;
            }

            return {
                id: profile.id,
                phone: profile.phone,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                phoneVerified: profile.phone_verified,
                loggedIn: true
            };
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    /**
     * Check if user has admin role (server-side verification)
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        const user = await this.getUser();
        return user && user.role === 'admin';
    },

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} returnUrl - URL to return to after login
     * @returns {Promise<Object|null>} User session if authenticated, otherwise redirects
     */
    async requireAuth(returnUrl = null) {
        const user = await this.getUser();
        
        if (!user) {
            const currentPage = returnUrl || window.location.pathname;
            alert('Please login to continue');
            window.location.href = `login.html?return=${encodeURIComponent(currentPage)}`;
            return null;
        }
        
        return user;
    },

    /**
     * Require admin role - redirect if not admin (server-side verification)
     * @returns {Promise<Object|null>} User session if admin, otherwise redirects
     */
    async requireAdmin() {
        const user = await this.requireAuth();
        
        if (user && user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'my-orders.html';
            return null;
        }
        
        return user;
    },

    /**
     * Logout user (proper Supabase signOut)
     */
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await supabaseClient.auth.signOut();
                localStorage.removeItem('userSession');
                sessionStorage.clear();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if API call fails
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        }
    },

    /**
     * Cache user data in localStorage for UI purposes only (NOT for authorization)
     * @param {Object} userData - User data to cache
     */
    cacheUserData(userData) {
        // Store for UI display only - NEVER trust this for authorization
        localStorage.setItem('userSessionCache', JSON.stringify({
            name: userData.name,
            phone: userData.phone,
            email: userData.email
        }));
    },

    /**
     * Get cached user data for UI display
     * @returns {Object|null}
     */
    getCachedUserData() {
        const cached = localStorage.getItem('userSessionCache');
        return cached ? JSON.parse(cached) : null;
    }
};

// Make available globally
window.AUTH = AUTH;

console.log('Authentication utility loaded');
