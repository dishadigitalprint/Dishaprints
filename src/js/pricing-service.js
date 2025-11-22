/**
 * Pricing Service - Disha Digital Prints
 * Fetches prices from database and calculates order totals dynamically
 */

class PricingService {
    constructor() {
        this.pricingConfig = null;
        this.loadPricing();
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

            if (error) {
                console.error('Error loading pricing:', error);
                // Use default fallback pricing
                this.pricingConfig = this.getDefaultPricing();
                return;
            }

            this.pricingConfig = data;
            console.log('Pricing configuration loaded:', this.pricingConfig);
        } catch (error) {
            console.error('Error in loadPricing:', error);
            this.pricingConfig = this.getDefaultPricing();
        }
    }

    getDefaultPricing() {
        return {
            bw_per_page: 2.00,
            color_per_page: 10.00,
            standard_paper_multiplier: 1.00,
            premium_paper_multiplier: 1.50,
            glossy_paper_multiplier: 2.00,
            binding_none: 0.00,
            binding_staple: 10.00,
            binding_spiral: 50.00,
            binding_perfect: 100.00,
            binding_hardcover: 200.00,
            cover_none: 0.00,
            cover_standard: 20.00,
            cover_glossy: 40.00,
            cover_laminated: 60.00,
            business_card_standard: 200.00,
            business_card_premium: 400.00,
            business_card_luxury: 800.00,
            brochure_a4_per_page: 15.00,
            brochure_a5_per_page: 10.00,
            brochure_letter_per_page: 12.00,
            delivery_charge_standard: 80.00,
            delivery_charge_express: 150.00,
            min_order_free_delivery: 500.00,
            gst_percentage: 18.00,
            bulk_discount_50_pages: 5.00,
            bulk_discount_100_pages: 10.00,
            bulk_discount_500_pages: 15.00
        };
    }

    async ensurePricingLoaded() {
        if (!this.pricingConfig) {
            await this.loadPricing();
        }
    }

    /**
     * Calculate price for a single file
     * @param {Object} fileConfig - File configuration
     * @param {number} fileConfig.pages - Number of pages
     * @param {number} fileConfig.quantity - Number of copies
     * @param {string} fileConfig.printMode - 'bw' or 'color'
     * @param {string} fileConfig.paperQuality - 'standard', 'premium', or 'glossy'
     * @param {string} fileConfig.binding - Binding type
     * @param {string} fileConfig.cover - Cover type
     */
    calculateFilePrice(fileConfig) {
        if (!this.pricingConfig) {
            console.warn('Pricing not loaded, using defaults');
            this.pricingConfig = this.getDefaultPricing();
        }

        const {
            pages = 0,
            quantity = 1,
            printMode = 'bw',
            paperQuality = 'standard',
            binding = 'none',
            cover = 'none'
        } = fileConfig;

        // Base print rate per page
        let pricePerPage = printMode === 'color' 
            ? this.pricingConfig.color_per_page 
            : this.pricingConfig.bw_per_page;

        // Apply paper quality multiplier
        const paperMultiplier = this.getPaperMultiplier(paperQuality);
        pricePerPage *= paperMultiplier;

        // Calculate print total
        let printTotal = pages * quantity * pricePerPage;

        // Apply bulk discount if applicable
        const discount = this.getBulkDiscount(pages * quantity);
        if (discount > 0) {
            printTotal = printTotal * (1 - discount / 100);
        }

        // Add binding cost
        const bindingCost = this.getBindingPrice(binding);

        // Add cover cost
        const coverCost = this.getCoverPrice(cover);

        // Calculate file total
        const fileTotal = printTotal + bindingCost + coverCost;

        return {
            pricePerPage: pricePerPage.toFixed(2),
            printTotal: printTotal.toFixed(2),
            bindingCost: bindingCost.toFixed(2),
            coverCost: coverCost.toFixed(2),
            fileTotal: fileTotal.toFixed(2),
            discount: discount,
            totalPages: pages * quantity
        };
    }

    /**
     * Calculate order total for multiple files
     * @param {Array} files - Array of file configurations
     * @param {string} deliveryType - 'standard' or 'express'
     */
    calculateOrderTotal(files, deliveryType = 'standard') {
        let subtotal = 0;

        const fileCalculations = files.map(file => {
            const calc = this.calculateFilePrice(file);
            subtotal += parseFloat(calc.fileTotal);
            return calc;
        });

        // Delivery charge
        const deliveryCharge = this.getDeliveryCharge(subtotal, deliveryType);

        // GST calculation
        const gst = (subtotal * this.pricingConfig.gst_percentage) / 100;

        // Grand total
        const grandTotal = subtotal + deliveryCharge + gst;

        return {
            subtotal: subtotal.toFixed(2),
            deliveryCharge: deliveryCharge.toFixed(2),
            gst: gst.toFixed(2),
            gstPercentage: this.pricingConfig.gst_percentage,
            grandTotal: grandTotal.toFixed(2),
            fileCalculations
        };
    }

    getPaperMultiplier(quality) {
        const multipliers = {
            'standard': this.pricingConfig.standard_paper_multiplier,
            'premium': this.pricingConfig.premium_paper_multiplier,
            'glossy': this.pricingConfig.glossy_paper_multiplier
        };
        return multipliers[quality] || 1.00;
    }

    getBindingPrice(bindingType) {
        const prices = {
            'none': this.pricingConfig.binding_none,
            'staple': this.pricingConfig.binding_staple,
            'spiral': this.pricingConfig.binding_spiral,
            'perfect': this.pricingConfig.binding_perfect,
            'hardcover': this.pricingConfig.binding_hardcover
        };
        return prices[bindingType] || 0;
    }

    getCoverPrice(coverType) {
        const prices = {
            'none': this.pricingConfig.cover_none,
            'standard': this.pricingConfig.cover_standard,
            'glossy': this.pricingConfig.cover_glossy,
            'laminated': this.pricingConfig.cover_laminated
        };
        return prices[coverType] || 0;
    }

    getBulkDiscount(totalPages) {
        if (totalPages >= 500) {
            return this.pricingConfig.bulk_discount_500_pages;
        } else if (totalPages >= 100) {
            return this.pricingConfig.bulk_discount_100_pages;
        } else if (totalPages >= 50) {
            return this.pricingConfig.bulk_discount_50_pages;
        }
        return 0;
    }

    getDeliveryCharge(subtotal, deliveryType) {
        // Free delivery above threshold
        if (subtotal >= this.pricingConfig.min_order_free_delivery) {
            return 0;
        }

        if (deliveryType === 'express') {
            return this.pricingConfig.delivery_charge_express;
        }

        return this.pricingConfig.delivery_charge_standard;
    }

    // Business Cards pricing
    getBusinessCardPrice(quantity, quality = 'standard') {
        const pricesPer100 = {
            'standard': this.pricingConfig.business_card_standard,
            'premium': this.pricingConfig.business_card_premium,
            'luxury': this.pricingConfig.business_card_luxury
        };

        const pricePerCard = (pricesPer100[quality] || pricesPer100.standard) / 100;
        return (pricePerCard * quantity).toFixed(2);
    }

    // Brochure pricing
    getBrochurePrice(pages, quantity, size = 'a4') {
        const pricePerPage = {
            'a4': this.pricingConfig.brochure_a4_per_page,
            'a5': this.pricingConfig.brochure_a5_per_page,
            'letter': this.pricingConfig.brochure_letter_per_page
        };

        const total = pages * quantity * (pricePerPage[size] || pricePerPage.a4);
        return total.toFixed(2);
    }
}

// Create global instance
window.pricingService = new PricingService();
