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

initializeTheme();