/**
 * Admin Pricing Configuration - Disha Digital Prints
 * Manages product pricing, binding costs, cover prices, and bulk discounts
 */

class AdminPricing {
    constructor() {
        this.init();
    }

    async init() {
        if (!this.checkAdminAuth()) {
            return;
        }

        await this.loadPricing();
        this.attachEventListeners();
    }

    checkAdminAuth() {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        
        if (!user.loggedIn || user.role !== 'admin') {
            alert('Admin access required');
            window.location.href = 'login.html?return=admin-pricing.html';
            return false;
        }

        // Update admin info in sidebar
        document.getElementById('admin-name').textContent = user.name || 'Admin';
        document.getElementById('admin-role').textContent = user.role === 'admin' ? 'Administrator' : 'User';
        
        return true;
    }

    async loadPricing() {
        try {
            const { data, error } = await supabase
                .from('pricing_config')
                .select('*')
                .eq('is_active', true)
                .order('effective_from', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;

            if (data) {
                // Fill form with current pricing
                this.populateForm(data);
                this.showMessage('Current pricing loaded successfully', 'success');
            } else {
                this.showMessage('No pricing configuration found. Please set up initial pricing.', 'info');
            }
        } catch (error) {
            console.error('Error loading pricing:', error);
            this.showMessage('Error loading pricing: ' + error.message, 'error');
        }
    }

    populateForm(data) {
        const fields = [
            'bw_per_page', 'color_per_page',
            'standard_paper_multiplier', 'premium_paper_multiplier', 'glossy_paper_multiplier',
            'binding_none', 'binding_staple', 'binding_spiral', 'binding_perfect', 'binding_hardcover',
            'cover_none', 'cover_standard', 'cover_glossy', 'cover_laminated',
            'business_card_standard', 'business_card_premium', 'business_card_luxury',
            'brochure_a4_per_page', 'brochure_a5_per_page', 'brochure_letter_per_page',
            'delivery_charge_standard', 'delivery_charge_express', 'min_order_free_delivery',
            'gst_percentage',
            'bulk_discount_50_pages', 'bulk_discount_100_pages', 'bulk_discount_500_pages'
        ];

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && data[field] !== undefined) {
                input.value = data[field];
            }
        });
    }

    attachEventListeners() {
        const form = document.getElementById('pricing-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = this.collectFormData();
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');

        try {
            // First, deactivate all existing pricing configs
            const { error: deactivateError } = await supabase
                .from('pricing_config')
                .update({ is_active: false })
                .eq('is_active', true);

            if (deactivateError) throw deactivateError;

            // Insert new pricing configuration
            const { data, error } = await supabase
                .from('pricing_config')
                .insert([{
                    ...formData,
                    is_active: true,
                    effective_from: new Date().toISOString(),
                    updated_by: user.email || user.phone || 'admin'
                }])
                .select()
                .single();

            if (error) throw error;

            this.showMessage('Pricing configuration saved successfully!', 'success');
            
            // Log activity
            if (typeof activityLogger !== 'undefined') {
                activityLogger.logActivity('pricing_updated', {
                    config_id: data.id,
                    updated_by: user.email || user.phone
                });
            }

        } catch (error) {
            console.error('Error saving pricing:', error);
            this.showMessage('Error saving pricing: ' + error.message, 'error');
        }
    }

    collectFormData() {
        return {
            bw_per_page: parseFloat(document.getElementById('bw_per_page').value),
            color_per_page: parseFloat(document.getElementById('color_per_page').value),
            standard_paper_multiplier: parseFloat(document.getElementById('standard_paper_multiplier').value),
            premium_paper_multiplier: parseFloat(document.getElementById('premium_paper_multiplier').value),
            glossy_paper_multiplier: parseFloat(document.getElementById('glossy_paper_multiplier').value),
            binding_none: parseFloat(document.getElementById('binding_none').value),
            binding_staple: parseFloat(document.getElementById('binding_staple').value),
            binding_spiral: parseFloat(document.getElementById('binding_spiral').value),
            binding_perfect: parseFloat(document.getElementById('binding_perfect').value),
            binding_hardcover: parseFloat(document.getElementById('binding_hardcover').value),
            cover_none: parseFloat(document.getElementById('cover_none').value),
            cover_standard: parseFloat(document.getElementById('cover_standard').value),
            cover_glossy: parseFloat(document.getElementById('cover_glossy').value),
            cover_laminated: parseFloat(document.getElementById('cover_laminated').value),
            business_card_standard: parseFloat(document.getElementById('business_card_standard').value),
            business_card_premium: parseFloat(document.getElementById('business_card_premium').value),
            business_card_luxury: parseFloat(document.getElementById('business_card_luxury').value),
            brochure_a4_per_page: parseFloat(document.getElementById('brochure_a4_per_page').value),
            brochure_a5_per_page: parseFloat(document.getElementById('brochure_a5_per_page').value),
            brochure_letter_per_page: parseFloat(document.getElementById('brochure_letter_per_page').value),
            delivery_charge_standard: parseFloat(document.getElementById('delivery_charge_standard').value),
            delivery_charge_express: parseFloat(document.getElementById('delivery_charge_express').value),
            min_order_free_delivery: parseFloat(document.getElementById('min_order_free_delivery').value),
            gst_percentage: parseFloat(document.getElementById('gst_percentage').value),
            bulk_discount_50_pages: parseFloat(document.getElementById('bulk_discount_50_pages').value),
            bulk_discount_100_pages: parseFloat(document.getElementById('bulk_discount_100_pages').value),
            bulk_discount_500_pages: parseFloat(document.getElementById('bulk_discount_500_pages').value)
        };
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `mb-6 p-4 rounded-lg ${
            type === 'success' ? 'bg-green-100 text-green-800' :
            type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
        }`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
}

function toggleSidebar() {
    // Mobile sidebar toggle functionality
    const sidebar = document.querySelector('aside');
    sidebar.classList.toggle('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new AdminPricing();
});
