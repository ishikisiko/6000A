import 'dotenv/config';
import Anthropic from "@anthropic-ai/sdk";

async function testLLM() {
    console.log("Testing LLM connection...");
    console.log("Base URL:", process.env.ANTHROPIC_BASE_URL);
    console.log("API Key present:", !!process.env.ANTHROPIC_API_KEY);

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("Error: ANTHROPIC_API_KEY is missing.");
        return;
    }

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
    });

    try {
        console.log("Sending request to MiniMax-M2...");
        const response = await anthropic.messages.create({
            model: "MiniMax-M2",
            max_tokens: 1000,
            system: "You are a helpful assistant.",
            messages: [
                {
                    role: "user",
                    content: "Hello, this is a test message. Are you working?"
                }
            ],
        });

        console.log("Response received:");
        for (const block of response.content) {
            if (block.type === 'text') {
                console.log(block.text);
            }
        }
        console.log("\nTest completed successfully.");
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testLLM();
