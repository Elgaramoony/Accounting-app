const invoicesPage = {
    currentInvoice: null,

    init() {
        this.loadInvoices();
        this.loadCustomers();
        this.loadProducts();
        this.setupEventListeners();
    },

    loadInvoices() {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const tbody = document.querySelector('#invoicesTable tbody');
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #7f8c8d;">لا توجد فواتير</td></tr>';
            return;
        }

        // تطبيق الفلاتر
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let filteredInvoices = invoices;
        
        if (statusFilter) {
            filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
        }
        
        if (dateFilter) {
            filteredInvoices = filteredInvoices.filter(inv => {
                const invoiceDate = new Date(inv.date);
                const filterDate = new Date(dateFilter);
                return invoiceDate.getMonth() === filterDate.getMonth() && 
                       invoiceDate.getFullYear() === filterDate.getFullYear();
            });
        }

        // ترتيب الفواتير من الأحدث إلى الأقدم
        filteredInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredInvoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customerName}</td>
                <td>${formatDate(invoice.date)}</td>
                <td>${formatDate(invoice.dueDate)}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td>${formatCurrency(invoice.paid)}</td>
                <td>${formatCurrency(invoice.balance)}</td>
                <td><span class="status ${invoice.status}">${this.getStatusText(invoice.status)}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-sm" onclick="invoicesPage.viewInvoice('${invoice.id}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm" onclick="invoicesPage.editInvoice('${invoice.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${invoice.balance > 0 ? `
                        <button class="btn btn-success btn-sm" onclick="invoicesPage.showPaymentForm('${invoice.id}')" title="تسديد">
                            <i class="fas fa-money-bill"></i>
                        </button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" onclick="invoicesPage.deleteInvoice('${invoice.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    loadCustomers() {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const select = document.getElementById('customerSelect');
        select.innerHTML = '<option value="">اختر العميل</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    },

    loadProducts() {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const selects = document.querySelectorAll('.product-select');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">اختر منتج</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                option.setAttribute('data-price', product.price);
                option.setAttribute('data-description', product.description);
                select.appendChild(option);
            });
        });
    },

    showInvoiceForm() {
        this.currentInvoice = null;
        document.getElementById('invoiceModalTitle').textContent = 'فاتورة جديدة';
        document.getElementById('invoiceForm').reset();
        document.getElementById('invoiceId').value = '';
        document.getElementById('invoiceNumber').value = generateInvoiceNumber();
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        
        // تاريخ الاستحقاق بعد 30 يوم
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
        
        // إعادة تعليم عناصر الفاتورة
        const tbody = document.querySelector('#invoiceItems tbody');
        tbody.innerHTML = '';
        this.addItem();
        
        this.calculateTotals();
        document.getElementById('invoiceModal').style.display = 'flex';
    },

    addItem() {
        const tbody = document.querySelector('#invoiceItems tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="product-select" onchange="invoicesPage.onProductChange(this)">
                    <option value="">اختر منتج</option>
                </select>
            </td>
            <td><input type="text" class="item-description" placeholder="الوصف"></td>
            <td><input type="number" class="item-quantity" value="1" min="1" onchange="invoicesPage.calculateItemTotal(this)"></td>
            <td><input type="number" class="item-price" step="0.01" onchange="invoicesPage.calculateItemTotal(this)"></td>
            <td class="item-total">0.00</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="invoicesPage.removeItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        this.loadProducts(); // إعادة تحميل المنتجات في العنصر الجديد
    },

    removeItem(button) {
        const row = button.closest('tr');
        if (document.querySelectorAll('#invoiceItems tbody tr').length > 1) {
            row.remove();
            this.calculateTotals();
        } else {
            window.accountingApp.showNotification('يجب أن تحتوي الفاتورة على عنصر واحد على الأقل', 'warning');
        }
    },

    onProductChange(select) {
        const selectedOption = select.options[select.selectedIndex];
        const row = select.closest('tr');
        
        if (selectedOption.value) {
            const price = selectedOption.getAttribute('data-price');
            const description = selectedOption.getAttribute('data-description');
            
            row.querySelector('.item-price').value = price;
            row.querySelector('.item-description').value = description || '';
            
            this.calculateItemTotal(select);
        }
    },

    calculateItemTotal(input) {
        const row = input.closest('tr');
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        row.querySelector('.item-total').textContent = total.toFixed(2);
        this.calculateTotals();
    },

    calculateTotals() {
        let subtotal = 0;
        const rows = document.querySelectorAll('#invoiceItems tbody tr');
        
        rows.forEach(row => {
            const total = parseFloat(row.querySelector('.item-total').textContent) || 0;
            subtotal += total;
        });
        
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        const taxRate = settings.taxRate || 15;
        const taxAmount = subtotal * (taxRate / 100);
        const totalAmount = subtotal + taxAmount;
        
        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
        document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    },

    onCustomerChange() {
        // يمكن إضافة منطق إضافي عند تغيير العميل
    },

    saveInvoice() {
        const form = document.getElementById('invoiceForm');
        if (!form.checkValidity()) {
            window.accountingApp.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const invoiceId = document.getElementById('invoiceId').value;
        const customerSelect = document.getElementById('customerSelect');
        const customerId = customerSelect.value;
        const customerName = customerSelect.options[customerSelect.selectedIndex].text;

        // جمع عناصر الفاتورة
        const items = [];
        const rows = document.querySelectorAll('#invoiceItems tbody tr');
        
        rows.forEach(row => {
            const productSelect = row.querySelector('.product-select');
            const productId = productSelect.value;
            const productName = productSelect.options[productSelect.selectedIndex].text;
            const description = row.querySelector('.item-description').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value);
            const price = parseFloat(row.querySelector('.item-price').value);
            const total = parseFloat(row.querySelector('.item-total').textContent);
            
            if (productId && quantity > 0 && price > 0) {
                items.push({
                    productId,
                    name: productName,
                    description,
                    quantity,
                    price,
                    total
                });
            }
        });

        if (items.length === 0) {
            window.accountingApp.showNotification('يجب إضافة عنصر واحد على الأقل للفاتورة', 'error');
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        const taxRate = settings.taxRate || 15;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;

        const invoiceData = {
            id: invoiceId || Date.now().toString(),
            invoiceNumber: document.getElementById('invoiceNumber').value,
            customerId,
            customerName,
            date: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            items,
            subtotal,
            tax,
            total,
            paid: 0,
            balance: total,
            status: 'unpaid',
            notes: document.getElementById('invoiceNotes').value,
            createdAt: invoiceId ? this.currentInvoice.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        
        if (invoiceId) {
            // تحديث الفاتورة الموجودة
            const index = invoices.findIndex(inv => inv.id === invoiceId);
            if (index !== -1) {
                invoices[index] = invoiceData;
            }
        } else {
            // إضافة فاتورة جديدة
            invoices.push(invoiceData);
        }

        localStorage.setItem('invoices', JSON.stringify(invoices));
        
        // تسجيل النشاط
        Auth.logActivity(Auth.getCurrentUser().id, invoiceId ? 'تحديث فاتورة' : 'إنشاء فاتورة', 
                        `${invoiceId ? 'تم تحديث' : 'تم إنشاء'} فاتورة ${invoiceData.invoiceNumber}`);

        window.accountingApp.showNotification(`تم ${invoiceId ? 'تحديث' : 'إنشاء'} الفاتورة بنجاح`, 'success');
        this.closeInvoiceForm();
        this.loadInvoices();
        
        // تحديث لوحة التحكم إذا كانت مفتوحة
        if (window.dashboardPage) {
            window.dashboardPage.loadDashboardData();
        }
    },

    editInvoice(id) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        this.currentInvoice = invoices.find(inv => inv.id === id);
        
        if (!this.currentInvoice) {
            window.accountingApp.showNotification('الفاتورة غير موجودة', 'error');
            return;
        }

        document.getElementById('invoiceModalTitle').textContent = 'تعديل الفاتورة';
        document.getElementById('invoiceId').value = this.currentInvoice.id;
        document.getElementById('invoiceNumber').value = this.currentInvoice.invoiceNumber;
        document.getElementById('invoiceDate').value = this.currentInvoice.date.split('T')[0];
        document.getElementById('dueDate').value = this.currentInvoice.dueDate.split('T')[0];
        document.getElementById('customerSelect').value = this.currentInvoice.customerId;
        document.getElementById('invoiceNotes').value = this.currentInvoice.notes || '';

        // تحميل عناصر الفاتورة
        const tbody = document.querySelector('#invoiceItems tbody');
        tbody.innerHTML = '';
        
        this.currentInvoice.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <select class="product-select" onchange="invoicesPage.onProductChange(this)">
                        <option value="">اختر منتج</option>
                    </select>
                </td>
                <td><input type="text" class="item-description" value="${item.description || ''}"></td>
                <td><input type="number" class="item-quantity" value="${item.quantity}" min="1" onchange="invoicesPage.calculateItemTotal(this)"></td>
                <td><input type="number" class="item-price" value="${item.price}" step="0.01" onchange="invoicesPage.calculateItemTotal(this)"></td>
                <td class="item-total">${item.total.toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" onclick="invoicesPage.removeItem(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.loadProducts();
        
        // تعيين المنتجات المحددة
        setTimeout(() => {
            const rows = tbody.querySelectorAll('tr');
            this.currentInvoice.items.forEach((item, index) => {
                if (rows[index]) {
                    const select = rows[index].querySelector('.product-select');
                    select.value = item.productId;
                    this.onProductChange(select);
                }
            });
        }, 100);

        this.calculateTotals();
        document.getElementById('invoiceModal').style.display = 'flex';
    },

    viewInvoice(id) {
        // تنفيذ عرض الفاتورة كـ PDF أو صفحة منفصلة
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoice = invoices.find(inv => inv.id === id);
        
        if (invoice) {
            // هنا يمكن إنشاء نافذة معاينة أو تحميل PDF
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>فاتورة ${invoice.invoiceNumber}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; direction: rtl; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .details { margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                            th { background-color: #f2f2f2; }
                            .total { text-align: left; margin-top: 20px; }
                            @media print { body { margin: 0; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>فاتورة</h1>
                            <h2>${invoice.invoiceNumber}</h2>
                        </div>
                        <div class="details">
                            <p><strong>العميل:</strong> ${invoice.customerName}</p>
                            <p><strong>التاريخ:</strong> ${formatDate(invoice.date)}</p>
                            <p><strong>تاريخ الاستحقاق:</strong> ${formatDate(invoice.dueDate)}</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>المنتج/الخدمة</th>
                                    <th>الوصف</th>
                                    <th>الكمية</th>
                                    <th>السعر</th>
                                    <th>المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.description || ''}</td>
                                        <td>${item.quantity}</td>
                                        <td>${formatCurrency(item.price)}</td>
                                        <td>${formatCurrency(item.total)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="total">
                            <p><strong>المجموع الفرعي:</strong> ${formatCurrency(invoice.subtotal)}</p>
                            <p><strong>الضريبة:</strong> ${formatCurrency(invoice.tax)}</p>
                            <p><strong>الإجمالي:</strong> ${formatCurrency(invoice.total)}</p>
                            <p><strong>الحالة:</strong> ${this.getStatusText(invoice.status)}</p>
                        </div>
                        ${invoice.notes ? `<div class="notes"><p><strong>ملاحظات:</strong> ${invoice.notes}</p></div>` : ''}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    },

    showPaymentForm(id) {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoice = invoices.find(inv => inv.id === id);
        
        if (!invoice) {
            window.accountingApp.showNotification('الفاتورة غير موجودة', 'error');
            return;
        }

        document.getElementById('paymentInvoiceId').value = invoice.id;
        document.getElementById('invoiceNumberDisplay').value = invoice.invoiceNumber;
        document.getElementById('totalAmountDisplay').value = formatCurrency(invoice.total);
        document.getElementById('paidAmountDisplay').value = formatCurrency(invoice.paid);
        document.getElementById('balanceDisplay').value = formatCurrency(invoice.balance);
        document.getElementById('paymentAmount').value = invoice.balance;
        document.getElementById('paymentAmount').max = invoice.balance;
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('paymentModal').style.display = 'flex';
    },

    processPayment() {
        const invoiceId = document.getElementById('paymentInvoiceId').value;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const paymentNotes = document.getElementById('paymentNotes').value;

        if (!paymentAmount || paymentAmount <= 0) {
            window.accountingApp.showNotification('يرجى إدخال مبلغ دفعة صحيح', 'error');
            return;
        }

        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
        
        if (invoiceIndex === -1) {
            window.accountingApp.showNotification('الفاتورة غير موجودة', 'error');
            return;
        }

        const invoice = invoices[invoiceIndex];
        
        if (paymentAmount > invoice.balance) {
            window.accountingApp.showNotification('مبلغ الدفعة أكبر من المبلغ المتبقي', 'error');
            return;
        }

        // تحديث الفاتورة
        invoice.paid += paymentAmount;
        invoice.balance = invoice.total - invoice.paid;
        
        if (invoice.balance === 0) {
            invoice.status = 'paid';
        } else if (invoice.paid > 0) {
            invoice.status = 'partial';
        }
        
        invoice.updatedAt = new Date().toISOString();
        invoices[invoiceIndex] = invoice;
        localStorage.setItem('invoices', JSON.stringify(invoices));

        // تسجيل الدفعة
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        payments.push({
            id: Date.now().toString(),
            invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            amount: paymentAmount,
            date: paymentDate,
            method: paymentMethod,
            notes: paymentNotes,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('payments', JSON.stringify(payments));

        // تسجيل النشاط
        Auth.logActivity(Auth.getCurrentUser().id, 'تسديد دفعة', 
                        `تم تسديد دفعة بقيمة ${formatCurrency(paymentAmount)} للفاتورة ${invoice.invoiceNumber}`);

        window.accountingApp.showNotification('تم تسجيل الدفعة بنجاح', 'success');
        this.closePaymentForm();
        this.loadInvoices();
        
        // تحديث لوحة التحكم
        if (window.dashboardPage) {
            window.dashboardPage.loadDashboardData();
        }
    },

    deleteInvoice(id) {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            return;
        }

        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoiceIndex = invoices.findIndex(inv => inv.id === id);
        
        if (invoiceIndex !== -1) {
            const invoice = invoices[invoiceIndex];
            invoices.splice(invoiceIndex, 1);
            localStorage.setItem('invoices', JSON.stringify(invoices));
            
            // تسجيل النشاط
            Auth.logActivity(Auth.getCurrentUser().id, 'حذف فاتورة', 
                            `تم حذف فاتورة ${invoice.invoiceNumber}`);
            
            window.accountingApp.showNotification('تم حذف الفاتورة بنجاح', 'success');
            this.loadInvoices();
            
            // تحديث لوحة التحكم
            if (window.dashboardPage) {
                window.dashboardPage.loadDashboardData();
            }
        }
    },

    closeInvoiceForm() {
        document.getElementById('invoiceModal').style.display = 'none';
    },

    closePaymentForm() {
        document.getElementById('paymentModal').style.display = 'none';
    },

    filterInvoices() {
        this.loadInvoices();
    },

    exportInvoices() {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const csv = this.convertToCSV(invoices);
        this.downloadCSV(csv, 'invoices.csv');
    },

    convertToCSV(invoices) {
        const headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'تاريخ الاستحقاق', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة'];
        const rows = invoices.map(inv => [
            inv.invoiceNumber,
            inv.customerName,
            formatDate(inv.date),
            formatDate(inv.dueDate),
            inv.total,
            inv.paid,
            inv.balance,
            this.getStatusText(inv.status)
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

    printInvoices() {
        window.print();
    },

    getStatusText(status) {
        const statusMap = {
            'paid': 'مدفوعة',
            'unpaid': 'غير مدفوعة',
            'partial': 'جزئي'
        };
        return statusMap[status] || status;
    },

    setupEventListeners() {
        // إضافة أي مستمعين إضافيين للأحداث هنا
    }
};