// البيانات الافتراضية للتطبيق
const DefaultData = {
    initializeDefaultData() {
        // التحقق إذا كانت البيانات موجودة مسبقاً
        if (!localStorage.getItem('defaultDataInitialized')) {
            this.initializeUsers();
            this.initializeCustomers();
            this.initializeProducts();
            this.initializeInvoices();
            this.initializeExpenses();
            this.initializeSettings();
            
            localStorage.setItem('defaultDataInitialized', 'true');
        }
    },

    initializeUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.length === 0) {
            const defaultUsers = [
                {
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
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    },

    initializeCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        if (customers.length === 0) {
            const defaultCustomers = [
                {
                    id: '1',
                    name: 'شركة التقنية المتطورة',
                    email: 'info@tech.com',
                    phone: '+966511111111',
                    address: 'الرياض - حي العليا',
                    taxNumber: '3100000001',
                    balance: 15000,
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'مؤسسة البناء الحديث',
                    email: 'contact@modern-build.com',
                    phone: '+966522222222',
                    address: 'جدة - حي الصفا',
                    taxNumber: '3100000002',
                    balance: 8500,
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'شركة الأجهزة الكهربائية',
                    email: 'sales@electro.com',
                    phone: '+966533333333',
                    address: 'الدمام - حي الثقبة',
                    taxNumber: '3100000003',
                    balance: 23000,
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('customers', JSON.stringify(defaultCustomers));
        }
    },

    initializeProducts() {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        if (products.length === 0) {
            const defaultProducts = [
                {
                    id: '1',
                    name: 'لابتوب ديل - طراز XPS',
                    description: 'لابتوب ديل XPS 13 بمواصفات عالية',
                    price: 4500,
                    cost: 3200,
                    sku: 'DL-XPS-13',
                    category: 'أجهزة كمبيوتر',
                    stock: 15,
                    minStock: 5,
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'هاتف سامسونج جالاكسي S24',
                    description: 'هاتف ذكي سامسونج جالاكسي S24',
                    price: 3200,
                    cost: 2400,
                    sku: 'SS-S24-256',
                    category: 'هواتف ذكية',
                    stock: 25,
                    minStock: 10,
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'طابعة كانون - طراز G系列',
                    description: 'طابعة كانون ليزر ملونة',
                    price: 1800,
                    cost: 1200,
                    sku: 'CN-G3010',
                    category: 'طابعات',
                    stock: 8,
                    minStock: 3,
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '4',
                    name: 'شاشة LG - 24 بوصة',
                    description: 'شاشة كمبيوتر LED 24 بوصة',
                    price: 800,
                    cost: 550,
                    sku: 'LG-24ML600',
                    category: 'شاشات',
                    stock: 20,
                    minStock: 8,
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('products', JSON.stringify(defaultProducts));
        }
    },

    initializeInvoices() {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        if (invoices.length === 0) {
            const defaultInvoices = [
                {
                    id: '1',
                    invoiceNumber: 'INV-0001',
                    customerId: '1',
                    customerName: 'شركة التقنية المتطورة',
                    date: new Date('2024-01-15').toISOString(),
                    dueDate: new Date('2024-02-15').toISOString(),
                    items: [
                        { productId: '1', name: 'لابتوب ديل - طراز XPS', quantity: 2, price: 4500, total: 9000 },
                        { productId: '4', name: 'شاشة LG - 24 بوصة', quantity: 3, price: 800, total: 2400 }
                    ],
                    subtotal: 11400,
                    tax: 1710,
                    total: 13110,
                    paid: 13110,
                    balance: 0,
                    status: 'paid',
                    notes: 'شكراً لتعاملكم معنا',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    invoiceNumber: 'INV-0002',
                    customerId: '2',
                    customerName: 'مؤسسة البناء الحديث',
                    date: new Date('2024-01-20').toISOString(),
                    dueDate: new Date('2024-02-20').toISOString(),
                    items: [
                        { productId: '3', name: 'طابعة كانون - طراز G系列', quantity: 1, price: 1800, total: 1800 },
                        { productId: '4', name: 'شاشة LG - 24 بوصة', quantity: 2, price: 800, total: 1600 }
                    ],
                    subtotal: 3400,
                    tax: 510,
                    total: 3910,
                    paid: 2000,
                    balance: 1910,
                    status: 'partial',
                    notes: 'سيتم الدفع خلال أسبوع',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    invoiceNumber: 'INV-0003',
                    customerId: '3',
                    customerName: 'شركة الأجهزة الكهربائية',
                    date: new Date('2024-01-25').toISOString(),
                    dueDate: new Date('2024-02-25').toISOString(),
                    items: [
                        { productId: '2', name: 'هاتف سامسونج جالاكسي S24', quantity: 5, price: 3200, total: 16000 },
                        { productId: '1', name: 'لابتوب ديل - طراز XPS', quantity: 1, price: 4500, total: 4500 }
                    ],
                    subtotal: 20500,
                    tax: 3075,
                    total: 23575,
                    paid: 0,
                    balance: 23575,
                    status: 'unpaid',
                    notes: '',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('invoices', JSON.stringify(defaultInvoices));
        }
    },

    initializeExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        if (expenses.length === 0) {
            const defaultExpenses = [
                {
                    id: '1',
                    category: 'رواتب',
                    description: 'رواتب شهر يناير',
                    amount: 25000,
                    date: new Date('2024-01-05').toISOString(),
                    paymentMethod: 'تحويل بنكي',
                    reference: 'SAL-0124',
                    vendor: 'بنك الرياض',
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    category: 'إيجار',
                    description: 'إيجار المكتب لشهر يناير',
                    amount: 8000,
                    date: new Date('2024-01-10').toISOString(),
                    paymentMethod: 'شيك',
                    reference: 'RENT-0124',
                    vendor: 'شركة العقارية',
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    category: 'مرافق',
                    description: 'فواتير الكهرباء والماء',
                    amount: 1500,
                    date: new Date('2024-01-15').toISOString(),
                    paymentMethod: 'نقدي',
                    reference: 'UTIL-0124',
                    vendor: 'شركة الكهرباء',
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '4',
                    category: 'تسويق',
                    description: 'حملة إعلانية على وسائل التواصل',
                    amount: 3000,
                    date: new Date('2024-01-20').toISOString(),
                    paymentMethod: 'تحويل بنكي',
                    reference: 'AD-0124',
                    vendor: 'شركة الإعلانات',
                    isRecurring: false,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('expenses', JSON.stringify(defaultExpenses));
        }
    },

    initializeSettings() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        const defaultSettings = {
            companyName: 'شركة النخبة للتجارة',
            taxNumber: '310000000003',
            address: 'الرياض، المملكة العربية السعودية',
            phone: '+966500000000',
            email: 'info@company.com',
            currency: 'ر.س',
            taxRate: 15,
            invoicePrefix: 'INV-',
            invoiceNotes: 'شكراً لتعاملكم معنا\nيرجى السداد خلال 30 يوم',
            logo: '',
            website: 'www.company.com'
        };
        
        const mergedSettings = { ...defaultSettings, ...settings };
        localStorage.setItem('settings', JSON.stringify(mergedSettings));
    }
};

// تهيئة البيانات الافتراضية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    DefaultData.initializeDefaultData();
});