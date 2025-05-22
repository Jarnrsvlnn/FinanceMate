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

// Function to get selected date from dashboard
function getSelectedDate() {
    const storedDate = localStorage.getItem('selectedDate');
    if (storedDate) {
        return new Date(storedDate);
    }
    return new Date(); // Default to current date if no date is selected
}

// Function to format date for display
function formatDateForDisplay(date) {
    return date.toLocaleDateString();
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

    // Load saved transactions from localStorage
    loadTransactions();

    submitButton.addEventListener('click', function(e) {
        e.preventDefault();

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

        // Get the selected date from dashboard date picker
        const selectedDate = getSelectedDate();
        
        const transaction = {
            id: Date.now().toString(),
            source: sourceInput.value.trim(),
            amount: parseFloat(amountInput.value).toFixed(2),
            date: formatDateForDisplay(selectedDate), // Use selected date instead of current date
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            actualDate: selectedDate.toISOString() // Store actual date for sorting purposes
        };

        // Add to transactions list
        addTransactionToDOM(transaction);

        // Save to localStorage
        saveTransaction(transaction);

        // Update budget data's totalIncome
        const transactions = JSON.parse(localStorage.getItem('incomeTransactions')) || [];
        const currentTotalIncome = calculateTotalIncome(transactions);
        const budgetData = JSON.parse(localStorage.getItem('budgetData')) || {};
        budgetData.totalIncome = currentTotalIncome;
        localStorage.setItem('budgetData', JSON.stringify(budgetData));

        // Clear input fields
        sourceInput.value = '';
        amountInput.value = '';

        // Update level
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
        let transactions = JSON.parse(localStorage.getItem('incomeTransactions')) || [];
        transactions.unshift(transaction);
        localStorage.setItem('incomeTransactions', JSON.stringify(transactions));

        // Trigger storage event to update other tabs
        window.dispatchEvent(new Event('storage'));
    }

    function loadTransactions() {
        const transactions = JSON.parse(localStorage.getItem('incomeTransactions')) || [];
        
        // Sort transactions by actual date (newest first)
        transactions.sort((a, b) => {
            const dateA = new Date(a.actualDate || a.date + ' ' + a.time);
            const dateB = new Date(b.actualDate || b.date + ' ' + b.time);
            return dateB - dateA;
        });
        
        transactions.forEach(transaction => {
            addTransactionToDOM(transaction);
        });

        // Update level display
        updateLevelDisplay();
    }

    function deleteTransaction(transactionId, amount) {
        let transactions = JSON.parse(localStorage.getItem('incomeTransactions')) || [];
        transactions = transactions.filter(t => t.id !== transactionId);
        localStorage.setItem('incomeTransactions', JSON.stringify(transactions));

        // Update budget data's totalIncome
        const budgetData = JSON.parse(localStorage.getItem('budgetData')) || {};
        const currentTotalIncome = calculateTotalIncome(transactions);
        budgetData.totalIncome = currentTotalIncome;
        localStorage.setItem('budgetData', JSON.stringify(budgetData));

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
        let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;

        // Each transaction gives 1 EXP
        currentExp += 1;

        // Level up if EXP reaches 100
        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0; // Reset EXP for next level
        }

        // Save to localStorage
        localStorage.setItem('currentLevel', currentLevel.toString());
        localStorage.setItem('currentExp', currentExp.toString());

        // Update display
        updateLevelDisplay();
    }

    function decreaseLevel() {
        let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;

        // Decrease EXP by 1 when transaction is deleted
        currentExp = Math.max(0, currentExp - 1);

        // Handle level down if EXP goes negative
        if (currentExp < 0 && currentLevel > 1) {
            currentLevel -= 1;
            currentExp = 99; // Set to 99 EXP of previous level
        }

        // Save to localStorage
        localStorage.setItem('currentLevel', currentLevel.toString());
        localStorage.setItem('currentExp', currentExp.toString());

        // Update display
        updateLevelDisplay();
    }

    function updateLevelDisplay() {
        const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
        const currentExp = parseInt(localStorage.getItem('currentExp')) || 0;
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

// ==================== AUTHENTICATION PROTECTION ====================
// Add this script to all protected pages (dashboard.html, profile.html, etc.)

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Skip authentication check for login and signup pages
    const currentPage = window.location.pathname;
    const publicPages = ['index.html', 'signup.html', '/'];
    
    // Check if current page is public
    const isPublicPage = publicPages.some(page => 
        currentPage.endsWith(page) || currentPage === '/'
    );
    
    if (!isPublicPage) {
        checkAuthentication();
    }
});

function checkAuthentication() {
    const username = sessionStorage.getItem('username');
    
    if (!username) {
        // No username in session, redirect to login
        window.location.href = 'index.html';
        return false;
    }
    
    // Check if user account still exists
    const accounts = JSON.parse(localStorage.getItem('userAccounts')) || {};
    if (!accounts[username]) {
        // User account was deleted, clear session and redirect
        sessionStorage.clear();
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// ==================== USER DATA SYNCHRONIZATION ====================

// Function to ensure user data is properly loaded
function ensureUserDataLoaded() {
    const username = sessionStorage.getItem('username');
    if (!username) return false;
    
    const accounts = JSON.parse(localStorage.getItem('userAccounts')) || {};
    const userData = accounts[username];
    
    if (!userData) return false;
    
    // Check if localStorage has the user's data, if not, load it
    const currentUsername = localStorage.getItem('username');
    if (currentUsername !== username) {
        loadUserDataToStorage(userData);
    }
    
    return true;
}

function loadUserDataToStorage(userData) {
    // Load all user-specific data to localStorage
    const keysToLoad = [
        'budgetData', 'incomeTransactions', 'expenses', 
        'currentLevel', 'currentExp', 'selectedDate', 'darkTheme'
    ];
    
    keysToLoad.forEach(key => {
        if (userData[key] !== undefined) {
            localStorage.setItem(key, typeof userData[key] === 'object' ? 
                JSON.stringify(userData[key]) : userData[key].toString());
        }
    });
    
    // Set username in localStorage
    localStorage.setItem('username', userData.username);
}

// ==================== PAGE VISIBILITY HANDLER ====================

// Auto-save and sync data when user switches tabs or minimizes window
document.addEventListener('visibilitychange', function() {
    const username = sessionStorage.getItem('username');
    if (!username) return;
    
    if (document.visibilityState === 'hidden') {
        // Save current data when page becomes hidden
        saveCurrentDataToUser(username);
    } else {
        // Ensure data is synchronized when page becomes visible
        ensureUserDataLoaded();
    }
});

// ==================== NAVIGATION PROTECTION ====================

// Save data before page unload
window.addEventListener('beforeunload', function() {
    const username = sessionStorage.getItem('username');
    if (username) {
        saveCurrentDataToUser(username);
    }
});

// ==================== UTILITY FUNCTIONS ====================

function saveCurrentDataToUser(username) {
    const accounts = JSON.parse(localStorage.getItem('userAccounts')) || {};
    const userData = accounts[username];
    
    if (!userData) return;
    
    // Update user data with current localStorage values
    userData.budgetData = JSON.parse(localStorage.getItem('budgetData') || '{}');
    userData.incomeTransactions = JSON.parse(localStorage.getItem('incomeTransactions') || '[]');
    userData.expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    userData.currentLevel = parseInt(localStorage.getItem('currentLevel') || '1');
    userData.currentExp = parseInt(localStorage.getItem('currentExp') || '0');
    userData.selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
    userData.darkTheme = localStorage.getItem('darkTheme') === 'true';
    
    // Save bio if on profile page
    const bioInput = document.getElementById('bio');
    if (bioInput) {
        userData.bio = bioInput.value;
    }
    
    // Save updated data
    accounts[username] = userData;
    localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

// Make functions globally available
window.checkAuthentication = checkAuthentication;
window.ensureUserDataLoaded = ensureUserDataLoaded;
window.saveCurrentDataToUser = saveCurrentDataToUser;