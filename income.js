// SHOW OR HIDE TASKBAR
const menuBtn = document.querySelector('#menu-btn');
const closeBtn = document.querySelector('#close-btn');
const sidebar = document.querySelector('aside');

menuBtn.onclick = function () {
    sidebar.style.display = 'block';
}

closeBtn.onclick = function () {
    sidebar.style.display = 'none';
}

// CHANGE THEME (DARK OR LIGHT)
const themeBtn = document.querySelector('.theme-btn');

// Initialize theme on page load
function initializeTheme() {
    if (localStorage.getItem('darkTheme') === 'true') {
        document.body.classList.add('dark-theme');
        if (themeBtn) {
            themeBtn.querySelector('span:first-child').classList.remove('active');
            themeBtn.querySelector('span:last-child').classList.add('active');
        }
    }
}

themeBtn.onclick = function () {
    document.body.classList.toggle('dark-theme');
    themeBtn.querySelector('span:first-child').classList.toggle('active');
    themeBtn.querySelector('span:last-child').classList.toggle('active');
    // Save theme preference to localStorage
    localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();

    const incomeForm = document.querySelector('.income-input');
    const submitButton = incomeForm.querySelector('button');
    const recentTransactions = document.querySelector('.recent-transactions');

    // Create a container for scrollable transactions
    const transactionsContainer = document.createElement('div');
    transactionsContainer.className = 'transactions-container';
    recentTransactions.appendChild(transactionsContainer);

    // Set maxlength attribute to prevent typing more than 10 characters
    const sourceInput = incomeForm.querySelector('.source input');
    const amountInput = incomeForm.querySelector('.amount input');
    sourceInput.setAttribute('maxlength', '10');
    amountInput.setAttribute('maxlength', '10');

    // Prevent non-numeric input in amount field
    amountInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9.]/g, '');
    });

    // Load saved transactions from sessionStorage
    loadTransactions();

    submitButton.addEventListener('click', function(e) {
        e.preventDefault();

        // ... (existing validation code)
        if (!sourceInput.value.trim() || !amountInput.value.trim()) {
            alert('Please fill in both fields');
            return;
        }

        if (sourceInput.value.length > 10) {
            alert('Source name should be maximum 10 letters');
            return;
        }

        if (amountInput.value.length > 10) {
            alert('Amount should be maximum 10 digits');
            return;
        }

        // Create transaction object
        const transaction = {
            id: Date.now().toString(),
            source: sourceInput.value.trim(),
            amount: parseFloat(amountInput.value).toFixed(2),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        // Add to transactions list
        addTransactionToDOM(transaction);

        // Save to sessionStorage
        saveTransaction(transaction);

        // Update budget data's totalIncome
        const transactions = JSON.parse(sessionStorage.getItem('incomeTransactions')) || [];
        const currentTotalIncome = calculateTotalIncome(transactions);
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        budgetData.totalIncome = currentTotalIncome;
        sessionStorage.setItem('budgetData', JSON.stringify(budgetData));

        // Clear inputs
        sourceInput.value = '';
        amountInput.value = '';

        // Update Level
        updateLevel();
    });

    function addTransactionToDOM(transaction) {
        // Create transaction element
        const transactionElement = document.createElement('div');
        transactionElement.className = 'history';
        transactionElement.dataset.id = transaction.id;
        transactionElement.innerHTML = `
            <h4>${transaction.source}</h4>
            <div class="date-time">
                <p>${transaction.date}</p>
                <small class="text-muted">${transaction.time}</small>
            </div>
            <div class="amount">
                <p>₱${transaction.amount}</p>
            </div>
            <button class="delete-btn">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;

        // Add delete button event listener
        const deleteBtn = transactionElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            deleteTransaction(transaction.id, parseFloat(transaction.amount));
            transactionElement.remove();
        });

        // Insert at the top of the container (most recent first)
        transactionsContainer.insertBefore(transactionElement, transactionsContainer.firstChild);
    }

    function saveTransaction(transaction) {
        let transactions = JSON.parse(sessionStorage.getItem('incomeTransactions')) || [];
        transactions.unshift(transaction);
        sessionStorage.setItem('incomeTransactions', JSON.stringify(transactions));

        // Trigger storage event manually for same-tab updates
        window.dispatchEvent(new Event('storage'));
    }

    function loadTransactions() {
        const transactions = JSON.parse(sessionStorage.getItem('incomeTransactions')) || [];
        transactions.forEach(transaction => {
            addTransactionToDOM(transaction);
        });

        // Initialize level display
        updateLevelDisplay();
    }

    function deleteTransaction(transactionId, amount) {
        let transactions = JSON.parse(sessionStorage.getItem('incomeTransactions')) || [];
        transactions = transactions.filter(t => t.id !== transactionId);
        sessionStorage.setItem('incomeTransactions', JSON.stringify(transactions));

        // Update budget data's totalIncome
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};
        const currentTotalIncome = calculateTotalIncome(transactions);
        budgetData.totalIncome = currentTotalIncome;
        sessionStorage.setItem('budgetData', JSON.stringify(budgetData));

        // Update budget display if exists
        const totalAmountDisplay = document.getElementById('total-amount');
        if (totalAmountDisplay) {
            totalAmountDisplay.textContent = `₱ ${Math.max(0, currentTotalIncome).toFixed(2)}`;
        }

        // Decrease level when transaction is deleted
        decreaseLevel();
    }

    function calculateTotalIncome(transactions) {
        return transactions.reduce((total, transaction) => {
            return total + parseFloat(transaction.amount);
        }, 0);
    }

    // New Level System (1 level per transaction)
    function updateLevel() {
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        // Each transaction gives 1 EXP
        currentExp += 1;

        // Level up if EXP reaches 100
        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0; // Reset EXP for next level
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

        // Update EXP progress bar and text
        if (expFill && expText) {
            const percentage = (currentExp / 100) * 100;
            expFill.style.width = `${percentage}%`;
            expText.textContent = `${currentExp} / 100 EXP`;
        }
    }
});
