import { getDb } from "./db";

async function main() {
    try {
        console.log("Attempting to connect to DB...");
        const db = await getDb();
        if (db) {
            console.log("Successfully connected to DB!");
        } else {
            console.error("Failed to connect to DB (returned null)");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error connecting to DB:", error);
        process.exit(1);
    }
}

main();
