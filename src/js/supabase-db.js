/**
 * Supabase Database Helper Functions
 * Handles all database operations for orders, addresses, and activities
 */

const SupabaseDB = {
    /**
     * Save or update user address
     */
    async saveAddress(userId, addressData) {
        try {
            const { data, error } = await supabaseClient
                .from('addresses')
                .insert([{
                    user_id: userId,
                    name: addressData.name,
                    phone: addressData.phone,
                    email: addressData.email || null,
                    address_line1: addressData.address,
                    address_line2: addressData.address2 || null,
                    city: addressData.city,
                    state: addressData.state,
                    pincode: addressData.pincode,
                    landmark: addressData.landmark || null,
                    is_default: true
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Address saved to database:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error saving address:', error);
            return { success: false, error };
        }
    },

    /**
     * Get user addresses
     */
    async getUserAddresses(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching addresses:', error);
            return { success: false, error };
        }
    },

    /**
     * Create order with items
     */
    async createOrder(userId, addressId, orderData, cartItems) {
        try {
            // First, insert the order
            const { data: order, error: orderError} = await supabaseClient
                .from('orders')
                .insert([{
                    user_id: userId,
                    address_id: addressId,
                    order_number: this.generateOrderNumber(),
                    status: 'pending',
                    subtotal: orderData.subtotal,
                    gst: orderData.gst,
                    delivery_charge: orderData.deliveryCharge || 0,
                    cod_charge: orderData.codCharge || 0,
                    total: orderData.total,
                    payment_method: orderData.paymentMethod,
                    payment_status: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
                    payment_screenshot: orderData.paymentScreenshot || null,
                    delivery_method: orderData.deliveryMethod || 'delivery',
                    customer_notes: orderData.notes || null
                }])
                .select()
                .single();
            
            if (orderError) throw orderError;
            
            console.log('✅ Order created:', order);
            
            // Then, insert order items - handle both standard and multi-file items
            const orderItems = [];
            
            for (const item of cartItems) {
                if (item.type === 'multi-file-upload') {
                    // Multi-file upload - create separate order_item for each file
                    for (const file of item.files) {
                        orderItems.push({
                            order_id: order.id,
                            product_type: 'multi-file-upload',
                            product_name: `${item.customerName} - ${file.fileName}`,
                            configuration: {
                                customerName: item.customerName,
                                jobDescription: item.jobDescription,
                                pages: file.pages,
                                quantity: file.quantity,
                                printMode: file.printMode,
                                paperQuality: file.paperQuality,
                                binding: file.binding,
                                cover: file.cover
                            },
                            file_url: file.fileUrl,
                            file_name: file.fileName,
                            file_size_bytes: file.fileSize || 0,
                            quantity: file.quantity,
                            unit_price: file.total / file.quantity,
                            subtotal: file.total
                        });
                    }
                } else {
                    // Standard items (documents, business cards, etc.)
                    orderItems.push({
                        order_id: order.id,
                        product_type: item.product || item.productType || 'unknown',
                        product_name: item.productName || 'Product',
                        configuration: item.configuration || {},
                        file_url: null,
                        file_name: null,
                        file_size_bytes: 0,
                        quantity: item.quantity || item.copies || 1,
                        unit_price: (item.pricing?.subtotal || item.total || 0) / (item.quantity || item.copies || 1),
                        subtotal: item.pricing?.subtotal || item.total || 0
                    });
                }
            }
            
            const { data: items, error: itemsError } = await supabaseClient
                .from('order_items')
                .insert(orderItems)
                .select();
            
            if (itemsError) throw itemsError;
            
            console.log('✅ Order items created:', items.length, 'items');
            
            return { success: true, order, items };
        } catch (error) {
            console.error('❌ Error creating order:', error);
            return { success: false, error };
        }
    },

    /**
     * Get user orders
     */
    async getUserOrders(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    addresses (*),
                    order_items (*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            return { success: false, error };
        }
    },

    /**
     * Get order by ID
     */
    async getOrderById(orderId) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    addresses (*),
                    order_items (*)
                `)
                .eq('id', orderId)
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching order:', error);
            return { success: false, error };
        }
    },

    /**
     * Get order by order number
     */
    async getOrderByNumber(orderNumber) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    addresses (*),
                    order_items (*)
                `)
                .eq('order_number', orderNumber)
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error fetching order:', error);
            return { success: false, error };
        }
    },

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Order status updated:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return { success: false, error };
        }
    },

    /**
     * Log activity
     */
    async logActivity(userId, phone, name, action, page, details = {}) {
        try {
            const { data, error } = await supabaseClient
                .from('activity_log')
                .insert([{
                    user_id: userId || null,
                    phone: phone || null,
                    name: name || 'Guest',
                    action: action,
                    page: page,
                    details: details
                }]);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error logging activity:', error);
            return { success: false, error };
        }
    },

    /**
     * Generate unique order number
     */
    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DDP${year}${month}${day}${random}`;
    },

    /**
     * Track cart abandonment
     */
    async trackCartAbandonment(userId, phone, name, cartItems, totalAmount) {
        try {
            const { data, error } = await supabaseClient
                .from('cart_abandonment')
                .insert([{
                    user_id: userId || null,
                    phone: phone,
                    name: name,
                    cart_items: cartItems,
                    total_amount: totalAmount,
                    status: 'abandoned'
                }]);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error tracking cart abandonment:', error);
            return { success: false, error };
        }
    }
};

// Export for global use
window.SupabaseDB = SupabaseDB;

console.log('🗄️ Supabase Database Helper loaded');
