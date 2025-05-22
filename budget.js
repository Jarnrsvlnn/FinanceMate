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

// Initialize theme first (at the top before other operations)
initializeTheme();

themeBtn.onclick = function () {
    document.body.classList.toggle('dark-theme');
    themeBtn.querySelector('span:first-child').classList.toggle('active');
    themeBtn.querySelector('span:last-child').classList.toggle('active');
    // Store theme preference in localStorage
    localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
}

// Function to initialize theme based on localStorage
function initializeTheme() {
    if (localStorage.getItem('darkTheme') === 'true') {
        document.body.classList.add('dark-theme');
        if (themeBtn) {
            themeBtn.querySelector('span:first-child').classList.remove('active');
            themeBtn.querySelector('span:last-child').classList.add('active');
        }
    }
}

// BUDGET MANAGER FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const accountButtons = document.querySelectorAll('.account-btn');
    const amountInput = document.getElementById('amount');
    const saveButton = document.querySelector('.saveBtn');
    const totalAmountDisplay = document.getElementById('total-amount');
    const cashAmountDisplay = document.getElementById('cash-amount');
    const debitAmountDisplay = document.getElementById('debit-amount');
    const gcashAmountDisplay = document.getElementById('gcash-amount');

    // State variables
    let selectedAccount = null;
    let totalIncome = 0;
    let cashBalance = 0;
    let debitBalance = 0;
    let gcashBalance = 0;

    // Load data from localStorage
    loadData();

    // Update displays
    updateDisplays();
    updateLevelDisplay(); // Initialize level display

    // Account selection
    accountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            accountButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Set selected account
            selectedAccount = this.value;
        });
    });

    // Save button click handler
    saveButton.addEventListener('click', function(e) {
        e.preventDefault();

        // Validate inputs
        if (!selectedAccount) {
            alert('Please select an account');
            return;
        }

        if (!amountInput.value || isNaN(amountInput.value) || parseFloat(amountInput.value) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(amountInput.value);

        // Check if enough funds in total income
        if (amount > totalIncome) {
            alert('Not enough funds in total income');
            return;
        }

        // Update balances
        totalIncome -= amount;

        switch(selectedAccount) {
            case 'cash':
                cashBalance += amount;
                break;
            case 'debit':
                debitBalance += amount;
                break;
            case 'gcash':
                gcashBalance += amount;
                break;
        }

        // Save to localStorage
        saveData();

        // Update displays
        updateDisplays();

        // Update level
        updateLevel();

        // Reset form
        amountInput.value = '';
        accountButtons.forEach(btn => btn.classList.remove('active'));
        selectedAccount = null;
    });

    // Load data from localStorage
    function loadData() {
        const budgetData = JSON.parse(localStorage.getItem('budgetData')) || {};

        // Use stored totalIncome if it exists, otherwise calculate from transactions
        totalIncome = budgetData.totalIncome !== undefined ? budgetData.totalIncome :
            (JSON.parse(localStorage.getItem('incomeTransactions')) || [])
            .reduce((total, transaction) => total + parseFloat(transaction.amount), 0);

        cashBalance = budgetData.cashBalance || 0;
        debitBalance = budgetData.debitBalance || 0;
        gcashBalance = budgetData.gcashBalance || 0;
    }

    // Save data to localStorage
    function saveData() {
        const budgetData = {
            cashBalance,
            debitBalance,
            gcashBalance,
            totalIncome
        };
        localStorage.setItem('budgetData', JSON.stringify(budgetData));

        // Trigger storage event manually
        window.dispatchEvent(new Event('storage'));
    }

    // Update all displays
    function updateDisplays() {
        totalAmountDisplay.textContent = `₱ ${totalIncome.toFixed(2)}`;
        cashAmountDisplay.textContent = `₱ ${cashBalance.toFixed(2)}`;
        debitAmountDisplay.textContent = `₱ ${debitBalance.toFixed(2)}`;
        gcashAmountDisplay.textContent = `₱ ${gcashBalance.toFixed(2)}`;

        // Add delete buttons to cards if they don't exist
        addDeleteButtons();
    }

    function addDeleteButtons() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            // Check if delete button already exists
            if (!card.querySelector('.card-delete-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'card-delete-btn';
                deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                deleteBtn.addEventListener('click', function() {
                    showDeleteForm(card.id);
                });
                card.appendChild(deleteBtn);
            }
        });
    }

    function showDeleteForm(cardId) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'delete-modal';
        modal.innerHTML = `
            <div class="delete-modal-content">
                <h3>DELETE FROM ${cardId.replace('-card', '').toUpperCase()}</h3>
                <input type="number" id="delete-amount" placeholder="Enter amount to remove">
                <div class="modal-buttons">
                    <button class="confirm-delete">CONFIRM</button>
                    <button class="cancel-delete">CANCEL</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.confirm-delete').addEventListener('click', function() {
            const amount = parseFloat(modal.querySelector('#delete-amount').value);
            if (!isNaN(amount) && amount > 0) {
                deleteFromCard(cardId, amount);
            }
            modal.remove();
        });

        modal.querySelector('.cancel-delete').addEventListener('click', function() {
            modal.remove();
        });
    }

    function deleteFromCard(cardId, amount) {
        const cardType = cardId.replace('-card', '');

        // Check if enough funds exist
        if (cardType === 'cash' && amount > cashBalance) {
            alert('Insufficient funds in cash account');
            return;
        }
        if (cardType === 'debit' && amount > debitBalance) {
            alert('Insufficient funds in debit account');
            return;
        }
        if (cardType === 'gcash' && amount > gcashBalance) {
            alert('Insufficient funds in GCash account');
            return;
        }

        // Update balances
        switch(cardType) {
            case 'cash':
                cashBalance -= amount;
                break;
            case 'debit':
                debitBalance -= amount;
                break;
            case 'gcash':
                gcashBalance -= amount;
                break;
        }

        // DON'T return amount to total income
        // totalIncome += amount; // REMOVE THIS LINE

        // Save and update
        saveData();
        updateDisplays();

        // Decrease level when transaction is deleted
        decreaseLevel();
    }

    function updateLevel() {
        let currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(localStorage.getItem('currentExp')) || 0;

        // Each transaction gives 1 EXP
        currentExp += 1;

        // Level up if EXP reaches 100
        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0;
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
            currentExp = 99;
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

        if (expFill && expText) {
            const percentage = (currentExp / 100) * 100;
            expFill.style.width = `${percentage}%`;
            expText.textContent = `${currentExp} / 100 EXP`;
        }
    }

    // Prevent non-numeric input in amount field
    amountInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9.]/g, '');
    });
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