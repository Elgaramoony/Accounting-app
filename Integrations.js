// نظام التكاملات الخارجية - تصميم نور الجرموني
class IntegrationSystem {
    constructor() {
        this.integrations = {
            email: null,
            payment: null,
            banking: null,
            tax: null,
            sms: null
        };
        this.init();
    }

    async init() {
        await this.loadIntegrationSettings();
        await this.initializeIntegrations();
    }

    // تحميل إعدادات التكاملات
    async loadIntegrationSettings() {
        const settings = await AccountingDB.get('settings', 'integrations');
        if (settings) {
            this.integrations = { ...this.integrations, ...settings.value };
        }
    }

    // تهيئة التكاملات
    async initializeIntegrations() {
        if (AppConfig.integrations.email.enabled) {
            await this.initializeEmailIntegration();
        }

        if (AppConfig.integrations.payment.enabled) {
            await this.initializePaymentIntegration();
        }

        if (AppConfig.integrations.banking.enabled) {
            await this.initializeBankingIntegration();
        }

        if (AppConfig.integrations.tax.enabled) {
            await this.initializeTaxIntegration();
        }
    }

    // تكامل البريد الإلكتروني
    async initializeEmailIntegration() {
        // تكامل مع خدمات البريد الإلكتروني
        this.integrations.email = {
            sendInvoice: async (invoice, customer) => {
                const subject = `فاتورة ${invoice.invoiceNumber}`;
                const body = this.generateInvoiceEmailTemplate(invoice, customer);
                
                return await this.sendEmail(customer.email, subject, body);
            },
            sendReminder: async (invoice, customer) => {
                const subject = `تذكير - فاتورة ${invoice.invoiceNumber}`;
                const body = this.generateReminderEmailTemplate(invoice, customer);
                
                return await this.sendEmail(customer.email, subject, body);
            },
            sendReport: async (report, email) => {
                const subject = `تقرير ${report.title}`;
                const body = this.generateReportEmailTemplate(report);
                
                return await this.sendEmail(email, subject, body);
            }
        };
    }

    // تكامل الدفع الإلكتروني
    async initializePaymentIntegration() {
        // تكامل مع بوابات الدفع
        this.integrations.payment = {
            processPayment: async (invoice, paymentMethod) => {
                try {
                    // محاكاة عملية الدفع
                    const paymentResult = {
                        success: true,
                        transactionId: 'txn_' + Date.now(),
                        amount: invoice.total,
                        method: paymentMethod,
                        timestamp: new Date().toISOString()
                    };

                    // تحديث الفاتورة
                    invoice.paid = invoice.total;
                    invoice.balance = 0;
                    invoice.status = 'paid';
                    await AccountingDB.update('invoices', invoice.id, invoice);

                    // تسجيل الحركة المالية
                    await this.recordTransaction(invoice, paymentResult);

                    return paymentResult;
                } catch (error) {
                    console.error('فشل في معالجة الدفع:', error);
                    throw error;
                }
            },
            refundPayment: async (transactionId, amount) => {
                // تنفيذ عملية الاسترداد
                console.log('معالجة استرداد المبلغ:', transactionId, amount);
            },
            getPaymentMethods: () => {
                return ['بطاقة ائتمان', 'مدى', 'حوالة بنكية', 'نقدي'];
            }
        };
    }

    // تكامل البنوك
    async initializeBankingIntegration() {
        // تكامل مع أنظمة البنوك
        this.integrations.banking = {
            syncTransactions: async (bankAccount, startDate, endDate) => {
                // مزامنة الحركات البنكية
                console.log('مزامنة الحركات البنكية:', bankAccount);
            },
            getAccountBalance: async (bankAccount) => {
                // الحصول على رصيد الحساب
                return 0;
            },
            transferFunds: async (fromAccount, toAccount, amount) => {
                // تحويل الأموال
                console.log('تحويل الأموال:', fromAccount, toAccount, amount);
            }
        };
    }

    // تكامل الضرائب
    async initializeTaxIntegration() {
        // تكامل مع نظام الفاتورة الإلكترونية
        this.integrations.tax = {
            generateEInvoice: async (invoice) => {
                try {
                    const eInvoice = {
                        id: 'einvoice_' + invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        issueDate: new Date().toISOString(),
                        supplier: await this.getCompanyInfo(),
                        customer: await this.getCustomerInfo(invoice.customerId),
                        items: invoice.items,
                        taxAmount: invoice.tax,
                        totalAmount: invoice.total,
                        qrCode: await this.generateQRCode(invoice)
                    };

                    // حفظ الفاتورة الإلكترونية
                    await AccountingDB.add('e_invoices', eInvoice);

                    return eInvoice;
                } catch (error) {
                    console.error('فشل في إنشاء الفاتورة الإلكترونية:', error);
                    throw error;
                }
            },
            submitToTaxAuthority: async (eInvoice) => {
                // إرسال للهيئة العامة للزكاة والدخل
                console.log('إرسال الفاتورة للهيئة:', eInvoice.id);
                return { success: true, submissionId: 'sub_' + Date.now() };
            },
            generateTaxReport: async (period) => {
                // إنشاء تقرير ضريبي
                const report = await this.calculateTaxForPeriod(period);
                return report;
            }
        };
    }

    // خدمات مساعدة
    async sendEmail(to, subject, body) {
        // تنفيذ إرسال البريد الإلكتروني
        console.log('إرسال بريد إلكتروني:', { to, subject });
        return { success: true, messageId: 'msg_' + Date.now() };
    }

    generateInvoiceEmailTemplate(invoice, customer) {
        return `
            <div dir="rtl">
                <h2>فاتورة ${invoice.invoiceNumber}</h2>
                <p>عزيزي/عزيزتي ${customer.name},</p>
                <p>نشكرك على تعاملك معنا. نرفق لك الفاتورة التالية:</p>
                
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                    </tr>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price}</td>
                            <td>${item.total}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <p><strong>الإجمالي: ${invoice.total} ر.س</strong></p>
                <p>شكراً لتعاملك معنا</p>
            </div>
        `;
    }

    async recordTransaction(invoice, paymentResult) {
        const transaction = {
            id: 'trn_' + Date.now(),
            type: 'income',
            amount: paymentResult.amount,
            date: new Date().toISOString(),
            description: `دفعة فاتورة ${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            paymentMethod: paymentResult.method,
            transactionId: paymentResult.transactionId
        };

        await AccountingDB.add('transactions', transaction);
    }

    async getCompanyInfo() {
        const settings = await AccountingDB.get('settings', 'company');
        return settings?.value || {};
    }

    async getCustomerInfo(customerId) {
        return await AccountingDB.get('customers', customerId);
    }

    async generateQRCode(invoice) {
        const qrData = {
            sellerName: (await this.getCompanyInfo()).name,
            taxNumber: (await this.getCompanyInfo()).taxNumber,
            invoiceDate: invoice.date,
            totalAmount: invoice.total,
            taxAmount: invoice.tax
        };

        return JSON.stringify(qrData);
    }

    async calculateTaxForPeriod(period) {
        const invoices = await AccountingDB.getAll('invoices');
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= new Date(period.startDate) && 
                   invDate <= new Date(period.endDate);
        });

        const totalSales = periodInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalTax = periodInvoices.reduce((sum, inv) => sum + inv.tax, 0);

        return {
            period: period,
            totalSales,
            totalTax,
            invoiceCount: periodInvoices.length,
            taxableAmount: totalSales - totalTax
        };
    }

    // إدارة التكاملات
    async enableIntegration(integrationName, config) {
        AppConfig.integrations[integrationName].enabled = true;
        this.integrations[integrationName] = config;
        
        await this.saveIntegrationSettings();
        await this.initializeIntegrations();

        return true;
    }

    async disableIntegration(integrationName) {
        AppConfig.integrations[integrationName].enabled = false;
        this.integrations[integrationName] = null;
        
        await this.saveIntegrationSettings();
        return true;
    }

    async saveIntegrationSettings() {
        await AccountingDB.update('settings', 'integrations', {
            key: 'integrations',
            value: this.integrations
        });
    }

    // ف