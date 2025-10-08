class AccountingApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.initializeDefaultData();
        this.checkAuth();
        this.setupEventListeners();
    }

    initializeDefaultData() {
        // تهيئة البيانات الافتراضية إذا لم تكن موجودة
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('invoices')) {
            localStorage.setItem('invoices', JSON.stringify([]));
        }
        if (!localStorage.getItem('expenses')) {
            localStorage.setItem('expenses', JSON.stringify([]));
        }
        if (!localStorage.getItem('customers')) {
            localStorage.setItem('customers', JSON.stringify([]));
        }
        if (!localStorage.getItem('products')) {
            localStorage.setItem('products', JSON.stringify([]));
        }
        if (!localStorage.getItem('settings')) {
            localStorage.setItem('settings', JSON.stringify({
                companyName: 'شركتي',
                taxRate: 15,
                currency: 'ر.س',
                invoicePrefix: 'INV-'
            }));
        }
        
        // إضافة مستخدم افتراضي إذا لم يكن موجوداً
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.length === 0) {
            users.push({
                id: '1',
                username: 'admin',
                password: '123456',
                companyName: 'شركة النخبة للتجارة',
                email: 'admin@company.com',
                phone: '+966500000000',
                address: 'الرياض، المملكة العربية السعودية',
                role: 'admin',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            });
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
        this.loadLoginPage();
    }

    showMainApp() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        this.loadMainApp();
    }

    loadLoginPage() {
        fetch('pages/login.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('login-page').innerHTML = html;
                if (typeof setupLoginPage === 'function') {
                    setupLoginPage();
                }
            })
            .catch(error => {
                console.error('Error loading login page:', error);
                this.showNotification('خطأ في تحميل صفحة التسجيل', 'error');
                // عرض نسخة احتياطية
                document.getElementById('login-page').innerHTML = this.getFallbackLoginHTML();
            });
    }

    getFallbackLoginHTML() {
        return `
            <div class="login-container">
                <div class="login-box">
                    <div class="login-header">
                        <h1>النظام المحاسبي</h1>
                        <p>مرحباً بك في نظام إدارة الحسابات</p>
                    </div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">اسم المستخدم</label>
                            <input type="text" id="username" placeholder="أدخل اسم المستخدم" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">كلمة المرور</label>
                            <input type="password" id="password" placeholder="أدخل كلمة المرور" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block">تسجيل الدخول</button>
                    </form>
                    
                    <div class="test-credentials" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                        <h4>بيانات الاختبار:</h4>
                        <p><strong>اسم المستخدم:</strong> admin</p>
                        <p><strong>كلمة المرور:</strong> 123456</p>
                    </div>
                </div>
            </div>
        `;
    }

    loadMainApp() {
        fetch('pages/dashboard.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('main-app').innerHTML = html;
                this.setupNavigation();
                this.loadPage('dashboard');
                this.setupMobileMenu();
            })
            .catch(error => {
                console.error('Error loading main app:', error);
                this.showNotification('خطأ في تحميل التطبيق', 'error');
                document.getElementById('main-app').innerHTML = this.getFallbackMainHTML();
            });
    }

    getFallbackMainHTML() {
        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>النظام المحاسبي</h2>
                    <div class="company-name">${this.currentUser?.companyName || 'شركتي'}</div>
                </div>
                <ul class="sidebar-menu">
                    <li><a href="#" data-page="dashboard" class="active"><i class="fas fa-tachometer-alt"></i>لوحة التحكم</a></li>
                    <li><a href="#" data-page="invoices"><i class="fas fa-file-invoice"></i>الفواتير</a></li>
                    <li><a href="#" data-page="expenses"><i class="fas fa-receipt"></i>المصروفات</a></li>
                    <li><a href="#" data-page="customers"><i class="fas fa-users"></i>العملاء</a></li>
                    <li><a href="#" data-page="reports"><i class="fas fa-chart-bar"></i>التقارير</a></li>
                    <li><a href="#" onclick="Auth.logout()"><i class="fas fa-sign-out-alt"></i>تسجيل الخروج</a></li>
                </ul>
            </div>

            <div class="main-content">
                <div class="header">
                    <div>
                        <h1>لوحة التحكم</h1>
                        <div class="breadcrumb">لوحة التحكم</div>
                    </div>
                    <div class="user-info">
                        <div class="user-avatar">${this.currentUser?.companyName?.charAt(0) || 'A'}</div>
                        <div>
                            <div>${this.currentUser?.companyName || 'مدير النظام'}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Administrator</div>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; padding: 50px;">
                    <h2>مرحباً بك في النظام المحاسبي</h2>
                    <p>جاري تحميل المحتوى...</p>
                </div>
            </div>
        `;
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.sidebar-menu a, .sidebar-menu a *')) {
                e.preventDefault();
                const link = e.target.closest('a');
                const page = link.getAttribute('data-page');
                if (page) {
                    this.loadPage(page);
                }
            }
        });
    }

    setupMobileMenu() {
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-btn';
        mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
        document.body.appendChild(mobileBtn);

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    }

    async loadPage(page) {
        this.showLoading();
        this.currentPage = page;

        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const html = await response.text();
            
            document.querySelector('.main-content').innerHTML = html;
            this.updateActiveNavLink(page);
            this.updateBreadcrumb(page);
            
            // تحميل الـ JavaScript الخاص بالصفحة
            if (window[`${page}Page`] && typeof window[`${page}Page`].init === 'function') {
                await window[`${page}Page`].init();
            }
            
            this.hideLoading();
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            this.showNotification(`خطأ في تحميل الصفحة: ${page}`, 'error');
            this.hideLoading();
            
            // عرض محتوى بديل
            document.querySelector('.main-content').innerHTML = `
                <div class="header">
                    <div>
                        <h1>${this.getPageTitle(page)}</h1>
                        <div class="breadcrumb">${this.getPageTitle(page)}</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 50px;">
                    <h3>عذراً، لا يمكن تحميل هذه الصفحة حالياً</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="accountingApp.loadPage('dashboard')">العودة للوحة التحكم</button>
                </div>
            `;
        }
    }

    getPageTitle(page) {
        const titles = {
            'dashboard': 'لوحة التحكم',
            'invoices': 'الفواتير',
            'expenses': 'المصروفات',
            'customers': 'العملاء',
            'reports': 'التقارير'
        };
        return titles[page] || page;
    }

    updateActiveNavLink(page) {
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updateBreadcrumb(page) {
        const breadcrumbMap = {
            'dashboard': 'لوحة التحكم',
            'invoices': 'الفواتير',
            'expenses': 'المصروفات',
            'customers': 'العملاء',
            'reports': 'التقارير'
        };
        
        const breadcrumbElement = document.querySelector('.breadcrumb');
        if (breadcrumbElement) {
            breadcrumbElement.textContent = breadcrumbMap[page] || page;
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            ${message}
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    setupEventListeners() {
        // إعداد المستمعين للأحداث العامة
    }
}

// دالة مساعدة للتنسيق المالي
function formatCurrency(amount) {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const currency = settings.currency || 'ر.س';
    return new Intl.NumberFormat('ar-SA').format(amount) + ' ' + currency;
}

// دالة مساعدة للتواريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
}

// دالة لإنشاء أرقام فواتير تلقائية
function generateInvoiceNumber() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const prefix = settings.invoicePrefix || 'INV-';
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const nextNumber = invoices.length + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// دالة مساعدة للبحث في الجداول
function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        let found = false;
        const cells = row.getElementsByTagName('td');
        
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.accountingApp = new AccountingApp();
    window.Auth = Auth;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.generateInvoiceNumber = generateInvoiceNumber;
    window.filterTable = filterTable;
});