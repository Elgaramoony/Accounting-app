// نظام الذكاء الاصطناعي - تصميم نور الجرموني
class AISystem {
    constructor() {
        this.mlModels = {};
        this.predictionHistory = [];
        this.init();
    }

    async init() {
        if (AppConfig.ai.enabled) {
            await this.loadMLModels();
            await this.trainPredictionModels();
        }
    }

    // تحميل نماذج التعلم الآلي
    async loadMLModels() {
        // يمكن تحميل نماذج مسبقة التدريب هنا
        console.log('تحميل نماذج الذكاء الاصطناعي...');
    }

    // تدريب النماذج التنبؤية
    async trainPredictionModels() {
        const historicalData = await this.getHistoricalData();
        
        // تدريب نموذج التنبؤ بالإيرادات
        this.mlModels.revenuePrediction = await this.trainRevenueModel(historicalData);
        
        // تدريب نموذج كشف الشذوذ
        this.mlModels.anomalyDetection = await this.trainAnomalyModel(historicalData);
        
        // تدريب نموذج التصنيف التلقائي
        this.mlModels.autoCategorization = await this.trainCategorizationModel(historicalData);
    }

    // التنبؤ بالإيرادات
    async predictRevenue(period = 'monthly') {
        try {
            const historicalData = await this.getHistoricalData();
            const predictions = [];

            for (let i = 1; i <= 12; i++) {
                const prediction = this.calculateRevenuePrediction(historicalData, i, period);
                predictions.push({
                    period: i,
                    predictedRevenue: prediction,
                    confidence: this.calculateConfidence(historicalData, prediction)
                });
            }

            // حفظ التنبؤات
            await this.savePredictions(predictions, 'revenue');

            return predictions;
        } catch (error) {
            console.error('فشل في التنبؤ بالإيرادات:', error);
            return [];
        }
    }

    // كشف الشذوذ
    async detectAnomalies() {
        try {
            const recentData = await this.getRecentData(30); // آخر 30 يوم
            const anomalies = [];

            // كشف الشذوذ في الفواتير
            const invoiceAnomalies = await this.detectInvoiceAnomalies(recentData.invoices);
            anomalies.push(...invoiceAnomalies);

            // كشف الشذوذ في المصروفات
            const expenseAnomalies = await this.detectExpenseAnomalies(recentData.expenses);
            anomalies.push(...expenseAnomalies);

            // كشف الشذوذ في العملاء
            const customerAnomalies = await this.detectCustomerAnomalies(recentData.customers);
            anomalies.push(...customerAnomalies);

            // حفظ النتائج
            await this.saveAnomalies(anomalies);

            return anomalies;
        } catch (error) {
            console.error('فشل في كشف الشذوذ:', error);
            return [];
        }
    }

    // التصنيف التلقائي
    async autoCategorize(items) {
        try {
            const categorized = [];

            for (const item of items) {
                const category = await this.predictCategory(item);
                categorized.push({
                    ...item,
                    predictedCategory: category,
                    confidence: this.calculateCategoryConfidence(item, category)
                });
            }

            return categorized;
        } catch (error) {
            console.error('فشل في التصنيف التلقائي:', error);
            return items;
        }
    }

    // توليد رؤى ذكية
    async generateInsights() {
        try {
            const insights = [];

            // رؤى الإيرادات
            const revenueInsights = await this.analyzeRevenueTrends();
            insights.push(...revenueInsights);

            // رؤى العملاء
            const customerInsights = await this.analyzeCustomerBehavior();
            insights.push(...customerInsights);

            // رؤى المصروفات
            const expenseInsights = await this.analyzeExpensePatterns();
            insights.push(...expenseInsights);

            // رؤى المخزون
            const inventoryInsights = await this.analyzeInventoryTrends();
            insights.push(...inventoryInsights);

            // حفظ الرؤى
            await this.saveInsights(insights);

            return insights;
        } catch (error) {
            console.error('فشل في توليد الرؤى:', error);
            return [];
        }
    }

    // خدمات مساعدة
    async getHistoricalData(months = 24) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const invoices = await AccountingDB.getAll('invoices');
        const expenses = await AccountingDB.getAll('expenses');
        const customers = await AccountingDB.getAll('customers');

        return {
            invoices: invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate >= startDate && invDate <= endDate;
            }),
            expenses: expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= startDate && expDate <= endDate;
            }),
            customers: customers
        };
    }

    async getRecentData(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const invoices = await AccountingDB.getAll('invoices');
        const expenses = await AccountingDB.getAll('expenses');
        const customers = await AccountingDB.getAll('customers');

        return {
            invoices: invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate >= startDate && invDate <= endDate;
            }),
            expenses: expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= startDate && expDate <= endDate;
            }),
            customers: customers
        };
    }

    // خوارزميات التعلم الآلي
    calculateRevenuePrediction(historicalData, period, type) {
        // تنفيذ خوارزمية التنبؤ بالإيرادات
        const recentRevenue = historicalData.invoices
            .slice(-6)
            .reduce((sum, inv) => sum + inv.total, 0) / 6;

        const growthRate = this.calculateGrowthRate(historicalData.invoices);
        const seasonality = this.calculateSeasonality(historicalData.invoices, period);

        return recentRevenue * (1 + growthRate) * seasonality;
    }

    calculateGrowthRate(invoices) {
        if (invoices.length < 2) return 0;

        const recent = invoices.slice(-6).reduce((sum, inv) => sum + inv.total, 0);
        const previous = invoices.slice(-12, -6).reduce((sum, inv) => sum + inv.total, 0);

        return previous > 0 ? (recent - previous) / previous : 0;
    }

    calculateSeasonality(invoices, period) {
        // حساب العوامل الموسمية
        return 1 + (Math.sin(period * Math.PI / 6) * 0.1); // مثال بسيط
    }

    calculateConfidence(historicalData, prediction) {
        // حساب درجة الثقة في التنبؤ
        const variance = this.calculateVariance(historicalData.invoices);
        return Math.max(0, 1 - variance / prediction);
    }

    calculateVariance(invoices) {
        if (invoices.length < 2) return 0;

        const amounts = invoices.map(inv => inv.total);
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;

        return Math.sqrt(variance);
    }

    async detectInvoiceAnomalies(invoices) {
        const anomalies = [];
        const amounts = invoices.map(inv => inv.total);
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const stdDev = this.calculateStandardDeviation(amounts);

        for (const invoice of invoices) {
            const zScore = Math.abs(invoice.total - mean) / stdDev;
            
            if (zScore > 2) { // أكثر من انحرافين معياريين
                anomalies.push({
                    type: 'invoice',
                    id: invoice.id,
                    severity: zScore > 3 ? 'high' : 'medium',
                    description: `فاتورة غير عادية: ${invoice.invoiceNumber}`,
                    value: invoice.total,
                    zScore: zScore,
                    date: invoice.date
                });
            }
        }

        return anomalies;
    }

    async detectExpenseAnomalies(expenses) {
        const anomalies = [];
        const amounts = expenses.map(exp => exp.amount);
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const stdDev = this.calculateStandardDeviation(amounts);

        for (const expense of expenses) {
            const zScore = Math.abs(expense.amount - mean) / stdDev;
            
            if (zScore > 2) {
                anomalies.push({
                    type: 'expense',
                    id: expense.id,
                    severity: zScore > 3 ? 'high' : 'medium',
                    description: `مصروف غير عادي: ${expense.description}`,
                    value: expense.amount,
                    zScore: zScore,
                    date: expense.date,
                    category: expense.category
                });
            }
        }

        return anomalies;
    }

    async detectCustomerAnomalies(customers) {
        const anomalies = [];
        
        for (const customer of customers) {
            const customerInvoices = await AccountingDB.queryAll('invoices', 'customerId', customer.id);
            
            if (customerInvoices.length > 0) {
                const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
                const avgInvoice = totalSpent / customerInvoices.length;
                
                // كشف العملاء ذوي الإنفاق المرتفع بشكل غير عادي
                if (avgInvoice > this.calculateCustomerSpendingThreshold()) {
                    anomalies.push({
                        type: 'customer',
                        id: customer.id,
                        severity: 'low',
                        description: `عميل مميز: ${customer.name}`,
                        value: totalSpent,
                        metric: 'high_spending',
                        date: new Date().toISOString()
                    });
                }
            }
        }

        return anomalies;
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
        return Math.sqrt(avgSquareDiff);
    }

    calculateCustomerSpendingThreshold() {
        // حساب عتبة الإنفاق للعملاء
        return 10000; // مثال
    }

    async predictCategory(item) {
        // تصنيف تلقائي based on description
        const keywords = {
            'رواتب': ['راتب', 'موظف', 'مرتب'],
            'إيجار': ['إيجار', 'شقة', 'مكتب'],
            'مرافق': ['كهرباء', 'ماء', 'إنترنت', 'هاتف'],
            'تسويق': ['إعلان', 'تسويق', 'حملة', 'وسائل تواصل'],
            'نقل': ['بنزين', 'سيارة', 'تاكسي', 'شحن'],
            'صيانة': ['إصلاح', 'صيانة', 'قطع غيار']
        };

        const description = item.description.toLowerCase();
        
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => description.includes(word))) {
                return category;
            }
        }

        return 'أخرى';
    }

    calculateCategoryConfidence(item, category) {
        // حساب درجة الثقة في التصنيف
        return 0.8; // مثال
    }

    // تحليل الاتجاهات
    async analyzeRevenueTrends() {
        const historicalData = await this.getHistoricalData(12);
        const insights = [];

        const monthlyRevenue = this.groupByMonth(historicalData.invoices);
        const trend = this.calculateTrend(monthlyRevenue);

        if (trend > 0.1) {
            insights.push({
                type: 'positive',
                title: 'نمو إيجابي في الإيرادات',
                description: `الإيرادات في تزايد بمعدل ${(trend * 100).toFixed(1)}% شهرياً`,
                impact: 'high',
                suggestion: 'استمر في الاستراتيجية الحالية'
            });
        } else if (trend < -0.1) {
            insights.push({
                type: 'negative',
                title: 'انخفاض في الإيرادات',
                description: `الإيرادات في انخفاض بمعدل ${(Math.abs(trend) * 100).toFixed(1)}% شهرياً`,
                impact: 'high',
                suggestion: 'راجع استراتيجية المبيعات والتسويق'
            });
        }

        return insights;
    }

    async analyzeCustomerBehavior() {
        const customers = await AccountingDB.getAll('customers');
        const insights = [];

        const newCustomers = customers.filter(cust => {
            const custDate = new Date(cust.createdAt);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return custDate > monthAgo;
        });

        if (newCustomers.length > 10) {
            insights.push({
                type: 'positive',
                title: 'نمو في قاعدة العملاء',
                description: `تم إضافة ${newCustomers.length} عميل جديد هذا الشهر`,
                impact: 'medium',
                suggestion: 'ركز على استبقاء العملاء الجدد'
            });
        }

        return insights;
    }

    async analyzeExpensePatterns() {
        const expenses = await AccountingDB.getAll('expenses');
        const insights = [];

        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const maxCategory = Object.entries(categoryTotals).reduce((max, [cat, total]) => 
            total > max.total ? { category: cat, total } : max, { total: 0 }
        );

        if (maxCategory.total > 10000) {
            insights.push({
                type: 'warning',
                title: 'تركيز في المصروفات',
                description: `أعلى مصروف في ${maxCategory.category} بقيمة ${maxCategory.total} ر.س`,
                impact: 'medium',
                suggestion: 'راجع مصروفات هذا التصنيف'
            });
        }

        return insights;
    }

    async analyzeInventoryTrends() {
        // تحليل اتجاهات المخزون
        return [];
    }

    // تجميع البيانات
    groupByMonth(invoices) {
        const monthly = {};
        
        invoices.forEach(invoice => {
            const date = new Date(invoice.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            if (!monthly[monthKey]) {
                monthly[monthKey] = 0;
            }
            
            monthly[monthKey] += invoice.total;
        });

        return monthly;
    }

    calculateTrend(monthlyData) {
        const values = Object.values(monthlyData);
        if (values.length < 2) return 0;

        const x = Array.from({length: values.length}, (_, i) => i);
        const y = values;

        const slope = this.calculateLinearRegressionSlope(x, y);
        return slope / (y.reduce((sum, val) => sum + val, 0) / y.length);
    }

    calculateLinearRegressionSlope(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // حفظ النتائج
    async savePredictions(predictions, type) {
        const predictionRecord = {
            id: 'pred_' + Date.now(),
            type: type,
            timestamp: new Date().toISOString(),
            predictions: predictions,
            modelVersion: '1.0'
        };

        await AccountingDB.add('predictions', predictionRecord);
        this.predictionHistory.push(predictionRecord);
    }

    async saveAnomalies(anomalies) {
        for (const anomaly of anomalies) {
            await AccountingDB.add('anomalies', {
                ...anomaly,
                id: 'anom_' + Date.now(),
                resolved: false
            });
        }
    }

    async saveInsights(insights) {
        for (const insight of insights) {
            await AccountingDB.add('insights', {
                ...insight,
                id: 'insight_' + Date.now(),
                read: false
            });
        }
    }

    // واجهة المستخدم
    async getDashboardInsights() {
        const insights = await this.generateInsights();
        const predictions = await this.predictRevenue();
        const anomalies = await this.detectAnomalies();

        return {
            insights: insights.slice(0, 5),
            predictions: predictions.slice(0, 6),
            anomalies: anomalies.filter(a => a.severity === 'high').slice(0, 3)
        };
    }
}

// إنشاء نسخة عامة من نظام الذكاء الاصطناعي
window.AISystem = new AISystem();