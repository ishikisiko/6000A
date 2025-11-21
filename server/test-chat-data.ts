
import 'dotenv/config'; // Load .env immediately
import { chatRouter } from "./routers/chat";
import { getDb } from "./db";

async function main() {
    console.log("ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);
    console.log("ANTHROPIC_BASE_URL:", process.env.ANTHROPIC_BASE_URL);

    console.log("Initializing DB...");
    await getDb();

    const caller = chatRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: null,
    });

    console.log("\n--- Test 1: General Question (should use match context) ---");
    try {
        const response = await caller.sendMessage({
            message: "What was my last match result?",
            userId: 1,
        });
        console.log("Response:", response.reply);
    } catch (error: any) {
        console.error("Error:", error);
        if (error.cause) {
            console.error("Cause:", JSON.stringify(error.cause, null, 2));
        }
    }

    console.log("\n--- Test 2: Create Topic (should use tool) ---");
    try {
        const response = await caller.sendMessage({
            message: "Create a bet on whether I will win the next game. Options: Yes, No.",
            userId: 1,
        });
        console.log("Response:", response.reply);
    } catch (error: any) {
        console.error("Error:", error);
        if (error.cause) {
            console.error("Cause:", JSON.stringify(error.cause, null, 2));
        }
    }
}

main().catch(console.error);
