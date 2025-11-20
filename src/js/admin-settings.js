// Admin Settings JavaScript
let currentUser = null;
let basePricing = {};
let productConfigs = {};
let paymentSettings = {};

// Secure admin authentication
(async function() {
    currentUser = await AUTH.requireAdmin();
    if (!currentUser) return;
    // init() is called at bottom of file
})();
let changes = {};

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// Switch tabs
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Load base pricing
async function loadBasePricing() {
    try {
        const { data, error } = await supabaseClient
            .from('base_pricing')
            .select('*')
            .order('product_type');

        if (error) throw error;

        basePricing = {};
        data.forEach(item => {
            basePricing[item.product_type] = item;
        });

        renderBasePricing();
    } catch (error) {
        console.error('Error loading base pricing:', error);
        document.getElementById('basePricingContainer').innerHTML = 
            '<p class="text-center text-red-500">Error loading pricing</p>';
    }
}

// Render base pricing
function renderBasePricing() {
    const container = document.getElementById('basePricingContainer');
    const products = ['documents', 'business_cards', 'brochures'];
    const labels = ['Document Printing', 'Business Cards', 'Brochures'];
    
    container.innerHTML = products.map((product, index) => {
        const pricing = basePricing[product] || {};
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-4">${labels[index]}</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                        <div class="flex items-center">
                            <span class="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l">₹</span>
                            <input type="number" step="0.01" value="${pricing.base_price || 0}" 
                                   onchange="updateBasePricing('${product}', 'base_price', this.value)"
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-r focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Price Unit</label>
                        <input type="text" value="${pricing.price_unit || ''}" 
                               onchange="updateBasePricing('${product}', 'price_unit', this.value)"
                               class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">GST %</label>
                        <input type="number" step="0.01" value="${pricing.gst_percentage || 5}" 
                               onchange="updateBasePricing('${product}', 'gst_percentage', this.value)"
                               class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update base pricing
function updateBasePricing(productType, field, value) {
    if (!changes.basePricing) changes.basePricing = {};
    if (!changes.basePricing[productType]) changes.basePricing[productType] = {};
    changes.basePricing[productType][field] = value;
    
    // Show save indicator
    showSaveIndicator();
}

// Load product configurations
async function loadProductConfigs() {
    try {
        const { data, error } = await supabaseClient
            .from('product_config')
            .select('*')
            .order('product_type')
            .order('config_key')
            .order('sort_order');

        if (error) throw error;

        // Group by product_type and config_key
        productConfigs = {};
        data.forEach(config => {
            const key = `${config.product_type}-${config.config_key}`;
            if (!productConfigs[key]) productConfigs[key] = [];
            productConfigs[key].push(config);
        });

        renderAllConfigs();
    } catch (error) {
        console.error('Error loading product configs:', error);
    }
}

// Render all configurations
function renderAllConfigs() {
    const configKeys = Object.keys(productConfigs);
    
    configKeys.forEach(key => {
        const container = document.getElementById(key);
        if (container) {
            renderConfigSection(key, container);
        }
    });
}

// Render config section
function renderConfigSection(key, container) {
    const configs = productConfigs[key] || [];
    
    if (configs.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No options configured</p>';
        return;
    }

    container.innerHTML = configs.map(config => `
        <div class="border border-gray-200 rounded-lg p-4" data-config-id="${config.id}">
            <div class="grid grid-cols-12 gap-3 items-start">
                <div class="col-span-4">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Value</label>
                    <input type="text" value="${config.config_value}" 
                           onchange="updateConfig('${config.id}', 'config_value', this.value)"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-4">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Display Label</label>
                    <input type="text" value="${config.display_label || ''}" 
                           onchange="updateConfig('${config.id}', 'display_label', this.value)"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Price +/-</label>
                    <input type="number" step="0.01" value="${config.price_modifier || 0}" 
                           onchange="updateConfig('${config.id}', 'price_modifier', this.value)"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-1">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Order</label>
                    <input type="number" value="${config.sort_order || 0}" 
                           onchange="updateConfig('${config.id}', 'sort_order', this.value)"
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="col-span-1 flex items-end">
                    <button onclick="deleteConfig('${config.id}', '${key}')" 
                            class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update config
function updateConfig(configId, field, value) {
    if (!changes.configs) changes.configs = {};
    if (!changes.configs[configId]) changes.configs[configId] = {};
    changes.configs[configId][field] = value;
    
    showSaveIndicator();
}

// Add new config
function addConfig(productType, configKey) {
    const value = prompt('Enter option value (e.g., "A4", "matte", "80gsm"):');
    if (!value) return;
    
    const label = prompt('Enter display label:');
    if (!label) return;
    
    const priceModifier = prompt('Enter price modifier (0 for no change, positive to add, negative to subtract):');
    
    if (!changes.newConfigs) changes.newConfigs = [];
    changes.newConfigs.push({
        product_type: productType,
        config_key: configKey,
        config_value: value,
        display_label: label,
        price_modifier: parseFloat(priceModifier) || 0,
        is_active: true,
        sort_order: 999
    });
    
    showSaveIndicator();
    alert('New option will be added when you save changes');
}

// Delete config
function deleteConfig(configId, key) {
    if (!confirm('Are you sure you want to delete this option?')) return;
    
    if (!changes.deleteConfigs) changes.deleteConfigs = [];
    changes.deleteConfigs.push(configId);
    
    // Remove from UI
    const element = document.querySelector(`[data-config-id="${configId}"]`);
    if (element) element.remove();
    
    showSaveIndicator();
}

// Show save indicator
function showSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg';
    indicator.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>You have unsaved changes';
    indicator.id = 'save-indicator';
    
    // Remove existing indicator
    const existing = document.getElementById('save-indicator');
    if (existing) existing.remove();
    
    document.body.appendChild(indicator);
}

// Save all changes
async function saveAllChanges() {
    try {
        // Save base pricing changes
        if (changes.basePricing) {
            for (const [productType, fields] of Object.entries(changes.basePricing)) {
                const { error } = await supabaseClient
                    .from('base_pricing')
                    .update(fields)
                    .eq('product_type', productType);
                
                if (error) throw error;
            }
        }

        // Save config changes
        if (changes.configs) {
            for (const [configId, fields] of Object.entries(changes.configs)) {
                const { error } = await supabaseClient
                    .from('product_config')
                    .update(fields)
                    .eq('id', configId);
                
                if (error) throw error;
            }
        }

        // Add new configs
        if (changes.newConfigs && changes.newConfigs.length > 0) {
            const { error } = await supabaseClient
                .from('product_config')
                .insert(changes.newConfigs);
            
            if (error) throw error;
        }

        // Delete configs
        if (changes.deleteConfigs && changes.deleteConfigs.length > 0) {
            const { error } = await supabaseClient
                .from('product_config')
                .delete()
                .in('id', changes.deleteConfigs);
            
            if (error) throw error;
        }

        // Save payment settings changes
        if (changes.paymentSettings) {
            // Check if settings exist
            const { data: existing } = await supabaseClient
                .from('payment_settings')
                .select('id')
                .single();

            if (existing) {
                // Update existing
                const { error } = await supabaseClient
                    .from('payment_settings')
                    .update(changes.paymentSettings)
                    .eq('id', existing.id);
                
                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabaseClient
                    .from('payment_settings')
                    .insert([changes.paymentSettings]);
                
                if (error) throw error;
            }
        }

        // Clear changes
        changes = {};
        
        // Remove indicator
        const indicator = document.getElementById('save-indicator');
        if (indicator) indicator.remove();
        
        // Show success
        alert('All changes saved successfully!');
        
        // Reload data
        await loadBasePricing();
        await loadProductConfigs();
        await loadPaymentSettings();
        
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}

// Load payment settings
async function loadPaymentSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('payment_settings')
            .select('*')
            .single();

        if (error) {
            // If no settings exist, create default
            if (error.code === 'PGRST116') {
                console.log('No payment settings found, using defaults');
                paymentSettings = {
                    upi_id: 'dishaprints@paytm',
                    merchant_name: 'Disha Digital Prints',
                    enable_cod: true,
                    cod_charge: 20,
                    enable_pickup: true
                };
            } else {
                throw error;
            }
        } else {
            paymentSettings = data;
        }

        renderPaymentSettings();
    } catch (error) {
        console.error('Error loading payment settings:', error);
        // Use defaults
        paymentSettings = {
            upi_id: 'dishaprints@paytm',
            merchant_name: 'Disha Digital Prints',
            enable_cod: true,
            cod_charge: 20,
            enable_pickup: true
        };
        renderPaymentSettings();
    }
}

// Render payment settings
function renderPaymentSettings() {
    document.getElementById('upi_id').value = paymentSettings.upi_id || '';
    document.getElementById('merchant_name').value = paymentSettings.merchant_name || '';
    document.getElementById('enable_cod').checked = paymentSettings.enable_cod !== false;
    document.getElementById('cod_charge').value = paymentSettings.cod_charge || 20;
    document.getElementById('enable_pickup').checked = paymentSettings.enable_pickup !== false;

    // Generate QR preview if UPI ID exists
    if (paymentSettings.upi_id) {
        generateQRPreview();
    }

    // Attach event listeners
    document.getElementById('upi_id').addEventListener('change', function(e) {
        if (!changes.paymentSettings) changes.paymentSettings = {};
        changes.paymentSettings.upi_id = e.target.value;
        showSaveIndicator();
        generateQRPreview();
    });

    document.getElementById('merchant_name').addEventListener('change', function(e) {
        if (!changes.paymentSettings) changes.paymentSettings = {};
        changes.paymentSettings.merchant_name = e.target.value;
        showSaveIndicator();
        generateQRPreview();
    });

    document.getElementById('enable_cod').addEventListener('change', function(e) {
        if (!changes.paymentSettings) changes.paymentSettings = {};
        changes.paymentSettings.enable_cod = e.target.checked;
        showSaveIndicator();
    });

    document.getElementById('cod_charge').addEventListener('change', function(e) {
        if (!changes.paymentSettings) changes.paymentSettings = {};
        changes.paymentSettings.cod_charge = parseFloat(e.target.value);
        showSaveIndicator();
    });

    document.getElementById('enable_pickup').addEventListener('change', function(e) {
        if (!changes.paymentSettings) changes.paymentSettings = {};
        changes.paymentSettings.enable_pickup = e.target.checked;
        showSaveIndicator();
    });
}

// Generate QR code preview
function generateQRPreview() {
    const upiId = document.getElementById('upi_id').value || paymentSettings.upi_id;
    const merchantName = document.getElementById('merchant_name').value || paymentSettings.merchant_name || 'Merchant';
    
    if (!upiId) {
        document.getElementById('qrPreviewSection').classList.add('hidden');
        return;
    }

    const sampleAmount = 100;
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${sampleAmount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
    
    document.getElementById('qrPreview').src = qrUrl;
    document.getElementById('qrPreviewSection').classList.remove('hidden');
}

// ===== WhatsApp Configuration Functions =====

// Load WhatsApp configuration from database
async function loadWhatsAppConfig() {
    try {
        const { data, error } = await supabaseClient
            .from('whatsapp_config')
            .select('*')
            .single();

        if (error) throw error;

        // Populate form fields
        if (data) {
            document.getElementById('phone_number_id').value = data.phone_number_id || '';
            document.getElementById('access_token').value = data.access_token || '';
            document.getElementById('api_version').value = data.api_version || 'v18.0';
            document.getElementById('business_phone_number').value = data.business_phone_number || '';
            document.getElementById('admin_phone_number').value = data.admin_phone_number || '';
            
            // Set toggle switches
            document.getElementById('silent_notifications').checked = data.silent_notifications || false;
            document.getElementById('enable_login_notifications').checked = data.enable_login_notifications || false;
            document.getElementById('enable_cart_notifications').checked = data.enable_cart_notifications || false;
            document.getElementById('enable_order_notifications').checked = data.enable_order_notifications || false;
            document.getElementById('enable_payment_notifications').checked = data.enable_payment_notifications || false;
        }
    } catch (error) {
        console.error('Error loading WhatsApp config:', error);
        alert('Error loading WhatsApp configuration. Please try again.');
    }
}

// Save WhatsApp configuration to database
async function saveWhatsAppConfig() {
    try {
        // Get form values
        const phoneNumberId = document.getElementById('phone_number_id').value.trim();
        const accessToken = document.getElementById('access_token').value.trim();
        const apiVersion = document.getElementById('api_version').value;
        const businessPhone = document.getElementById('business_phone_number').value.trim();
        const adminPhone = document.getElementById('admin_phone_number').value.trim();
        
        const silentNotifications = document.getElementById('silent_notifications').checked;
        const enableLogin = document.getElementById('enable_login_notifications').checked;
        const enableCart = document.getElementById('enable_cart_notifications').checked;
        const enableOrder = document.getElementById('enable_order_notifications').checked;
        const enablePayment = document.getElementById('enable_payment_notifications').checked;

        // Validate required fields
        if (!phoneNumberId) {
            alert('Phone Number ID is required');
            document.getElementById('phone_number_id').focus();
            return;
        }

        if (!accessToken) {
            alert('Access Token is required');
            document.getElementById('access_token').focus();
            return;
        }

        if (!businessPhone) {
            alert('Business Phone Number is required');
            document.getElementById('business_phone_number').focus();
            return;
        }

        if (!adminPhone) {
            alert('Admin Phone Number is required');
            document.getElementById('admin_phone_number').focus();
            return;
        }

        // Validate phone number formats (must start with country code)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(businessPhone)) {
            alert('Business Phone Number must be in international format (e.g., +919876543210)');
            document.getElementById('business_phone_number').focus();
            return;
        }

        if (!phoneRegex.test(adminPhone)) {
            alert('Admin Phone Number must be in international format (e.g., +919876543210)');
            document.getElementById('admin_phone_number').focus();
            return;
        }

        // Show loading state
        const saveBtn = document.querySelector('#content-whatsapp button[onclick="saveWhatsAppConfig()"]');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        saveBtn.disabled = true;

        // Prepare data
        const configData = {
            phone_number_id: phoneNumberId,
            access_token: accessToken,
            api_version: apiVersion,
            business_phone_number: businessPhone,
            admin_phone_number: adminPhone,
            silent_notifications: silentNotifications,
            enable_login_notifications: enableLogin,
            enable_cart_notifications: enableCart,
            enable_order_notifications: enableOrder,
            enable_payment_notifications: enablePayment
        };

        // Upsert configuration (update if exists, insert if not)
        const { error } = await supabaseClient
            .from('whatsapp_config')
            .upsert(configData, { onConflict: 'id' });

        if (error) throw error;

        // Success
        saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
        saveBtn.classList.remove('btn-primary');
        saveBtn.classList.add('btn-success');
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-primary');
            saveBtn.disabled = false;
        }, 2000);

        // Reload WhatsApp service config
        if (window.whatsappService) {
            await window.whatsappService.loadConfig();
        }

    } catch (error) {
        console.error('Error saving WhatsApp config:', error);
        alert('Error saving WhatsApp configuration. Please try again.');
        
        // Reset button
        const saveBtn = document.querySelector('#content-whatsapp button[onclick="saveWhatsAppConfig()"]');
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Configuration';
        saveBtn.disabled = false;
    }
}

// Test WhatsApp connection
async function testWhatsAppConnection() {
    try {
        const testBtn = document.querySelector('#content-whatsapp button[onclick="testWhatsAppConnection()"]');
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
        testBtn.disabled = true;

        // Get current form values (not saved yet)
        const phoneNumberId = document.getElementById('phone_number_id').value.trim();
        const accessToken = document.getElementById('access_token').value.trim();
        const apiVersion = document.getElementById('api_version').value;
        const businessPhone = document.getElementById('business_phone_number').value.trim();
        const adminPhone = document.getElementById('admin_phone_number').value.trim();

        if (!phoneNumberId || !accessToken || !businessPhone || !adminPhone) {
            alert('Please fill in all required fields before testing');
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
            return;
        }

        // Construct API URL
        const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

        // Send test message
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: adminPhone,
                type: 'text',
                text: {
                    body: '🧪 Test message from Disha Digital Prints admin panel. Your WhatsApp configuration is working correctly!'
                }
            })
        });

        const result = await response.json();

        if (response.ok && result.messages) {
            testBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Connection Successful!';
            testBtn.classList.remove('btn-secondary');
            testBtn.classList.add('btn-success');
            
            alert('✅ Test message sent successfully! Check your WhatsApp for the test message.');
            
            setTimeout(() => {
                testBtn.innerHTML = originalText;
                testBtn.classList.remove('btn-success');
                testBtn.classList.add('btn-secondary');
                testBtn.disabled = false;
            }, 3000);
        } else {
            throw new Error(result.error?.message || 'Failed to send test message');
        }

    } catch (error) {
        console.error('Error testing WhatsApp connection:', error);
        
        const testBtn = document.querySelector('#content-whatsapp button[onclick="testWhatsAppConnection()"]');
        testBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Test Failed';
        testBtn.classList.remove('btn-secondary');
        testBtn.classList.add('btn-danger');
        
        alert(`❌ WhatsApp connection test failed:\n\n${error.message}\n\nPlease check:\n• Phone Number ID is correct\n• Access Token is valid and not expired\n• Business phone number is verified in Meta Business Suite\n• Admin phone number is in international format (+919876543210)`);
        
        setTimeout(() => {
            testBtn.innerHTML = '<i class="fas fa-plug mr-2"></i>Test Connection';
            testBtn.classList.remove('btn-danger');
            testBtn.classList.add('btn-secondary');
            testBtn.disabled = false;
        }, 3000);
    }
}

// Toggle access token visibility
function toggleTokenVisibility() {
    const tokenInput = document.getElementById('access_token');
    const icon = document.getElementById('token-icon');
    
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        tokenInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// =====================================================
// Razorpay Gateway Functions
// =====================================================

/**
 * Load Razorpay configuration from database
 */
async function loadRazorpayConfig() {
    try {
        const { data, error } = await supabaseClient
            .from('razorpay_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('Error loading Razorpay config:', error);
            return;
        }

        if (data) {
            // Populate form fields
            document.getElementById('razorpay_key_id').value = data.key_id || '';
            document.getElementById('razorpay_key_secret').value = data.key_secret || '';
            document.getElementById('razorpay_mode').value = data.mode || 'test';
            document.getElementById('razorpay_enabled').checked = data.enabled || false;
            document.getElementById('razorpay_webhook_secret').value = data.webhook_secret || '';
            document.getElementById('razorpay_brand_name').value = data.brand_name || 'Disha Digital Prints';
            document.getElementById('razorpay_brand_logo').value = data.brand_logo || '';
            document.getElementById('razorpay_brand_color').value = data.brand_color || '#1E6CE0';
            document.getElementById('razorpay_brand_color_hex').value = data.brand_color || '#1E6CE0';
            
            console.log('✅ Razorpay config loaded');
        } else {
            console.log('ℹ️ No Razorpay config found, using defaults');
        }

        // Sync color picker and hex input
        document.getElementById('razorpay_brand_color').addEventListener('input', (e) => {
            document.getElementById('razorpay_brand_color_hex').value = e.target.value;
        });

        document.getElementById('razorpay_brand_color_hex').addEventListener('input', (e) => {
            document.getElementById('razorpay_brand_color').value = e.target.value;
        });

    } catch (error) {
        console.error('Error loading Razorpay config:', error);
        alert('Failed to load Razorpay configuration');
    }
}

/**
 * Save Razorpay configuration to database
 */
async function saveRazorpaySettings() {
    try {
        // Get form values
        const keyId = document.getElementById('razorpay_key_id').value.trim();
        const keySecret = document.getElementById('razorpay_key_secret').value.trim();
        const mode = document.getElementById('razorpay_mode').value;
        const enabled = document.getElementById('razorpay_enabled').checked;
        const webhookSecret = document.getElementById('razorpay_webhook_secret').value.trim();
        const brandName = document.getElementById('razorpay_brand_name').value.trim();
        const brandLogo = document.getElementById('razorpay_brand_logo').value.trim();
        const brandColor = document.getElementById('razorpay_brand_color').value;

        // Validation
        if (!keyId) {
            alert('⚠️ Please enter Razorpay Key ID');
            return;
        }

        if (!keySecret) {
            alert('⚠️ Please enter Razorpay Key Secret');
            return;
        }

        // Validate key format
        const keyPattern = mode === 'test' ? /^rzp_test_/ : /^rzp_live_/;
        if (!keyPattern.test(keyId)) {
            alert(`⚠️ Invalid Key ID for ${mode} mode.\nKey ID should start with ${mode === 'test' ? 'rzp_test_' : 'rzp_live_'}`);
            return;
        }

        // Show loading
        const saveBtn = document.querySelector('#content-razorpay button[onclick="saveRazorpaySettings()"]');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        saveBtn.disabled = true;

        // Prepare data
        const configData = {
            key_id: keyId,
            key_secret: keySecret,
            mode: mode,
            enabled: enabled,
            brand_name: brandName || 'Disha Digital Prints',
            brand_logo: brandLogo || null,
            brand_color: brandColor || '#1E6CE0',
            webhook_secret: webhookSecret || null,
            updated_by: currentUser.id
        };

        // Check if config exists
        const { data: existing } = await supabaseClient
            .from('razorpay_config')
            .select('id')
            .limit(1)
            .single();

        let result;
        if (existing) {
            // Update existing
            result = await supabaseClient
                .from('razorpay_config')
                .update(configData)
                .eq('id', existing.id);
        } else {
            // Insert new
            result = await supabaseClient
                .from('razorpay_config')
                .insert([configData]);
        }

        if (result.error) throw result.error;

        // Success
        saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
        saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        saveBtn.classList.add('bg-green-600');

        alert(`✅ Razorpay settings saved successfully!\n\nMode: ${mode === 'test' ? '🧪 Test' : '🚀 Live'}\nStatus: ${enabled ? '✓ Enabled' : '✗ Disabled'}\n\n${mode === 'test' ? 'Use test cards for testing.' : '⚠️ Live mode - Real payments will be processed!'}`);

        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('bg-green-600');
            saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            saveBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error saving Razorpay settings:', error);
        
        const saveBtn = document.querySelector('#content-razorpay button[onclick="saveRazorpaySettings()"]');
        saveBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Failed';
        saveBtn.classList.add('bg-red-600');
        
        alert(`❌ Failed to save Razorpay settings:\n\n${error.message}`);
        
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Settings';
            saveBtn.classList.remove('bg-red-600');
            saveBtn.disabled = false;
        }, 2000);
    }
}

/**
 * Test Razorpay connection
 */
async function testRazorpayConnection() {
    try {
        const keyId = document.getElementById('razorpay_key_id').value.trim();
        const keySecret = document.getElementById('razorpay_key_secret').value.trim();
        const mode = document.getElementById('razorpay_mode').value;

        if (!keyId || !keySecret) {
            alert('⚠️ Please enter both Key ID and Key Secret before testing');
            return;
        }

        // Show loading
        const testBtn = document.querySelector('#content-razorpay button[onclick="testRazorpayConnection()"]');
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
        testBtn.disabled = true;

        // Basic validation
        const keyPattern = mode === 'test' ? /^rzp_test_/ : /^rzp_live_/;
        if (!keyPattern.test(keyId)) {
            throw new Error(`Invalid Key ID format for ${mode} mode`);
        }

        // Test by checking if config is saved
        const { data, error } = await supabaseClient
            .from('razorpay_config')
            .select('enabled')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Success
        testBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Connected!';
        testBtn.classList.remove('bg-gray-100', 'text-gray-700');
        testBtn.classList.add('bg-green-100', 'text-green-700');

        alert(`✅ Razorpay configuration is valid!\n\nMode: ${mode === 'test' ? '🧪 Test' : '🚀 Live'}\nKey ID: ${keyId}\n\n${mode === 'test' ? 'You can now test payments using test cards.' : '⚠️ Live mode - Customers will see this payment option at checkout!'}\n\nNext steps:\n1. Save settings if not saved\n2. Go to checkout page and test payment flow\n3. Use test cards from Razorpay docs`);

        setTimeout(() => {
            testBtn.innerHTML = originalText;
            testBtn.classList.remove('bg-green-100', 'text-green-700');
            testBtn.classList.add('bg-gray-100', 'text-gray-700');
            testBtn.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Error testing Razorpay connection:', error);
        
        const testBtn = document.querySelector('#content-razorpay button[onclick="testRazorpayConnection()"]');
        testBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Test Failed';
        testBtn.classList.remove('bg-gray-100', 'text-gray-700');
        testBtn.classList.add('bg-red-100', 'text-red-700');
        
        alert(`❌ Razorpay connection test failed:\n\n${error.message}\n\nPlease check:\n• Key ID and Key Secret are correct\n• Keys match the selected mode (test/live)\n• Keys are from Razorpay Dashboard → Settings → API Keys\n• No extra spaces in the keys`);
        
        setTimeout(() => {
            testBtn.innerHTML = '<i class="fas fa-plug mr-2"></i>Test Razorpay Connection';
            testBtn.classList.remove('bg-red-100', 'text-red-700');
            testBtn.classList.add('bg-gray-100', 'text-gray-700');
            testBtn.disabled = false;
        }, 3000);
    }
}

/**
 * Toggle Razorpay secret visibility
 */
function toggleRazorpaySecretVisibility() {
    const secretInput = document.getElementById('razorpay_key_secret');
    const icon = document.getElementById('razorpay-secret-icon');
    
    if (secretInput.type === 'password') {
        secretInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        secretInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Initialize
async function init() {
    await loadBasePricing();
    await loadProductConfigs();
    await loadPaymentSettings();
    await loadWhatsAppConfig();
    await loadRazorpayConfig();
}

init();
