import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { upsertUser, getUserByOpenId } from "../db";

export const devRouter = router({
    login: publicProcedure
        .input(z.object({
            username: z.string().min(1),
        }))
        .mutation(async ({ input, ctx }) => {
            const openId = `dev_${input.username}`;

            // Create or update user
            await upsertUser({
                openId,
                name: input.username,
                email: null,
                loginMethod: 'dev',
                lastSignedIn: new Date(),
                role: 'admin', // Default to admin for dev convenience
            });

            const user = await getUserByOpenId(openId);

            if (!user) {
                throw new Error("Failed to create user");
            }

            // Create session
            const sessionToken = await sdk.createSessionToken(openId, {
                name: input.username,
            });

            // Set cookie
            const cookieOptions = getSessionCookieOptions(ctx.req);
            console.log("[Login] Setting cookie with options:", cookieOptions);
            ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

            return user;
        }),
});
