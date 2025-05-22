// ==================== PROFILE PAGE FUNCTIONALITY ====================

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

// Also save to current user's data
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
saveCurrentDataToUser(currentUsername);
}
}

// ==================== USER PROFILE MANAGEMENT ====================

// Get user data functions (same as in validation.js)
function getAllAccounts() {
return JSON.parse(localStorage.getItem('userAccounts')) || {};
}

function saveAllAccounts(accounts) {
localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

function getCurrentUser() {
const username = sessionStorage.getItem('username');
if (!username) return null;

const accounts = getAllAccounts();
return accounts[username] || null;
}

function saveUserData(username, userData) {
const accounts = getAllAccounts();
accounts[username] = userData;
saveAllAccounts(accounts);
}

function saveCurrentDataToUser(username) {
const userData = getCurrentUser();
if (!userData) return;

// Update user data with current localStorage values
userData.budgetData = JSON.parse(localStorage.getItem('budgetData') || '{}');
userData.incomeTransactions = JSON.parse(localStorage.getItem('incomeTransactions') || '[]');
userData.expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
userData.currentLevel = parseInt(localStorage.getItem('currentLevel') || '1');
userData.currentExp = parseInt(localStorage.getItem('currentExp') || '0');
userData.selectedDate = localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0];
userData.darkTheme = localStorage.getItem('darkTheme') === 'true';

// FIXED: Only get bio from input field if we're on the profile page AND the current user owns this bio
const bioInput = document.getElementById('bio');
if (bioInput && userData.username === username) {
userData.bio = bioInput.value;
}

saveUserData(username, userData);
}

// ==================== PROFILE PAGE INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
// Initialize theme
initializeTheme();

// Check if user is logged in
const currentUsername = sessionStorage.getItem('username');
if (!currentUsername) {
// Redirect to login if not logged in
window.location.href = 'index.html';
return;
}

// FORCE CLEAR ALL FORM FIELDS FIRST - with improved clearing
forceClearAllFields();

// Longer delay to ensure clearing is complete and any auto-save timers are cleared
setTimeout(() => {
loadUserProfile();
setupBioAutoSave();
setupProfileButtons();
}, 200);
});

// IMPROVED: Enhanced form field clearing
function forceClearAllFields() {
// Clear any existing bio save timeouts first
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
window.bioSaveTimeout = null;
}

// Get all input and textarea elements
const formElements = document.querySelectorAll('input, textarea');

formElements.forEach(element => {
// Multiple ways to clear the field
element.value = '';
element.defaultValue = '';
element.textContent = '';
element.innerHTML = '';
// Remove any cached/auto-filled values
element.removeAttribute('value');
// Trigger change event to clear any listeners
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
});

// Specifically target the bio field with extra clearing
const bioInput = document.getElementById('bio');
if (bioInput) {
bioInput.value = '';
bioInput.defaultValue = '';
bioInput.textContent = '';
bioInput.innerHTML = '';
bioInput.removeAttribute('value');
// Force browser to forget any cached values
bioInput.setAttribute('autocomplete', 'off');
bioInput.blur(); // Remove focus
}
}

// IMPROVED: More robust profile loading
function loadUserProfile() {
const currentUser = getCurrentUser();
if (!currentUser) {
window.location.href = 'index.html';
return;
}

// Display username
const profileNameElement = document.querySelector('.profile-name h1');
if (profileNameElement) {
profileNameElement.textContent = currentUser.username.toUpperCase();
}

// FIXED: Load bio with proper validation and clearing
const bioInput = document.getElementById('bio');
if (bioInput) {
// Clear the field completely first
bioInput.value = '';
bioInput.textContent = '';
bioInput.innerHTML = '';
bioInput.removeAttribute('value');

// Only set the user's bio if they actually have one AND it belongs to them
if (currentUser.bio &&
currentUser.bio.trim() !== '' &&
currentUser.username === sessionStorage.getItem('username')) {

// Use a longer timeout to ensure clearing is complete
setTimeout(() => {
bioInput.value = currentUser.bio;
// Set default value to prevent browser caching issues
bioInput.defaultValue = currentUser.bio;
}, 150);
} else {
// Ensure field stays empty
setTimeout(() => {
bioInput.value = '';
bioInput.defaultValue = '';
}, 150);
}
}
}

// IMPROVED: Enhanced bio auto-save with better user validation
function setupBioAutoSave() {
const bioInput = document.getElementById('bio');
if (!bioInput) return;

// Auto-save bio as user types (with debouncing)
bioInput.addEventListener('input', function() {
// Clear previous timeout
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
}

// Set new timeout to save after 1 second of no typing
window.bioSaveTimeout = setTimeout(() => {
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
const currentUser = getCurrentUser();
// FIXED: Double-check that we're saving to the correct user
if (currentUser && currentUser.username === currentUsername) {
currentUser.bio = bioInput.value;
saveUserData(currentUsername, currentUser);
}
}
}, 1000);
});

// Also save when input loses focus
bioInput.addEventListener('blur', function() {
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
window.bioSaveTimeout = null;
}
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
const currentUser = getCurrentUser();
// FIXED: Double-check that we're saving to the correct user
if (currentUser && currentUser.username === currentUsername) {
currentUser.bio = bioInput.value;
saveUserData(currentUsername, currentUser);
}
}
});
}

function setupProfileButtons() {
// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
logoutBtn.addEventListener('click', function() {
// Show confirmation dialog
if (confirm('Are you sure you want to logout?')) {
handleLogout();
}
});
}

// Switch account button
const switchBtn = document.getElementById('switch-btn');
if (switchBtn) {
switchBtn.addEventListener('click', function() {
// FIXED: Save current user's data with proper validation before switching
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
// Clear bio save timeout to prevent cross-contamination
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
window.bioSaveTimeout = null;
}
saveCurrentDataToUser(currentUsername);
}

// Show switch account modal
if (window.showSwitchAccountModal) {
window.showSwitchAccountModal();
} else {
// Fallback if function not available
alert('Switch account functionality not available. Please refresh the page.');
}
});
}
}

function handleLogout() {
// Clear bio save timeout
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
window.bioSaveTimeout = null;
}

// Save current user's data before logout
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
saveCurrentDataToUser(currentUsername);
}

// Clear session storage
sessionStorage.clear();

// Clear localStorage (user-specific data)
const keysToRemove = [
'budgetData', 'incomeTransactions', 'expenses',
'currentLevel', 'currentExp', 'selectedDate',
'darkTheme', 'username'
];

keysToRemove.forEach(key => {
localStorage.removeItem(key);
});

// Redirect to login page
window.location.href = 'index.html';
}

// ==================== AUTO-SAVE FUNCTIONALITY ====================

// Auto-save when navigating away from page
window.addEventListener('beforeunload', function() {
// Clear bio save timeout
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
}
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
saveCurrentDataToUser(currentUsername);
}
});

// Auto-save when page visibility changes
document.addEventListener('visibilitychange', function() {
if (document.visibilityState === 'hidden') {
// Clear bio save timeout
if (window.bioSaveTimeout) {
clearTimeout(window.bioSaveTimeout);
}
const currentUsername = sessionStorage.getItem('username');
if (currentUsername) {
saveCurrentDataToUser(currentUsername);
}
}
});

// ==================== UTILITY FUNCTIONS ====================

// Check if user is authenticated (can be used by other pages)
function isUserAuthenticated() {
const username = sessionStorage.getItem('username');
if (!username) return false;

const accounts = getAllAccounts();
return accounts[username] !== undefined;
}

// Get current username
function getCurrentUsername() {
return sessionStorage.getItem('username');
}

// Make functions globally available
window.isUserAuthenticated = isUserAuthenticated;
window.getCurrentUsername = getCurrentUsername;

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

// FIXED: Save bio only if we're on profile page and it belongs to the correct user
const bioInput = document.getElementById('bio');
if (bioInput && userData.username === username) {
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


