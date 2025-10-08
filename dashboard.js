const dashboardPage = {
    chart: null,

    init() {
        this.loadUserInfo();
        this.loadDashboardData();
        this.setupEventListeners();
    },

    loadUserInfo() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.companyName || 'مدير النظام';
            document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'User';
            document.getElementById('sidebarCompanyName').textContent = user.companyName || 'شركتي';
            
            // إنشاء الأحرف الأولى للصورة الرمزية
            const initials = user.companyName ? user.companyName.split(' ').map(n => n[0]).join('') : 'AD';
            document.getElementById('userAvatar').textContent = initials.substring(0, 2).toUpperCase();
        }
    },

    loadDashboardData() {
        this.loadStatistics();
        this.loadRecentInvoices();
        this.loadRecentExpenses();
        this.loadRecentActivities();
        this.initCharts();
    },

    loadStatistics() {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');

        // حساب الإحصائيات الحالية
        const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        // حساب الإحصائيات للشهر السابق (محاكاة)
        const previousRevenue = totalRevenue * 0.85;
        const previousExpenses = totalExpenses * 0.90;
        const previousProfit = previousRevenue - previousExpenses;
        const previousCustomers = Math.max(0, customers.length - 2);

        // حساب النسب المئوية للتغير
        const revenueTrend = ((totalRevenue - previousRevenue) / previousRevenue * 100) || 0;
        const expensesTrend = ((totalExpenses - previousExpenses) / previousExpenses * 100) || 0;
        const profitTrend = ((netProfit - previousProfit) / Math.abs(previousProfit) * 100) || 0;
        const customersTrend = ((customers.length - previousCustomers) / previousCustomers * 100) || 0;

        // تحديث واجهة المستخدم
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('netProfit').textContent = formatCurrency(netProfit);
        document.getElementById('totalCustomers').textContent = customers.length;

        // تحديث اتجاهات المؤشرات
        this.updateTrend('revenueTrend', revenueTrend);
        this.updateTrend('expensesTrend', expensesTrend);
        this.updateTrend('profitTrend', profitTrend);
        this.updateTrend('customersTrend', customersTrend);
    },

    updateTrend(elementId, trend) {
        const element = document.getElementById(elementId);
        const trendElement = element.closest('.trend');
        
        element.textContent = Math.abs(trend).toFixed(1) + '%';
        
        if (trend > 0) {
            trendElement.className = 'trend up';
            trendElement.innerHTML = `<i class="fas fa-arrow-up"></i> <span>${Math.abs(trend).toFixed(1)}%</span>`;
        } else if (trend < 0) {
            trendElement.className = 'trend down';
            trendElement.innerHTML = `<i class="fas fa-arrow-down"></i> <span>${Math.abs(trend).toFixed(1)}%</span>`;
        } else {
            trendElement.className = 'trend';
            trendElement.innerHTML = `<i class="fas fa-minus"></i> <span>0%</span>`;
        }
    },

    loadRecentInvoices() {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const tbody = document.querySelector('#recentInvoices tbody');
        tbody.innerHTML = '';

        const recentInvoices = invoices
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #7f8c8d;">لا توجد فواتير</td></tr>';
            return;
        }

        recentInvoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="#" onclick="invoicesPage.viewInvoice('${invoice.id}')" style="color: var(--primary-color); text-decoration: none;">${invoice.invoiceNumber}</a></td>
                <td>${invoice.customerName}</td>
                <td>${formatDate(invoice.date)}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td><span class="status ${invoice.status}">${this.getStatusText(invoice.status)}</span></td>
            `;
            tbody.appendChild(row);
        });
    },

    loadRecentExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const tbody = document.querySelector('#recentExpenses tbody');
        tbody.innerHTML = '';

        const recentExpenses = expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentExpenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #7f8c8d;">لا توجد مصروفات</td></tr>';
            return;
        }

        recentExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>${formatDate(expense.date)}</td>
                <td>${formatCurrency(expense.amount)}</td>
            `;
            tbody.appendChild(row);
        });
    },

    loadRecentActivities() {
        const activities = Auth.getActivities(10);
        const tbody = document.querySelector('#recentActivities tbody');
        tbody.innerHTML = '';

        if (activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #7f8c8d;">لا توجد نشاطات</td></tr>';
            return;
        }

        activities.forEach(activity => {
            const date = new Date(activity.timestamp);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.action}</td>
                <td>${activity.description}</td>
                <td>${date.toLocaleDateString('ar-SA')}</td>
                <td>${date.toLocaleTimeString('ar-SA')}</td>
            `;
            tbody.appendChild(row);
        });
    },

    getStatusText(status) {
        const statusMap = {
            'paid': 'مدفوعة',
            'unpaid': 'غير مدفوعة',
            'partial': 'جزئي'
        };
        return statusMap[status] || status;
    },

    initCharts() {
        this.initRevenueExpenseChart();
    },

    initRevenueExpenseChart() {
        const ctx = document.getElementById('revenueExpenseChart').getContext('2d');
        const period = parseInt(document.getElementById('chartPeriod').value) || 6;
        
        if (this.chart) {
            this.chart.destroy();
        }

        const data = this.getChartData(period);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'الإيرادات',
                        data: data.revenues,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'المصروفات',
                        data: data.expenses,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
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

    getChartData(months) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const labels = [];
        const revenues = [];
        const expensesData = [];
        
        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('ar-SA', { month: 'long' });
            const year = date.getFullYear();
            labels.push(`${monthName} ${year}`);
            
            // حساب الإيرادات للشهر
            const monthRevenue = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === date.getMonth() && 
                           invDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, inv) => sum + inv.total, 0);
            revenues.push(monthRevenue);
            
            // حساب المصروفات للشهر
            const monthExpenses = expenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === date.getMonth() && 
                           expDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, exp) => sum + exp.amount, 0);
            expensesData.push(monthExpenses);
        }
        
        return { labels, revenues, expenses: expensesData };
    },

    setupEventListeners() {
        document.getElementById('chartPeriod').addEventListener('change', (e) => {
            this.initRevenueExpenseChart();
        });
    }
};