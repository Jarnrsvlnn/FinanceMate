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
    // Store theme preference in localStorage instead of sessionStorage
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

    // Load data from sessionStorage
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

        // Save to sessionStorage
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

    // Load data from sessionStorage
    function loadData() {
        const budgetData = JSON.parse(sessionStorage.getItem('budgetData')) || {};

        // Use stored totalIncome if it exists, otherwise calculate from transactions
        totalIncome = budgetData.totalIncome !== undefined ? budgetData.totalIncome :
            (JSON.parse(sessionStorage.getItem('incomeTransactions')) || [])
            .reduce((total, transaction) => total + parseFloat(transaction.amount), 0);

        cashBalance = budgetData.cashBalance || 0;
        debitBalance = budgetData.debitBalance || 0;
        gcashBalance = budgetData.gcashBalance || 0;
    }

    // Save data to sessionStorage
    function saveData() {
        const budgetData = {
            cashBalance,
            debitBalance,
            gcashBalance,
            totalIncome
        };
        sessionStorage.setItem('budgetData', JSON.stringify(budgetData));

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
        let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1;
        let currentExp = parseInt(sessionStorage.getItem('currentExp')) || 0;

        // Each transaction gives 1 EXP
        currentExp += 1;

        // Level up if EXP reaches 100
        if (currentExp >= 100) {
            currentLevel += 1;
            currentExp = 0;
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
            currentExp = 99;
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

    // Prevent non-numeric input in amount field
    amountInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9.]/g, '');
    });
});