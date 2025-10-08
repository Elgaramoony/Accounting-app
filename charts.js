// مكتبة مساعدة للرسوم البيانية
const ChartHelper = {
    colors: {
        primary: '#3498db',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
        info: '#17a2b8',
        secondary: '#6c757d',
        dark: '#343a40',
        light: '#f8f9fa'
    },

    getColorPalette(count) {
        const palette = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400',
            '#c0392b', '#16a085', '#8e44ad', '#2c3e50', '#f1c40f'
        ];
        return palette.slice(0, count);
    },

    createLineChart(ctx, data, options = {}) {
        const defaultOptions = {
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
        };

        return new Chart(ctx, {
            type: 'line',
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },

    createBarChart(ctx, data, options = {}) {
        const defaultOptions = {
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
        };

        return new Chart(ctx, {
            type: 'bar',
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },

    createPieChart(ctx, data, options = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
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
        };

        return new Chart(ctx, {
            type: 'pie',
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },

    createDoughnutChart(ctx, data, options = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
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
        };

        return new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },

    // دالة لإنشاء بيانات الرسم البياني للإيرادات والمصروفات
    createRevenueExpenseData(labels, revenues, expenses) {
        return {
            labels: labels,
            datasets: [
                {
                    label: 'الإيرادات',
                    data: revenues,
                    borderColor: this.colors.success,
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'المصروفات',
                    data: expenses,
                    borderColor: this.colors.danger,
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    },

    // دالة لإنشاء بيانات الرسم البياني للمقارنة
    createComparisonData(labels, currentData, previousData, currentLabel, previousLabel) {
        return {
            labels: labels,
            datasets: [
                {
                    label: currentLabel,
                    data: currentData,
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary,
                    borderWidth: 1
                },
                {
                    label: previousLabel,
                    data: previousData,
                    backgroundColor: this.colors.secondary,
                    borderColor: this.colors.secondary,
                    borderWidth: 1
                }
            ]
        };
    }
};

// إضافة الدوال إلى النطاق العام للاستخدام في الملفات الأخرى
window.ChartHelper = ChartHelper;