const authMessage = document.getElementById("auth-message");

function showAuthMessage(message) {
    if (authMessage) {
        authMessage.textContent = message;
    }
}

document.getElementById("login-form")?.addEventListener("submit", event => {
    event.preventDefault();
    showAuthMessage("Login is ready for backend authentication integration.");
});

document.getElementById("register-form")?.addEventListener("submit", event => {
    event.preventDefault();
    showAuthMessage("Registration is ready for backend authentication integration.");
});
