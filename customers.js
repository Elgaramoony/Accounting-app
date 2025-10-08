const customersPage = {
    currentCustomer: null,

    init() {
        this.loadCustomers();
        this.loadCustomerStats();
        this.setupEventListeners();
    },

    loadCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const tbody = document.querySelector('#customersTable tbody');
        tbody.innerHTML = '';

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">لا توجد عملاء</td></tr>';
            return;
        }

        // تطبيق الفلاتر
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredCustomers = customers;
        
        if (statusFilter) {
            filteredCustomers = filteredCustomers.filter(cust => 
                statusFilter === 'active' ? cust.isActive : !cust.isActive
            );
        }

        // ترتيب العملاء أبجدياً
        filteredCustomers.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        filteredCustomers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${customer.name}</strong>
                    ${customer.type ? `<br><small style="color: #666;">${customer.type}</small>` : ''}
                </td>
                <td>${customer.email || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.taxNumber || '-'}</td>
                <td>${this.getCustomerTotalPurchases(customer.id)}</td>
                <td>
                    <span style="color: ${customer.balance < 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                        ${formatCurrency(Math.abs(customer.balance))}
                        ${customer.balance < 0 ? ' (مدين)' : customer.balance > 0 ? ' (دائن)' : ''}
                    </span>
                </td>
                <td><span class="status ${customer.isActive ? 'active' : 'inactive'}">${customer.isActive ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-sm" onclick="customersPage.viewCustomerDetails('${customer.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm" onclick="customersPage.editCustomer('${customer.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="customersPage.deleteCustomer('${customer.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    getCustomerTotalPurchases(customerId) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
        const total = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
        return formatCurrency(total);
    },

    loadCustomerStats() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        
        // إجمالي العملاء
        document.getElementById('totalCustomersCount').textContent = customers.length;
        
        // العملاء النشطين
        const activeCustomers = customers.filter(cust => cust.isActive).length;
        document.getElementById('activeCustomersCount').textContent = activeCustomers;
        
        // إجمالي المدينون
        const totalDebt = customers.reduce((sum, cust) => cust.balance < 0 ? sum + Math.abs(cust.balance) : sum, 0);
        document.getElementById('totalDebt').textContent = formatCurrency(totalDebt);
        
        // متوسط الرصيد
        const totalBalance = customers.reduce((sum, cust) => sum + cust.balance, 0);
        const averageBalance = customers.length > 0 ? totalBalance / customers.length : 0;
        document.getElementById('averageBalance').textContent = formatCurrency(averageBalance);
    },

    showCustomerForm() {
        this.currentCustomer = null;
        document.getElementById('customerModalTitle').textContent = 'عميل جديد';
        document.getElementById('customerForm').reset();
        document.getElementById('customerId').value = '';
        document.getElementById('customerBalance').value = '0';
        document.getElementById('isActive').checked = true;
        document.getElementById('customerModal').style.display = 'flex';
    },

    editCustomer(id) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        this.currentCustomer = customers.find(cust => cust.id === id);
        
        if (!this.currentCustomer) {
            window.accountingApp.showNotification('العميل غير موجود', 'error');
            return;
        }

        document.getElementById('customerModalTitle').textContent = 'تعديل العميل';
        document.getElementById('customerId').value = this.currentCustomer.id;
        document.getElementById('customerName').value = this.currentCustomer.name;
        document.getElementById('customerType').value = this.currentCustomer.type || 'فرد';
        document.getElementById('customerEmail').value = this.currentCustomer.email || '';
        document.getElementById('customerPhone').value = this.currentCustomer.phone || '';
        document.getElementById('taxNumber').value = this.currentCustomer.taxNumber || '';
        document.getElementById('customerBalance').value = this.currentCustomer.balance || 0;
        document.getElementById('customerAddress').value = this.currentCustomer.address || '';
        document.getElementById('customerNotes').value = this.currentCustomer.notes || '';
        document.getElementById('isActive').checked = this.currentCustomer.isActive !== false;

        document.getElementById('customerModal').style.display = 'flex';
    },

    saveCustomer() {
        const form = document.getElementById('customerForm');
        if (!form.checkValidity()) {
            window.accountingApp.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const customerId = document.getElementById('customerId').value;
        const customerData = {
            id: customerId || Date.now().toString(),
            name: document.getElementById('customerName').value,
            type: document.getElementById('customerType').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            taxNumber: document.getElementById('taxNumber').value,
            balance: parseFloat(document.getElementById('customerBalance').value) || 0,
            address: document.getElementById('customerAddress').value,
            notes: document.getElementById('customerNotes').value,
            isActive: document.getElementById('isActive').checked,
            createdAt: customerId ? this.currentCustomer.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        if (customerId) {
            // تحديث العميل الموجود
            const index = customers.findIndex(cust => cust.id === customerId);
            if (index !== -1) {
                customers[index] = customerData;
            }
        } else {
            // إضافة عميل جديد
            customers.push(customerData);
        }

        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تسجيل النشاط
        Auth.logActivity(Auth.getCurrentUser().id, customerId ? 'تحديث عميل' : 'إضافة عميل', 
                        `${customerId ? 'تم تحديث' : 'تم إضافة'} عميل ${customerData.name}`);

        window.accountingApp.showNotification(`تم ${customerId ? 'تحديث' : 'إضافة'} العميل بنجاح`, 'success');
        this.closeCustomerForm();
        this.loadCustomers();
        this.loadCustomerStats();
    },

    deleteCustomer(id) {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم أيضاً حذف جميع الفواتير المرتبطة به.')) {
            return;
        }

        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customerIndex = customers.findIndex(cust => cust.id === id);
        
        if (customerIndex !== -1) {
            const customer = customers[customerIndex];
            
            // حذف الفواتير المرتبطة بالعميل
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const updatedInvoices = invoices.filter(inv => inv.customerId !== id);
            localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
            
            // حذف العميل
            customers.splice(customerIndex, 1);
            localStorage.setItem('customers', JSON.stringify(customers));
            
            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser().id, 'حذف عميل', 
                            `تم حذف عميل ${customer.name} وجميع فواتيره`);
            
            window.accountingApp.showNotification('تم حذف العميل بنجاح', 'success');
            this.loadCustomers();
            this.loadCustomerStats();
            
            // تحديث لوحة التحكم
            if (window.dashboardPage) {
                window.dashboardPage.loadDashboardData();
            }
        }
    },

    viewCustomerDetails(id) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(cust => cust.id === id);
        
        if (!customer) {
            window.accountingApp.showNotification('العميل غير موجود', 'error');
            return;
        }

        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const customerInvoices = invoices.filter(inv => inv.customerId === id);
        
        const totalInvoices = customerInvoices.length;
        const totalAmount = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const paidAmount = customerInvoices.reduce((sum, inv) => sum + inv.paid, 0);
        const balanceAmount = customerInvoices.reduce((sum, inv) => sum + inv.balance, 0);

        document.getElementById('customerDetailsTitle').textContent = `تفاصيل العميل: ${customer.name}`;
        
        const detailsContent = `
            <div class="customer-info">
                <div class="form-row">
                    <div class="form-group">
                        <label>اسم العميل:</label>
                        <p><strong>${customer.name}</strong></p>
                    </div>
                    <div class="form-group">
                        <label>نوع العميل:</label>
                        <p>${customer.type || 'فرد'}</p>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>البريد الإلكتروني:</label>
                        <p>${customer.email || '-'}</p>
                    </div>
                    <div class="form-group">
                        <label>رقم الهاتف:</label>
                        <p>${customer.phone || '-'}</p>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>الرقم الضريبي:</label>
                        <p>${customer.taxNumber || '-'}</p>
                    </div>
                    <div class="form-group">
                        <label>الحالة:</label>
                        <p><span class="status ${customer.isActive ? 'active' : 'inactive'}">${customer.isActive ? 'نشط' : 'غير نشط'}</span></p>
                    </div>
                </div>
                
                ${customer.address ? `
                <div class="form-group">
                    <label>العنوان:</label>
                    <p>${customer.address}</p>
                </div>
                ` : ''}
                
                ${customer.notes ? `
                <div class="form-group">
                    <label>ملاحظات:</label>
                    <p>${customer.notes}</p>
                </div>
                ` : ''}
            </div>

            <div class="customer-stats">
                <div class="stat-card">
                    <div class="stat-value">${totalInvoices}</div>
                    <div class="stat-label">إجمالي الفواتير</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(totalAmount)}</div>
                    <div class="stat-label">إجمالي المشتريات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(paidAmount)}</div>
                    <div class="stat-label">المبلغ المدفوع</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: ${balanceAmount > 0 ? '#e74c3c' : '#27ae60'}">
                        ${formatCurrency(Math.abs(balanceAmount))}
                    </div>
                    <div class="stat-label">${balanceAmount > 0 ? 'مدين' : balanceAmount < 0 ? 'دائن' : 'متوازن'}</div>
                </div>
            </div>

            <div class="table-container">
                <h4>الفواتير الأخيرة</h4>
                <table>
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>الإجمالي</th>
                            <th>المدفوع</th>
                            <th>المتبقي</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerInvoices.slice(0, 5).map(invoice => `
                            <tr>
                                <td>${invoice.invoiceNumber}</td>
                                <td>${formatDate(invoice.date)}</td>
                                <td>${formatDate(invoice.dueDate)}</td>
                                <td>${formatCurrency(invoice.total)}</td>
                                <td>${formatCurrency(invoice.paid)}</td>
                                <td>${formatCurrency(invoice.balance)}</td>
                                <td><span class="status ${invoice.status}">${this.getInvoiceStatusText(invoice.status)}</span></td>
                            </tr>
                        `).join('')}
                        ${customerInvoices.length === 0 ? `
                            <tr>
                                <td colspan="7" style="text-align: center; color: #7f8c8d;">لا توجد فواتير</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('customerDetailsContent').innerHTML = detailsContent;
        document.getElementById('customerDetailsModal').style.display = 'flex';
    },

    getInvoiceStatusText(status) {
        const statusMap = {
            'paid': 'مدفوعة',
            'unpaid': 'غير مدفوعة',
            'partial': 'جزئي'
        };
        return statusMap[status] || status;
    },

    closeCustomerForm() {
        document.getElementById('customerModal').style.display = 'none';
    },

    closeCustomerDetails() {
        document.getElementById('customerDetailsModal').style.display = 'none';
    },

    filterCustomers() {
        this.loadCustomers();
    },

    exportCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const csv = this.convertToCSV(customers);
        this.downloadCSV(csv, 'customers.csv');
    },

    convertToCSV(customers) {
        const headers = ['الاسم', 'النوع', 'البريد الإلكتروني', 'الهاتف', 'الرقم الضريبي', 'الرصيد', 'الحالة'];
        const rows = customers.map(cust => [
            cust.name,
            cust.type || 'فرد',
            cust.email || '',
            cust.phone || '',
            cust.taxNumber || '',
            cust.balance,
            cust.isActive ? 'نشط' : 'غير نشط'
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

    printCustomers() {
        window.print();
    },

    setupEventListeners() {
        // إضافة أي مستمعين إضافيين للأحداث هنا
    }
};