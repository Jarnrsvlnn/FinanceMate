var username = document.getElementById("username");
var password = document.getElementById("password");
var error_message = document.getElementById("error-message");
var signup = document.getElementById("signup");

signup.onclick = function (event) {
    event.preventDefault();

    var usernameValue = username.value.trim();
    var passwordValue = password.value.trim();

    username.style.border = "";
    password.style.border = "";
    error_message.innerText = "";

    var error = "";

    if (usernameValue === "" && passwordValue === "") {
        error = "Please fill in all fields.";
        username.style.border = "2px solid red";
        password.style.border = "2px solid red";
    }
    else if (usernameValue === "") {
        error = "Please enter a username.";
        if (usernameValue === "") {
            username.style.border = "2px solid red";
        }
    }
    else if (passwordValue === "") {
        error = "Please enter a password.";
        if (passwordValue === "") {
            password.style.border = "2px solid red";
        }
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
        // Store the username in sessionStorage before redirecting
        sessionStorage.setItem('username', usernameValue);
        window.location.href = "dashboard.html";
        return;
    }

    error_message.innerText = error;
}
