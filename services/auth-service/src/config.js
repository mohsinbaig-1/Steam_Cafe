const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

function requiredSecret(value) {
    if (!value || value === "replace-this-with-a-long-random-secret") {
        throw new Error("JWT_SECRET must be set to a non-placeholder secret.");
    }
    return value;
}

function getConfig() {
    return {
        port: Number.parseInt(process.env.PORT || "4000", 10),
        mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
        databaseName: process.env.MONGODB_DB_NAME || "steam_cafe",
        jwtSecret: requiredSecret(process.env.JWT_SECRET),
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
        frontendOrigins: (process.env.FRONTEND_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
            .split(",")
            .map(origin => origin.trim())
            .filter(Boolean)
    };
}

module.exports = { getConfig };

