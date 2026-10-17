const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateRegistration(body) {
    const fullName = normalizeText(body.fullName || body.name);
    const email = normalizeText(body.email).toLowerCase();
    const phone = normalizeText(body.phone);
    const password = typeof body.password === "string" ? body.password : "";
    const errors = {};

    if (!fullName) errors.fullName = "Full name is required.";
    if (!email) errors.email = "Email is required.";
    else if (!emailPattern.test(email)) errors.email = "Enter a valid email address.";
    if (!phone) errors.phone = "Phone is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";

    return { value: { fullName, email, phone, password }, errors };
}

function validateLogin(body) {
    const email = normalizeText(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const errors = {};

    if (!email) errors.email = "Email is required.";
    else if (!emailPattern.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";

    return { value: { email, password }, errors };
}

module.exports = { validateRegistration, validateLogin };

