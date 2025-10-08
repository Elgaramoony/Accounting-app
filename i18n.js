// نظام الترجمة المتعدد اللغات
class I18n {
    constructor() {
        this.currentLang = 'ar';
        this.translations = {
            ar: {
                // التطبيق الرئيسي
                'app.name': 'النظام المحاسبي',
                'app.dashboard': 'لوحة التحكم',
                'app.invoices': 'الفواتير',
                'app.expenses': 'المصروفات',
                'app.customers': 'العملاء',
                'app.reports': 'التقارير',
                'app.settings': 'الإعدادات',
                
                // الميزات الجديدة
                'app.budget': 'الميزانية',
                'app.inventory': 'المخزون',
                'app.accounting': 'المحاسبة',
                'app.projects': 'المشاريع',
                'app.payroll': 'الرواتب',
                'app.pos': 'نقاط البيع',
                'app.ai': 'الذكاء الاصطناعي',
                'app.integrations': 'التكاملات',
                
                // الأزرار والعناصر العامة
                'common.add': 'إضافة',
                'common.edit': 'تعديل',
                'common.delete': 'حذف',
                'common.save': 'حفظ',
                'common.cancel': 'إلغاء',
                'common.search': 'بحث',
                'common.export': 'تصدير',
                'common.import': 'استيراد',
                'common.filter': 'تصفية',
                'common.status': 'الحالة',
                'common.actions': 'الإجراءات',
                'common.yes': 'نعم',
                'common.no': 'لا',
                
                // صفحات الميزانية
                'budget.title': 'إدارة الميزانية',
                'budget.create': 'ميزانية جديدة',
                'budget.overview': 'نظرة عامة',
                'budget.planning': 'التخطيط',
                'budget.tracking': 'المتابعة',
                'budget.reports': 'تقارير الميزانية',
                'budget.annual': 'الميزانية السنوية',
                'budget.actual': 'الفعلي',
                'budget.variance': 'الانحراف',
                
                // صفحات المخزون
                'inventory.title': 'إدارة المخزون',
                'inventory.add_product': 'منتج جديد',
                'inventory.total_products': 'إجمالي المنتجات',
                'inventory.value': 'قيمة المخزون',
                'inventory.low_stock': 'منتجات منخفضة',
                'inventory.out_of_stock': 'منتجات منتهية',
                
                // وهكذا لباقي الترجمات...
            },
            en: {
                'app.name': 'Accounting System',
                'app.dashboard': 'Dashboard',
                'app.invoices': 'Invoices',
                'app.expenses': 'Expenses',
                'app.customers': 'Customers',
                'app.reports': 'Reports',
                'app.settings': 'Settings',
                
                'app.budget': 'Budget',
                'app.inventory': 'Inventory',
                'app.accounting': 'Accounting',
                'app.projects': 'Projects',
                'app.payroll': 'Payroll',
                'app.pos': 'Point of Sale',
                'app.ai': 'AI Dashboard',
                'app.integrations': 'Integrations',
                
                'common.add': 'Add',
                'common.edit': 'Edit',
                'common.delete': 'Delete',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.search': 'Search',
                'common.export': 'Export',
                'common.import': 'Import',
                'common.filter': 'Filter',
                'common.status': 'Status',
                'common.actions': 'Actions',
                'common.yes': 'Yes',
                'common.no': 'No',
                
                'budget.title': 'Budget Management',
                'budget.create': 'New Budget',
                'budget.overview': 'Overview',
                'budget.planning': 'Planning',
                'budget.tracking': 'Tracking',
                'budget.reports': 'Budget Reports',
                'budget.annual': 'Annual Budget',
                'budget.actual': 'Actual',
                'budget.variance': 'Variance',
                
                'inventory.title': 'Inventory Management',
                'inventory.add_product': 'New Product',
                'inventory.total_products': 'Total Products',
                'inventory.value': 'Inventory Value',
                'inventory.low_stock': 'Low Stock',
                'inventory.out_of_stock': 'Out of Stock'
            }
        };
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('preferred_language', lang);
            this.applyTranslations();
            this.updateDirection();
        }
    }

    t(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    applyTranslations() {
        // ترجمة جميع العناصر التي تحتوي على data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // ترجمة عناصر العنوان
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = this.t(element.getAttribute('data-i18n-title'));
        });

        // تحديث عنوان الصفحة
        const pageTitle = document.querySelector('[data-i18n-page]');
        if (pageTitle) {
            document.title = this.t(pageTitle.getAttribute('data-i18n-page'));
        }
    }

    updateDirection() {
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;
    }

    getCurrencyFormat() {
        return this.currentLang === 'ar' ? 
            { symbol: 'ر.س', decimal: ',', thousands: ',' } :
            { symbol: 'SAR', decimal: '.', thousands: ',' };
    }

    getDateFormat() {
        return this.currentLang === 'ar' ? 
            { format: 'dd/mm/yyyy', separator: '/' } :
            { format: 'mm/dd/yyyy', separator: '/' };
    }
}

// إنشاء نسخة عامة من النظام
window.i18n = new I18n();