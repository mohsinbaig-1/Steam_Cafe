const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getConfig } = require("./config");
const { connectToDatabase, getUsersCollection } = require("./db");
const { validateRegistration, validateLogin } = require("./validation");

const config = getConfig();
const app = express();

app.use(cors({
    origin(origin, callback) {
        if (!origin || config.frontendOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        const error = new Error("Origin is not allowed by CORS.");
        error.statusCode = 403;
        callback(error);
    }
}));
app.use(express.json({ limit: "10kb" }));

function safeUser(user) {
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
    };
}

function validationError(errors) {
    const error = new Error("Validation failed.");
    error.statusCode = 400;
    error.details = errors;
    return error;
}

app.get("/health", async (req, res, next) => {
    try {
        await connectToDatabase(config);
        res.status(200).json({ status: "ok", database: "connected" });
    } catch (error) {
        next(error);
    }
});

app.post("/api/auth/register", async (req, res, next) => {
    try {
        const { value, errors } = validateRegistration(req.body || {});
        if (Object.keys(errors).length > 0) throw validationError(errors);

        const users = getUsersCollection();
        const existingUser = await users.findOne({ email: value.email }, { projection: { _id: 1 } });
        if (existingUser) {
            const error = new Error("An account with this email already exists.");
            error.statusCode = 409;
            error.code = "DUPLICATE_EMAIL";
            throw error;
        }

        const passwordHash = await bcrypt.hash(value.password, 12);
        const result = await users.insertOne({
            fullName: value.fullName,
            email: value.email,
            phone: value.phone,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            message: "Account created successfully.",
            user: safeUser({ _id: result.insertedId, ...value })
        });
    } catch (error) {
        if (error && error.code === 11000) {
            error.statusCode = 409;
            error.message = "An account with this email already exists.";
            error.code = "DUPLICATE_EMAIL";
        }
        next(error);
    }
});

app.post("/api/auth/login", async (req, res, next) => {
    try {
        const { value, errors } = validateLogin(req.body || {});
        if (Object.keys(errors).length > 0) throw validationError(errors);

        const user = await getUsersCollection().findOne({ email: value.email });
        const passwordMatches = user
            ? await bcrypt.compare(value.password, user.passwordHash)
            : false;
        if (!user || !passwordMatches) {
            const error = new Error("Invalid email or password.");
            error.statusCode = 401;
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        const token = jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn
        });
        res.status(200).json({ token, user: safeUser(user) });
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        res.status(400).json({ error: "Request body must be valid JSON." });
        return;
    }

    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) console.error(error);
    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal server error." : error.message,
        ...(error.details ? { details: error.details } : {})
    });
});

async function start() {
    await connectToDatabase(config);
    app.listen(config.port, () => {
        console.log(`Steam Cafe auth service listening on port ${config.port}`);
    });
}

if (require.main === module) {
    start().catch(error => {
        console.error("Unable to start authentication service.", error);
        process.exitCode = 1;
    });
}

module.exports = { app };
