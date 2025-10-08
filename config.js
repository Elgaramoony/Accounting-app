// إعدادات النظام المحاسبي - تصميم نور الجرموني
const AppConfig = {
    // معلومات المطور
    developer: {
        name: "نور الجرموني",
        email: "noor.aljarmoni@example.com",
        website: "https://noor-aljarmoni.com",
        version: "2.0.0"
    },

    // إعدادات التطبيق
    app: {
        name: "النظام المحاسبي المتكامل",
        version: "2.0.0",
        defaultLanguage: "ar",
        supportedLanguages: ["ar", "en"],
        defaultCurrency: "ر.س",
        defaultTaxRate: 15,
        backupInterval: 24 * 60 * 60 * 1000, // 24 ساعة
        autoSave: true,
        enableSounds: true,
        enableAnimations: true
    },

    // إعدادات الوضع الليلي
    darkMode: {
        enabled: false,
        autoSwitch: true,
        switchTime: {
            start: "18:00", // 6 مساءً
            end: "06:00"    // 6 صباحًا
        },
        colors: {
            primary: "#bb86fc",
            secondary: "#03dac6",
            background: "#121212",
            surface: "#1e1e1e",
            error: "#cf6679"
        }
    },

    // إعدادات الأمان
    security: {
        encryption: true,
        sessionTimeout: 30, // دقائق
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        twoFactorAuth: false
    },

    // إعدادات قاعدة البيانات
    database: {
        type: "indexedDB", // indexedDB, localStorage, api
        name: "accounting_system",
        version: 2,
        backupToCloud: false,
        syncInterval: 5 * 60 * 1000 // 5 دقائق
    },

    // التكاملات
    integrations: {
        email: {
            enabled: false,
            provider: "smtp"
        },
        payment: {
            enabled: false,
            providers: ["mada", "visa", "mastercard"]
        },
        banking: {
            enabled: false,
            apis: []
        },
        tax: {
            enabled: false,
            authority: "zatca" // الهيئة العامة للزكاة والدخل
        }
    },

    // الإشعارات
    notifications: {
        email: true,
        browser: true,
        sound: true,
        mobile: false
    },

    // التقارير
    reports: {
        autoGenerate: true,
        saveHistory: true,
        exportFormats: ["pdf", "excel", "csv"],
        schedule: {
            daily: true,
            weekly: true,
            monthly: true
        }
    },

    // الذكاء الاصطناعي
    ai: {
        enabled: true,
        features: {
            predictions: true,
            anomalyDetection: true,
            autoCategorization: true,
            insights: true
        }
    },

    // النسخ الاحتياطي
    backup: {
        autoBackup: true,
        cloudBackup: false,
        localBackup: true,
        retentionDays: 30
    },

    // API
    api: {
        enabled: false,
        baseURL: "https://api.accounting-system.com",
        version: "v1"
    }
};

// تصدير الإعدادات
window.AppConfig = AppConfig;

// تهيئة الإعدادات
function initializeConfig() {
    const savedConfig = localStorage.getItem('app_config');
    if (!savedConfig) {
        localStorage.setItem('app_config', JSON.stringify(AppConfig));
    } else {
        Object.assign(AppConfig, JSON.parse(savedConfig));
    }
    
    // تطبيق الإعدادات
    applyConfig();
}

function applyConfig() {
    // تطبيق الوضع الليلي
    if (AppConfig.darkMode.enabled) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }

    // تطبيق اللغة
    document.documentElement.lang = AppConfig.app.defaultLanguage;
    
    // تطبيق الأصوات
    if (!AppConfig.app.enableSounds) {
        document.getElementById('bgMusic')?.pause();
    }
}

function saveConfig() {
    localStorage.setItem('app_config', JSON.stringify(AppConfig));
}

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeConfig);