import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Crown,
  Shield,
  User,
  Gamepad2,
  Circle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamTheme } from "@/contexts/TeamThemeContext";
import { TeamThemeSwitcher } from "@/components/TeamThemeSwitcher";

// Status indicator colors
const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  "in-game": "bg-purple-500",
  away: "bg-yellow-500",
};

// Role icons
const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

// Position colors for CS2/Valorant roles
const positionColors: Record<string, string> = {
  IGL: "bg-amber-500/20 text-amber-500",
  Entry: "bg-red-500/20 text-red-500",
  AWPer: "bg-blue-500/20 text-blue-500",
  Support: "bg-green-500/20 text-green-500",
  Lurker: "bg-purple-500/20 text-purple-500",
  Rifler: "bg-orange-500/20 text-orange-500",
  Flex: "bg-cyan-500/20 text-cyan-500",
};

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: "owner" | "admin" | "member";
  nickname: string | null;
  position: string | null;
  status: "online" | "offline" | "in-game" | "away" | null;
  lastActiveAt: Date | null;
  joinedAt: Date;
  user: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

interface TeamStatusDrawerProps {
  teamId?: string;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function TeamStatusDrawer({
  teamId,
  trigger,
  defaultOpen = false,
}: TeamStatusDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return t('teams.roleOwner');
      case "admin": return t('teams.roleAdmin');
      case "member": return t('teams.roleMember');
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online": return t('teamStatus.online');
      case "offline": return t('teamStatus.offline');
      case "in-game": return t('teamStatus.inGame');
      case "away": return t('teamStatus.away');
      default: return status;
    }
  };

  // Get user's teams if no specific teamId provided
  const { data: userTeams, isLoading: teamsLoading } = trpc.team.list.useQuery(
    undefined,
    { enabled: !teamId }
  );

  // Get the active team (either specified or first user team)
  const activeTeamId = teamId || userTeams?.[0]?.teamId;

  // Get team details
  const {
    data: teamData,
    isLoading: teamLoading,
    refetch,
  } = trpc.team.get.useQuery(
    { teamId: activeTeamId! },
    { enabled: !!activeTeamId, refetchInterval: 30000 } // Refresh every 30s
  );

  const copyInviteCode = async () => {
    if (teamData?.inviteCode) {
      await navigator.clipboard.writeText(teamData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading = teamsLoading || teamLoading;

  // Sort members: owner first, then admins, then by online status
  const sortedMembers = teamData?.members?.slice().sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    const roleCompare = roleOrder[a.role] - roleOrder[b.role];
    if (roleCompare !== 0) return roleCompare;

    const statusOrder = { "in-game": 0, online: 1, away: 2, offline: 3 };
    return (
      (statusOrder[a.status || "offline"] || 3) -
      (statusOrder[b.status || "offline"] || 3)
    );
  });

  const onlineMemberCount =
    teamData?.members?.filter(
      (m) => m.status === "online" || m.status === "in-game"
    ).length || 0;

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative transition-colors"
      style={{ color: themeConfig.icon }}
    >
      <Users className="h-5 w-5" />
      {onlineMemberCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium text-white flex items-center justify-center"
          style={{ background: themeConfig.primary }}
        >
          {onlineMemberCount}
        </span>
      )}
    </Button>
  );

  if (!activeTeamId && !teamsLoading) {
    // No team - show join/create prompt
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle 
              className="flex items-center gap-2"
              style={{ color: themeConfig.text }}
            >
              <Users className="h-5 w-5" style={{ color: themeConfig.icon }} />
              {t('teamStatus.team')}
            </SheetTitle>
            <SheetDescription>{t('teamStatus.joinOrCreate')}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[400px] p-4 text-center">
            <Users 
              className="h-16 w-16 mb-4" 
              style={{ color: themeConfig.iconMuted, opacity: 0.3 }}
            />
            <h3 
              className="font-semibold mb-2"
              style={{ color: themeConfig.text }}
            >
              {t('teamStatus.noTeam')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('teamStatus.noTeamDesc')}
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => setLocation("/teams/create")}
                className="team-btn-primary"
                style={{
                  background: themeConfig.gradient,
                  color: themeConfig.primaryForeground,
                }}
              >
                {t('teams.createTeam')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/teams/join")}
                className="team-btn-outline"
                style={{
                  borderColor: themeConfig.border,
                  color: themeConfig.text,
                }}
              >
                {t('teams.joinTeam')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        {isLoading ? (
          <TeamStatusSkeleton />
        ) : teamData ? (
          <>
            {/* Team Header */}
            <SheetHeader 
              className="p-4 pb-2 border-b"
              style={{ borderColor: themeConfig.border }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-10 w-10 border-2"
                    style={{ 
                      borderColor: themeConfig.primary,
                      boxShadow: `0 0 8px ${themeConfig.glow}`,
                    }}
                  >
                    {teamData.avatar && (
                      <AvatarImage 
                        src={teamData.avatar} 
                        alt={teamData.name} 
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback 
                      className="text-sm font-bold"
                      style={{ 
                        background: themeConfig.gradient,
                        color: themeConfig.primaryForeground 
                      }}
                    >
                      {teamData.tag || teamData.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle 
                      className="text-base"
                      style={{ color: themeConfig.text }}
                    >
                      {teamData.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {t('teamStatus.onlineCount').replace('{online}', String(onlineMemberCount)).replace('{total}', String(teamData.members?.length || 0))}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TeamThemeSwitcher variant="compact" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => refetch()}
                        style={{ color: themeConfig.icon }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('teamStatus.refresh')}</TooltipContent>
                  </Tooltip>
                  {(teamData.userRole === "owner" ||
                    teamData.userRole === "admin") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setLocation(`/teams/${teamData.teamId}/settings`)
                          }
                          style={{ color: themeConfig.icon }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('teamStatus.teamSettings')}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Invite Code Section */}
            {teamData.isMember && teamData.inviteCode && (
              <div 
                className="px-4 py-3 border-b"
                style={{ 
                  borderColor: themeConfig.border,
                  background: themeConfig.cardBg,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('teamStatus.inviteCode')}
                    </p>
                    <p 
                      className="font-mono text-sm font-semibold tracking-wider"
                      style={{ color: themeConfig.text }}
                    >
                      {teamData.inviteCode}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={copyInviteCode}
                    style={{ color: themeConfig.icon }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
              <div className="p-2">
                <div 
                  className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeConfig.textMuted }}
                >
                  {t('teamStatus.members')} ({t('teamStatus.memberCount').replace('{count}', String(teamData.members?.length || 0)).replace('{max}', String(teamData.maxMembers))})
                </div>
                <div className="space-y-1">
                  {sortedMembers?.map((member) => (
                    <TeamMemberCard 
                      key={member.id} 
                      member={member} 
                      getRoleLabel={getRoleLabel} 
                      getStatusLabel={getStatusLabel} 
                    />
                  ))}
                </div>

                {/* Empty slots */}
                {teamData.members &&
                  teamData.members.length < teamData.maxMembers && (
                    <>
                      <Separator 
                        className="my-3" 
                        style={{ background: themeConfig.border }}
                      />
                      <div 
                        className="px-2 py-1.5 text-xs font-medium"
                        style={{ color: themeConfig.textMuted }}
                      >
                        {t('teamStatus.emptySlots')} (
                        {teamData.maxMembers - teamData.members.length})
                      </div>
                      {Array.from({
                        length: teamData.maxMembers - teamData.members.length,
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed"
                          style={{ borderColor: themeConfig.border }}
                        >
                          <div 
                            className="h-9 w-9 rounded-full flex items-center justify-center"
                            style={{ background: themeConfig.cardBg }}
                          >
                            <User 
                              className="h-4 w-4" 
                              style={{ color: themeConfig.iconMuted, opacity: 0.5 }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {t('teamStatus.waitingToJoin')}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div 
              className="border-t p-3"
              style={{ borderColor: themeConfig.border }}
            >
              <Button
                variant="outline"
                className="w-full justify-between team-btn-outline"
                onClick={() => setLocation(`/teams/${teamData.teamId}`)}
                style={{
                  borderColor: themeConfig.border,
                  color: themeConfig.text,
                }}
              >
                {t('teamStatus.viewDetails')}
                <ChevronRight className="h-4 w-4" style={{ color: themeConfig.icon }} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t('teamStatus.loadFailed')}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TeamMemberCard({ member, getRoleLabel, getStatusLabel }: { member: TeamMember; getRoleLabel: (role: string) => string; getStatusLabel: (status: string) => string }) {
  const RoleIcon = roleIcons[member.role];
  const status = member.status || "offline";
  const { themeConfig } = useTeamTheme();

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg transition-colors group"
      style={{ 
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = themeConfig.cardBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <Avatar 
          className="h-9 w-9 border"
          style={{ borderColor: themeConfig.border }}
        >
          <AvatarFallback className="text-xs">
            {(member.nickname || member.user.name || "?")
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            statusColors[status]
          )}
        />
      </div>

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span 
            className="text-sm font-medium truncate"
            style={{ color: themeConfig.text }}
          >
            {member.nickname || member.user.name || "Unknown"}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <RoleIcon
                className={cn(
                  "h-3.5 w-3.5",
                  member.role === "admin" && "text-blue-500",
                  member.role === "member" && "text-muted-foreground"
                )}
                style={member.role === "owner" ? { color: themeConfig.crown } : {}}
              />
            </TooltipTrigger>
            <TooltipContent>{getRoleLabel(member.role)}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {getStatusLabel(status)}
          </span>
          {member.position && (
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4",
                positionColors[member.position] ||
                  "bg-muted text-muted-foreground"
              )}
            >
              {member.position}
            </Badge>
          )}
        </div>
      </div>

      {/* Game indicator */}
      {status === "in-game" && (
        <Gamepad2 
          className="h-4 w-4 animate-pulse" 
          style={{ color: themeConfig.primary }}
        />
      )}
    </div>
  );
}

function TeamStatusSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamStatusDrawer;
