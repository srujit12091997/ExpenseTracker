// Initialize state with sample transactions
const sampleTransactions = [
    {
        id: Date.now() - 40000,
        description: "Monthly Salary",
        amount: 5000,
        type: "income",
        category: "salary",
        date: new Date(Date.now() - 40000)
    },
    {
        id: Date.now() - 30000,
        description: "Grocery Shopping",
        amount: 150.75,
        type: "expense",
        category: "groceries",
        date: new Date(Date.now() - 30000)
    },
    {
        id: Date.now() - 20000,
        description: "Rent Payment",
        amount: 1200,
        type: "expense",
        category: "rent",
        date: new Date(Date.now() - 20000)
    },
    {
        id: Date.now() - 10000,
        description: "Freelance Work",
        amount: 800,
        type: "income",
        category: "freelance",
        date: new Date(Date.now() - 10000)
    },
    {
        id: Date.now(),
        description: "Utility Bills",
        amount: 200,
        type: "expense",
        category: "utilities",
        date: new Date()
    }
];

let transactions = JSON.parse(localStorage.getItem('transactions')) || sampleTransactions;
let chart = null;

// DOM Elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income-total');
const expenseEl = document.getElementById('expense-total');
const form = document.getElementById('transaction-form');
const transactionsList = document.getElementById('transactions-list');
const chartCanvas = document.getElementById('chart').getContext('2d');

// Update UI
function updateUI() {
    const { balance, income, expense } = calculateTotals();
    
    // Update balance display (allowing negative numbers)
    balanceEl.textContent = formatMoney(balance);
    balanceEl.style.color = balance < 0 ? '#e53e3e' : '#2d3748';
    
    incomeEl.textContent = formatMoney(income);
    expenseEl.textContent = formatMoney(expense);
    
    displayTransactions();
    updateChart();
    saveToLocalStorage();
}

// Calculate totals (modified to handle negative balance)
function calculateTotals() {
    return transactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
            acc.income += amount;
            acc.balance += amount;
        } else {
            acc.expense += amount;
            acc.balance -= amount;  // This can now go negative
        }
        return acc;
    }, { balance: 0, income: 0, expense: 0 });
}

// Format money (modified to handle negative numbers)
function formatMoney(amount) {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    return (isNegative ? '-' : '') + new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(absAmount);
}

// Display transactions (showing only 5 most recent)
function displayTransactions() {
    transactionsList.innerHTML = '';
    
    const sortedTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);  // Only show 5 most recent
    
    sortedTransactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        div.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-description">${transaction.description}</span>
                <span class="transaction-category ${transaction.type}">
                    ${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                </span>
            </div>
            <div class="transaction-amount ${transaction.type}">
                <span>${transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}</span>
                <small>${formattedDate}</small>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">×</button>
            </div>
        `;
        
        transactionsList.appendChild(div);
    });

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-transactions">
                No transactions yet. Add your first transaction above!
            </div>
        `;
    }
}

// Update chart (modified to better handle categories)
function updateChart() {
    const categoryTotals = {};
    let hasExpenses = false;

    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            hasExpenses = true;
            const category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
            categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(transaction.amount);
        }
    });

    if (chart) {
        chart.destroy();
    }

    if (!hasExpenses) {
        chartCanvas.canvas.style.height = '150px';
        chart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: ['No expenses yet'],
                datasets: [{
                    data: [0],
                    backgroundColor: '#e0e0e0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }

    chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#E91E63',
                    '#9C27B0',
                    '#FF5722'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / Object.values(categoryTotals).reduce((a, b) => a + b)) * 100).toFixed(1);
                            return `${label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Add transaction
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    if (amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        date: new Date()
    };
    
    transactions.push(transaction);
    updateUI();
    form.reset();

    // Set default type and category
    document.getElementById('type').value = 'expense';
    updateCategories('expense');

    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`, 'success');
});

// Update categories based on type
function updateCategories(type) {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '';

    const categories = type === 'income' 
        ? ['Salary', 'Freelance', 'Investments', 'Other Income']
        : ['Groceries', 'Rent', 'Entertainment', 'Transport', 'Utilities', 'Other'];

    categories.forEach(category => {
        const option = new Option(category, category.toLowerCase());
        categorySelect.add(option);
    });
}

// Event listener for type change
document.getElementById('type').addEventListener('change', function(e) {
    updateCategories(e.target.value);
});

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateUI();
        showNotification('Transaction deleted!', 'success');
    }
}

// Initialize
updateUI();