// ==================== USER ACCOUNT MANAGEMENT SYSTEM ====================

// Simple encoding/decoding functions for basic password protection
function encodePassword(password) {
    return btoa(password + "financemate_salt");
    }
    
    function decodePassword(encodedPassword) {
    try {
    return atob(encodedPassword).replace("financemate_salt", "");
    } catch (e) {
    return null;
    }
    }
    
    // Get all user accounts from localStorage
    function getAllAccounts() {
    return JSON.parse(localStorage.getItem('userAccounts')) || {};
    }
    
    // Save all accounts to localStorage
    function saveAllAccounts(accounts) {
    localStorage.setItem('userAccounts', JSON.stringify(accounts));
    }
    
    // Get current user data
    function getCurrentUser() {
    const username = sessionStorage.getItem('username');
    if (!username) return null;
    
    const accounts = getAllAccounts();
    return accounts[username] || null;
    }
    
    // Save user data
    function saveUserData(username, userData) {
    const accounts = getAllAccounts();
    accounts[username] = userData;
    saveAllAccounts(accounts);
    }
    
    // Initialize user data structure
    function initializeUserData(username) {
    return {
    username: username,
    budgetData: {
    cashBalance: 0,
    debitBalance: 0,
    gcashBalance: 0,
    totalIncome: 0
    },
    incomeTransactions: [],
    expenses: [],
    currentLevel: 1,
    currentExp: 0,
    selectedDate: new Date().toISOString().split('T')[0],
    darkTheme: false
    };
    }
    
    // Load user-specific data to localStorage (for the finance app to read)
    function loadUserDataToStorage(userData) {
    // Clear previous user's data
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
    
    // Set username in localStorage for the finance app
    localStorage.setItem('username', userData.username);
    }
    
    // Save current data to user account
    function saveCurrentDataToUser(username) {
    const userData = getCurrentUser();
    if (!userData || userData.username !== username) return;
    
    // Update user data with current localStorage values
    userData.budgetData = JSON.parse(localStorage.getItem('budgetData') || '{}');
    userData.incomeTransactions = JSON.parse(localStorage.getItem('incomeTransactions') || '[]');
    userData.expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    userData.currentLevel = parseInt(localStorage.getItem('currentLevel') || '1');
    userData.currentExp = parseInt(localStorage.getItem('currentExp') || '0');
    userData.selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
    userData.darkTheme = localStorage.getItem('darkTheme') === 'true';
    
    saveUserData(username, userData);
    }
    
    // ==================== FORM VALIDATION AND AUTHENTICATION ====================
    
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var error_message = document.getElementById("error-message");
    var signup = document.getElementById("signup");
    
    // Check if we're on signup or login page
    const isSignupPage = document.querySelector('.form-text p').textContent.includes('REGISTER');
    
    signup.onclick = function (event) {
    event.preventDefault();
    
    var usernameValue = username.value.trim();
    var passwordValue = password.value.trim();
    
    // Reset styles
    username.style.border = "";
    password.style.border = "";
    error_message.innerText = "";
    
    var error = "";
    
    // Basic validation
    if (usernameValue === "" && passwordValue === "") {
    error = "Please fill in all fields.";
    username.style.border = "2px solid red";
    password.style.border = "2px solid red";
    }
    else if (usernameValue === "") {
    error = "Please enter a username.";
    username.style.border = "2px solid red";
    }
    else if (passwordValue === "") {
    error = "Please enter a password.";
    password.style.border = "2px solid red";
    }
    else if (usernameValue.length < 3 || passwordValue.length < 6) {
    error = "Username must be at least 3 characters and password at least 6 characters.";
    if (usernameValue.length < 3) {
    username.style.border = "2px solid red";
    }
    if (passwordValue.length < 6) {
    password.style.border = "2px solid red";
    }
    }
    else {
    // Handle signup or login
    if (isSignupPage) {
    handleSignup(usernameValue, passwordValue);
    } else {
    handleLogin(usernameValue, passwordValue);
    }
    return;
    }
    
    error_message.innerText = error;
    }
    
    function handleSignup(usernameValue, passwordValue) {
    const accounts = getAllAccounts();
    
    // Check if username already exists
    if (accounts[usernameValue]) {
    error_message.innerText = "Username already exists. Please choose a different username.";
    username.style.border = "2px solid red";
    return;
    }
    
    // Create new user account
    const newUserData = initializeUserData(usernameValue);
    newUserData.password = encodePassword(passwordValue);
    
    // Save the new account
    saveUserData(usernameValue, newUserData);
    
    // Set current session
    sessionStorage.setItem('username', usernameValue);
    
    // Load user data to localStorage
    loadUserDataToStorage(newUserData);
    
    // Redirect to dashboard
    window.location.href = "dashboard.html";
    }
    
    function handleLogin(usernameValue, passwordValue) {
    const accounts = getAllAccounts();
    
    // Check if username exists
    if (!accounts[usernameValue]) {
    error_message.innerText = "Username not found. Please sign up first.";
    username.style.border = "2px solid red";
    return;
    }
    
    // Check password
    const storedPassword = decodePassword(accounts[usernameValue].password);
    if (storedPassword !== passwordValue) {
    error_message.innerText = "Incorrect password.";
    password.style.border = "2px solid red";
    return;
    }
    
    // Set current session
    sessionStorage.setItem('username', usernameValue);
    
    // Load user data to localStorage
    loadUserDataToStorage(accounts[usernameValue]);
    
    // Redirect to dashboard
    window.location.href = "dashboard.html";
    }
    
    // ==================== AUTO-SAVE FUNCTIONALITY ====================
    
    // Auto-save user data when navigating between pages
    window.addEventListener('beforeunload', function() {
    const currentUsername = sessionStorage.getItem('username');
    if (currentUsername) {
    saveCurrentDataToUser(currentUsername);
    }
    });
    
    // Auto-save when page visibility changes (tab switching, minimizing, etc.)
    document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
    const currentUsername = sessionStorage.getItem('username');
    if (currentUsername) {
    saveCurrentDataToUser(currentUsername);
    }
    }
    });
    
    // Auto-save every 10 seconds for active sessions
    setInterval(function() {
    const currentUsername = sessionStorage.getItem('username');
    if (currentUsername && document.visibilityState === 'visible') {
    saveCurrentDataToUser(currentUsername);
    }
    }, 10000);
    
    // ==================== SWITCH ACCOUNT FUNCTIONALITY ====================
    
    function showSwitchAccountModal() {
    const accounts = getAllAccounts();
    const accountNames = Object.keys(accounts);
    
    if (accountNames.length === 0) {
    alert('No accounts found. Please sign up first.');
    return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'switch-account-modal';
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    `;
    
    modal.innerHTML = `
    <div class="switch-modal-content" style="
    background-color: #fff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    width: 90%;
    max-width: 400px;
    text-align: center;
    ">
    <h2 style="margin-top: 0; color: #333; font-family: 'Press Start 2P', sans-serif; font-size: 16px;">SWITCH ACCOUNT</h2>
    <form id="switch-account-form">
    <input type="text" id="switch-username" placeholder="Enter username" style="
    width: 90%;
    padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    border: 2px solid #ddd;
    font-size: 14px;
    ">
    <input type="password" id="switch-password" placeholder="Enter password" style="
    width: 90%;
    padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    border: 2px solid #ddd;
    font-size: 14px;
    ">
    <p id="switch-error-message" style="color: red; font-size: 12px; margin: 10px 0;"></p>
    <div style="display: flex; justify-content: space-around; margin-top: 20px;">
    <button type="submit" style="
    padding: 12px 24px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'Press Start 2P', sans-serif;
    font-size: 10px;
    ">SWITCH</button>
    <button type="button" id="cancel-switch" style="
    padding: 12px 24px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'Press Start 2P', sans-serif;
    font-size: 10px;
    ">CANCEL</button>
    </div>
    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Available accounts:</p>
    <p style="font-size: 11px; color: #888;">${accountNames.join(', ')}</p>
    </div>
    </form>
    </div>
    `;
    
    document.body.appendChild(modal);
    
    // Apply dark theme if active
    if (document.body.classList.contains('dark-theme')) {
    const modalContent = modal.querySelector('.switch-modal-content');
    modalContent.style.backgroundColor = '#333';
    modalContent.style.color = '#fff';
    
    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
    input.style.backgroundColor = '#444';
    input.style.color = '#fff';
    input.style.borderColor = '#555';
    });
    
    const h2 = modal.querySelector('h2');
    h2.style.color = '#fff';
    }
    
    // Focus on username input
    setTimeout(() => {
    modal.querySelector('#switch-username').focus();
    }, 100);
    
    // Handle form submission
    modal.querySelector('#switch-account-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const switchUsername = modal.querySelector('#switch-username').value.trim();
    const switchPassword = modal.querySelector('#switch-password').value.trim();
    const errorMessage = modal.querySelector('#switch-error-message');
    
    // Reset styles
    modal.querySelector('#switch-username').style.border = '2px solid #ddd';
    modal.querySelector('#switch-password').style.border = '2px solid #ddd';
    errorMessage.innerText = '';
    
    if (!switchUsername || !switchPassword) {
    errorMessage.innerText = 'Please fill in both fields.';
    if (!switchUsername) modal.querySelector('#switch-username').style.border = '2px solid red';
    if (!switchPassword) modal.querySelector('#switch-password').style.border = '2px solid red';
    return;
    }
    
    const accounts = getAllAccounts();
    
    if (!accounts[switchUsername]) {
    errorMessage.innerText = 'Username not found.';
    modal.querySelector('#switch-username').style.border = '2px solid red';
    return;
    }
    
    const storedPassword = decodePassword(accounts[switchUsername].password);
    if (storedPassword !== switchPassword) {
    errorMessage.innerText = 'Incorrect password.';
    modal.querySelector('#switch-password').style.border = '2px solid red';
    return;
    }
    
    // Enhanced account switching with proper data isolation
    const currentUsername = sessionStorage.getItem('username');
    if (currentUsername) {
    // Save current user's data
    saveCurrentDataToUser(currentUsername);
    }
    
    // Complete data clearing before switching
    const keysToRemove = [
    'budgetData', 'incomeTransactions', 'expenses',
    'currentLevel', 'currentExp', 'selectedDate',
    'darkTheme', 'username'
    ];
    
    keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    });
    
    // Switch to new account
    sessionStorage.setItem('username', switchUsername);
    loadUserDataToStorage(accounts[switchUsername]);
    
    modal.remove();
    
    // Complete page refresh with cache busting
    window.location.replace(window.location.href.split('?')[0] + '?switch=' + Date.now());
    });
    
    // Handle cancel button
    modal.querySelector('#cancel-switch').addEventListener('click', function() {
    modal.remove();
    });
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
    modal.remove();
    document.removeEventListener('keydown', escHandler);
    }
    });
    }
    
    // Make function globally available
    window.showSwitchAccountModal = showSwitchAccountModal;
    
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
    
    // Save updated data
    accounts[username] = userData;
    localStorage.setItem('userAccounts', JSON.stringify(accounts));
    }
    
    // Make functions globally available
    window.checkAuthentication = checkAuthentication;
    window.ensureUserDataLoaded = ensureUserDataLoaded;
    window.saveCurrentDataToUser = saveCurrentDataToUser;