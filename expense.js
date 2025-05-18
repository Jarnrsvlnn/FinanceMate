// EXPENSE MANAGER FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const saveButton = document.querySelector('.add-expense button');
    const categoryOptions = document.querySelectorAll('.category-options .options');
    const expensesList = document.querySelector('.history-container');
    const paymentModal = document.getElementById('payment-modal');
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const cancelButton = document.querySelector('.cancel-btn');
    const pieChartCanvas = document.getElementById('line-chart');
    const themeBtn = document.querySelector('.theme-btn'); // Added theme button

    // State variables
    let selectedCategory = null;
    let currentExpense = null;
    let expenses = [];
    let expensePieChart = null;

    // Category color mapping (consistent with dashboard)
    const categoryColorMap = {
        'Food': '#FF6384',
        'Housing': '#36A2EB',
        'Transportation': '#FFCE56',
        'Entertainment': '#4BC0C0',
        'Shopping': '#9966FF',
        'Health': '#FF9F40',
        'Education': '#8AC24A',
        'Bills': '#FF6B6B',
        'Travel': '#8175C7',
        'Groceries': '#5AD3D1',
        'Dining': '#FF8A5B',
        'Utilities': '#4A5FC4',
        'Clothing': '#FF5252',
        'Tech': '#00B8D4',
        'Other': '#757575'
    };

    function getCategoryColor(category) {
        return categoryColorMap[category] || '#757575';
    }

    // Initialize theme first
    initializeTheme();

    // Initialize level display immediately
    updateLevelDisplay();
    loadExpenses();
    updatePieChart();

    // Category selection
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            categoryOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.querySelector('h5').textContent;
        });
    });

    // Save button click handler
    saveButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (!validateInputs()) return;

        currentExpense = {
            id: Date.now().toString(),
            amount: parseFloat(amountInput.value).toFixed(2),
            description: descriptionInput.value.trim(),
            category: selectedCategory,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        paymentModal.style.display = 'flex';
    });

    // Payment method selection
    paymentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const paymentMethod = this.value;
            const amount = parseFloat(currentExpense.amount);

            if (!hasSufficientFunds(paymentMethod, amount)) {
                alert(`Insufficient funds in your ${paymentMethod} account`);
                return;
            }

            currentExpense.paymentMethod = paymentMethod;
            addExpenseToDOM(currentExpense);
            saveExpense(currentExpense);
            updateCardBalances(currentExpense);
            updatePieChart();
            updateLevel(); // Update level when adding expense
            paymentModal.style.display = 'none';
            resetExpenseForm();
        });
    });

    // Cancel button in modal
    cancelButton.addEventListener('click', function() {
        paymentModal.style.display = 'none';
        currentExpense = null;
    });

    // Theme button click handler
    if (themeBtn) {
        themeBtn.onclick = function() {
            document.body.classList.toggle('dark-theme');
            themeBtn.querySelector('span:first-child').classList.toggle('active');
            themeBtn.querySelector('span:last-child').classList.toggle('active');
            // Store theme preference in localStorage instead of sessionStorage
            localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
        };
    }

    // ==================== CORE FUNCTIONS ====================

    function validateInputs() {
        if (!amountInput.value || isNaN(amountInput.value) || parseFloat(amountInput.value) <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        if (!descriptionInput.value.trim()) {
            alert('Please enter a description');
            return false;
        }
        if (descriptionInput.value.length > 20) {
            alert('Description should be maximum 20 letters');
            return false;
        }
        if (!selectedCategory) {
            alert('Please select a category');
            return false;
        }
        return true;
    }

    function hasSufficientFunds(paymentMethod, amount) {
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        switch(paymentMethod) {
            case 'cash': return (budgetData.cashBalance || 0) >= amount;
            case 'debit': return (budgetData.debitBalance || 0) >= amount;
            case 'gcash': return (budgetData.gcashBalance || 0) >= amount;
            default: return false;
        }
    }

    function addExpenseToDOM(expense) {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'history';
        expenseElement.dataset.id = expense.id;
        expenseElement.innerHTML = `
            <div class="history-info">
                <h2>${expense.category}</h2>
                <h2>₱${expense.amount}</h2>
            </div>
            <div class="history-details">
                <details>
                    <summary>${expense.paymentMethod.toUpperCase()}  ↓ ${expense.date} ${expense.time}</summary>
                    <h5>${expense.description}</h5>
                </details>
            </div>
            <button class="delete-expense-btn">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;

        expenseElement.querySelector('.delete-expense-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteExpense(expense.id, expense.paymentMethod, parseFloat(expense.amount));
            expenseElement.remove();
        });

        expensesList.insertBefore(expenseElement, expensesList.firstChild);
    }

    function deleteExpense(expenseId, paymentMethod, amount) {
        // Update expenses list
        expenses = expenses.filter(e => e.id !== expenseId);
        sessionStorage.setItem('expenses', JSON.stringify(expenses));

        // Return funds to payment method
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        switch(paymentMethod) {
            case 'cash':
                budgetData.cashBalance = (budgetData.cashBalance || 0) + amount;
                break;
            case 'debit':
                budgetData.debitBalance = (budgetData.debitBalance || 0) + amount;
                break;
            case 'gcash':
                budgetData.gcashBalance = (budgetData.gcashBalance || 0) + amount;
                break;
        }
        sessionStorage.setItem('budgetData', JSON.stringify(budgetData));

        // Decrease level
        decreaseLevel();
        updatePieChart();
    }

    function updatePieChart() {
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
        });

        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);

        // Map colors to categories consistently
        const colors = categories.map(category => getCategoryColor(category));

        const ctx = pieChartCanvas.getContext('2d');

        if (window.expensePieChart) {
            window.expensePieChart.destroy();
        }

        window.expensePieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   legend: {
                       position: 'right',
                       labels: {
                           font: {
                               family: "'Press Start 2P', sans-serif",
                               size: 8
                           }
                       }
                   }
               }
            }
        });
    }

    function loadExpenses() {
        expenses = JSON.parse(sessionStorage.getItem('expenses')) || [];
        expenses.forEach(expense => addExpenseToDOM(expense));
    }

    function saveExpense(expense) {
        expenses = JSON.parse(sessionStorage.getItem('expenses')) || [];
        expenses.unshift(expense);
        sessionStorage.setItem('expenses', JSON.stringify(expenses));

        // Trigger storage event manually
        window.dispatchEvent(new Event('storage'));
    }

    function updateCardBalances(expense) {
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        const amount = parseFloat(expense.amount);

        switch(expense.paymentMethod) {
            case 'cash':
                budgetData.cashBalance = (budgetData.cashBalance || 0) - amount;
                break;
            case 'debit':
                budgetData.debitBalance = (budgetData.debitBalance || 0) - amount;
                break;
            case 'gcash':
                budgetData.gcashBalance = (budgetData.gcashBalance || 0) - amount;
                break;
        }

        sessionStorage.setItem('budgetData', JSON.stringify(budgetData));
        window.dispatchEvent(new Event('storage'));
    }

    function resetExpenseForm() {
        amountInput.value = '';
        descriptionInput.value = '';
        categoryOptions.forEach(opt => opt.classList.remove('active'));
        selectedCategory = null;
        currentExpense = null;
    }

    // ==================== LEVEL SYSTEM ====================

    function updateLevel() {
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        currentExp += 1;

        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0;
            showLevelUpNotification(currentLevel);
        }

        sessionStorage.setItem('currentLevel', currentLevel.toString());
        sessionStorage.setItem('currentExp', currentExp.toString());
        updateLevelDisplay();
    }

    function decreaseLevel() {
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        currentExp = Math.max(0, currentExp - 1);

        if (currentExp < 0 && currentLevel > 1) {
            currentLevel -= 1;
            currentExp = 99;
        }

        sessionStorage.setItem('currentLevel', currentLevel.toString());
        sessionStorage.setItem('currentExp', currentExp.toString());
        updateLevelDisplay();
    }

    function updateLevelDisplay() {
        const currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        const currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;
        const levelHeader = document.querySelector('.level-header h2');
        const expFill = document.getElementById('expFill');
        const expText = document.getElementById('expText');

        if (levelHeader) levelHeader.textContent = `Level ${currentLevel}`;
        if (expFill && expText) {
            const percentage = (currentExp / 100) * 100;
            expFill.style.width = `${percentage}%`;
            expText.textContent = `${currentExp} / 100 EXP`;
        }
    }

    function showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <h2>LEVEL UP!</h2>
                <p>Now Level ${newLevel}!</p>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Initialize theme function
    function initializeTheme() {
        // Use localStorage instead of sessionStorage for theme persistence
        if (localStorage.getItem('darkTheme') === 'true') {
            document.body.classList.add('dark-theme');
            if (themeBtn) {
                themeBtn.querySelector('span:first-child').classList.remove('active');
                themeBtn.querySelector('span:last-child').classList.add('active');
            }
        }
    }

    // Input restrictions
    amountInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9.]/g, '');
    });

    descriptionInput.addEventListener('input', function(e) {
        if (this.value.length > 30) {
            this.value = this.value.substring(0, 30);
        }
    });

    // Initialize chart.js if not already loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = updatePieChart;
        document.head.appendChild(script);
    }
}
);