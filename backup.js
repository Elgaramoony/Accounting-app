// نظام النسخ الاحتياطي المتقدم - تصميم نور الجرموني
class BackupSystem {
    constructor() {
        this.autoBackupInterval = null;
        this.cloudServices = {
            googleDrive: false,
            dropbox: false,
            oneDrive: false
        };
        this.init();
    }

    async init() {
        await this.setupAutoBackup();
        await this.checkCloudServices();
    }

    // النسخ الاحتياطي التلقائي
    async setupAutoBackup() {
        if (AppConfig.backup.autoBackup) {
            const interval = AppConfig.backup.backupInterval || (24 * 60 * 60 * 1000);
            
            this.autoBackupInterval = setInterval(async () => {
                try {
                    await this.createBackup('auto');
                    console.log('تم النسخ الاحتياطي التلقائي بنجاح');
                } catch (error) {
                    console.error('فشل النسخ الاحتياطي التلقائي:', error);
                }
            }, interval);

            // أيضًا عمل نسخة احتياطية فورية عند التحميل
            setTimeout(() => this.createBackup('initial'), 5000);
        }
    }

    // إنشاء نسخة احتياطية
    async createBackup(type = 'manual', description = '') {
        try {
            const backupData = await AccountingDB.exportData();
            const backup = {
                id: 'backup_' + Date.now(),
                type: type,
                timestamp: new Date().toISOString(),
                description: description,
                data: backupData,
                size: new Blob([JSON.stringify(backupData)]).size,
                version: AppConfig.app.version
            };

            // حفظ في قاعدة البيانات
            await AccountingDB.add('backups', backup);

            // حفظ محلي
            await this.saveLocalBackup(backup);

            // حفظ على السحابة إذا كان مفعل
            if (AppConfig.backup.cloudBackup) {
                await this.saveCloudBackup(backup);
            }

            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser()?.id, 'نسخ احتياطي', 
                `تم إنشاء نسخة احتياطية (${type})`);

            return backup;
        } catch (error) {
            console.error('فشل في إنشاء النسخة الاحتياطية:', error);
            AccountingUtils.logError(error, 'createBackup');
            throw error;
        }
    }

    // حفظ نسخة محلية
    async saveLocalBackup(backup) {
        const backupBlob = new Blob([JSON.stringify(backup.data)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(backupBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${backup.timestamp.split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // حفظ على السحابة
    async saveCloudBackup(backup) {
        // تنفيذ التكامل مع خدمات السحابة
        // يمكن إضافة تكامل مع Google Drive, Dropbox, etc.
        console.log('حفظ النسخة الاحتياطية على السحابة:', backup.id);
    }

    // استعادة من نسخة احتياطية
    async restoreBackup(backupId) {
        try {
            const backup = await AccountingDB.get('backups', backupId);
            
            if (!backup) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }

            // إنشاء نسخة احتياطية قبل الاستعادة
            await this.createBackup('pre_restore', 'نسخة قبل الاستعادة');

            // استعادة البيانات
            await AccountingDB.importData(backup.data);

            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser()?.id, 'استعادة نسخة', 
                `تم استعادة النظام من نسخة احتياطية (${backup.timestamp})`);

            return true;
        } catch (error) {
            console.error('فشل في استعادة النسخة الاحتياطية:', error);
            AccountingUtils.logError(error, 'restoreBackup');
            throw error;
        }
    }

    // استعادة من ملف
    async restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    // التحقق من صحة البيانات
                    if (!this.validateBackupData(backupData)) {
                        throw new Error('ملف النسخة الاحتياطية غير صالح');
                    }

                    // إنشاء نسخة احتياطية قبل الاستعادة
                    await this.createBackup('pre_restore', 'نسخة قبل الاستعادة من ملف');

                    // استعادة البيانات
                    await AccountingDB.importData(backupData);

                    // تسجيل النشاط
                    Auth.logActivity(Auth.getCurrentUser()?.id, 'استعادة من ملف', 
                        'تم استعادة النظام من ملف نسخة احتياطية');

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            reader.readAsText(file);
        });
    }

    // التحقق من صحة بيانات النسخة الاحتياطية
    validateBackupData(data) {
        const requiredStores = ['users', 'customers', 'invoices', 'expenses', 'settings'];
        return requiredStores.every(store => Array.isArray(data[store]));
    }

    // إدارة النسخ الاحتياطية
    async getBackups(limit = 50) {
        try {
            const backups = await AccountingDB.getAll('backups');
            return backups
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('فشل في جلب النسخ الاحتياطية:', error);
            return [];
        }
    }

    async deleteBackup(backupId) {
        try {
            await AccountingDB.delete('backups', backupId);
            
            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser()?.id, 'حذف نسخة', 
                'تم حذف نسخة احتياطية');

            return true;
        } catch (error) {
            console.error('فشل في حذف النسخة الاحتياطية:', error);
            throw error;
        }
    }

    async cleanupOldBackups() {
        const retentionDays = AppConfig.backup.retentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        try {
            const backups = await AccountingDB.getAll('backups');
            const oldBackups = backups.filter(backup => 
                new Date(backup.timestamp) < cutoffDate
            );

            let deletedCount = 0;
            for (const backup of oldBackups) {
                await this.deleteBackup(backup.id);
                deletedCount++;
            }

            return deletedCount;
        } catch (error) {
            console.error('فشل في تنظيف النسخ القديمة:', error);
            throw error;
        }
    }

    // إحصائيات النسخ الاحتياطية
    async getBackupStats() {
        try {
            const backups = await AccountingDB.getAll('backups');
            const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
            const autoBackups = backups.filter(b => b.type === 'auto').length;
            const manualBackups = backups.filter(b => b.type === 'manual').length;

            return {
                totalBackups: backups.length,
                totalSize,
                autoBackups,
                manualBackups,
                lastBackup: backups.length > 0 ? backups[0].timestamp : null,
                averageSize: backups.length > 0 ? totalSize / backups.length : 0
            };
        } catch (error) {
            console.error('فشل في جلب إحصائيات النسخ:', error);
            return null;
        }
    }

    // فحص خدمات السحابة
    async checkCloudServices() {
        // يمكن إضافة فحص للتكامل مع خدمات السحابة
        this.cloudServices = {
            googleDrive: await this.checkGoogleDrive(),
            dropbox: await this.checkDropbox(),
            oneDrive: await this.checkOneDrive()
        };
    }

    async checkGoogleDrive() {
        // تنفيذ فحص تكامل Google Drive
        return false;
    }

    async checkDropbox() {
        // تنفيذ فحص تكامل Dropbox
        return false;
    }

    async checkOneDrive() {
        // تنفيذ فحص تكامل OneDrive
        return false;
    }

    // إعدادات النسخ الاحتياطي
    async updateBackupSettings(settings) {
        Object.assign(AppConfig.backup, settings);
        localStorage.setItem('app_config', JSON.stringify(AppConfig));

        // إعادة تهيئة النسخ التلقائي
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }
        await this.setupAutoBackup();

        return true;
    }

    // تصدير تقرير النسخ الاحتياطية
    async exportBackupReport() {
        const backups = await this.getBackups();
        const stats = await this.getBackupStats();

        const report = {
            generatedAt: new Date().toISOString(),
            stats: stats,
            backups: backups.map(backup => ({
                id: backup.id,
                type: backup.type,
                timestamp: backup.timestamp,
                size: backup.size,
                description: backup.description
            }))
        };

        const csvContent = this.convertToCSV(report);
        AccountingUtils.exportData(csvContent, 'backup_report.csv', 'text/csv');
    }

    convertToCSV(report) {
        const headers = ['النوع', 'التاريخ', 'الحجم', 'الوصف'];
        const rows = report.backups.map(backup => [
            backup.type,
            backup.timestamp,
            backup.size,
            backup.description || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// إنشاء نسخة عامة من نظام النسخ الاحتياطي
window.BackupSystem = new BackupSystem();