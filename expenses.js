const expensesPage = {
    currentExpense: null,
    analysisChart: null,

    init() {
        this.loadExpenses();
        this.loadExpenseStats();
        this.setupEventListeners();
    },

    loadExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const tbody = document.querySelector('#expensesTable tbody');
        tbody.innerHTML = '';

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">لا توجد مصروفات</td></tr>';
            return;
        }

        // تطبيق الفلاتر
        const categoryFilter = document.getElementById('categoryFilter').value;
        const dateFilter = document.getElementById('expenseDateFilter').value;
        
        let filteredExpenses = expenses;
        
        if (categoryFilter) {
            filteredExpenses = filteredExpenses.filter(exp => exp.category === categoryFilter);
        }
        
        if (dateFilter) {
            filteredExpenses = filteredExpenses.filter(exp => {
                const expenseDate = new Date(exp.date);
                const filterDate = new Date(dateFilter);
                return expenseDate.getMonth() === filterDate.getMonth() && 
                       expenseDate.getFullYear() === filterDate.getFullYear();
            });
        }

        // ترتيب المصروفات من الأحدث إلى الأقدم
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>
                    <span class="status" style="background: ${this.getCategoryColor(expense.category)}">
                        ${expense.category}
                    </span>
                </td>
                <td>${expense.description}</td>
                <td>${expense.vendor || '-'}</td>
                <td>${expense.paymentMethod}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <span class="status ${expense.isRecurring ? 'active' : 'inactive'}">
                        ${expense.isRecurring ? 'نعم' : 'لا'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-sm" onclick="expensesPage.editExpense('${expense.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="expensesPage.deleteExpense('${expense.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    loadExpenseStats() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        // إجمالي المصروفات
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('totalExpensesAmount').textContent = formatCurrency(totalExpenses);
        
        // مصروفات هذا الشهر
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyExpenses = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
        
        // أعلى تصنيف
        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        let topCategory = '-';
        let maxAmount = 0;
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                topCategory = category;
            }
        }
        document.getElementById('topCategory').textContent = topCategory;
        
        // متوسط المصروفات
        const averageExpenses = expenses.length > 0 ? totalExpenses / expenses.length : 0;
        document.getElementById('averageExpenses').textContent = formatCurrency(averageExpenses);
    },

    getCategoryColor(category) {
        const colors = {
            'رواتب': '#e74c3c',
            'إيجار': '#3498db',
            'مرافق': '#2ecc71',
            'تسويق': '#f39c12',
            'نقل': '#9b59b6',
            'صيانة': '#1abc9c',
            'مصاريف مكتب': '#34495e',
            'ضرائب': '#e67e22',
            'أخرى': '#95a5a6'
        };
        return colors[category] || '#95a5a6';
    },

    showExpenseForm() {
        this.currentExpense = null;
        document.getElementById('expenseModalTitle').textContent = 'مصروف جديد';
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseId').value = '';
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('expenseModal').style.display = 'flex';
    },

    editExpense(id) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        this.currentExpense = expenses.find(exp => exp.id === id);
        
        if (!this.currentExpense) {
            window.accountingApp.showNotification('المصروف غير موجود', 'error');
            return;
        }

        document.getElementById('expenseModalTitle').textContent = 'تعديل المصروف';
        document.getElementById('expenseId').value = this.currentExpense.id;
        document.getElementById('expenseDate').value = this.currentExpense.date.split('T')[0];
        document.getElementById('expenseCategory').value = this.currentExpense.category;
        document.getElementById('expenseDescription').value = this.currentExpense.description;
        document.getElementById('expenseAmount').value = this.currentExpense.amount;
        document.getElementById('paymentMethod').value = this.currentExpense.paymentMethod;
        document.getElementById('vendor').value = this.currentExpense.vendor || '';
        document.getElementById('reference').value = this.currentExpense.reference || '';
        document.getElementById('expenseNotes').value = this.currentExpense.notes || '';
        document.getElementById('isRecurring').checked = this.currentExpense.isRecurring || false;

        document.getElementById('expenseModal').style.display = 'flex';
    },

    saveExpense() {
        const form = document.getElementById('expenseForm');
        if (!form.checkValidity()) {
            window.accountingApp.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const expenseId = document.getElementById('expenseId').value;
        const expenseData = {
            id: expenseId || Date.now().toString(),
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            paymentMethod: document.getElementById('paymentMethod').value,
            vendor: document.getElementById('vendor').value,
            reference: document.getElementById('reference').value,
            notes: document.getElementById('expenseNotes').value,
            isRecurring: document.getElementById('isRecurring').checked,
            createdAt: expenseId ? this.currentExpense.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        if (expenseId) {
            // تحديث المصروف الموجود
            const index = expenses.findIndex(exp => exp.id === expenseId);
            if (index !== -1) {
                expenses[index] = expenseData;
            }
        } else {
            // إضافة مصروف جديد
            expenses.push(expenseData);
        }

        localStorage.setItem('expenses', JSON.stringify(expenses));
        
        // تسجيل النشاط
        Auth.logActivity(Auth.getCurrentUser().id, expenseId ? 'تحديث مصروف' : 'إضافة مصروف', 
                        `${expenseId ? 'تم تحديث' : 'تم إضافة'} مصروف ${expenseData.description} بقيمة ${formatCurrency(expenseData.amount)}`);

        window.accountingApp.showNotification(`تم ${expenseId ? 'تحديث' : 'إضافة'} المصروف بنجاح`, 'success');
        this.closeExpenseForm();
        this.loadExpenses();
        this.loadExpenseStats();
        
        // تحديث لوحة التحكم إذا كانت مفتوحة
        if (window.dashboardPage) {
            window.dashboardPage.loadDashboardData();
        }
    },

    deleteExpense(id) {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            return;
        }

        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const expenseIndex = expenses.findIndex(exp => exp.id === id);
        
        if (expenseIndex !== -1) {
            const expense = expenses[expenseIndex];
            expenses.splice(expenseIndex, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            
            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser().id, 'حذف مصروف', 
                            `تم حذف مصروف ${expense.description} بقيمة ${formatCurrency(expense.amount)}`);
            
            window.accountingApp.showNotification('تم حذف المصروف بنجاح', 'success');
            this.loadExpenses();
            this.loadExpenseStats();
            
            // تحديث لوحة التحكم
            if (window.dashboardPage) {
                window.dashboardPage.loadDashboardData();
            }
        }
    },

    closeExpenseForm() {
        document.getElementById('expenseModal').style.display = 'none';
    },

    filterExpenses() {
        this.loadExpenses();
    },

    exportExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const csv = this.convertToCSV(expenses);
        this.downloadCSV(csv, 'expenses.csv');
    },

    convertToCSV(expenses) {
        const headers = ['التاريخ', 'التصنيف', 'الوصف', 'المورد', 'طريقة الدفع', 'المبلغ', 'مصروف متكرر'];
        const rows = expenses.map(exp => [
            formatDate(exp.date),
            exp.category,
            exp.description,
            exp.vendor || '',
            exp.paymentMethod,
            exp.amount,
            exp.isRecurring ? 'نعم' : 'لا'
        ]);
        
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

    printExpenses() {
        window.print();
    },

    showAnalysis() {
        this.loadExpenseAnalysis();
        document.getElementById('analysisModal').style.display = 'flex';
    },

    loadExpenseAnalysis() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        // تجميع البيانات حسب التصنيف
        const categoryData = {};
        expenses.forEach(exp => {
            categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
        });

        // إعداد الرسم البياني
        const ctx = document.getElementById('expenseAnalysisChart').getContext('2d');
        
        if (this.analysisChart) {
            this.analysisChart.destroy();
        }

        this.analysisChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: Object.keys(categoryData).map(cat => this.getCategoryColor(cat)),
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

        // تحديث جدول الملخص
        this.updateCategorySummary(categoryData);
    },

    updateCategorySummary(categoryData) {
        const tbody = document.querySelector('#categorySummary tbody');
        tbody.innerHTML = '';

        const total = Object.values(categoryData).reduce((sum, amount) => sum + amount, 0);
        const sortedCategories = Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a);

        sortedCategories.forEach(([category, amount]) => {
            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="status" style="background: ${this.getCategoryColor(category)}">
                        ${category}
                    </span>
                </td>
                <td>${formatCurrency(amount)}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
    },

    closeAnalysis() {
        document.getElementById('analysisModal').style.display = 'none';
    },

    setupEventListeners() {
        // إضافة زر التحليل إلى واجهة المستخدم
        const filterBar = document.querySelector('.filter-bar');
        const analysisBtn = document.createElement('button');
        analysisBtn.className = 'btn btn-success';
        analysisBtn.innerHTML = '<i class="fas fa-chart-pie"></i> تحليل المصروفات';
        analysisBtn.onclick = () => this.showAnalysis();
        filterBar.appendChild(analysisBtn);
    }
};