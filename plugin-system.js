// نظام الإضافات المتقدم
class PluginSystem {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        // تحميل الإضافات المثبتة
        await this.loadInstalledPlugins();
        this.initialized = true;
    }

    async loadInstalledPlugins() {
        try {
            const installedPlugins = await AccountingDB.getAll('plugins') || [];
            
            for (const pluginData of installedPlugins) {
                if (pluginData.active) {
                    await this.loadPlugin(pluginData);
                }
            }
        } catch (error) {
            console.error('Error loading plugins:', error);
        }
    }

    async loadPlugin(pluginData) {
        try {
            // في التطبيق الحقيقي، سيتم تحميل الكود من ملف خارجي
            const plugin = this.createPluginInstance(pluginData);
            
            this.plugins.set(pluginData.id, plugin);
            
            // تسجيل الـ hooks
            if (plugin.hooks) {
                plugin.hooks.forEach(hook => {
                    this.registerHook(hook.name, hook.handler.bind(plugin));
                });
            }
            
            // تهيئة الإضافة
            if (plugin.init) {
                await plugin.init();
            }
            
            console.log(`Plugin ${pluginData.name} loaded successfully`);
            
        } catch (error) {
            console.error(`Error loading plugin ${pluginData.name}:`, error);
        }
    }

    createPluginInstance(pluginData) {
        // محاكاة إنشاء إضافة (في التطبيق الحقيقي سيتم تحميلها ديناميكياً)
        const pluginTypes = {
            'reporting': ReportingPlugin,
            'integration': IntegrationPlugin,
            'analytics': AnalyticsPlugin,
            'custom': CustomPlugin
        };
        
        const PluginClass = pluginTypes[pluginData.type] || BasePlugin;
        return new PluginClass(pluginData);
    }

    registerHook(hookName, handler) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push(handler);
    }

    async triggerHook(hookName, data = {}) {
        const handlers = this.hooks.get(hookName) || [];
        const results = [];
        
        for (const handler of handlers) {
            try {
                const result = await handler(data);
                results.push(result);
            } catch (error) {
                console.error(`Error in hook ${hookName}:`, error);
            }
        }
        
        return results;
    }

    async installPlugin(pluginConfig) {
        const pluginData = {
            id: `plugin_${Date.now()}`,
            ...pluginConfig,
            installedAt: new Date().toISOString(),
            active: true
        };
        
        await AccountingDB.add('plugins', pluginData);
        await this.loadPlugin(pluginData);
        
        await this.triggerHook('plugin_installed', { plugin: pluginData });
    }

    async uninstallPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        
        if (plugin && plugin.destroy) {
            await plugin.destroy();
        }
        
        this.plugins.delete(pluginId);
        await AccountingDB.delete('plugins', pluginId);
        
        await this.triggerHook('plugin_uninstalled', { pluginId });
    }

    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
}

// الفئات الأساسية للإضافات
class BasePlugin {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.version = config.version;
        this.description = config.description;
        this.config = config;
    }

    async init() {
        // يتم override من قبل الإضافات
    }

    async destroy() {
        // تنظيف الموارد
    }
}

class ReportingPlugin extends BasePlugin {
    constructor(config) {
        super(config);
        this.hooks = [
            {
                name: 'report_generate',
                handler: this.onReportGenerate.bind(this)
            }
        ];
    }

    async onReportGenerate(data) {
        // معالجة إنشاء التقارير
        console.log('Reporting plugin processing report:', data);
        return data;
    }
}

class IntegrationPlugin extends BasePlugin {
    constructor(config) {
        super(config);
        this.hooks = [
            {
                name: 'invoice_created',
                handler: this.onInvoiceCreated.bind(this)
            }
        ];
    }

    async onInvoiceCreated(data) {
        // تكامل مع أنظمة خارجية عند إنشاء فاتورة
        console.log('Integration plugin processing invoice:', data);
        return data;
    }
}

// إنشاء نسخة عامة من نظام الإضافات
window.pluginSystem = new PluginSystem();