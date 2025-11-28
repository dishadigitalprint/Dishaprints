/**
 * Authentication-aware Header Component
 * Manages user session, role-based navigation, and logout
 */

class AuthHeader {
    constructor() {
        this.user = this.getUserSession();
        this.init();
    }

    init() {
        this.renderHeader();
        this.attachEventListeners();
    }

    getUserSession() {
        const userData = localStorage.getItem('userSession');
        if (userData) {
            const user = JSON.parse(userData);
            // Verify phone verification status
            if (user.phoneVerified) {
                return user;
            }
        }
        
        // Not logged in or phone not verified
        return null;
    }

    setUserSession(userData) {
        localStorage.setItem('userSession', JSON.stringify(userData));
        this.user = userData;
    }

    logout() {
        localStorage.removeItem('userSession');
        sessionStorage.clear(); // Clear cart and checkout data
        window.location.href = 'index.html';
    }

    renderHeader() {
        const headerNav = document.getElementById('header-nav');
        const userActions = document.getElementById('user-actions');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (!headerNav || !userActions) return;

        // If not logged in, show simple navigation
        if (!this.user) {
            headerNav.innerHTML = `
                <a href="index.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-home mr-1"></i>Home
                </a>
                <a href="order.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-plus-circle mr-1"></i>Browse Products
                </a>
                <a href="order-upload.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-file-upload mr-1"></i>Multi-File Upload
                </a>
                <a href="track-order.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-truck mr-1"></i>Track Order
                </a>
            `;
            
            userActions.innerHTML = `
                <a href="https://wa.me/919700653332" class="text-sm font-medium text-accentA-600 hover:text-accentA-700 transition-colors duration-200 flex items-center gap-2">
                    <i class="fab fa-whatsapp text-lg"></i>
                    <span class="hidden lg:inline">WhatsApp</span>
                </a>
                <a href="cart.html" class="relative text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-shopping-cart text-xl"></i>
                    <span id="cart-badge" class="hidden absolute -top-2 -right-2 bg-danger-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
                </a>
                <a href="login.html" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    <i class="fas fa-sign-in-alt mr-2"></i>Login
                </a>
            `;
            
            this.updateCartBadge();
            return;
        }

        // Simplified navigation for logged-in users (no marketing pages)
        const userNav = `
            <a href="order.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-plus-circle mr-1"></i>New Order
            </a>
            <a href="order-upload.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-file-upload mr-1"></i>Multi-File Upload
            </a>
            <a href="my-orders.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-list mr-1"></i>My Orders
            </a>
            <a href="track-order.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-truck mr-1"></i>Track Order
            </a>
        `;

        const adminNav = `
            <a href="admin-dashboard.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-dashboard mr-1"></i>Dashboard
            </a>
            <a href="admin-orders.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-shopping-cart mr-1"></i>Orders
            </a>
            <a href="admin-customers.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-users mr-1"></i>Customers
            </a>
            <a href="admin-production.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-industry mr-1"></i>Production
            </a>
            <a href="admin-cart-history.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-shopping-basket mr-1"></i>Cart History
            </a>
            <a href="admin-settings.html" class="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-cog mr-1"></i>Settings
            </a>
        `;

        // Set navigation based on role
        headerNav.innerHTML = this.user.role === 'admin' ? adminNav : userNav;
        
        // Mobile navigation
        if (mobileNav) {
            if (!this.user) {
                // Guest mobile navigation
                mobileNav.innerHTML = `
                    <a href="index.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <a href="order.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-plus-circle mr-2"></i>Browse Products
                    </a>
                    <a href="order-upload.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-file-upload mr-2"></i>Multi-File Upload
                    </a>
                    <a href="track-order.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-truck mr-2"></i>Track Order
                    </a>
                    <div class="border-t border-neutral-200 pt-3 mt-3">
                        <a href="cart.html" class="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                            <i class="fas fa-shopping-cart"></i>
                            Cart
                        </a>
                        <a href="login.html" class="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
                            <i class="fas fa-sign-in-alt"></i>
                            Login
                        </a>
                    </div>
                `;
            } else {
                const userMobileNav = `
                    <a href="order.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-plus-circle mr-2"></i>New Order
                    </a>
                    <a href="order-upload.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-file-upload mr-2"></i>Multi-File Upload
                    </a>
                    <a href="my-orders.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-list mr-2"></i>My Orders
                    </a>
                    <a href="track-order.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-truck mr-2"></i>Track Order
                    </a>
                    <div class="border-t border-neutral-200 pt-3 mt-3">
                        <a href="cart.html" class="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                            <i class="fas fa-shopping-cart"></i>
                            Cart
                        </a>
                        <button id="mobile-logout-btn" class="text-sm text-danger-600 hover:text-danger-700 py-2">Logout</button>
                    </div>
                `;

                const adminMobileNav = `
                    <a href="admin-dashboard.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-dashboard mr-2"></i>Dashboard
                    </a>
                    <a href="admin-orders.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-shopping-cart mr-2"></i>Orders
                    </a>
                    <a href="admin-customers.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-users mr-2"></i>Customers
                    </a>
                    <a href="admin-production.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-industry mr-2"></i>Production
                    </a>
                    <a href="admin-inventory.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-boxes mr-2"></i>Inventory
                    </a>
                    <a href="admin-cart-history.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-shopping-basket mr-2"></i>Cart History
                    </a>
                    <a href="admin-settings.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-cog mr-2"></i>Settings
                    </a>
                    <a href="admin-activity.html" class="block text-sm text-neutral-700 hover:text-primary-600 font-medium py-2">
                        <i class="fas fa-history mr-2"></i>Activity Log
                    </a>
                    <div class="border-t border-neutral-200 pt-3 mt-3">
                        <button id="mobile-logout-btn" class="text-sm text-danger-600 hover:text-danger-700 py-2">Logout</button>
                    </div>
                `;
                
                mobileNav.innerHTML = this.user.role === 'admin' ? adminMobileNav : userMobileNav;
            }
        }

        // User actions (only if logged in)
        if (!this.user) {
            this.updateCartBadge();
            return;
        }
        userActions.innerHTML = `
            <a href="https://wa.me/919876543210" class="text-sm font-medium text-accentA-600 hover:text-accentA-700 transition-colors duration-200 flex items-center gap-2">
                <i class="fab fa-whatsapp text-lg"></i>
                <span class="hidden lg:inline">WhatsApp</span>
            </a>
            <a href="cart.html" class="relative text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                <i class="fas fa-shopping-cart text-xl"></i>
                <span id="cart-badge" class="hidden absolute -top-2 -right-2 bg-danger-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </a>
            <div class="relative group">
                <button class="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors duration-200">
                    <i class="fas fa-user-circle text-lg"></i>
                    <span class="hidden md:inline">${this.user.name}</span>
                    <i class="fas fa-chevron-down text-xs hidden md:inline"></i>
                </button>
                
                <!-- Dropdown Menu -->
                <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div class="py-2">
                        <div class="px-4 py-2 border-b border-neutral-200">
                            <p class="text-xs text-neutral-500">Signed in as</p>
                            <p class="text-sm font-medium text-neutral-900 truncate">+91 ${this.user.phone}</p>
                            ${this.user.role === 'admin' ? '<span class="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">Admin</span>' : ''}
                        </div>
                        <a href="my-account.html" class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                            <i class="fas fa-user w-4"></i>
                            <span>My Account</span>
                        </a>
                        <a href="my-orders.html" class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                            <i class="fas fa-shopping-bag w-4"></i>
                            <span>My Orders</span>
                        </a>
                        <a href="settings.html" class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                            <i class="fas fa-cog w-4"></i>
                            <span>Settings</span>
                        </a>
                        <div class="border-t border-neutral-200 mt-2 pt-2">
                            <button id="logout-btn" class="flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors w-full text-left">
                                <i class="fas fa-sign-out-alt w-4"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update cart badge
        this.updateCartBadge();
    }

    attachEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        }

        // Mobile logout button
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    updateCartBadge() {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const badge = document.getElementById('cart-badge');
        
        if (badge) {
            if (cart.length > 0) {
                badge.textContent = cart.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    switchToAdmin() {
        this.user.role = 'admin';
        this.setUserSession(this.user);
        this.renderHeader();
    }

    switchToUser() {
        this.user.role = 'user';
        this.setUserSession(this.user);
        this.renderHeader();
    }
}

// Initialize on page load
let authHeader;
document.addEventListener('DOMContentLoaded', () => {
    authHeader = new AuthHeader();
});

// Expose globally for debugging
window.authHeader = authHeader;
