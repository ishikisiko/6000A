import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { getMatchesByUserId, getActiveTopics, createTopic, getUserPoints } from "../db";
import { nanoid } from "nanoid";

// Initialize Anthropic client
// Note: Ensure ANTHROPIC_API_KEY is set in your environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      message: z.string(),
      userId: z.number().optional().default(1), // Default to user 1 for now
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      console.log("[Chat] Received message:", input.message);
      try {
        // 1. Fetch Context Data
        console.log("[Chat] Fetching context data...");
        const [recentMatches, activeTopics, userPoints] = await Promise.all([
          getMatchesByUserId(input.userId, 10),
          getActiveTopics(),
          getUserPoints(input.userId)
        ]);
        console.log(`[Chat] Found ${recentMatches.length} matches, ${activeTopics.length} topics, and ${userPoints?.points ?? 0} points.`);

        const matchContext = recentMatches.map(m =>
          `- Match ${m.matchId}: ${m.game} on ${m.map}, Result: ${m.metadata ? JSON.stringify(m.metadata) : 'N/A'}`
        ).join('\n');

        const topicContext = activeTopics.map(t =>
          `- Topic: ${t.title} (ID: ${t.topicId}, Status: ${t.status}) -> Link: /topic/${t.topicId}`
        ).join('\n');

        const pointsContext = userPoints 
          ? `Points: ${userPoints.points}\nBadges: ${userPoints.badges?.join(', ') || 'None'}\nStreak: ${userPoints.streak}`
          : "Points: 0\nBadges: None\nStreak: 0";

        const systemPrompt = `You are a helpful FPS coach assistant.
        
Current User Context:
User Profile:
${pointsContext}

Recent Matches (Last 10):
${matchContext || "No recent matches found."}

Active Voting Topics:
${topicContext || "No active topics."}

You can answer questions about the user's performance, their points/badges, or help them create new voting topics (bets/votes) for the community.

IMPORTANT:
1. If referencing a specific topic, ALWAYS use the link format: /topic/TOPIC_ID (e.g., /topic/${activeTopics[0]?.topicId || '123'}). Do NOT use /topics/TOPIC_ID.
2. If the user asks to create a topic, vote, or bet, you MUST return a JSON object in the following format (and nothing else):
\`\`\`json
{
  "tool": "create_topic",
  "title": "The question or title",
  "description": "Short description",
  "options": ["Option1", "Option2"],
  "type": "vote" or "bet",
  "revealInHours": 24
}
\`\`\`
If the user is just asking a question, just answer normally in text.
`;

        const messages: Anthropic.MessageParam[] = [
          ...input.history.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          {
            role: "user",
            content: input.message
          }
        ];

        console.log("[Chat] Calling Anthropic API...");
        const response = await anthropic.messages.create({
          model: "MiniMax-M2",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages,
        });
        console.log("[Chat] Anthropic response received.");

        let replyText = "";
        for (const block of response.content) {
          if (block.type === 'text') {
            replyText += block.text;
          }
        }

        // Check for JSON in the response
        const jsonMatch = replyText.match(/```json\n([\s\S]*?)\n```/) || replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const data = JSON.parse(jsonStr);

            if (data.tool === "create_topic") {
              console.log("[Chat] Creating topic:", data.title);
              const newTopic = await createTopic({
                topicId: nanoid(),
                matchId: recentMatches[0]?.id, // Associate with latest match if available
                topicType: data.type,
                title: data.title,
                description: data.description || "",
                options: data.options,
                createdBy: input.userId,
                status: 'active',
                revealAt: new Date(Date.now() + (data.revealInHours || 24) * 60 * 60 * 1000),
              });

              return {
                reply: `✅ Created new ${data.type}: "${data.title}" with options: ${data.options.join(", ")}`
              };
            }
          } catch (e) {
            console.warn("Failed to parse JSON from LLM:", e);
            // Fallthrough to return the text
          }
        }

        return {
          reply: replyText,
        };
      } catch (error: any) {
        console.error("Error calling Anthropic API:", error);
        if (error.response) {
          console.error("API Response:", error.response.data);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to communicate with the AI service.",
          cause: error,
        });
      }
    }),
});
