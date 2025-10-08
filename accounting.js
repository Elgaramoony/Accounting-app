// المحاسبة المتقدمة
const accountingPage = {
    currentStep: 'journal',
    accounts: [],
    journalEntries: [],

    async init() {
        await this.loadAccounts();
        await this.loadJournalEntries();
        this.setupChartOfAccounts();
    },

    async loadAccounts() {
        try {
            this.accounts = await AccountingDB.getAll('accounts') || [];
            if (this.accounts.length === 0) {
                await this.createDefaultAccounts();
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    },

    async createDefaultAccounts() {
        const defaultAccounts = [
            { id: 'acc_1', name: 'النقدية', type: 'asset', code: '101' },
            { id: 'acc_2', name: 'البنك', type: 'asset', code: '102' },
            { id: 'acc_3', name: 'العملاء', type: 'asset', code: '103' },
            { id: 'acc_4', name: 'المخزون', type: 'asset', code: '104' },
            { id: 'acc_5', name: 'الموردون', type: 'liability', code: '201' },
            { id: 'acc_6', name: 'القروض', type: 'liability', code: '202' },
            { id: 'acc_7', name: 'رأس المال', type: 'equity', code: '301' },
            { id: 'acc_8', name: 'الإيرادات', type: 'revenue', code: '401' },
            { id: 'acc_9', name: 'المصروفات', type: 'expense', code: '501' }
        ];

        for (const account of defaultAccounts) {
            await AccountingDB.add('accounts', account);
        }

        this.accounts = defaultAccounts;
    },

    async loadJournalEntries() {
        try {
            this.journalEntries = await AccountingDB.getAll('journal_entries') || [];
            this.displayJournalEntries();
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    },

    displayJournalEntries() {
        const tbody = document.querySelector('#journalTable tbody');
        
        if (this.journalEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="fas fa-book fa-3x mb-3" style="color: #7f8c8d;"></i>
                        <p>لا توجد قيود مسجلة</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.journalEntries.map(entry => `
            <tr>
                <td>${entry.number}</td>
                <td>${AccountingUtils.formatDate(entry.date)}</td>
                <td>${entry.description}</td>
                <td>${this.getAccountName(entry.debitAccount)}</td>
                <td>${AccountingUtils.formatCurrency(entry.debitAmount)}</td>
                <td>${this.getAccountName(entry.creditAccount)}</td>
                <td>${AccountingUtils.formatCurrency(entry.creditAmount)}</td>
                <td>
                    <button class="btn btn-sm" onclick="accountingPage.editJournal('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="accountingPage.deleteJournal('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    getAccountName(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'غير معروف';
    },

    setupChartOfAccounts() {
        const accountsByType = this.groupAccountsByType();
        
        this.displayAccountsSection('assetsAccounts', accountsByType.asset, 'الأصول');
        this.displayAccountsSection('liabilitiesAccounts', accountsByType.liability, 'الخصوم');
        this.displayAccountsSection('revenueAccounts', accountsByType.revenue, 'الإيرادات');
        this.displayAccountsSection('expenseAccounts', accountsByType.expense, 'المصروفات');
    },

    groupAccountsByType() {
        return this.accounts.reduce((groups, account) => {
            if (!groups[account.type]) groups[account.type] = [];
            groups[account.type].push(account);
            return groups;
        }, {});
    },

    displayAccountsSection(containerId, accounts, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = accounts.map(account => `
            <div class="account-item">
                <div class="account-code">${account.code}</div>
                <div class="account-name">${account.name}</div>
                <div class="account-balance">0 ر.س</div>
            </div>
        `).join('');
    },

    showStep(step) {
        // تحديث الخطوات
        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        document.querySelector(`.step[onclick="accountingPage.showStep('${step}')"]`).classList.add('active');

        // تحديث المحتوى
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(step + 'Step').classList.add('active');

        this.currentStep = step;
    },

    showJournalForm() {
        document.getElementById('journalNumber').value = 'J-' + (this.journalEntries.length + 1).toString().padStart(3, '0');
        document.getElementById('journalDate').value = new Date().toISOString().split('T')[0];
        this.showModal('journalModal');
    },

    closeJournalForm() {
        document.getElementById('journalModal').style.display = 'none';
    },

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    },

    async generateFinancialStatements() {
        // توليد القوائم المالية
        const incomeStatement = await this.generateIncomeStatement();
        const balanceSheet = await this.generateBalanceSheet();
        
        this.showSuccess('تم توليد القوائم المالية بنجاح');
    },

    async generateIncomeStatement() {
        // حساب قائمة الدخل
        const revenue = await this.calculateAccountTotal('revenue');
        const expenses = await this.calculateAccountTotal('expense');
        
        return {
            revenue,
            expenses,
            netIncome: revenue - expenses
        };
    },

    async calculateAccountTotal(accountType) {
        const accounts = this.accounts.filter(acc => acc.type === accountType);
        // في التطبيق الحقيقي، سيتم حساب الأرصدة من قيود اليومية
        return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    },

    showSuccess(message) {
        alert(message);
    }
};

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    accountingPage.init();
});