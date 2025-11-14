import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { initializeDiscordBot, shutdownDiscordBot, getDiscordClient } from "./bot";

export const discordRouter = router({
  // Get bot status
  status: protectedProcedure
    .query(async () => {
      const client = getDiscordClient();
      
      if (!client || !client.isReady()) {
        return {
          active: false,
          status: 'offline',
        };
      }

      return {
        active: true,
        status: 'online',
        username: client.user?.tag,
        guilds: client.guilds.cache.size,
      };
    }),

  // Start bot
  start: protectedProcedure
    .input(z.object({
      token: z.string().min(1, 'Discord Bot Token is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admin can start bot
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can start the Discord bot' });
      }

      const client = getDiscordClient();
      if (client && client.isReady()) {
        return {
          success: true,
          message: 'Bot is already running',
        };
      }

      try {
        await initializeDiscordBot(input.token);
        return {
          success: true,
          message: 'Discord bot started successfully',
        };
      } catch (error: any) {
        console.error('[Discord] Failed to start bot:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to start bot: ${error.message}`,
        });
      }
    }),

  // Stop bot
  stop: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admin can stop bot
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can stop the Discord bot' });
      }

      const client = getDiscordClient();
      if (!client) {
        return {
          success: true,
          message: 'Bot is not running',
        };
      }

      try {
        await shutdownDiscordBot();
        return {
          success: true,
          message: 'Discord bot stopped successfully',
        };
      } catch (error: any) {
        console.error('[Discord] Failed to stop bot:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to stop bot: ${error.message}`,
        });
      }
    }),
});
