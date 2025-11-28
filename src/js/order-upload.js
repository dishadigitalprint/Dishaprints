/**
 * Order Upload Page - Multi-File PDF Upload with Dynamic Pricing
 * Disha Digital Prints
 */

class OrderUpload {
    constructor() {
        this.files = [];
        this.pricingService = window.pricingService;
        this.init();
    }

    async init() {
        await this.pricingService.ensurePricingLoaded();
        this.loadUserInfo();
        this.attachEventListeners();
        this.updatePricingSummary();
    }

    loadUserInfo() {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (user.loggedIn && user.name) {
            document.getElementById('customerName').value = user.name;
        }
    }

    attachEventListeners() {
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Clear all
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
        
        // Print mode change
        document.querySelectorAll('input[name="printMode"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateAllFilesModes());
        });
        
        // Action buttons
        document.getElementById('generateQuote').addEventListener('click', () => this.generateQuote());
        document.getElementById('confirmOrder').addEventListener('click', () => this.confirmOrder());
    }

    async handleFileUpload(event) {
        const uploadedFiles = Array.from(event.target.files);
        const printMode = document.querySelector('input[name="printMode"]:checked').value;

        for (const file of uploadedFiles) {
            if (file.type !== 'application/pdf') {
                this.showToast('Only PDF files are allowed', 'error');
                continue;
            }

            // Show loading state
            this.showToast(`Analyzing ${file.name}...`, 'info');

            try {
                const pageCount = await this.detectPDFPages(file);
                
                const fileData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    fileName: file.name,
                    pages: pageCount,
                    quantity: 1,
                    printMode: printMode,
                    paperQuality: 'standard',
                    binding: 'none',
                    cover: 'none',
                    total: 0
                };

                this.files.push(fileData);
                await this.renderFileRow(fileData);
                this.calculateFileTotal(fileData);
                
            } catch (error) {
                console.error('Error processing PDF:', error);
                this.showToast(`Error processing ${file.name}`, 'error');
            }
        }

        // Clear file input
        event.target.value = '';
        
        // Hide empty state
        document.getElementById('emptyState').style.display = 'none';
        
        // Update pricing
        this.updatePricingSummary();
    }

    async detectPDFPages(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            return pdf.numPages;
        } catch (error) {
            console.error('Error detecting pages:', error);
            return 1; // Default to 1 page if detection fails
        }
    }

    async renderFileRow(fileData) {
        const tbody = document.getElementById('filesBody');
        const row = document.createElement('tr');
        row.id = `file-${fileData.id}`;
        row.className = 'border-b border-neutral-200 hover:bg-neutral-50';
        
        // Calculate effective rate per page
        const perPageRate = fileData.printMode === 'bw' 
            ? (window.pricingService.pricing?.bw_per_page || 2)
            : (window.pricingService.pricing?.color_per_page || 10);
        const paperMultiplier = fileData.paperQuality === 'premium' 
            ? (window.pricingService.pricing?.paper_quality_premium || 1.5)
            : fileData.paperQuality === 'glossy'
            ? (window.pricingService.pricing?.paper_quality_glossy || 1.3)
            : (window.pricingService.pricing?.paper_quality_standard || 1.0);
        const effectiveRate = (perPageRate * paperMultiplier).toFixed(2);
        
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-file-pdf text-danger-500"></i>
                    <span class="text-sm font-medium text-neutral-900">${this.truncateFileName(fileData.fileName)}</span>
                </div>
            </td>
            <td class="px-4 py-3 text-center">
                <span class="text-sm font-semibold text-neutral-900">${fileData.pages}</span>
            </td>
            <td class="px-4 py-3 text-center">
                <input type="number" min="1" value="${fileData.quantity}" 
                    class="w-16 h-8 text-center border border-neutral-200 rounded text-sm"
                    onchange="orderUpload.updateQuantity('${fileData.id}', this.value)">
            </td>
            <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    fileData.printMode === 'bw' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }">${fileData.printMode === 'bw' ? 'B&W' : 'Color'}</span>
            </td>
            <td class="px-4 py-3 text-center">
                <select class="w-24 h-8 text-xs border border-neutral-200 rounded" 
                    onchange="orderUpload.updatePaper('${fileData.id}', this.value)">
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="glossy">Glossy</option>
                </select>
            </td>
            <td class="px-4 py-3 text-center">
                <span class="text-sm font-mono text-neutral-700">₹${effectiveRate}</span>
            </td>
            <td class="px-4 py-3 text-left">
                <select class="w-28 h-8 text-xs border border-neutral-200 rounded" 
                    onchange="orderUpload.updateBinding('${fileData.id}', this.value)">
                    <option value="none">None</option>
                    <option value="staple">Staple (₹10)</option>
                    <option value="spiral">Spiral (₹50)</option>
                    <option value="perfect">Perfect (₹100)</option>
                    <option value="hardcover">Hardcover (₹200)</option>
                </select>
            </td>
            <td class="px-4 py-3 text-center">
                <select class="w-28 h-8 text-xs border border-neutral-200 rounded" 
                    onchange="orderUpload.updateCover('${fileData.id}', this.value)">
                    <option value="none">None</option>
                    <option value="standard">Standard (₹20)</option>
                    <option value="glossy">Glossy (₹40)</option>
                    <option value="laminated">Laminated (₹60)</option>
                </select>
            </td>
            <td class="px-4 py-3 text-right">
                <span class="text-sm font-bold text-primary-600" id="total-${fileData.id}">₹${fileData.total.toFixed(2)}</span>
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="orderUpload.removeFile('${fileData.id}')" 
                    class="text-danger-500 hover:text-danger-600">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    }

    truncateFileName(fileName) {
        if (fileName.length > 30) {
            return fileName.substring(0, 27) + '...';
        }
        return fileName;
    }

    updateQuantity(fileId, quantity) {
        const file = this.files.find(f => f.id == fileId);
        if (file) {
            file.quantity = parseInt(quantity) || 1;
            this.calculateFileTotal(file);
            this.updatePricingSummary();
        }
    }

    updatePaper(fileId, paper) {
        const file = this.files.find(f => f.id == fileId);
        if (file) {
            file.paperQuality = paper;
            
            // Update price per page display
            const row = document.getElementById(`file-${fileId}`);
            if (row) {
                const perPageRate = file.printMode === 'bw' 
                    ? (window.pricingService.pricing?.bw_per_page || 2)
                    : (window.pricingService.pricing?.color_per_page || 10);
                const paperMultiplier = paper === 'premium' 
                    ? (window.pricingService.pricing?.paper_quality_premium || 1.5)
                    : paper === 'glossy'
                    ? (window.pricingService.pricing?.paper_quality_glossy || 1.3)
                    : (window.pricingService.pricing?.paper_quality_standard || 1.0);
                const effectiveRate = (perPageRate * paperMultiplier).toFixed(2);
                
                const priceCell = row.querySelector('td:nth-child(6) span');
                if (priceCell) {
                    priceCell.textContent = `₹${effectiveRate}`;
                }
            }
            
            this.calculateFileTotal(file);
            this.updatePricingSummary();
        }
    }

    updateBinding(fileId, binding) {
        const file = this.files.find(f => f.id == fileId);
        if (file) {
            file.binding = binding;
            this.calculateFileTotal(file);
            this.updatePricingSummary();
        }
    }

    updateCover(fileId, cover) {
        const file = this.files.find(f => f.id == fileId);
        if (file) {
            file.cover = cover;
            this.calculateFileTotal(file);
            this.updatePricingSummary();
        }
    }

    updateAllFilesModes() {
        const printMode = document.querySelector('input[name="printMode"]:checked').value;
        this.files.forEach(file => {
            file.printMode = printMode;
            this.calculateFileTotal(file);
            
            // Update badge in table
            const row = document.getElementById(`file-${file.id}`);
            if (row) {
                const badge = row.querySelector('td:nth-child(4) span');
                badge.className = `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    printMode === 'bw' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`;
                badge.textContent = printMode === 'bw' ? 'B&W' : 'Color';
                
                // Update price per page display
                const perPageRate = printMode === 'bw' 
                    ? (window.pricingService.pricing?.bw_per_page || 2)
                    : (window.pricingService.pricing?.color_per_page || 10);
                const paperMultiplier = file.paperQuality === 'premium' 
                    ? (window.pricingService.pricing?.paper_quality_premium || 1.5)
                    : file.paperQuality === 'glossy'
                    ? (window.pricingService.pricing?.paper_quality_glossy || 1.3)
                    : (window.pricingService.pricing?.paper_quality_standard || 1.0);
                const effectiveRate = (perPageRate * paperMultiplier).toFixed(2);
                
                const priceCell = row.querySelector('td:nth-child(6) span');
                if (priceCell) {
                    priceCell.textContent = `₹${effectiveRate}`;
                }
            }
        });
        this.updatePricingSummary();
    }

    calculateFileTotal(fileData) {
        const pricing = this.pricingService.calculateFilePrice({
            pages: fileData.pages,
            quantity: fileData.quantity,
            printMode: fileData.printMode,
            paperQuality: fileData.paperQuality,
            binding: fileData.binding,
            cover: fileData.cover
        });

        fileData.total = parseFloat(pricing.fileTotal);
        
        // Update total in table
        const totalEl = document.getElementById(`total-${fileData.id}`);
        if (totalEl) {
            totalEl.textContent = `₹${fileData.total.toFixed(2)}`;
        }
    }

    updatePricingSummary() {
        if (this.files.length === 0) {
            document.getElementById('subtotal').textContent = '₹0.00';
            document.getElementById('gst').textContent = '₹0.00';
            document.getElementById('delivery').textContent = '₹0.00';
            document.getElementById('grandTotal').textContent = '₹0.00';
            document.getElementById('discountRow').style.display = 'none';
            return;
        }

        const orderTotal = this.pricingService.calculateOrderTotal(
            this.files.map(f => ({
                pages: f.pages,
                quantity: f.quantity,
                printMode: f.printMode,
                paperQuality: f.paperQuality,
                binding: f.binding,
                cover: f.cover
            })),
            'standard'
        );

        // Update UI
        document.getElementById('subtotal').textContent = `₹${orderTotal.subtotal}`;
        document.getElementById('gst').textContent = `₹${orderTotal.gst}`;
        document.getElementById('gstPercent').textContent = orderTotal.gstPercentage;
        
        // Delivery
        const deliveryEl = document.getElementById('delivery');
        if (parseFloat(orderTotal.deliveryCharge) === 0) {
            deliveryEl.textContent = 'FREE';
            deliveryEl.className = 'font-semibold text-accentA-600';
        } else {
            deliveryEl.textContent = `₹${orderTotal.deliveryCharge}`;
            deliveryEl.className = 'font-semibold';
        }

        // Check for bulk discount
        const totalPages = this.files.reduce((sum, f) => sum + (f.pages * f.quantity), 0);
        let discountPercent = 0;
        if (totalPages >= 500) discountPercent = this.pricingService.pricingConfig.bulk_discount_500_pages;
        else if (totalPages >= 100) discountPercent = this.pricingService.pricingConfig.bulk_discount_100_pages;
        else if (totalPages >= 50) discountPercent = this.pricingService.pricingConfig.bulk_discount_50_pages;

        if (discountPercent > 0) {
            const discountAmount = (parseFloat(orderTotal.subtotal) * discountPercent) / 100;
            document.getElementById('discountRow').style.display = 'flex';
            document.getElementById('discountLabel').textContent = `(${totalPages}+ pages: ${discountPercent}% off)`;
            document.getElementById('discount').textContent = `-₹${discountAmount.toFixed(2)}`;
        } else {
            document.getElementById('discountRow').style.display = 'none';
        }

        document.getElementById('grandTotal').textContent = `₹${orderTotal.grandTotal}`;
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id != fileId);
        
        const row = document.getElementById(`file-${fileId}`);
        if (row) {
            row.remove();
        }

        if (this.files.length === 0) {
            document.getElementById('emptyState').style.display = 'table-row';
        }

        this.updatePricingSummary();
        this.showToast('File removed', 'success');
    }

    clearAll() {
        if (this.files.length === 0) return;
        
        if (!confirm('Are you sure you want to remove all files?')) return;

        this.files = [];
        document.getElementById('filesBody').innerHTML = `
            <tr id="emptyState">
                <td colspan="9" class="px-4 py-12 text-center text-neutral-500">
                    <i class="fas fa-file-pdf text-4xl text-neutral-300 mb-3"></i>
                    <p>No files uploaded yet. Click "Upload PDFs" to begin.</p>
                </td>
            </tr>
        `;
        
        this.updatePricingSummary();
        this.showToast('All files cleared', 'success');
    }

    generateQuote() {
        if (this.files.length === 0) {
            this.showToast('Please upload at least one file', 'error');
            return;
        }

        const customerName = document.getElementById('customerName').value.trim();
        if (!customerName) {
            this.showToast('Please enter customer name', 'error');
            return;
        }

        this.showToast('Quote generation feature coming soon!', 'info');
        
        // TODO: Generate PDF quote
        console.log('Generate quote for:', {
            customer: customerName,
            files: this.files
        });
    }

    async confirmOrder() {
        if (this.files.length === 0) {
            this.showToast('Please upload at least one file', 'error');
            return;
        }

        const customerName = document.getElementById('customerName').value.trim();
        if (!customerName) {
            this.showToast('Please enter customer name', 'error');
            document.getElementById('customerName').focus();
            return;
        }

        const jobDescription = document.getElementById('jobDescription').value.trim();

        // Show uploading progress
        this.showToast('Uploading files to cloud storage...', 'info');

        try {
            // Upload all files to Supabase Storage
            const uploadedFiles = [];
            for (let i = 0; i < this.files.length; i++) {
                const fileData = this.files[i];
                
                this.showToast(`Uploading ${i + 1}/${this.files.length}: ${fileData.fileName}`, 'info');
                
                const uploadResult = await this.uploadFileToStorage(fileData.file);
                
                if (!uploadResult.success) {
                    throw new Error(`Failed to upload ${fileData.fileName}: ${uploadResult.error}`);
                }
                
                uploadedFiles.push({
                    fileName: fileData.fileName,
                    fileUrl: uploadResult.url,
                    filePath: uploadResult.path,
                    fileSize: fileData.file.size,
                    pages: fileData.pages,
                    quantity: fileData.quantity,
                    printMode: fileData.printMode,
                    paperQuality: fileData.paperQuality,
                    binding: fileData.binding,
                    cover: fileData.cover,
                    total: fileData.total
                });
            }

            // Calculate pricing summary
            const pricingSummary = this.pricingService.calculateOrderTotal(
                this.files.map(f => ({
                    pages: f.pages,
                    quantity: f.quantity,
                    printMode: f.printMode,
                    paperQuality: f.paperQuality,
                    binding: f.binding,
                    cover: f.cover
                })),
                'standard'
            );

            // Create cart item for multi-file order with uploaded file URLs
            // Note: Delivery charge is calculated at cart level, not per item
            const itemTotal = parseFloat(pricingSummary.subtotal) + parseFloat(pricingSummary.gst);
            
            const cartItem = {
                id: 'multi-file-' + Date.now(),
                type: 'multi-file-upload',
                name: `Multi-File Order: ${this.files.length} file(s)`,
                customerName: customerName,
                jobDescription: jobDescription,
                files: uploadedFiles,
                quantity: 1,
                price: itemTotal, // Item price without delivery
                subtotal: parseFloat(pricingSummary.subtotal),
                gst: parseFloat(pricingSummary.gst),
                bulkDiscount: parseFloat(pricingSummary.bulkDiscount || 0),
                pricingSummary: pricingSummary,
                addedAt: new Date().toISOString()
            };

            // Get existing cart
            const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
            
            // Add to cart
            cart.push(cartItem);
            sessionStorage.setItem('cart', JSON.stringify(cart));
            
            this.showToast('✅ Files uploaded! Redirecting to cart...', 'success');
            
            // Redirect to cart after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1500);

        } catch (error) {
            console.error('Error processing order:', error);
            this.showToast('❌ Error: ' + error.message, 'error');
        }
    }

    async uploadFileToStorage(file) {
        try {
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}-${sanitizedFileName}`;
            const filePath = `orders/${fileName}`;
            
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('order-files')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('order-files')
                .getPublicUrl(filePath);
            
            console.log('✅ File uploaded:', fileName, urlData.publicUrl);
            
            return { 
                success: true, 
                url: urlData.publicUrl,
                path: filePath,
                size: file.size
            };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        toastMessage.textContent = message;
        
        if (type === 'success') {
            toastIcon.className = 'fas fa-check-circle text-accentA-600 text-xl';
            toast.className = 'fixed bottom-8 right-8 bg-white shadow-lg rounded-lg p-4 border-l-4 border-accentA-600 max-w-sm z-50';
        } else if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle text-danger-500 text-xl';
            toast.className = 'fixed bottom-8 right-8 bg-white shadow-lg rounded-lg p-4 border-l-4 border-danger-500 max-w-sm z-50';
        } else {
            toastIcon.className = 'fas fa-info-circle text-primary-600 text-xl';
            toast.className = 'fixed bottom-8 right-8 bg-white shadow-lg rounded-lg p-4 border-l-4 border-primary-600 max-w-sm z-50';
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize
let orderUpload;
document.addEventListener('DOMContentLoaded', async () => {
    orderUpload = new OrderUpload();
});
