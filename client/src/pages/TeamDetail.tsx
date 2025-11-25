import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Crown,
  Shield,
  User,
  Copy,
  Check,
  Settings,
  Trash2,
  UserMinus,
  RefreshCw,
  ArrowLeft,
  LogOut,
  UserPlus,
  Edit,
  ChevronRight,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamTheme } from "@/contexts/TeamThemeContext";
import { TeamThemeSwitcher } from "@/components/TeamThemeSwitcher";

// Position options
const positionOptions = [
  { value: "IGL", labelKey: "position.IGL" },
  { value: "Entry", labelKey: "position.Entry" },
  { value: "AWPer", labelKey: "position.AWPer" },
  { value: "Support", labelKey: "position.Support" },
  { value: "Lurker", labelKey: "position.Lurker" },
  { value: "Rifler", labelKey: "position.Rifler" },
  { value: "Flex", labelKey: "position.Flex" },
];

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  "in-game": "bg-purple-500",
  away: "bg-yellow-500",
};

const positionColors: Record<string, string> = {
  IGL: "bg-amber-500/20 text-amber-500",
  Entry: "bg-red-500/20 text-red-500",
  AWPer: "bg-blue-500/20 text-blue-500",
  Support: "bg-green-500/20 text-green-500",
  Lurker: "bg-purple-500/20 text-purple-500",
  Rifler: "bg-orange-500/20 text-orange-500",
  Flex: "bg-cyan-500/20 text-cyan-500",
};

export default function TeamDetail() {
  return (
    <DashboardLayout>
      <TeamDetailContent />
    </DashboardLayout>
  );
}

function TeamDetailContent() {
  const params = useParams<{ teamId: string }>();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  const {
    data: team,
    isLoading,
    refetch,
  } = trpc.team.get.useQuery(
    { teamId: params.teamId! },
    { enabled: !!params.teamId }
  );

  const leaveTeam = trpc.team.leave.useMutation({
    onSuccess: () => {
      toast.success(t('teamDetail.leftTeam'));
      setLocation("/teams");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      toast.success(t('teamDetail.disbanded'));
      setLocation("/teams");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const regenerateCode = trpc.team.regenerateInviteCode.useMutation({
    onSuccess: () => {
      toast.success(t('teamDetail.codeRefreshed'));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyInviteCode = async () => {
    if (team?.inviteCode) {
      await navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <TeamDetailSkeleton />;
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users 
          className="h-16 w-16 mb-4" 
          style={{ color: themeConfig.iconMuted, opacity: 0.5 }}
        />
        <h3 
          className="font-semibold text-lg mb-2"
          style={{ color: themeConfig.text }}
        >
          {t('teamDetail.notFound')}
        </h3>
        <p className="text-muted-foreground mb-6">
          {t('teamDetail.notFoundDesc')}
        </p>
        <Button 
          onClick={() => setLocation("/teams")}
          className="team-btn-outline"
          style={{
            borderColor: themeConfig.border,
            color: themeConfig.text,
          }}
        >
          {t('teamDetail.backToList')}
        </Button>
      </div>
    );
  }

  const isOwner = team.userRole === "owner";
  const isAdmin = team.userRole === "admin" || isOwner;
  const isMember = team.isMember;

  // Sort members
  const sortedMembers = team.members?.slice().sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <div className="space-y-6 relative">
      {/* Page Background */}
      <div 
        className="fixed inset-0 -z-10 transition-all duration-500 pointer-events-none"
        style={{
          background: themeConfig.pageBg,
          backgroundImage: themeConfig.pageBgGradient,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/teams")}
          style={{ color: themeConfig.icon }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar 
              className="h-14 w-14 border-2 team-avatar-ring"
              style={{ 
                borderColor: themeConfig.primary,
                boxShadow: `0 0 0 2px ${themeConfig.primary}, 0 0 12px ${themeConfig.glow}`,
              }}
            >
              <AvatarFallback 
                className="text-xl font-bold"
                style={{ 
                  background: themeConfig.gradient,
                  color: themeConfig.primaryForeground 
                }}
              >
                {team.tag || team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 
                className="text-2xl font-bold tracking-tight flex items-center gap-2"
                style={{ color: themeConfig.text }}
              >
                {team.name}
                {team.tag && (
                  <Badge 
                    variant="outline" 
                    className="font-mono"
                    style={{ 
                      borderColor: themeConfig.border,
                      color: themeConfig.textMuted 
                    }}
                  >
                    [{team.tag}]
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                <span style={{ color: themeConfig.text }}>
                  {team.members?.length || 0}
                </span>
                /{team.maxMembers} {t('teamDetail.members')}
                {isMember && (
                  <span className="ml-2">
                    · {t('teamDetail.youAre').replace('{role}', getRoleLabel(team.userRole as string))}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TeamThemeSwitcher variant="compact" />
          {isAdmin && (
            <EditTeamDialog
              team={team}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSuccess={() => {
                refetch();
                setEditDialogOpen(false);
              }}
            />
          )}
          {isMember && !isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('teamDetail.leaveTeam')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('teamDetail.confirmLeave')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('teamDetail.leaveHint')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => leaveTeam.mutate({ teamId: team.teamId })}
                  >
                    {t('teamDetail.confirmLeaveBtn')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('teamDetail.disbandTeam')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('teamDetail.confirmDisband')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('teamDetail.disbandHint')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteTeam.mutate({ teamId: team.teamId })}
                  >
                    {t('teamDetail.confirmDisbandBtn')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Invite Code Card */}
      {isMember && team.inviteCode && (
        <Card
          className="team-card transition-all"
          style={{
            background: themeConfig.cardBg,
            borderColor: themeConfig.cardBorder,
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('teamDetail.inviteCodeLabel')}
                </p>
                <p 
                  className="font-mono text-2xl font-bold tracking-[0.3em]"
                  style={{ color: themeConfig.text }}
                >
                  {team.inviteCode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyInviteCode}
                  className="team-btn-outline"
                  style={{
                    borderColor: themeConfig.border,
                    color: themeConfig.icon,
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      regenerateCode.mutate({ teamId: team.teamId })
                    }
                    disabled={regenerateCode.isPending}
                    className="team-btn-outline"
                    style={{
                      borderColor: themeConfig.border,
                      color: themeConfig.icon,
                    }}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        regenerateCode.isPending && "animate-spin"
                      )}
                    />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {team.description && (
        <Card
          className="team-card"
          style={{
            background: themeConfig.cardBg,
            borderColor: themeConfig.cardBorder,
          }}
        >
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ borderColor: themeConfig.border }}>
          <TabsTrigger 
            value="members" 
            className={cn(
              "gap-2 transition-all",
              activeTab === "members" && "team-tab-active"
            )}
            style={activeTab === "members" ? { 
              color: themeConfig.text,
              borderBottomColor: themeConfig.primary 
            } : {}}
          >
            <Users 
              className="h-4 w-4" 
              style={activeTab === "members" ? { color: themeConfig.icon } : {}} 
            />
            {t('teamDetail.members')} ({team.members?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedMembers?.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                teamId={team.teamId}
                isAdmin={isAdmin}
                isOwner={isOwner}
                ownerId={team.ownerId}
                onUpdate={() => refetch()}
                getRoleLabel={getRoleLabel}
                getStatusLabel={getStatusLabel}
              />
            ))}
            {/* Empty slots */}
            {team.members &&
              team.members.length < team.maxMembers &&
              Array.from({
                length: team.maxMembers - team.members.length,
              }).map((_, i) => (
                <Card
                  key={`empty-${i}`}
                  className="border-dashed"
                  style={{ borderColor: `${themeConfig.border}` }}
                >
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <User 
                        className="h-10 w-10 mx-auto mb-2" 
                        style={{ color: themeConfig.iconMuted, opacity: 0.3 }}
                      />
                      <p className="text-sm text-muted-foreground">{t('teamDetail.emptySlot')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Member Card Component
interface MemberCardProps {
  member: {
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
      avatar: string | null;
    };
  };
  teamId: string;
  isAdmin: boolean;
  isOwner: boolean;
  ownerId: number;
  onUpdate: () => void;
  getRoleLabel: (role: string) => string;
  getStatusLabel: (status: string) => string;
}

function MemberCard({
  member,
  teamId,
  isAdmin,
  isOwner,
  ownerId,
  onUpdate,
  getRoleLabel,
  getStatusLabel,
}: MemberCardProps) {
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();
  const [editOpen, setEditOpen] = useState(false);
  const [nickname, setNickname] = useState(member.nickname || "");
  const [position, setPosition] = useState(member.position || "");
  const [role, setRole] = useState(member.role);

  const updateMember = trpc.team.members.update.useMutation({
    onSuccess: () => {
      toast.success(t('teamMember.updated'));
      onUpdate();
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const kickMember = trpc.team.members.kick.useMutation({
    onSuccess: () => {
      toast.success(t('teamMember.kicked'));
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const transferOwnership = trpc.team.members.transferOwnership.useMutation({
    onSuccess: () => {
      toast.success(t('teamMember.transferred'));
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const status = member.status || "offline";
  const isMemberOwner = member.userId === ownerId;
  const canEdit =
    isAdmin && !isMemberOwner && member.role !== "owner";
  const canKick = canEdit;
  const canTransfer = isOwner && !isMemberOwner;

  const roleIcons = {
    owner: Crown,
    admin: Shield,
    member: User,
  };
  const RoleIcon = roleIcons[member.role];
  const memberName = member.nickname || member.user.name || "Unknown";

  return (
    <Card
      className="team-card transition-all"
      style={{
        background: themeConfig.cardBg,
        borderColor: themeConfig.cardBorder,
      }}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar 
              className="h-12 w-12 border-2"
              style={{ borderColor: themeConfig.border }}
            >
              {member.user.avatar && (
                <AvatarImage src={member.user.avatar} alt={memberName} />
              )}
              <AvatarFallback className="text-lg">
                {(member.nickname || member.user.name || "?")
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background",
                statusColors[status]
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold truncate"
                style={{ color: themeConfig.text }}
              >
                {memberName}
              </h3>
              <RoleIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  member.role === "owner"
                    ? ""
                    : member.role === "admin"
                      ? "text-blue-500"
                      : "text-muted-foreground"
                )}
                style={member.role === "owner" ? { color: themeConfig.crown } : {}}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  member.role === "owner" && "team-crown"
                )}
                style={member.role === "owner" ? {
                  background: themeConfig.crownBg,
                  color: themeConfig.crown,
                } : {}}
              >
                {getRoleLabel(member.role)}
              </Badge>
              {member.position && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    positionColors[member.position] ||
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {member.position}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getStatusLabel(status)}
            </p>
          </div>
        </div>
      </CardContent>
      {(canEdit || canTransfer) && (
        <CardFooter className="pt-0 gap-2">
          {canEdit && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 team-btn-outline"
                  style={{
                    borderColor: themeConfig.border,
                    color: themeConfig.text,
                  }}
                >
                  <Edit className="mr-2 h-3 w-3" style={{ color: themeConfig.icon }} />
                  {t('teamMember.edit')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ color: themeConfig.text }}>
                    {t('teamMember.editMember')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('teamMember.editMemberDesc').replace('{name}', memberName)}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>{t('teamMember.nickname')}</Label>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t('teamMember.nicknamePlaceholder')}
                      className="team-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('teamMember.position')}</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('teamMember.positionPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isOwner && (
                    <div className="grid gap-2">
                      <Label>{t('teamMember.role')}</Label>
                      <Select
                        value={role}
                        onValueChange={(v) =>
                          setRole(v as "admin" | "member")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('teams.roleAdmin')}</SelectItem>
                          <SelectItem value="member">{t('teams.roleMember')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() =>
                      updateMember.mutate({
                        teamId,
                        userId: member.userId,
                        nickname: nickname || undefined,
                        position: position || undefined,
                        role: role !== member.role ? (role as "admin" | "member") : undefined,
                      })
                    }
                    disabled={updateMember.isPending}
                    className="team-btn-primary"
                    style={{
                      background: themeConfig.gradient,
                      color: themeConfig.primaryForeground,
                    }}
                  >
                    {updateMember.isPending ? t('teamMember.saving') : t('common.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canKick && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                >
                  <UserMinus className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('teamMember.confirmKick')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('teamMember.kickHint').replace('{name}', memberName)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      kickMember.mutate({ teamId, userId: member.userId })
                    }
                  >
                    {t('teamMember.confirmKickBtn')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canTransfer && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  style={{ color: themeConfig.crown }}
                >
                  <Crown className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('teamMember.confirmTransfer')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('teamMember.transferHint').replace('{name}', memberName)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      transferOwnership.mutate({
                        teamId,
                        newOwnerId: member.userId,
                      })
                    }
                  >
                    {t('teamMember.confirmTransferBtn')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// Edit Team Dialog
interface EditTeamDialogProps {
  team: {
    teamId: string;
    name: string;
    tag?: string | null;
    description?: string | null;
    isPublic?: boolean | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditTeamDialog({
  team,
  open,
  onOpenChange,
  onSuccess,
}: EditTeamDialogProps) {
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag || "");
  const [description, setDescription] = useState(team.description || "");
  const [isPublic, setIsPublic] = useState(team.isPublic || false);

  const updateTeam = trpc.team.update.useMutation({
    onSuccess: () => {
      toast.success(t('teamEdit.updated'));
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate({
      teamId: team.teamId,
      name,
      tag: tag || undefined,
      description: description || undefined,
      isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="team-btn-outline"
          style={{
            borderColor: themeConfig.border,
            color: themeConfig.text,
          }}
        >
          <Settings className="mr-2 h-4 w-4" style={{ color: themeConfig.icon }} />
          {t('teamDetail.editTeam')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle style={{ color: themeConfig.text }}>
              {t('teamEdit.title')}
            </DialogTitle>
            <DialogDescription>{t('teamEdit.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('teams.teamName')}</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="team-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tag">{t('teams.teamTag')}</Label>
              <Input
                id="edit-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={6}
                className="team-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('teams.teamDescription')}</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="team-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-isPublic">{t('teams.publicTeam')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('teams.publicTeamHint')}
                </p>
              </div>
              <Switch
                id="edit-isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={!name || updateTeam.isPending}
              className="team-btn-primary"
              style={{
                background: themeConfig.gradient,
                color: themeConfig.primaryForeground,
              }}
            >
              {updateTeam.isPending ? t('teamMember.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
