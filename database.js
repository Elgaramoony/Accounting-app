// نظام قاعدة البيانات المتقدم - تصميم نور الجرموني
class AccountingDatabase {
    constructor() {
        this.db = null;
        this.dbName = 'AccountingSystem';
        this.version = 3;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('فشل في فتح قاعدة البيانات');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('تم الاتصال بقاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        // مستخدمين النظام
        if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('email', 'email', { unique: true });
        }

        // العملاء
        if (!db.objectStoreNames.contains('customers')) {
            const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
            customersStore.createIndex('name', 'name');
            customersStore.createIndex('email', 'email');
            customersStore.createIndex('phone', 'phone');
        }

        // الفواتير
        if (!db.objectStoreNames.contains('invoices')) {
            const invoicesStore = db.createObjectStore('invoices', { keyPath: 'id' });
            invoicesStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
            invoicesStore.createIndex('customerId', 'customerId');
            invoicesStore.createIndex('date', 'date');
            invoicesStore.createIndex('status', 'status');
        }

        // المصروفات
        if (!db.objectStoreNames.contains('expenses')) {
            const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
            expensesStore.createIndex('category', 'category');
            expensesStore.createIndex('date', 'date');
            expensesStore.createIndex('amount', 'amount');
        }

        // المنتجات والخدمات
        if (!db.objectStoreNames.contains('products')) {
            const productsStore = db.createObjectStore('products', { keyPath: 'id' });
            productsStore.createIndex('name', 'name');
            productsStore.createIndex('category', 'category');
            productsStore.createIndex('price', 'price');
        }

        // الموردين
        if (!db.objectStoreNames.contains('suppliers')) {
            const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id' });
            suppliersStore.createIndex('name', 'name');
            suppliersStore.createIndex('category', 'category');
        }

        // المشاريع
        if (!db.objectStoreNames.contains('projects')) {
            const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
            projectsStore.createIndex('name', 'name');
            projectsStore.createIndex('status', 'status');
            projectsStore.createIndex('startDate', 'startDate');
        }

        // المخزون
        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
            inventoryStore.createIndex('productId', 'productId');
            inventoryStore.createIndex('quantity', 'quantity');
            inventoryStore.createIndex('location', 'location');
        }

        // الحركات المالية
        if (!db.objectStoreNames.contains('transactions')) {
            const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionsStore.createIndex('type', 'type');
            transactionsStore.createIndex('date', 'date');
            transactionsStore.createIndex('amount', 'amount');
        }

        // الإعدادات
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }

        // سجل النشاطات
        if (!db.objectStoreNames.contains('activities')) {
            const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
            activitiesStore.createIndex('userId', 'userId');
            activitiesStore.createIndex('timestamp', 'timestamp');
            activitiesStore.createIndex('action', 'action');
        }

        // النسخ الاحتياطي
        if (!db.objectStoreNames.contains('backups')) {
            const backupsStore = db.createObjectStore('backups', { keyPath: 'id' });
            backupsStore.createIndex('timestamp', 'timestamp');
            backupsStore.createIndex('type', 'type');
        }
    }

    // العمليات الأساسية (CRUD)
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, range = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = indexName ? store.index(indexName) : store;
            const request = range ? target.getAll(range) : target.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id: key });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // عمليات متقدمة
    async query(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async queryAll(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName, indexName = null, key = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const target = indexName ? store.index(indexName) : store;
            const request = key ? target.count(key) : target.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // عمليات المجموعة
    async bulkAdd(storeName, items) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let completed = 0;
            const results = [];

            items.forEach(item => {
                const request = store.add(item);
                request.onsuccess = () => {
                    results.push(request.result);
                    completed++;
                    if (completed === items.length) {
                        resolve(results);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    async bulkDelete(storeName, keys) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let completed = 0;

            keys.forEach(key => {
                const request = store.delete(key);
                request.onsuccess = () => {
                    completed++;
                    if (completed === keys.length) {
                        resolve(true);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    // الإحصائيات والتقارير
    async getFinancialStats(startDate, endDate) {
        const invoices = await this.getAll('invoices');
        const expenses = await this.getAll('expenses');
        
        const filteredInvoices = invoices.filter(inv => {
            const invoiceDate = new Date(inv.date);
            return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
        });

        const filteredExpenses = expenses.filter(exp => {
            const expenseDate = new Date(exp.date);
            return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
        });

        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            invoiceCount: filteredInvoices.length,
            expenseCount: filteredExpenses.length,
            averageInvoice: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0
        };
    }

    async getCustomerSummary(customerId) {
        const invoices = await this.queryAll('invoices', 'customerId', customerId);
        const totalInvoices = invoices.length;
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const paidAmount = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
        const balance = totalAmount - paidAmount;

        return {
            totalInvoices,
            totalAmount,
            paidAmount,
            balance,
            lastInvoice: invoices.length > 0 ? invoices[invoices.length - 1] : null
        };
    }

    // النسخ الاحتياطي والاستعادة
    async exportData() {
        const stores = [
            'users', 'customers', 'invoices', 'expenses', 
            'products', 'suppliers', 'projects', 'settings'
        ];

        const exportData = {};

        for (const storeName of stores) {
            exportData[storeName] = await this.getAll(storeName);
        }

        exportData.metadata = {
            exportDate: new Date().toISOString(),
            version: this.version,
            recordCount: Object.values(exportData).flat().length
        };

        return exportData;
    }

    async importData(data) {
        const transaction = this.db.transaction([
            'users', 'customers', 'invoices', 'expenses', 
            'products', 'suppliers', 'projects', 'settings'
        ], 'readwrite');

        try {
            for (const [storeName, items] of Object.entries(data)) {
                if (storeName !== 'metadata') {
                    const store = transaction.objectStore(storeName);
                    await store.clear();
                    
                    for (const item of items) {
                        await store.add(item);
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // الصيانة والتنظيف
    async cleanupOldData(days = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // تنظيف النشاطات القديمة
        const activities = await this.getAll('activities');
        const oldActivities = activities.filter(activity => 
            new Date(activity.timestamp) < cutoffDate
        );

        if (oldActivities.length > 0) {
            const keys = oldActivities.map(act => act.id);
            await this.bulkDelete('activities', keys);
        }

        // تنظيف النسخ الاحتياطي القديمة
        const backups = await this.getAll('backups');
        const oldBackups = backups.filter(backup => 
            new Date(backup.timestamp) < cutoffDate
        );

        if (oldBackups.length > 0) {
            const keys = oldBackups.map(backup => backup.id);
            await this.bulkDelete('backups', keys);
        }

        return {
            deletedActivities: oldActivities.length,
            deletedBackups: oldBackups.length
        };
    }

    // تحسين الأداء
    async optimizeDatabase() {
        // يمكن إضافة عمليات تحسين الأداء هنا
        console.log('تحسين قاعدة البيانات...');
        return true;
    }

    // معلومات قاعدة البيانات
    async getDatabaseInfo() {
        const stores = Array.from(this.db.objectStoreNames);
        const storeInfo = {};

        for (const storeName of stores) {
            storeInfo[storeName] = await this.count(storeName);
        }

        return {
            name: this.dbName,
            version: this.version,
            stores: storeInfo,
            totalSize: await this.getDatabaseSize(),
            lastBackup: await this.getLastBackupDate()
        };
    }

    async getDatabaseSize() {
        // تقدير حجم قاعدة البيانات
        const allData = await this.exportData();
        const dataString = JSON.stringify(allData);
        return new Blob([dataString]).size;
    }

    async getLastBackupDate() {
        const backups = await this.getAll('backups');
        if (backups.length === 0) return null;
        
        const latestBackup = backups.reduce((latest, backup) => {
            return new Date(backup.timestamp) > new Date(latest.timestamp) ? backup : latest;
        });
        
        return latestBackup.timestamp;
    }
}

// إنشاء نسخة عامة من قاعدة البيانات
window.AccountingDB = new AccountingDatabase();

// دعم localStorage كنسخة احتياطية
class FallbackStorage {
    async getAll(storeName) {
        const data = localStorage.getItem(storeName);
        return data ? JSON.parse(data) : [];
    }

    async add(storeName, item) {
        const items = await this.getAll(storeName);
        item.id = item.id || Date.now().toString();
        items.push(item);
        localStorage.setItem(storeName, JSON.stringify(items));
        return item.id;
    }

    async update(storeName, key, data) {
        const items = await this.getAll(storeName);
        const index = items.findIndex(item => item.id === key);
        if (index !== -1) {
            items[index] = { ...data, id: key };
            localStorage.setItem(storeName, JSON.stringify(items));
            return true;
        }
        return false;
    }

    async delete(storeName, key) {
        const items = await this.getAll(storeName);
        const filteredItems = items.filter(item => item.id !== key);
        localStorage.setItem(storeName, JSON.stringify(filteredItems));
        return true;
    }
}

// تصدير الفئات
window.FallbackStorage = FallbackStorage;