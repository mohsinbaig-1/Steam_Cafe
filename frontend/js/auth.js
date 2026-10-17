(function () {
    "use strict";

    const rememberedEmailKey = "steamCafeRememberedEmail";
    const authApiBaseUrl = window.STEAM_CAFE_AUTH_API_URL || "http://localhost:4000";

    function setFieldError(input, message) {
        const errorElement = document.getElementById(`${input.id}-error`);
        input.setAttribute("aria-invalid", message ? "true" : "false");
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function setFormMessage(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message${type ? ` ${type}` : ""}`;
    }

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    async function requestAuth(path, payload) {
        const response = await fetch(`${authApiBaseUrl}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(data.error || "The authentication service could not complete the request.");
            error.status = response.status;
            throw error;
        }
        return data;
    }

    function setupPasswordToggles() {
        document.querySelectorAll(".password-toggle").forEach(button => {
            button.addEventListener("click", () => {
                const input = document.getElementById(button.dataset.passwordTarget);
                if (!input) return;
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
                button.setAttribute("aria-pressed", String(isPassword));
                const icon = button.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-eye", !isPassword);
                    icon.classList.toggle("fa-eye-slash", isPassword);
                }
            });
        });
    }

    function setupLogin() {
        const form = document.getElementById("login-form");
        if (!form) return;

        const email = document.getElementById("login-email");
        const password = document.getElementById("login-password");
        const rememberMe = document.getElementById("remember-me");
        const message = document.getElementById("login-message");

        try {
            const rememberedEmail = localStorage.getItem(rememberedEmailKey);
            if (rememberedEmail && validateEmail(rememberedEmail)) {
                email.value = rememberedEmail;
                rememberMe.checked = true;
            }
        } catch (error) {
            console.error("Unable to read remembered login details.", error);
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();
            setFieldError(email, "");
            setFieldError(password, "");
            setFormMessage(message, "", "");

            let valid = true;
            if (!email.value.trim()) {
                setFieldError(email, "Please enter your email address.");
                valid = false;
            } else if (!validateEmail(email.value.trim())) {
                setFieldError(email, "Please enter a valid email address.");
                valid = false;
            }
            if (!password.value) {
                setFieldError(password, "Please enter your password.");
                valid = false;
            }
            if (!valid) {
                setFormMessage(message, "Please correct the highlighted fields.", "error");
                return;
            }

            const submitButton = form.querySelector("button[type='submit']");
            submitButton.disabled = true;
            setFormMessage(message, "Signing you in...", "");
            try {
                const data = await requestAuth("/api/auth/login", {
                    email: email.value.trim(),
                    password: password.value
                });
                try {
                    if (rememberMe.checked) localStorage.setItem(rememberedEmailKey, email.value.trim());
                    else localStorage.removeItem(rememberedEmailKey);
                    sessionStorage.setItem("steamCafeAuthToken", data.token);
                    sessionStorage.setItem("steamCafeUser", JSON.stringify(data.user));
                } catch (storageError) {
                    console.error("Unable to save session details.", storageError);
                }
                setFormMessage(message, "Login successful.", "success");
            } catch (error) {
                setFormMessage(message, error.message, "error");
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    function setupRegistration() {
        const form = document.getElementById("register-form");
        if (!form) return;

        const name = document.getElementById("register-name");
        const email = document.getElementById("register-email");
        const phone = document.getElementById("register-phone");
        const password = document.getElementById("register-password");
        const confirmation = document.getElementById("register-confirm-password");
        const message = document.getElementById("register-message");

        form.addEventListener("submit", async event => {
            event.preventDefault();
            [name, email, phone, password, confirmation].forEach(input => setFieldError(input, ""));
            setFormMessage(message, "", "");

            let valid = true;
            if (!name.value.trim()) {
                setFieldError(name, "Please enter your full name.");
                valid = false;
            }
            if (!email.value.trim()) {
                setFieldError(email, "Please enter your email address.");
                valid = false;
            } else if (!validateEmail(email.value.trim())) {
                setFieldError(email, "Please enter a valid email address.");
                valid = false;
            }
            if (!phone.value.trim()) {
                setFieldError(phone, "Please enter your phone number.");
                valid = false;
            }
            if (!password.value) {
                setFieldError(password, "Please create a password.");
                valid = false;
            } else if (password.value.length < 6) {
                setFieldError(password, "Password must be at least 6 characters.");
                valid = false;
            }
            if (!confirmation.value) {
                setFieldError(confirmation, "Please confirm your password.");
                valid = false;
            } else if (confirmation.value !== password.value) {
                setFieldError(confirmation, "Passwords do not match.");
                valid = false;
            }
            if (!valid) {
                setFormMessage(message, "Please correct the highlighted fields.", "error");
                return;
            }

            const submitButton = form.querySelector("button[type='submit']");
            submitButton.disabled = true;
            setFormMessage(message, "Creating your account...", "");
            try {
                await requestAuth("/api/auth/register", {
                    fullName: name.value.trim(),
                    email: email.value.trim(),
                    phone: phone.value.trim(),
                    password: password.value
                });
                setFormMessage(message, "Account created. You can now log in.", "success");
                form.reset();
            } catch (error) {
                setFormMessage(message, error.message, "error");
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    setupPasswordToggles();
    setupLogin();
    setupRegistration();
})();
