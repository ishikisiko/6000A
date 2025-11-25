import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createTeam,
  getTeamById,
  getTeamByTeamId,
  getTeamByInviteCode,
  getTeamsByUserId,
  getAllTeams,
  updateTeam,
  deleteTeam,
  addTeamMember,
  getTeamMembers,
  getTeamMembersWithUsers,
  getTeamMember,
  updateTeamMember,
  removeTeamMember,
  updateMemberStatus,
  getTeamMemberCount,
  createAuditLog,
} from "../db";
import { randomBytes } from "crypto";

// Generate a unique team ID
function generateTeamId(): string {
  return `team_${randomBytes(8).toString("hex")}`;
}

// Generate invite code
function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export const teamRouter = router({
  // Create a new team
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        tag: z.string().min(2).max(6).optional(),
        description: z.string().max(500).optional(),
        avatar: z.string().optional(),
        maxMembers: z.number().min(2).max(10).default(5),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const teamId = generateTeamId();
      const inviteCode = generateInviteCode();

      const team = await createTeam({
        teamId,
        name: input.name,
        tag: input.tag,
        description: input.description,
        avatar: input.avatar,
        ownerId: ctx.user.id,
        inviteCode,
        maxMembers: input.maxMembers,
        isPublic: input.isPublic,
      });

      // Add the creator as owner
      await addTeamMember({
        teamId: team.id,
        userId: ctx.user.id,
        role: "owner",
        status: "online",
        lastActiveAt: new Date(),
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "team_create",
        resourceType: "team",
        resourceId: team.id,
        details: { teamId: team.teamId, name: team.name },
      });

      return team;
    }),

  // List user's teams
  list: protectedProcedure.query(async ({ ctx }) => {
    const teams = await getTeamsByUserId(ctx.user.id);
    // 获取每个战队的成员信息（前3个用于显示头像）
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await getTeamMembersWithUsers(team.id);
        return {
          ...team,
          members: members.slice(0, 3), // 只返回前3个成员用于头像显示
        };
      })
    );
    return teamsWithMembers;
  }),

  // List all public teams (for discovery)
  discover: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const allTeams = await getAllTeams(input.limit);
      const publicTeams = allTeams.filter((t) => t.isPublic);
      // 获取每个战队的成员信息（前3个用于显示头像）
      const teamsWithMembers = await Promise.all(
        publicTeams.map(async (team) => {
          const members = await getTeamMembersWithUsers(team.id);
          return {
            ...team,
            members: members.slice(0, 3), // 只返回前3个成员用于头像显示
          };
        })
      );
      return teamsWithMembers;
    }),

  // Get team details
  get: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        teamId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let team;
      if (input.id) {
        team = await getTeamById(input.id);
      } else if (input.teamId) {
        team = await getTeamByTeamId(input.teamId);
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either id or teamId is required",
        });
      }

      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      // Check if user is a member or team is public
      const membership = await getTeamMember(team.id, ctx.user.id);
      if (!membership && !team.isPublic) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const members = await getTeamMembersWithUsers(team.id);

      return {
        ...team,
        members,
        isMember: !!membership,
        userRole: membership?.role,
      };
    }),

  // Update team settings
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string().min(2).max(50).optional(),
        tag: z.string().min(2).max(6).optional(),
        description: z.string().max(500).optional(),
        avatar: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const team = await getTeamByTeamId(input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      const membership = await getTeamMember(team.id, ctx.user.id);
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team owner or admin can update team settings",
        });
      }

      const { teamId, ...updates } = input;
      await updateTeam(team.id, updates);

      await createAuditLog({
        userId: ctx.user.id,
        action: "team_update",
        resourceType: "team",
        resourceId: team.id,
        details: updates,
      });

      return { success: true };
    }),

  // Delete team
  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const team = await getTeamByTeamId(input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      if (team.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team owner can delete the team",
        });
      }

      await deleteTeam(team.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: "team_delete",
        resourceType: "team",
        resourceId: team.id,
        details: { teamId: team.teamId, name: team.name },
      });

      return { success: true };
    }),

  // Regenerate invite code
  regenerateInviteCode: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const team = await getTeamByTeamId(input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      const membership = await getTeamMember(team.id, ctx.user.id);
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team owner or admin can regenerate invite code",
        });
      }

      const newInviteCode = generateInviteCode();
      await updateTeam(team.id, { inviteCode: newInviteCode });

      return { inviteCode: newInviteCode };
    }),

  // Join team via invite code
  join: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const team = await getTeamByInviteCode(input.inviteCode);
      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      // Check if already a member
      const existing = await getTeamMember(team.id, ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this team",
        });
      }

      // Check team capacity
      const memberCount = await getTeamMemberCount(team.id);
      if (memberCount >= team.maxMembers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team is full",
        });
      }

      await addTeamMember({
        teamId: team.id,
        userId: ctx.user.id,
        role: "member",
        status: "online",
        lastActiveAt: new Date(),
      });

      await createAuditLog({
        userId: ctx.user.id,
        action: "team_join",
        resourceType: "team",
        resourceId: team.id,
        details: { teamId: team.teamId },
      });

      return team;
    }),

  // Leave team
  leave: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const team = await getTeamByTeamId(input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      const membership = await getTeamMember(team.id, ctx.user.id);
      if (!membership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are not a member of this team",
        });
      }

      if (membership.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Owner cannot leave. Transfer ownership first or delete the team.",
        });
      }

      await removeTeamMember(team.id, ctx.user.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: "team_leave",
        resourceType: "team",
        resourceId: team.id,
        details: { teamId: team.teamId },
      });

      return { success: true };
    }),

  // Member management
  members: router({
    // List team members
    list: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(async ({ input, ctx }) => {
        const team = await getTeamByTeamId(input.teamId);
        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }

        const membership = await getTeamMember(team.id, ctx.user.id);
        if (!membership && !team.isPublic) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return await getTeamMembersWithUsers(team.id);
      }),

    // Update member role/position
    update: protectedProcedure
      .input(
        z.object({
          teamId: z.string(),
          userId: z.number(),
          role: z.enum(["admin", "member"]).optional(),
          nickname: z.string().max(30).optional(),
          position: z.string().max(20).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamByTeamId(input.teamId);
        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }

        const myMembership = await getTeamMember(team.id, ctx.user.id);
        if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only team owner or admin can update members",
          });
        }

        // Cannot modify owner role
        if (input.userId === team.ownerId && input.role) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot change owner role",
          });
        }

        const { teamId, userId, ...updates } = input;
        await updateTeamMember(team.id, userId, updates);

        return { success: true };
      }),

    // Kick member
    kick: protectedProcedure
      .input(
        z.object({
          teamId: z.string(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamByTeamId(input.teamId);
        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }

        const myMembership = await getTeamMember(team.id, ctx.user.id);
        if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only team owner or admin can kick members",
          });
        }

        // Cannot kick owner
        if (input.userId === team.ownerId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot kick team owner",
          });
        }

        // Admins cannot kick other admins (only owner can)
        const targetMembership = await getTeamMember(team.id, input.userId);
        if (
          targetMembership?.role === "admin" &&
          myMembership.role !== "owner"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only owner can kick admins",
          });
        }

        await removeTeamMember(team.id, input.userId);

        await createAuditLog({
          userId: ctx.user.id,
          action: "team_kick_member",
          resourceType: "team",
          resourceId: team.id,
          details: { kickedUserId: input.userId },
        });

        return { success: true };
      }),

    // Transfer ownership
    transferOwnership: protectedProcedure
      .input(
        z.object({
          teamId: z.string(),
          newOwnerId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const team = await getTeamByTeamId(input.teamId);
        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }

        if (team.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only team owner can transfer ownership",
          });
        }

        const newOwnerMembership = await getTeamMember(team.id, input.newOwnerId);
        if (!newOwnerMembership) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New owner must be a team member",
          });
        }

        // Update team owner
        await updateTeam(team.id, { ownerId: input.newOwnerId });

        // Update roles
        await updateTeamMember(team.id, ctx.user.id, { role: "admin" });
        await updateTeamMember(team.id, input.newOwnerId, { role: "owner" });

        await createAuditLog({
          userId: ctx.user.id,
          action: "team_transfer_ownership",
          resourceType: "team",
          resourceId: team.id,
          details: { newOwnerId: input.newOwnerId },
        });

        return { success: true };
      }),
  }),

  // Update my status in all teams
  updateStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "offline", "in-game", "away"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateMemberStatus(ctx.user.id, input.status);
      return { success: true };
    }),
});
