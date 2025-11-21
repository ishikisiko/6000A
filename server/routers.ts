import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { discordRouter } from "./discord/routes";
import { topicsRouter } from "./routers/topics";
import { devRouter } from "./routers/dev";
import { chatRouter } from "./routers/chat";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createMatch, getMatchById, getMatchByMatchId, getMatchesByUserId,
  createPhase, getPhasesByMatchId,
  createEvent, getEventsByMatchId,
  createTTDSample, getTTDSamplesByMatchId,
  createVoiceTurn, getVoiceTurnsByMatchId,
  createCombo, getCombosByMatchId,
  createTopic, getTopicByTopicId, getActiveTopics,
  createBetVote, getBetVotesByTopicId,
  getUserPoints, updateUserPoints,
  createProcessingTask, getProcessingTaskByTaskId, updateProcessingTask,
  createAuditLog,
  createConsent, getUserConsents,
  createDataRetention, getExpiredDataRetentions
} from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  discord: discordRouter,
  topics: topicsRouter,
  dev: devRouter,
  chat: chatRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) {
        // Ensure user has points record, grant 1000 initial points if new
        const points = await getUserPoints(ctx.user.id);
        if (!points) {
          await updateUserPoints(ctx.user.id, 1000);
        }
      }
      return ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Match management
  match: router({
    create: protectedProcedure
      .input(z.object({
        matchId: z.string(),
        game: z.string(),
        map: z.string(),
        teamIds: z.array(z.string()),
        startTs: z.date(),
        endTs: z.date(),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const match = await createMatch({
          ...input,
          userId: ctx.user.id,
        });

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "match_create",
          resourceType: "match",
          resourceId: match.id,
          details: { matchId: match.matchId },
        });

        // Create data retention policy (default 30 days)
        const deleteAt = new Date();
        deleteAt.setDate(deleteAt.getDate() + 30);
        await createDataRetention({
          matchId: match.id,
          retentionDays: 30,
          deleteAt,
          frozen: false,
        });

        return match;
      }),

    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return await getMatchesByUserId(ctx.user.id, input.limit);
      }),

    get: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        matchId: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (input.id) {
          const match = await getMatchById(input.id);
          if (match && match.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
          }
          return match;
        }
        if (input.matchId) {
          const match = await getMatchByMatchId(input.matchId);
          if (match && match.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
          }
          return match;
        }
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Either id or matchId is required' });
      }),
  }),

  // Phase analysis
  phase: router({
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await getPhasesByMatchId(input.matchId);
      }),
  }),

  // Event tracking
  event: router({
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        startTs: z.date().optional(),
        endTs: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await getEventsByMatchId(input.matchId, input.startTs, input.endTs);
      }),
  }),

  // TTD analysis
  ttd: router({
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        phaseId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await getTTDSamplesByMatchId(input.matchId, input.phaseId);
      }),

    analyze: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        phaseId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        const samples = await getTTDSamplesByMatchId(input.matchId, input.phaseId);

        if (samples.length === 0) {
          return {
            p50: 0,
            p90: 0,
            mean: 0,
            count: 0,
          };
        }

        const sorted = samples.map(s => s.ttdMs).sort((a, b) => a - b);
        const p50Index = Math.floor(sorted.length * 0.5);
        const p90Index = Math.floor(sorted.length * 0.9);
        const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;

        return {
          p50: sorted[p50Index],
          p90: sorted[p90Index],
          mean,
          count: sorted.length,
        };
      }),
  }),

  // Voice quality analysis
  voice: router({
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await getVoiceTurnsByMatchId(input.matchId);
      }),

    analyze: protectedProcedure
      .input(z.object({
        matchId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        const turns = await getVoiceTurnsByMatchId(input.matchId);

        if (turns.length === 0) {
          return {
            avgClarity: 0,
            avgInfoDensity: 0,
            interruptionRate: 0,
            totalTurns: 0,
          };
        }

        const avgClarity = turns.reduce((sum, t) => sum + (t.clarity || 0), 0) / turns.length;
        const avgInfoDensity = turns.reduce((sum, t) => sum + (t.infoDensity || 0), 0) / turns.length;
        const interruptions = turns.filter(t => t.interruption).length;
        const interruptionRate = interruptions / turns.length;

        return {
          avgClarity,
          avgInfoDensity,
          interruptionRate,
          totalTurns: turns.length,
        };
      }),
  }),

  // Team collaboration
  collab: router({
    list: protectedProcedure
      .input(z.object({
        matchId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await getCombosByMatchId(input.matchId);
      }),
  }),

  // Topic management (betting/voting)
  topic: router({
    create: protectedProcedure
      .input(z.object({
        topicId: z.string(),
        matchId: z.number().optional(),
        topicType: z.enum(['bet', 'vote']),
        title: z.string(),
        description: z.string().optional(),
        options: z.array(z.string()),
        revealAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const topic = await createTopic({
          ...input,
          createdBy: ctx.user.id,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "topic_create",
          resourceType: "topic",
          resourceId: topic.id,
          details: { topicId: topic.topicId, topicType: topic.topicType },
        });

        return topic;
      }),

    list: protectedProcedure
      .input(z.object({
        matchId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await getActiveTopics(input.matchId);
      }),

    get: protectedProcedure
      .input(z.object({
        topicId: z.string(),
      }))
      .query(async ({ input }) => {
        return await getTopicByTopicId(input.topicId);
      }),

    vote: protectedProcedure
      .input(z.object({
        topicId: z.string(),
        choice: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const topic = await getTopicByTopicId(input.topicId);
        if (!topic) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
        }

        if (topic.status !== 'active') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Topic is not active' });
        }

        // Create anonymized voter ID (hash of user ID + topic ID)
        const crypto = require('crypto');
        const voterAnonId = crypto.createHash('sha256').update(`${ctx.user.id}-${input.topicId}`).digest('hex');

        const betVote = await createBetVote({
          topicId: input.topicId,
          matchId: topic.matchId,
          topicType: topic.topicType,
          title: topic.title,
          description: topic.description,
          options: topic.options,
          voterAnonId,
          choice: input.choice,
        });

        // Award participation points
        await updateUserPoints(ctx.user.id, 1);

        return betVote;
      }),

    results: protectedProcedure
      .input(z.object({
        topicId: z.string(),
      }))
      .query(async ({ input }) => {
        const topic = await getTopicByTopicId(input.topicId);
        if (!topic) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Topic not found' });
        }

        if (topic.status !== 'revealed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Results not yet revealed' });
        }

        const votes = await getBetVotesByTopicId(input.topicId);

        const results: Record<string, number> = {};
        topic.options.forEach(opt => results[opt] = 0);

        votes.forEach(vote => {
          if (results[vote.choice] !== undefined) {
            results[vote.choice]++;
          }
        });

        return {
          topic,
          results,
          totalVotes: votes.length,
        };
      }),
  }),

  // User points and gamification
  points: router({
    get: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserPoints(ctx.user.id);
      }),
  }),

  // Processing tasks
  task: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        matchId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        return await createProcessingTask({
          taskId: input.taskId,
          matchId: input.matchId,
          status: 'pending',
        });
      }),

    get: protectedProcedure
      .input(z.object({
        taskId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const task = await getProcessingTaskByTaskId(input.taskId);
        if (!task) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
        }

        const match = await getMatchById(task.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        return task;
      }),
  }),

  // AI-powered analysis
  analysis: router({
    generateSummary: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        persona: z.enum(['coach', 'hype', 'analyst', 'casual']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const match = await getMatchById(input.matchId);
        if (!match || match.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        const phases = await getPhasesByMatchId(input.matchId);
        const ttdAnalysis = await getTTDSamplesByMatchId(input.matchId);
        const voiceAnalysis = await getVoiceTurnsByMatchId(input.matchId);

        const persona = input.persona || 'coach';
        const personaPrompts = {
          coach: "You are an experienced FPS coach. Provide constructive feedback and actionable advice.",
          hype: "You are an enthusiastic hype person. Celebrate wins and motivate the team.",
          analyst: "You are a data analyst. Focus on statistics and objective observations.",
          casual: "You are a friendly teammate. Keep it casual and supportive.",
        };

        const prompt = `${personaPrompts[persona]}

Analyze this FPS match:
- Game: ${match.game}
- Map: ${match.map}
- Phases detected: ${phases.length}
- TTD samples: ${ttdAnalysis.length}
- Voice turns: ${voiceAnalysis.length}

Provide a concise summary (max 200 words) with 3 actionable recommendations.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: personaPrompts[persona] },
            { role: "user", content: prompt },
          ],
        });

        const summary = response.choices[0].message.content;

        return {
          summary,
          persona,
        };
      }),
  }),

  // Consent management
  consent: router({
    grant: protectedProcedure
      .input(z.object({
        consentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const consent = await createConsent({
          userId: ctx.user.id,
          consentType: input.consentType,
          granted: true,
          grantedAt: new Date(),
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "consent_grant",
          resourceType: "consent",
          resourceId: consent.id,
          details: { consentType: input.consentType },
        });

        return consent;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserConsents(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
