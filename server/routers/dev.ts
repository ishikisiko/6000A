import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { upsertUser, getUserByOpenId, getUserPoints } from "../db";

export const devRouter = router({
    login: publicProcedure
        .input(z.object({
            username: z.string().min(1),
        }))
        .mutation(async ({ input, ctx }) => {
            const username = input.username.trim();
            // Use lowercase for the ID to make it case-insensitive
            const openId = `dev_${username.toLowerCase()}`;

            // Create or update user
            // We keep the original display name (input.username) but use the lowercased ID
            await upsertUser({
                openId,
                name: username,
                email: null,
                loginMethod: 'dev',
                lastSignedIn: new Date(),
                role: 'admin', // Default to admin for dev convenience
            });

            const user = await getUserByOpenId(openId);

            if (!user) {
                throw new Error("Failed to create user");
            }
            
            // Fetch user points
            const userPointsData = await getUserPoints(user.id);

            // Create session
            const sessionToken = await sdk.createSessionToken(openId, {
                name: input.username,
            });

            // Set cookie
            const cookieOptions = getSessionCookieOptions(ctx.req);
            console.log("[Login] Setting cookie with options:", cookieOptions);
            ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

            return {
                ...user,
                points: userPointsData?.points ?? 1000, // Attach points to the user object
            };
        }),
});
