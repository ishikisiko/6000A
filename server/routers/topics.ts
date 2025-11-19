import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createTopic,
  getTopicById,
  getActiveTopics,
  updateTopicStatus,
  createBetVote,
  getBetVotesByTopicId,
  getBetVotesByUserId,
  getUserPoints,
  updateUserPoints,
  settleTopicResults,
} from "../db";

export const topicsRouter = router({
  // Get all active topics
  list: publicProcedure
    .input(z.object({
      status: z.enum(['active', 'closed', 'settled']).optional(),
      topicType: z.enum(['bet', 'vote']).optional(),
    }).optional())
    .query(async ({ input }) => {
      if (input?.status) {
        // Filter by status if provided
        const allTopics = await getActiveTopics();
        return allTopics.filter(t => t.status === input.status && (!input.topicType || t.topicType === input.topicType));
      }
      return await getActiveTopics();
    }),

  // Get topic by ID
  getById: publicProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ input }) => {
      const topic = await getTopicById(input.topicId);
      if (!topic) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
      }
      return topic;
    }),

  // Get topic votes/bets
  getVotes: publicProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ input }) => {
      return await getBetVotesByTopicId(input.topicId);
    }),

  // Get user's votes/bets
  myVotes: protectedProcedure
    .query(async ({ ctx }) => {
      return await getBetVotesByUserId(ctx.user.id);
    }),

  // Get user points
  myPoints: protectedProcedure
    .query(async ({ ctx }) => {
      const points = await getUserPoints(ctx.user.id);
      return { points: points || 0 };
    }),

  // Create new topic (admin only)
  create: protectedProcedure
    .input(z.object({
      matchId: z.string().optional(),
      topicType: z.enum(['bet', 'vote']),
      title: z.string().min(1),
      description: z.string().optional(),
      options: z.array(z.string()).min(2),
      expiresAt: z.date(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create topics' });
      }

      const topicId = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await createTopic({
        topicId,
        matchId: input.matchId ? parseInt(input.matchId) : undefined,
        topicType: input.topicType,
        title: input.title,
        description: input.description,
        options: input.options,
        status: 'active',
        revealAt: input.expiresAt,
        createdBy: ctx.user.id,
        metadata: input.metadata || {},
      });

      return { success: true, topicId };
    }),

  // Submit vote or bet
  submit: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      choice: z.string(),
      points: z.number().int().min(1).optional(), // For bets only
      isAnonymous: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const topic = await getTopicById(input.topicId);
      
      if (!topic) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
      }

      if (topic.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Topic is not active' });
      }

      if (!topic.options.includes(input.choice)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid choice' });
      }

      // Check if user already voted/bet on this topic
      const existingVotes = await getBetVotesByUserId(ctx.user.id);
      const alreadyVoted = existingVotes.some((v: any) => v.topicId === input.topicId);
      
      if (alreadyVoted) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already participated in this topic' });
      }

      // For bets, check and deduct points
      if (topic.topicType === 'bet') {
        if (!input.points || input.points < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Points are required for bets' });
        }

        const userPointsRecord = await getUserPoints(ctx.user.id);
        const currentPoints = userPointsRecord?.points || 0;
        
        if (currentPoints < input.points) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient points' });
        }

        // Deduct points
        await updateUserPoints(ctx.user.id, currentPoints - input.points);
      }

      // Create vote/bet record with anonymized ID
      const voterAnonId = input.isAnonymous 
        ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : `user_${ctx.user.id}`;
      
      await createBetVote({
        topicId: input.topicId,
        topicType: topic.topicType,
        title: topic.title,
        description: topic.description,
        options: topic.options,
        voterAnonId,
        choice: input.choice,
        matchId: topic.matchId,
        metadata: { points: input.points || 0, userId: ctx.user.id },
      });

      return { success: true };
    }),

  // Delete topic (admin only)
  delete: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可以删除话题' });
      }

      const topic = await getTopicById(input.topicId);
      if (!topic) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '话题不存在' });
      }

      // Note: Actual deletion would be done via db function
      // For now we just close it
      await updateTopicStatus(input.topicId, 'closed');

      return { success: true };
    }),

  // Close topic (admin only)
  close: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can close topics' });
      }

      await updateTopicStatus(input.topicId, 'closed');
      return { success: true };
    }),

  // Settle topic results (admin only)
  settle: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      correctChoice: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can settle topics' });
      }

      const topic = await getTopicById(input.topicId);
      
      if (!topic) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
      }

      if (topic.status === 'revealed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Topic already settled' });
      }

      if (!topic.options.includes(input.correctChoice)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid correct choice' });
      }

      // Settle results and distribute points
      await settleTopicResults(input.topicId, input.correctChoice);

      return { success: true };
    }),

  // Get topic statistics
  stats: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ input }) => {
      const topic = await getTopicById(input.topicId);
      
      if (!topic) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
      }

      const votes = await getBetVotesByTopicId(input.topicId);
      
      // Calculate statistics
      const totalVotes = votes.length;
      const totalPoints = votes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
      
      const choiceStats = topic.options.map((option: string) => {
        const optionVotes = votes.filter(v => v.choice === option);
        const optionPoints = optionVotes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
        
        return {
          choice: option,
          votes: optionVotes.length,
          points: optionPoints,
          percentage: totalVotes > 0 ? (optionVotes.length / totalVotes * 100).toFixed(1) : '0',
        };
      });

      return {
        topicId: input.topicId,
        totalVotes,
        totalPoints,
        choiceStats,
        isAnonymous: votes.some(v => v.voterAnonId.startsWith('anon_')),
      };
    }),
});
