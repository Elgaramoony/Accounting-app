// إدارة الميزانية
const budgetPage = {
    currentBudget: null,
    budgets: [],
    charts: {},

    async init() {
        await this.loadBudgets();
        await this.loadBudgetStats();
        await this.initCharts();
        this.setupEventListeners();
    },

    async loadBudgets() {
        try {
            this.budgets = await AccountingDB.getAll('budgets') || [];
            this.displayBudgets();
        } catch (error) {
            console.error('Error loading budgets:', error);
        }
    },

    async loadBudgetStats() {
        const expenses = await AccountingDB.getAll('expenses') || [];
        const invoices = await AccountingDB.getAll('invoices') || [];
        
        const totalBudget = this.budgets.reduce((sum, budget) => sum + budget.amount, 0);
        const actualExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const actualRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
        
        const variance = totalBudget > 0 ? ((actualExpenses - totalBudget) / totalBudget * 100) : 0;

        document.getElementById('annualBudget').textContent = AccountingUtils.formatCurrency(totalBudget);
        document.getElementById('actualExpenses').textContent = AccountingUtils.formatCurrency(actualExpenses);
        document.getElementById('actualRevenue').textContent = AccountingUtils.formatCurrency(actualRevenue);
        document.getElementById('variance').textContent = variance.toFixed(1) + '%';
    },

    async initCharts() {
        this.initBudgetVsActualChart();
        this.initBudgetDistributionChart();
    },

    initBudgetVsActualChart() {
        const ctx = document.getElementById('budgetVsActualChart').getContext('2d');
        
        this.charts.budgetVsActual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [
                    {
                        label: 'الميزانية',
                        data: [50000, 55000, 60000, 58000, 62000, 65000],
                        backgroundColor: '#3498db'
                    },
                    {
                        label: 'الفعلي',
                        data: [48000, 52000, 58000, 56000, 61000, 63000],
                        backgroundColor: '#2ecc71'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                },
                scales: {
                    x: {
                        reverse: true
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return AccountingUtils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },

    initBudgetDistributionChart() {
        const ctx = document.getElementById('budgetDistributionChart').getContext('2d');
        
        this.charts.budgetDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['رواتب', 'تسويق', 'مصاريف مكتب', 'صيانة', 'أخرى'],
                datasets: [{
                    data: [40, 20, 15, 10, 15],
                    backgroundColor: [
                        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    }
                }
            }
        });
    },

    showTab(tabName) {
        // إخفاء جميع المحتويات
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // إلغاء تنشيط جميع الأزرار
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // إظهار المحتوى المحدد
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // تنشيط الزر المحدد
        document.querySelector(`.tab-btn[onclick="budgetPage.showTab('${tabName}')"]`).classList.add('active');
    },

    createBudget() {
        this.showModal('budgetModal');
    },

    closeModal() {
        document.getElementById('budgetModal').style.display = 'none';
    },

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    },

    async exportBudget() {
        const data = this.prepareExportData();
        const csv = AccountingUtils.convertToCSV(data);
        AccountingUtils.downloadCSV(csv, `budget_${new Date().toISOString().split('T')[0]}.csv`);
        this.showSuccess('تم تصدير بيانات الميزانية');
    },

    prepareExportData() {
        return [
            ['البند', 'الميزانية', 'الفعلي', 'الانحراف', 'النسبة'],
            ['رواتب', '50,000', '48,000', '-2,000', '96%'],
            ['تسويق', '20,000', '22,000', '+2,000', '110%']
        ];
    },

    showSuccess(message) {
        alert(message); // في التطبيق الحقيقي، استخدم نظام الإشعارات
    },

    setupEventListeners() {
        // تحديث البيانات كل 5 دقائق
        setInterval(() => {
            this.loadBudgetStats();
        }, 300000);
    }
};

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    budgetPage.init();
});