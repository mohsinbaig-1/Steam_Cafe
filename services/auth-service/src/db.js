const { MongoClient } = require("mongodb");

let client;
let database;

async function connectToDatabase(config) {
    if (database) return database;

    client = new MongoClient(config.mongodbUri);
    await client.connect();
    database = client.db(config.databaseName);
    await database.collection("users").createIndex({ email: 1 }, { unique: true });
    return database;
}

function getUsersCollection() {
    if (!database) {
        throw new Error("MongoDB connection has not been established.");
    }
    return database.collection("users");
}

async function closeDatabase() {
    if (client) {
        await client.close();
        client = undefined;
        database = undefined;
    }
}

module.exports = {
    connectToDatabase,
    getUsersCollection,
    closeDatabase
};

