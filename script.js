// Initialize state
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
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
    
    balanceEl.textContent = formatMoney(balance);
    incomeEl.textContent = formatMoney(income);
    expenseEl.textContent = formatMoney(expense);
    
    displayTransactions();
    updateChart();
    saveToLocalStorage();
}

// Calculate totals
function calculateTotals() {
    const totals = transactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
            acc.income += amount;
            acc.balance += amount;
        } else {
            acc.expense += amount;
            acc.balance -= amount;
        }
        return acc;
    }, { balance: 0, income: 0, expense: 0 });

    return totals;
}

// Format money
function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Display transactions
function displayTransactions() {
    transactionsList.innerHTML = '';
    
    transactions.slice().reverse().forEach(transaction => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
        div.innerHTML = `
            <div class="transaction-info">
                <span>${transaction.description}</span>
                <span class="transaction-category ${transaction.type}">
                    ${transaction.category}
                </span>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">×</button>
            </div>
        `;
        
        transactionsList.appendChild(div);
    });
}

// Update chart
function updateChart() {
    const categories = {};
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            categories[transaction.category] = (categories[transaction.category] || 0) + parseFloat(transaction.amount);
        }
    });

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#4299E1',
                    '#48BB78',
                    '#ED8936',
                    '#ECC94B',
                    '#667EEA'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Add transaction
form.addEventListener('submit', e => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: new Date()
    };
    
    transactions.push(transaction);
    updateUI();
    form.reset();

    // Show success notification
    showNotification('Transaction added successfully!');
});

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateUI();
        showNotification('Transaction deleted!');
    }
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize
updateUI();

// Add category change handler
document.getElementById('type').addEventListener('change', function(e) {
    const categorySelect = document.getElementById('category');
    const type = e.target.value;

    // Clear current options
    categorySelect.innerHTML = '';

    // Add appropriate options based on type
    if (type === 'income') {
        ['Salary', 'Freelance', 'Investments', 'Other Income'].forEach(category => {
            const option = new Option(category, category.toLowerCase());
            categorySelect.add(option);
        });
    } else {
        ['Groceries', 'Rent', 'Entertainment', 'Transport', 'Utilities', 'Other'].forEach(category => {
            const option = new Option(category, category.toLowerCase());
            categorySelect.add(option);
        });
    }
});