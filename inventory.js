// إدارة المخزون
const inventoryPage = {
    products: [],
    selectedProducts: new Set(),

    async init() {
        await this.loadProducts();
        await this.loadInventoryStats();
        this.setupEventListeners();
    },

    async loadProducts() {
        try {
            this.products = await AccountingDB.getAll('products') || [];
            this.displayProducts();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    },

    async loadInventoryStats() {
        const totalProducts = this.products.length;
        const inventoryValue = this.products.reduce((sum, product) => {
            return sum + (product.purchasePrice * product.currentStock);
        }, 0);
        
        const lowStockItems = this.products.filter(product => 
            product.currentStock <= product.minStock
        ).length;
        
        const outOfStockItems = this.products.filter(product => 
            product.currentStock === 0
        ).length;

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('inventoryValue').textContent = AccountingUtils.formatCurrency(inventoryValue);
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('outOfStockItems').textContent = outOfStockItems;
    },

    displayProducts() {
        const tbody = document.getElementById('inventoryData');
        
        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <i class="fas fa-box-open fa-3x mb-3" style="color: #7f8c8d;"></i>
                        <p>لا توجد منتجات</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <input type="checkbox" value="${product.id}" 
                           onchange="inventoryPage.toggleProductSelection('${product.id}')">
                </td>
                <td>
                    <div class="product-image">
                        <i class="fas fa-box"></i>
                    </div>
                </td>
                <td>
                    <div class="product-info">
                        <strong>${product.name}</strong>
                        <div class="product-description">${product.description || ''}</div>
                    </div>
                </td>
                <td>${product.sku}</td>
                <td>
                    <span class="category-tag">${product.category}</span>
                </td>
                <td>${AccountingUtils.formatCurrency(product.salePrice)}</td>
                <td>${AccountingUtils.formatCurrency(product.purchasePrice)}</td>
                <td>
                    <div class="stock-info">
                        <span class="stock-amount">${product.currentStock}</span>
                        ${product.currentStock <= product.minStock ? 
                          '<i class="fas fa-exclamation-triangle text-warning"></i>' : ''}
                    </div>
                </td>
                <td>
                    <span class="status ${this.getStockStatus(product)}">
                        ${this.getStockStatusText(product)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm" onclick="inventoryPage.editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-info btn-sm" onclick="inventoryPage.adjustStock('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="inventoryPage.deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStockStatus(product) {
        if (product.currentStock === 0) return 'danger';
        if (product.currentStock <= product.minStock) return 'warning';
        return 'success';
    },

    getStockStatusText(product) {
        if (product.currentStock === 0) return 'منتهي';
        if (product.currentStock <= product.minStock) return 'منخفض';
        return 'متوفر';
    },

    showProductForm() {
        this.currentProduct = null;
        document.getElementById('productModalTitle').textContent = 'منتج جديد';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        
        // إنشاء SKU تلقائي
        document.getElementById('productSKU').value = 'SKU-' + Date.now();
        
        this.showModal('productModal');
    },

    async saveProduct() {
        const form = document.getElementById('productForm');
        if (!form.checkValidity()) {
            this.showError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const productId = document.getElementById('productId').value;
        const productData = {
            id: productId || 'prod_' + Date.now(),
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSKU').value,
            category: document.getElementById('productCategory').value,
            barcode: document.getElementById('productBarcode').value,
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            salePrice: parseFloat(document.getElementById('salePrice').value),
            currentStock: parseInt(document.getElementById('currentStock').value),
            minStock: parseInt(document.getElementById('minStock').value),
            description: document.getElementById('productDescription').value,
            createdAt: productId ? this.currentProduct.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (productId) {
                await AccountingDB.update('products', productId, productData);
            } else {
                await AccountingDB.add('products', productData);
            }

            this.showSuccess(`تم ${productId ? 'تحديث' : 'إضافة'} المنتج بنجاح`);
            this.closeProductForm();
            await this.loadProducts();
            await this.loadInventoryStats();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('فشل في حفظ المنتج');
        }
    },

    async editProduct(id) {
        try {
            this.currentProduct = await AccountingDB.get('products', id);
            
            if (!this.currentProduct) {
                this.showError('المنتج غير موجود');
                return;
            }

            document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
            document.getElementById('productId').value = this.currentProduct.id;
            document.getElementById('productName').value = this.currentProduct.name;
            document.getElementById('productSKU').value = this.currentProduct.sku;
            document.getElementById('productCategory').value = this.currentProduct.category;
            document.getElementById('productBarcode').value = this.currentProduct.barcode || '';
            document.getElementById('purchasePrice').value = this.currentProduct.purchasePrice;
            document.getElementById('salePrice').value = this.currentProduct.salePrice;
            document.getElementById('currentStock').value = this.currentProduct.currentStock;
            document.getElementById('minStock').value = this.currentProduct.minStock || 5;
            document.getElementById('productDescription').value = this.currentProduct.description || '';

            this.showModal('productModal');

        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('فشل في تحميل المنتج');
        }
    },

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    },

    closeProductForm() {
        document.getElementById('productModal').style.display = 'none';
    },

    showSuccess(message) {
        alert(message);
    },

    showError(message) {
        alert(message);
    },

    setupEventListeners() {
        // البحث في الوقت الحقيقي
        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // تحديث البيانات كل دقيقة
        setInterval(() => {
            this.loadInventoryStats();
        }, 60000);
    }
};

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    inventoryPage.init();
});