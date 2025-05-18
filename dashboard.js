document.addEventListener('DOMContentLoaded', function() {
    // ========== DOM Elements ==========
    const menuBtn = document.querySelector('#menu-btn');
    const closeBtn = document.querySelector('#close-btn');
    const sidebar = document.querySelector('aside');
    const themeBtn = document.querySelector('.theme-btn');
    const dateInput = document.querySelector('input[type="date"]');
    const pieChartCanvas = document.getElementById('line-chart');

    // ========== Initialize ==========
    // Load Chart.js first if needed
    loadChartJsIfNeeded(function() {
        updateDashboardData();
        updateLevelDisplay();
        initializeTheme();
        setupStorageListener();
        displayUsername();
    });


    // ========== Event Listeners ==========
    if (menuBtn) menuBtn.onclick = () => sidebar.style.display = 'block';
    if (closeBtn) closeBtn.onclick = () => sidebar.style.display = 'none';

    if (themeBtn) {
        themeBtn.onclick = function() {
            document.body.classList.toggle('dark-theme');
            themeBtn.querySelector('span:first-child').classList.toggle('active');
            themeBtn.querySelector('span:last-child').classList.toggle('active');
            // Changed from sessionStorage to localStorage
            localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
        };
    }

    if (dateInput) {
        dateInput.valueAsDate = new Date();
        dateInput.addEventListener('change', updateDashboardData);
    }

    // ========== Core Functions ==========

    // Load Chart.js library if it's not already loaded
    function loadChartJsIfNeeded(callback) {
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded, loading now...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = function() {
                console.log('Chart.js loaded successfully');
                callback();
            };
            script.onerror = function() {
                console.error('Failed to load Chart.js');
                // Still call callback to initialize other parts
                callback();
            };
            document.head.appendChild(script);
        } else {
            console.log('Chart.js already loaded');
            callback();
        }
    }

    // Debounce function to limit how often a function is called
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Main function to update all dashboard data
    function updateDashboardData() {
        // Load data from storage
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        const incomeTransactions = JSON.parse(sessionStorage.getItem('incomeTransactions')) || [];
        const expenses = JSON.parse(sessionStorage.getItem('expenses')) || [];

        // Update card balances
        updateCardBalances(budgetData);

        // Update income/expense reports
        updateReports(incomeTransactions, expenses);

        // Update recent transactions
        updateRecentTransactions(incomeTransactions, expenses);

        // Update recent payments (expenses)
        updateRecentPayments(expenses);

        // Display username
        displayUsername();

        // Set a small delay before creating/updating the pie chart
        // This helps ensure the container is ready
        setTimeout(() => {
            createPieChart(expenses);
        }, 100);
    }

    function updateCardBalances(budgetData) {
        // Cash Card
        const cashCard = document.querySelector('.cards-container .card:nth-child(1) .middle h1');
        if (cashCard) cashCard.textContent = `₱${(budgetData.cashBalance || 0).toFixed(2)}`;

        // Debit Card
        const debitCard = document.querySelector('.cards-container .card:nth-child(2) .middle h1');
        if (debitCard) debitCard.textContent = `₱${(budgetData.debitBalance || 0).toFixed(2)}`;

        // GCash Card
        const gcashCard = document.querySelector('.cards-container .card:nth-child(3) .middle h1');
        if (gcashCard) gcashCard.textContent = `₱${(budgetData.gcashBalance || 0).toFixed(2)}`;
    }

    function updateReports(incomeTransactions, expenses) {
        // Calculate total income
        const totalIncome = incomeTransactions.reduce((total, transaction) => {
            return total + parseFloat(transaction.amount);
        }, 0);

        // Calculate total expenses
        const totalExpenses = expenses.reduce((total, expense) => {
            return total + parseFloat(expense.amount);
        }, 0);

        // Update income report
        const incomeReport = document.querySelector('.monthly-report .report:nth-child(1) details h1');
        if (incomeReport) incomeReport.textContent = `₱${totalIncome.toFixed(2)}`;

        // Update expense report
        const expenseReport = document.querySelector('.monthly-report .report:nth-child(2) details h1');
        if (expenseReport) expenseReport.textContent = `₱${totalExpenses.toFixed(2)}`;
    }

    function updateRecentTransactions(incomeTransactions, expenses) {
        const historyContainer = document.querySelector('.history-container');
        if (!historyContainer) return;

        // Clear all transaction entries
        historyContainer.innerHTML = '';

        // Combine and sort transactions (newest first)
        const allTransactions = [
            ...incomeTransactions.map(t => ({ ...t, type: 'income' })),
            ...expenses.map(e => ({ ...e, type: 'expense' }))
        ].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

        // Display up to 5 recent transactions
        allTransactions.slice(0, 5).forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.className = 'history';

            transactionEl.innerHTML = `
                <h4>${transaction.type === 'income' ? 'Income: ' + transaction.source : 'Expense: ' + transaction.category}</h4>
                <div class="date-time">
                    <p>${transaction.date}</p>
                    <small class="text-muted">${transaction.time}</small>
                </div>
                <div class="amount">
                    <p class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'income' ? '+' : '-'}₱${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                </div>
            `;

            historyContainer.appendChild(transactionEl);
        });
    }

function updateRecentPayments(expenses) {
    const badgeContainer = document.querySelector('.badge-container');
    if (!badgeContainer) return;

    // Keep only the add button if it exists
    const addButton = badgeContainer.querySelector('.badge:first-child');
    badgeContainer.innerHTML = '';
    if (addButton) badgeContainer.appendChild(addButton);

    // Display up to 7 recent expenses
    expenses.slice(0, 7).forEach(expense => {
        const badge = document.createElement('div');
        badge.className = 'badge';

        // Get category color from our mapping
        const categoryColor = getCategoryColor(expense.category);

        badge.innerHTML = `
            <span style="background-color: ${categoryColor}"></span>
            <div>
                <h5>${expense.category}</h5>
                <h4>₱${parseFloat(expense.amount).toFixed(2)}</h4>
            </div>
        `;

        // Add hover effect with the category color
        badge.style.setProperty('--category-color', categoryColor);
        badge.addEventListener('mouseenter', () => {
            badge.style.boxShadow = `0 6px 12px ${hexToRgba(categoryColor, 0.2)}`;
        });
        badge.addEventListener('mouseleave', () => {
            badge.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });

        badgeContainer.appendChild(badge);
    });
}

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

    // Create a consistent color mapping for categories
    const categoryColorMap = {
      'Food': '#FF6384', // Pink
      'Housing': '#36A2EB', // Blue
      'Transportation': '#FFCE56', // Yellow
      'Entertainment': '#4BC0C0', // Teal
      'Shopping': '#9966FF', // Purple
      'Health': '#FF9F40', // Orange
      'Education': '#8AC24A', // Green
      'Bills': '#FF6B6B', // Light Red
      'Travel': '#8175C7', // Indigo
      'Groceries': '#5AD3D1', // Light Teal
      'Dining': '#FF8A5B', // Coral
      'Utilities': '#4A5FC4', // Royal Blue
      'Clothing': '#FF5252', // Red
      'Tech': '#00B8D4', // Cyan
      'Other': '#757575'  // Gray
    };

    function getCategoryColor(category) {
      // Return the mapped color or a default gray if category isn't in the map
      return categoryColorMap[category] || '#757575';
    }

    // Function to create the pie chart
    function createPieChart(expenses) {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not available yet');
            return;
        }

        // Check if canvas exists
        if (!pieChartCanvas) {
            console.log('Pie chart canvas not found');
            return;
        }

        // Skip rendering if no expenses yet
        if (!expenses || expenses.length === 0) {
            console.log('No expenses to display in pie chart');
            if (window.dashboardPieChart) {
                window.dashboardPieChart.destroy();
                window.dashboardPieChart = null;
            }
            return;
        }

        console.log('Creating pie chart with', expenses.length, 'expenses');

        // Group expenses by category
        const categoryTotals = {};
        expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += parseFloat(expense.amount);
        });

        // Prepare chart data
        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = categories.map(category => getCategoryColor(category));

        // Destroy existing chart if present
        if (window.dashboardPieChart) {
            window.dashboardPieChart.destroy();
            window.dashboardPieChart = null;
        }

        // Set larger dimensions for the chart
        pieChartCanvas.style.height = '400px'; // Increased from 200px
        pieChartCanvas.style.width = '450px';  // Increased from 250px
        pieChartCanvas.height = 300;
        pieChartCanvas.width = 350;

        // Create the chart with a larger size
        try {
            window.dashboardPieChart = new Chart(pieChartCanvas, {
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
                    responsive: false,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 500 // Added some animation
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Expenses by Category',
                            font: {
                                family: "'Press Start 2P', sans-serif",
                                size: 12 // Increased from 10
                            }
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    family: "'Press Start 2P', sans-serif",
                                    size: 9 // Increased from 7
                                },
                                boxWidth: 10 // Increased from 8
                            }
                        }
                    }
                }
            });
            console.log('Pie chart created successfully');
        } catch (error) {
            console.error('Error creating pie chart:', error);
        }
    }

    // ========== LEVEL SYSTEM FUNCTIONS ==========

    function updateLevel() {
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        // Each transaction gives 1 EXP
        currentExp += 1;

        // Level up if EXP reaches 100
        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0; // Reset EXP for next level
            showLevelUpNotification(currentLevel);
        }

        // Save to sessionStorage
        sessionStorage.setItem('currentLevel', currentLevel.toString());
        sessionStorage.setItem('currentExp', currentExp.toString());

        // Update display
        updateLevelDisplay();
    }

    function decreaseLevel() {
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        // Decrease EXP by 1 when transaction is deleted
        currentExp = Math.max(0, currentExp - 1);

        // Handle level down if EXP goes negative
        if (currentExp < 0 && currentLevel > 1) {
            currentLevel -= 1;
            currentExp = 99; // Set to 99 EXP of previous level
        }

        // Save to sessionStorage
        sessionStorage.setItem('currentLevel', currentLevel.toString());
        sessionStorage.setItem('currentExp', currentExp.toString());

        // Update display
        updateLevelDisplay();
    }

    function updateLevelDisplay() {
        const currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        const currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;
        const levelHeader = document.querySelector('.level-header h2');
        const expFill = document.getElementById('expFill');
        const expText = document.getElementById('expText');

        if (levelHeader) {
            levelHeader.textContent = `Level ${currentLevel}`;
        }

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

    function initializeTheme() {
        // Changed from sessionStorage to localStorage
        if (localStorage.getItem('darkTheme') === 'true') {
            document.body.classList.add('dark-theme');
            if (themeBtn) {
                themeBtn.querySelector('span:first-child').classList.remove('active');
                themeBtn.querySelector('span:last-child').classList.add('active');
            }
        }
    }

    function setupStorageListener() {
        // Keep track of last update time
        let lastUpdateTime = Date.now();

        // Update when the page becomes visible
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // Only update if it's been at least 2 seconds since last update
                if (Date.now() - lastUpdateTime > 2000) {
                    updateDashboardData();
                    updateLevelDisplay();
                    lastUpdateTime = Date.now();
                }
            }
        });

        // Listen for storage events (across tabs)
        window.addEventListener('storage', function(event) {
            if (event.key === 'incomeTransactions' ||
                event.key === 'expenses' ||
                event.key === 'budgetData') {
                updateDashboardData();
                updateLevelDisplay();
                lastUpdateTime = Date.now();
            }
        });

        // Also add a manual trigger for custom events
        window.addEventListener('budgetUpdated', function() {
            updateDashboardData();
            updateLevelDisplay();
            lastUpdateTime = Date.now();
        });

        // Less frequent polling as fallback
        setInterval(function() {
            if (document.visibilityState === 'visible' && Date.now() - lastUpdateTime > 5000) {
                updateDashboardData();
                updateLevelDisplay();
                lastUpdateTime = Date.now();
            }
        }, 5000);
    }

    // Handle window resize to redraw chart properly
    window.addEventListener('resize', debounce(function() {
        // Completely redraw the chart on resize rather than just resizing it
        updateDashboardData();
    }, 250));
});

function displayUsername() {
    // Get the username from sessionStorage
    const username = sessionStorage.getItem('username') || 'User';

    // Update all card holder names
    const cardHolders = document.querySelectorAll('.cards-container .card .bottom h5');
    cardHolders.forEach(holder => {
        holder.textContent = username;
    });
}