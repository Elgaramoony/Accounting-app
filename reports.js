const reportsPage = {
    charts: {},
    currentReportType: 'financial',

    init() {
        this.setupEventListeners();
        this.loadReports();
    },

    setupEventListeners() {
        document.getElementById('reportPeriod').addEventListener('change', function(e) {
            const customRange = document.getElementById('customDateRange');
            const customRangeEnd = document.getElementById('customDateRangeEnd');
            
            if (e.target.value === 'custom') {
                customRange.style.display = 'block';
                customRangeEnd.style.display = 'block';
                
                // تعيين التواريخ الافتراضية
                const endDate = new Date();
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                
                document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
                document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            } else {
                customRange.style.display = 'none';
                customRangeEnd.style.display = 'none';
            }
        });

        document.getElementById('reportType').addEventListener('change', function(e) {
            reportsPage.currentReportType = e.target.value;
            reportsPage.showReportSection(e.target.value);
        });
    },

    loadReports() {
        this.loadReportStats();
        
        switch (this.currentReportType) {
            case 'financial':
                this.loadFinancialReport();
                break;
            case 'sales':
                this.loadSalesReport();
                break;
            case 'expenses':
                this.loadExpensesReport();
                break;
            case 'customers':
                this.loadCustomersReport();
                break;
            case 'tax':
                this.loadTaxReport();
                break;
        }
    },

    loadReportStats() {
        const period = this.getSelectedPeriod();
        const { startDate, endDate } = period;
        
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        // فلترة البيانات حسب الفترة
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= startDate && invDate <= endDate;
        });
        
        const periodExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && expDate <= endDate;
        });
        
        // حساب الإحصائيات الحالية
        const currentRevenue = periodInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const currentExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const currentProfit = currentRevenue - currentExpenses;
        const currentInvoicesCount = periodInvoices.length;
        
        // حساب الإحصائيات للفترة السابقة
        const previousPeriod = this.getPreviousPeriod(period);
        const previousInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= previousPeriod.startDate && invDate <= previousPeriod.endDate;
        });
        
        const previousExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= previousPeriod.startDate && expDate <= previousPeriod.endDate;
        });
        
        const previousRevenue = previousInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const previousExpenses = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const previousProfit = previousRevenue - previousExpenses;
        const previousInvoicesCount = previousInvoices.length;
        
        // تحديث واجهة المستخدم
        document.getElementById('reportTotalRevenue').textContent = formatCurrency(currentRevenue);
        document.getElementById('reportTotalExpenses').textContent = formatCurrency(currentExpenses);
        document.getElementById('reportNetProfit').textContent = formatCurrency(currentProfit);
        document.getElementById('reportInvoicesCount').textContent = currentInvoicesCount;
        
        // تحديث اتجاهات المؤشرات
        this.updateTrend('revenueTrendReport', currentRevenue, previousRevenue);
        this.updateTrend('expensesTrendReport', currentExpenses, previousExpenses);
        this.updateTrend('profitTrendReport', currentProfit, previousProfit);
        this.updateTrend('invoicesTrendReport', currentInvoicesCount, previousInvoicesCount);
    },

    updateTrend(elementId, current, previous) {
        const element = document.getElementById(elementId);
        const trend = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
        
        element.innerHTML = '';
        
        if (trend > 0) {
            element.className = 'trend up';
            element.innerHTML = `<i class="fas fa-arrow-up"></i> <span>${Math.abs(trend).toFixed(1)}%</span>`;
        } else if (trend < 0) {
            element.className = 'trend down';
            element.innerHTML = `<i class="fas fa-arrow-down"></i> <span>${Math.abs(trend).toFixed(1)}%</span>`;
        } else {
            element.className = 'trend';
            element.innerHTML = `<i class="fas fa-minus"></i> <span>0%</span>`;
        }
    },

    loadFinancialReport() {
        this.initFinancialChart();
        this.initRevenueByCustomerChart();
        this.initExpensesByCategoryChart();
        this.loadFinancialSummary();
    },

    initFinancialChart() {
        const ctx = document.getElementById('financialChart').getContext('2d');
        const period = this.getSelectedPeriod();
        
        if (this.charts.financial) {
            this.charts.financial.destroy();
        }

        const data = this.getFinancialChartData(period);
        const chartType = document.getElementById('financialChartType').value;
        
        this.charts.financial = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'الإيرادات',
                        data: data.revenues,
                        borderColor: '#27ae60',
                        backgroundColor: chartType === 'bar' ? '#27ae60' : 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 2,
                        fill: chartType === 'line',
                        tension: 0.4
                    },
                    {
                        label: 'المصروفات',
                        data: data.expenses,
                        borderColor: '#e74c3c',
                        backgroundColor: chartType === 'bar' ? '#e74c3c' : 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: chartType === 'line',
                        tension: 0.4
                    },
                    {
                        label: 'صافي الربح',
                        data: data.profits,
                        borderColor: '#3498db',
                        backgroundColor: chartType === 'bar' ? '#3498db' : 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: chartType === 'line',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },

    updateFinancialChart() {
        this.initFinancialChart();
    },

    getFinancialChartData(period) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const labels = [];
        const revenues = [];
        const expensesData = [];
        const profits = [];
        
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        
        // تقسيم الفترة إلى أشهر
        const current = new Date(start);
        while (current <= end) {
            const monthName = current.toLocaleDateString('ar-SA', { month: 'long' });
            const year = current.getFullYear();
            labels.push(`${monthName} ${year}`);
            
            // حساب الإيرادات للشهر
            const monthRevenue = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === current.getMonth() && 
                           invDate.getFullYear() === current.getFullYear();
                })
                .reduce((sum, inv) => sum + inv.total, 0);
            revenues.push(monthRevenue);
            
            // حساب المصروفات للشهر
            const monthExpenses = expenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === current.getMonth() && 
                           expDate.getFullYear() === current.getFullYear();
                })
                .reduce((sum, exp) => sum + exp.amount, 0);
            expensesData.push(monthExpenses);
            
            // حساب الأرباح للشهر
            profits.push(monthRevenue - monthExpenses);
            
            current.setMonth(current.getMonth() + 1);
        }
        
        return { labels, revenues, expenses: expensesData, profits };
    },

    initRevenueByCustomerChart() {
        const ctx = document.getElementById('revenueByCustomerChart').getContext('2d');
        const period = this.getSelectedPeriod();
        
        if (this.charts.revenueByCustomer) {
            this.charts.revenueByCustomer.destroy();
        }

        const data = this.getRevenueByCustomerData(period);
        
        this.charts.revenueByCustomer = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
                        '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'left',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    getRevenueByCustomerData(period) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= period.startDate && invDate <= period.endDate;
        });
        
        const customerRevenue = {};
        periodInvoices.forEach(inv => {
            customerRevenue[inv.customerName] = (customerRevenue[inv.customerName] || 0) + inv.total;
        });
        
        // ترتيب العملاء حسب الإيرادات
        const sortedCustomers = Object.entries(customerRevenue)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // أفضل 10 عملاء
        
        return {
            labels: sortedCustomers.map(([name]) => name),
            values: sortedCustomers.map(([, revenue]) => revenue)
        };
    },

    initExpensesByCategoryChart() {
        const ctx = document.getElementById('expensesByCategoryChart').getContext('2d');
        const period = this.getSelectedPeriod();
        
        if (this.charts.expensesByCategory) {
            this.charts.expensesByCategory.destroy();
        }

        const data = this.getExpensesByCategoryData(period);
        
        this.charts.expensesByCategory = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
                        '#1abc9c', '#34495e', '#e67e22', '#95a5a6'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'left',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    getExpensesByCategoryData(period) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const periodExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= period.startDate && expDate <= period.endDate;
        });
        
        const categoryTotals = {};
        periodExpenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        return {
            labels: Object.keys(categoryTotals),
            values: Object.values(categoryTotals)
        };
    },

    loadFinancialSummary() {
        const period = this.getSelectedPeriod();
        const previousPeriod = this.getPreviousPeriod(period);
        
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        // البيانات الحالية
        const currentInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= period.startDate && invDate <= period.endDate;
        });
        
        const currentExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= period.startDate && expDate <= period.endDate;
        });
        
        // البيانات السابقة
        const previousInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= previousPeriod.startDate && invDate <= previousPeriod.endDate;
        });
        
        const previousExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= previousPeriod.startDate && expDate <= previousPeriod.endDate;
        });
        
        // الحسابات
        const currentRevenue = currentInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const previousRevenue = previousInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const revenueChange = currentRevenue - previousRevenue;
        const revenueChangePercent = previousRevenue !== 0 ? (revenueChange / previousRevenue) * 100 : 0;
        
        const currentExpensesTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const previousExpensesTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const expensesChange = currentExpensesTotal - previousExpensesTotal;
        const expensesChangePercent = previousExpensesTotal !== 0 ? (expensesChange / previousExpensesTotal) * 100 : 0;
        
        const currentProfit = currentRevenue - currentExpensesTotal;
        const previousProfit = previousRevenue - previousExpensesTotal;
        const profitChange = currentProfit - previousProfit;
        const profitChangePercent = previousProfit !== 0 ? (profitChange / previousProfit) * 100 : 0;
        
        const currentInvoicesCount = currentInvoices.length;
        const previousInvoicesCount = previousInvoices.length;
        const invoicesChange = currentInvoicesCount - previousInvoicesCount;
        const invoicesChangePercent = previousInvoicesCount !== 0 ? (invoicesChange / previousInvoicesCount) * 100 : 0;
        
        // تحديث الجدول
        const tbody = document.querySelector('#financialSummary tbody');
        tbody.innerHTML = `
            <tr>
                <td>الإيرادات</td>
                <td>${formatCurrency(currentRevenue)}</td>
                <td>${formatCurrency(previousRevenue)}</td>
                <td style="color: ${revenueChange >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${revenueChange >= 0 ? '+' : ''}${formatCurrency(revenueChange)}
                </td>
                <td style="color: ${revenueChangePercent >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${revenueChangePercent >= 0 ? '+' : ''}${revenueChangePercent.toFixed(1)}%
                </td>
            </tr>
            <tr>
                <td>المصروفات</td>
                <td>${formatCurrency(currentExpensesTotal)}</td>
                <td>${formatCurrency(previousExpensesTotal)}</td>
                <td style="color: ${expensesChange <= 0 ? '#27ae60' : '#e74c3c'}">
                    ${expensesChange >= 0 ? '+' : ''}${formatCurrency(expensesChange)}
                </td>
                <td style="color: ${expensesChangePercent <= 0 ? '#27ae60' : '#e74c3c'}">
                    ${expensesChangePercent >= 0 ? '+' : ''}${expensesChangePercent.toFixed(1)}%
                </td>
            </tr>
            <tr>
                <td>صافي الربح</td>
                <td>${formatCurrency(currentProfit)}</td>
                <td>${formatCurrency(previousProfit)}</td>
                <td style="color: ${profitChange >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${profitChange >= 0 ? '+' : ''}${formatCurrency(profitChange)}
                </td>
                <td style="color: ${profitChangePercent >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${profitChangePercent >= 0 ? '+' : ''}${profitChangePercent.toFixed(1)}%
                </td>
            </tr>
            <tr>
                <td>عدد الفواتير</td>
                <td>${currentInvoicesCount}</td>
                <td>${previousInvoicesCount}</td>
                <td style="color: ${invoicesChange >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${invoicesChange >= 0 ? '+' : ''}${invoicesChange}
                </td>
                <td style="color: ${invoicesChangePercent >= 0 ? '#27ae60' : '#e74c3c'}">
                    ${invoicesChangePercent >= 0 ? '+' : ''}${invoicesChangePercent.toFixed(1)}%
                </td>
            </tr>
        `;
    },

    loadSalesReport() {
        this.initSalesChart();
        this.loadTopCustomers();
        this.loadInvoicesByStatus();
    },

    loadExpensesReport() {
        this.initExpensesAnalysisChart();
        this.loadExpensesDetail();
    },

    loadCustomersReport() {
        this.initCustomersChart();
        this.loadCustomersBalance();
        this.loadCustomersActivity();
    },

    loadTaxReport() {
        this.loadTaxSummary();
        this.loadTaxDetail();
    },

    showReportSection(section) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.report-section').forEach(el => {
            el.style.display = 'none';
        });
        
        // إظهار القسم المحدد
        document.getElementById(section + 'Report').style.display = 'block';
    },

    getSelectedPeriod() {
        const period = document.getElementById('reportPeriod').value;
        
        if (period === 'custom') {
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(document.getElementById('endDate').value);
            return { startDate, endDate };
        }
        
        const days = parseInt(period);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return { startDate, endDate };
    },

    getPreviousPeriod(currentPeriod) {
        const duration = currentPeriod.endDate - currentPeriod.startDate;
        const startDate = new Date(currentPeriod.startDate);
        const endDate = new Date(currentPeriod.endDate);
        
        startDate.setDate(startDate.getDate() - duration / (1000 * 60 * 60 * 24));
        endDate.setDate(endDate.getDate() - duration / (1000 * 60 * 60 * 24));
        
        return { startDate, endDate };
    },

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const period = document.getElementById('reportPeriod').value;
        
        let reportData = '';
        let filename = '';
        
        switch (reportType) {
            case 'financial':
                reportData = this.generateFinancialReport();
                filename = `financial_report_${period}_days.csv`;
                break;
            case 'sales':
                reportData = this.generateSalesReport();
                filename = `sales_report_${period}_days.csv`;
                break;
            case 'expenses':
                reportData = this.generateExpensesReport();
                filename = `expenses_report_${period}_days.csv`;
                break;
            case 'customers':
                reportData = this.generateCustomersReport();
                filename = `customers_report_${period}_days.csv`;
                break;
            case 'tax':
                reportData = this.generateTaxReport();
                filename = `tax_report_${period}_days.csv`;
                break;
        }
        
        this.downloadCSV(reportData, filename);
        window.accountingApp.showNotification('تم تصدير التقرير بنجاح', 'success');
    },

    generateFinancialReport() {
        const period = this.getSelectedPeriod();
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= period.startDate && invDate <= period.endDate;
        });
        
        const periodExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= period.startDate && expDate <= period.endDate;
        });
        
        const revenue = periodInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const expensesTotal = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const profit = revenue - expensesTotal;
        
        const headers = ['البند', 'القيمة'];
        const rows = [
            ['الإيرادات', revenue],
            ['المصروفات', expensesTotal],
            ['صافي الربح', profit],
            ['عدد الفواتير', periodInvoices.length],
            ['عدد المصروفات', periodExpenses.length],
            ['متوسط الفاتورة', periodInvoices.length > 0 ? revenue / periodInvoices.length : 0],
            ['هامش الربح', revenue > 0 ? (profit / revenue) * 100 : 0]
        ];
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    generateSalesReport() {
        const period = this.getSelectedPeriod();
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= period.startDate && invDate <= period.endDate;
        });
        
        const headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة'];
        const rows = periodInvoices.map(inv => [
            inv.invoiceNumber,
            inv.customerName,
            formatDate(inv.date),
            inv.total,
            inv.paid,
            inv.balance,
            inv.status
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    generateExpensesReport() {
        const period = this.getSelectedPeriod();
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const periodExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= period.startDate && expDate <= period.endDate;
        });
        
        const headers = ['التاريخ', 'التصنيف', 'الوصف', 'المورد', 'طريقة الدفع', 'المبلغ'];
        const rows = periodExpenses.map(exp => [
            formatDate(exp.date),
            exp.category,
            exp.description,
            exp.vendor || '',
            exp.paymentMethod,
            exp.amount
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    generateCustomersReport() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        
        const headers = ['اسم العميل', 'البريد الإلكتروني', 'الهاتف', 'إجمالي المشتريات', 'المدفوع', 'الرصيد', 'الحالة'];
        const rows = customers.map(cust => {
            const customerInvoices = invoices.filter(inv => inv.customerId === cust.id);
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
            const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paid, 0);
            const balance = totalPurchases - totalPaid;
            
            return [
                cust.name,
                cust.email || '',
                cust.phone || '',
                totalPurchases,
                totalPaid,
                balance,
                cust.isActive ? 'نشط' : 'غير نشط'
            ];
        });
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    generateTaxReport() {
        const period = this.getSelectedPeriod();
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        
        const periodInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= period.startDate && invDate <= period.endDate;
        });
        
        const totalTax = periodInvoices.reduce((sum, inv) => sum + inv.tax, 0);
        const totalRevenue = periodInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        const headers = ['الفترة', 'الإيرادات', 'الضريبة', 'نسبة الضريبة'];
        const rows = [
            [
                `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
                totalRevenue,
                totalTax,
                totalRevenue > 0 ? (totalTax / totalRevenue * 100).toFixed(2) + '%' : '0%'
            ]
        ];
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // الدوال الأخرى للتقارير المختلفة
    initSalesChart() {
        // تنفيذ مخطط المبيعات
    },

    initExpensesAnalysisChart() {
        // تنفيذ مخطط تحليل المصروفات
    },

    initCustomersChart() {
        // تنفيذ مخطط العملاء
    },

    loadTopCustomers() {
        // تحميل أفضل العملاء
    },

    loadInvoicesByStatus() {
        // تحميل الفواتير حسب الحالة
    },

    loadExpensesDetail() {
        // تحميل تفاصيل المصروفات
    },

    loadCustomersBalance() {
        // تحميل أرصدة العملاء
    },

    loadCustomersActivity() {
        // تحميل أنشطة العملاء
    },

    loadTaxSummary() {
        // تحميل ملخص الضرائب
    },

    loadTaxDetail() {
        // تحميل تفاصيل الضرائب
    }
};