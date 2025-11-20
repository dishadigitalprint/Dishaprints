/**
 * Configuration Loader - Fetches pricing and product config from database
 * Loads base pricing and product configurations set by admin
 */

const ConfigLoader = {
    // Cache for loaded configurations
    cache: {
        basePricing: {},
        productConfigs: {},
        lastFetch: null
    },

    /**
     * Load all base pricing from database
     */
    async loadBasePricing() {
        try {
            const { data, error } = await supabaseClient
                .from('base_pricing')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            // Store in cache
            data.forEach(item => {
                this.cache.basePricing[item.product_type] = item;
            });

            this.cache.lastFetch = new Date();
            console.log('✅ Base pricing loaded:', this.cache.basePricing);
            return { success: true, data: this.cache.basePricing };
        } catch (error) {
            console.error('❌ Error loading base pricing:', error);
            return { success: false, error };
        }
    },

    /**
     * Load product configurations from database
     * @param {string} productType - e.g., 'documents', 'business_cards', 'brochures'
     */
    async loadProductConfig(productType) {
        try {
            const { data, error } = await supabaseClient
                .from('product_config')
                .select('*')
                .eq('product_type', productType)
                .eq('is_active', true)
                .order('config_key')
                .order('sort_order');

            if (error) throw error;

            // Group by config_key
            if (!this.cache.productConfigs[productType]) {
                this.cache.productConfigs[productType] = {};
            }

            data.forEach(config => {
                if (!this.cache.productConfigs[productType][config.config_key]) {
                    this.cache.productConfigs[productType][config.config_key] = [];
                }
                this.cache.productConfigs[productType][config.config_key].push(config);
            });

            console.log(`✅ Config loaded for ${productType}:`, this.cache.productConfigs[productType]);
            return { success: true, data: this.cache.productConfigs[productType] };
        } catch (error) {
            console.error(`❌ Error loading config for ${productType}:`, error);
            return { success: false, error };
        }
    },

    /**
     * Get base price for a product type
     * @param {string} productType - e.g., 'documents', 'business_cards', 'brochures'
     */
    getBasePrice(productType) {
        const pricing = this.cache.basePricing[productType];
        return pricing ? parseFloat(pricing.base_price) : 0;
    },

    /**
     * Get GST percentage for a product type
     * @param {string} productType
     */
    getGSTRate(productType) {
        const pricing = this.cache.basePricing[productType];
        return pricing ? parseFloat(pricing.gst_percentage) / 100 : 0.05;
    },

    /**
     * Get price unit description
     * @param {string} productType
     */
    getPriceUnit(productType) {
        const pricing = this.cache.basePricing[productType];
        return pricing ? pricing.price_unit : 'per unit';
    },

    /**
     * Get price modifier for a specific config option
     * @param {string} productType
     * @param {string} configKey - e.g., 'paper_type', 'color', 'binding'
     * @param {string} configValue - e.g., '80gsm', 'color', 'spiral'
     */
    getPriceModifier(productType, configKey, configValue) {
        const configs = this.cache.productConfigs[productType];
        if (!configs || !configs[configKey]) return 0;

        const option = configs[configKey].find(c => c.config_value === configValue);
        return option ? parseFloat(option.price_modifier) : 0;
    },

    /**
     * Get all options for a config key
     * @param {string} productType
     * @param {string} configKey
     */
    getConfigOptions(productType, configKey) {
        const configs = this.cache.productConfigs[productType];
        if (!configs || !configs[configKey]) return [];

        return configs[configKey].map(c => ({
            value: c.config_value,
            label: c.display_label || c.config_value,
            priceModifier: parseFloat(c.price_modifier)
        }));
    },

    /**
     * Populate a dropdown with config options
     * @param {HTMLSelectElement} selectElement
     * @param {string} productType
     * @param {string} configKey
     */
    populateDropdown(selectElement, productType, configKey) {
        const options = this.getConfigOptions(productType, configKey);
        
        if (options.length === 0) {
            console.warn(`No options found for ${productType} - ${configKey}`);
            return;
        }

        // Clear existing options except the first (placeholder if any)
        const hasPlaceholder = selectElement.options[0]?.disabled;
        selectElement.innerHTML = hasPlaceholder ? selectElement.options[0].outerHTML : '';

        // Add options from database
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            option.dataset.priceModifier = opt.priceModifier;
            selectElement.appendChild(option);
        });

        console.log(`✅ Populated dropdown for ${configKey} with ${options.length} options`);
    },

    /**
     * Initialize configuration for a product type
     * @param {string} productType
     */
    async initializeForProduct(productType) {
        console.log(`🔄 Loading configuration for ${productType}...`);
        
        // Load base pricing if not already loaded
        if (Object.keys(this.cache.basePricing).length === 0) {
            await this.loadBasePricing();
        }

        // Load product-specific configs
        await this.loadProductConfig(productType);

        return { success: true };
    },

    /**
     * Clear cache and reload
     */
    clearCache() {
        this.cache = {
            basePricing: {},
            productConfigs: {},
            lastFetch: null
        };
    }
};

// Export for global use
window.ConfigLoader = ConfigLoader;

console.log('📦 Configuration Loader initialized');
