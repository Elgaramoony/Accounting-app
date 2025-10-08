// تطبيق الجوال
class MobileApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.cart = [];
        this.offline = false;
    }

    async init() {
        await this.checkConnection();
        await this.loadUserData();
        await this.loadDashboardData();
        this.setupEventListeners();
        this.setupOfflineSupport();
    }

    async checkConnection() {
        this.offline = !navigator.onLine;
        
        window.addEventListener('online', () => {
            this.offline = false;
            this.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.offline = true;
            this.showNotification('أنت غير متصل بالإنترنت', 'warning');
        });
    }

    async loadUserData() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('mobileUserName').textContent = user.name;
            document.getElementById('mobileUserRole').textContent = user.role;
        }
    }

    async loadDashboardData() {
        try {
            const [invoices, expenses, customers] = await Promise.all([
                AccountingDB.getAll('invoices'),
                AccountingDB.getAll('expenses'),
                AccountingDB.getAll('customers')
            ]);

            this.updateDashboardStats(invoices, expenses, customers);
            this.updateRecentInvoices(invoices);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats(invoices, expenses, customers) {
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalCustomers = customers.length;
        const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;

        document.getElementById('mobileTotalRevenue').textContent = 
            AccountingUtils.formatCurrency(totalRevenue);
        document.getElementById('mobileTotalExpenses').textContent = 
            AccountingUtils.formatCurrency(totalExpenses);
        document.getElementById('mobileTotalCustomers').textContent = totalCustomers;
        document.getElementById('mobilePendingInvoices').textContent = pendingInvoices;
    }

    updateRecentInvoices(invoices) {
        const recentInvoices = invoices
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const container = document.getElementById('mobileRecentInvoices');
        
        container.innerHTML = recentInvoices.map(invoice => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-title">${invoice.invoiceNumber}</div>
                    <div class="item-subtitle">${invoice.customerName}</div>
                </div>
                <div class="item-details">
                    <div class="item-amount">${AccountingUtils.formatCurrency(invoice.total)}</div>
                    <div class="item-status status ${invoice.status}">
                        ${this.getStatusText(invoice.status)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'paid': 'مدفوعة',
            'unpaid': 'غير مدفوعة',
            'partial': 'جزئي'
        };
        return i18n.t(`status.${status}`) || statusMap[status] || status;
    }

    showPage(pageId) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // إظهار الصفحة المطلوبة
        document.getElementById(pageId + 'Page').classList.add('active');

        // تحديث التبويبات
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.tab-item[onclick="mobileApp.showPage('${pageId}')"]`).classList.add('active');

        this.currentPage = pageId;

        // تحميل بيانات الصفحة إذا لزم الأمر
        if (pageId === 'pos') {
            this.loadPOSProducts();
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('mobileSidebar');
        sidebar.classList.toggle('active');
    }

    showNotifications() {
        document.getElementById('notificationsPanel').classList.add('active');
        this.loadNotifications();
    }

    hideNotifications() {
        document.getElementById('notificationsPanel').classList.remove('active');
    }

    async loadNotifications() {
        // تحميل الإشعارات من قاعدة البيانات
        const notifications = await AccountingDB.getAll('notifications') || [];
        const container = document.getElementById('mobileNotificationsList');
        
        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'invoice': 'fa-file-invoice',
            'payment': 'fa-money-bill-wave',
            'expense': 'fa-receipt',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `منذ ${days} يوم`;
        if (hours > 0) return `منذ ${hours} ساعة`;
        if (minutes > 0) return `منذ ${minutes} دقيقة`;
        return 'الآن';
    }

    // وظائف نقاط البيع
    async loadPOSProducts() {
        const products = await AccountingDB.getAll('products') || [];
        const container = document.getElementById('mobileProductsGrid');
        
        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="mobileApp.addToCart('${product.id}')">
                <div class="product-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${AccountingUtils.formatCurrency(product.salePrice)}</div>
                    <div class="product-stock">المخزون: ${product.currentStock}</div>
                </div>
            </div>
        `).join('');
    }

    addToCart(productId) {
        // إضافة منتج إلى السلة
        const product = this.getProductById(productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                productId: productId,
                name: product.name,
                price: product.salePrice,
                quantity: 1
            });
        }

        this.updateCartDisplay();
    }

    getProductById(productId) {
        // في التطبيق الحقيقي، سيتم جلب المنتج من قاعدة البيانات
        return {
            id: productId,
            name: 'منتج تجريبي',
            salePrice: 100,
            currentStock: 10
        };
    }

    updateCartDisplay() {
        const container = document.getElementById('mobileCartItems');
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.15; // ضريبة 15%
        const total = subtotal + tax;

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${AccountingUtils.formatCurrency(item.price)}</div>
                </div>
                <div class="item-controls">
                    <button class="btn btn-sm" onclick="mobileApp.updateQuantity('${item.productId}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="btn btn-sm" onclick="mobileApp.updateQuantity('${item.productId}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="mobileApp.removeFromCart('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('mobileCartSubtotal').textContent = AccountingUtils.formatCurrency(subtotal);
        document.getElementById('mobileCartTax').textContent = AccountingUtils.formatCurrency(tax);
        document.getElementById('mobileCartTotal').textContent = AccountingUtils.formatCurrency(total);
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.updateCartDisplay();
            }
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.updateCartDisplay();
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
    }

    async processPayment() {
        if (this.cart.length === 0) {
            this.showNotification('السلة فارغة', 'warning');
            return;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;

        // إنشاء فاتورة
        const invoice = {
            id: 'inv_mobile_' + Date.now(),
            invoiceNumber: 'INV-M-' + Date.now(),
            customerId: 'walkin_customer',
            customerName: 'عميل نقدي',
            items: this.cart,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: 'paid',
            date: new Date().toISOString(),
            paymentMethod: 'نقدي'
        };

        try {
            await AccountingDB.add('invoices', invoice);
            
            // تحديث المخزون
            for (const item of this.cart) {
                await this.updateProductStock(item.productId, item.quantity);
            }

            this.showNotification('تمت عملية البيع بنجاح', 'success');
            this.clearCart();
            
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showNotification('فشل في معالجة الدفع', 'error');
        }
    }

    async updateProductStock(productId, quantity) {
        // تحديث كمية المنتج في المخزون
        const product = await AccountingDB.get('products', productId);
        if (product) {
            product.currentStock -= quantity;
            await AccountingDB.update('products', productId, product);
        }
    }

    showNotification(message, type = 'info') {
        // عرض إشعار للمستخدم
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIconByType(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getNotificationIconByType(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    setupEventListeners() {
        // إغلاق الشريط الجانبي عند النقر خارجها
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('mobileSidebar');
            if (!sidebar.contains(e.target) && !e.target.closest('.menu-btn')) {
                sidebar.classList.remove('active');
            }
        });

        // منع التمرير عند فتح الإشعارات
        document.getElementById('notificationsPanel').addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }

    setupOfflineSupport() {
        // دعم العمل دون اتصال
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                // تخزين البيانات مؤقتاً للعمل دون اتصال
            });
        }
    }

    async syncOfflineData() {
        // مزامنة البيانات عند استعادة الاتصال
        const offlineInvoices = await this.getOfflineData('offline_invoices');
        
        for (const invoice of offlineInvoices) {
            try {
                await AccountingDB.add('invoices', invoice);
            } catch (error) {
                console.error('Error syncing invoice:', error);
            }
        }

        await this.clearOfflineData('offline_invoices');
        this.showNotification('تمت مزامنة البيانات', 'success');
    }

    async getOfflineData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    async saveOfflineData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    async clearOfflineData(key) {
        localStorage.removeItem(key);
    }
}

// إنشاء نسخة عامة من التطبيق
window.mobileApp = new MobileApp();

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    mobileApp.init();
    i18n.applyTranslations();
});