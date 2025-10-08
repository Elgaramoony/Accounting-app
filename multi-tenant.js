// نظام متعدد المستأجرين للسحابة
class MultiTenantSystem {
    constructor() {
        this.tenants = new Map();
        this.currentTenant = null;
        this.tenantDatabases = new Map();
    }

    async init() {
        await this.loadTenants();
        await this.setupCurrentTenant();
    }

    async loadTenants() {
        try {
            const tenantsData = await AccountingDB.getAll('tenants') || [];
            
            for (const tenantData of tenantsData) {
                await this.registerTenant(tenantData);
            }
        } catch (error) {
            console.error('Error loading tenants:', error);
        }
    }

    async registerTenant(tenantData) {
        const tenant = {
            id: tenantData.id,
            name: tenantData.name,
            subdomain: tenantData.subdomain,
            database: tenantData.database,
            settings: tenantData.settings || {},
            createdAt: tenantData.createdAt,
            status: tenantData.status || 'active'
        };

        this.tenants.set(tenant.id, tenant);
        
        // إنشاء قاعدة بيانات للمستأجر
        await this.createTenantDatabase(tenant);
        
        return tenant;
    }

    async createTenantDatabase(tenant) {
        // في التطبيق الحقيقي، سيتم إنشاء قاعدة بيانات منفصلة لكل مستأجر
        const dbName = `tenant_${tenant.id}`;
        const tenantDB = new AccountingDB(dbName);
        
        await tenantDB.init();
        this.tenantDatabases.set(tenant.id, tenantDB);
        
        return tenantDB;
    }

    async setupCurrentTenant() {
        // تحديد المستأجر الحالي من النطاق الفرعي أو الإعدادات
        const subdomain = this.getSubdomain();
        let tenant = null;

        if (subdomain) {
            tenant = Array.from(this.tenants.values()).find(t => 
                t.subdomain === subdomain
            );
        }

        if (!tenant) {
            // استخدام المستأجر الافتراضي
            tenant = this.tenants.values().next().value;
        }

        if (tenant) {
            await this.switchTenant(tenant.id);
        }
    }

    getSubdomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        if (parts.length > 2) {
            return parts[0];
        }
        
        return null;
    }

    async switchTenant(tenantId) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        const tenantDB = this.tenantDatabases.get(tenantId);
        if (!tenantDB) {
            throw new Error(`Database for tenant ${tenantId} not found`);
        }

        this.currentTenant = tenant;
        window.currentTenantDB = tenantDB;

        // تحديث واجهة المستخدم
        this.updateUIForTenant(tenant);

        // trigger hooks
        await pluginSystem.triggerHook('tenant_switched', { tenant });

        console.log(`Switched to tenant: ${tenant.name}`);
    }

    updateUIForTenant(tenant) {
        // تحديث واجهة المستخدم حسب إعدادات المستأجر
        document.title = `${tenant.name} - ${i18n.t('app.name')}`;
        
        // تطبيق إعدادات المستأجر (لون، شعار، إلخ)
        if (tenant.settings.theme) {
            this.applyTheme(tenant.settings.theme);
        }
    }

    applyTheme(theme) {
        // تطبيق السمات المخصصة
        const root = document.documentElement;
        
        if (theme.primaryColor) {
            root.style.setProperty('--primary-color', theme.primaryColor);
        }
        
        if (theme.logo) {
            const logoElement = document.querySelector('.logo');
            if (logoElement) {
                logoElement.src = theme.logo;
            }
        }
    }

    async createTenant(tenantData) {
        const tenantId = `tenant_${Date.now()}`;
        const newTenant = {
            id: tenantId,
            ...tenantData,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        await AccountingDB.add('tenants', newTenant);
        await this.registerTenant(newTenant);

        return newTenant;
    }

    getCurrentTenant() {
        return this.currentTenant;
    }

    getAllTenants() {
        return Array.from(this.tenants.values());
    }

    async updateTenantSettings(tenantId, settings) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) return;

        tenant.settings = { ...tenant.settings, ...settings };
        await AccountingDB.update('tenants', tenantId, tenant);

        if (tenantId === this.currentTenant?.id) {
            this.updateUIForTenant(tenant);
        }
    }
}

// إنشاء نسخة عامة من النظام
window.multiTenant = new MultiTenantSystem();