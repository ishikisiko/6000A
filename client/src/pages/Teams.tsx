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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Plus,
  Crown,
  Shield,
  User,
  Copy,
  Check,
  LogIn,
  Search,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamTheme } from "@/contexts/TeamThemeContext";
import { TeamThemeSwitcher } from "@/components/TeamThemeSwitcher";

export default function Teams() {
  return (
    <DashboardLayout>
      <TeamsContent />
    </DashboardLayout>
  );
}

function TeamsContent() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("my-teams");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();

  // Fetch user's teams
  const {
    data: myTeams,
    isLoading: myTeamsLoading,
    refetch: refetchMyTeams,
  } = trpc.team.list.useQuery();

  // Fetch public teams for discovery
  const { data: publicTeams, isLoading: publicTeamsLoading } =
    trpc.team.discover.useQuery({ limit: 20 });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-2xl font-bold tracking-tight"
            style={{ color: themeConfig.text }}
          >
            {t('teams.title')}
          </h1>
          <p className="text-muted-foreground">{t('teams.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <TeamThemeSwitcher variant="compact" />
          <JoinTeamDialog
            open={joinDialogOpen}
            onOpenChange={setJoinDialogOpen}
            onSuccess={() => {
              refetchMyTeams();
              setJoinDialogOpen(false);
            }}
          />
          <CreateTeamDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              refetchMyTeams();
              setCreateDialogOpen(false);
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="transition-colors"
          style={{ 
            borderColor: themeConfig.border 
          }}
        >
          <TabsTrigger 
            value="my-teams" 
            className={cn(
              "gap-2 transition-all",
              activeTab === "my-teams" && "team-tab-active"
            )}
            style={activeTab === "my-teams" ? { 
              color: themeConfig.text,
              borderBottomColor: themeConfig.primary 
            } : {}}
          >
            <Users className="h-4 w-4" style={activeTab === "my-teams" ? { color: themeConfig.icon } : {}} />
            {t('teams.myTeams')}
            {myTeams && myTeams.length > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1"
                style={activeTab === "my-teams" ? { 
                  background: themeConfig.badge,
                  color: themeConfig.badgeForeground 
                } : {}}
              >
                {myTeams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="discover" 
            className={cn(
              "gap-2 transition-all",
              activeTab === "discover" && "team-tab-active"
            )}
            style={activeTab === "discover" ? { 
              color: themeConfig.text,
              borderBottomColor: themeConfig.primary 
            } : {}}
          >
            <Search className="h-4 w-4" style={activeTab === "discover" ? { color: themeConfig.icon } : {}} />
            {t('teams.discoverTeams')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-teams" className="mt-6">
          {myTeamsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          ) : myTeams && myTeams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  memberRole={team.memberRole}
                  onClick={() => setLocation(`/teams/${team.teamId}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t('teams.noTeams')}
              description={t('teams.noTeamsDesc')}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setJoinDialogOpen(true)}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('teams.joinTeam')}
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('teams.createTeam')}
                  </Button>
                </div>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          {publicTeamsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          ) : publicTeams && publicTeams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isPublic
                  onClick={() => setLocation(`/teams/${team.teamId}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={t('teams.noPublicTeams')}
              description={t('teams.noPublicTeamsDesc')}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Team Card Component
interface TeamCardProps {
  team: {
    id: number;
    teamId: string;
    name: string;
    tag?: string | null;
    description?: string | null;
    avatar?: string | null;
    maxMembers: number;
    isPublic?: boolean | null;
    members?: Array<{
      id: number;
      user: {
        id: number;
        name: string | null;
        avatar: string | null;
      };
    }>;
  };
  memberRole?: string;
  isPublic?: boolean;
  onClick?: () => void;
}

function TeamCard({ team, memberRole, isPublic, onClick }: TeamCardProps) {
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();
  const roleIcons = {
    owner: Crown,
    admin: Shield,
    member: User,
  };
  const RoleIcon = memberRole
    ? roleIcons[memberRole as keyof typeof roleIcons]
    : null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return t('teams.roleOwner');
      case "admin": return t('teams.roleAdmin');
      case "member": return t('teams.roleMember');
      default: return role;
    }
  };

  // 获取前3个成员的头像用于堆叠显示
  const memberAvatars = team.members?.slice(0, 3) || [];

  return (
    <Card
      className="cursor-pointer transition-all duration-300 team-card team-glow-hover"
      onClick={onClick}
      style={{
        background: themeConfig.cardBg,
        borderColor: themeConfig.cardBorder,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = themeConfig.cardHoverBorder;
        e.currentTarget.style.boxShadow = themeConfig.cardHoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = themeConfig.cardBorder;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar 
              className="h-12 w-12 border-2 transition-all"
              style={{ borderColor: themeConfig.border }}
            >
              {team.avatar && (
                <AvatarImage 
                  src={team.avatar} 
                  alt={team.name} 
                  className="object-cover"
                />
              )}
              <AvatarFallback 
                className="text-lg font-bold"
                style={{ 
                  background: themeConfig.gradient,
                  color: themeConfig.primaryForeground 
                }}
              >
                {team.tag || team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle 
                className="text-lg transition-colors"
                style={{ color: themeConfig.text }}
              >
                {team.name}
              </CardTitle>
              {team.tag && (
                <Badge 
                  variant="outline" 
                  className="mt-1"
                  style={{ 
                    borderColor: themeConfig.border,
                    color: themeConfig.textMuted 
                  }}
                >
                  [{team.tag}]
                </Badge>
              )}
            </div>
            {/* 成员头像堆叠 */}
            {memberAvatars.length > 0 && (
              <div className="flex items-center -space-x-2 ml-2">
                {memberAvatars.map((member, index) => (
                  <Avatar
                    key={member.id}
                    className={cn(
                      "h-8 w-8 border-2 border-background ring-1",
                      "transition-transform hover:scale-110 hover:z-10"
                    )}
                    style={{
                      transform: `rotate(${(index - 1) * 8}deg)`,
                      zIndex: memberAvatars.length - index,
                      outlineColor: themeConfig.border,
                    }}
                  >
                    {member.user.avatar && (
                      <AvatarImage src={member.user.avatar} alt={member.user.name || ''} />
                    )}
                    <AvatarFallback className="text-xs">
                      {(member.user.name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
          {RoleIcon && memberRole && (
            <Badge
              variant="secondary"
              className={cn(
                "transition-colors",
                memberRole === "owner" && "team-crown",
                memberRole === "admin" && "bg-blue-500/20 text-blue-500"
              )}
              style={memberRole === "owner" ? {
                background: themeConfig.crownBg,
                color: themeConfig.crown,
              } : {}}
            >
              <RoleIcon className="mr-1 h-3 w-3" />
              {getRoleLabel(memberRole)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {team.description || t('teams.noDescription')}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" style={{ color: themeConfig.iconMuted }} />
          <span 
            className="team-highlight"
            style={{ color: themeConfig.text }}
          >
            {team.members?.length || 0}
          </span>
          <span>/ {team.maxMembers} {t('teamDetail.members')}</span>
          {isPublic && (
            <Badge 
              variant="outline" 
              className="ml-auto"
              style={{ 
                borderColor: themeConfig.border,
                color: themeConfig.textMuted 
              }}
            >
              {t('teams.public')}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function TeamCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  const { themeConfig } = useTeamTheme();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span style={{ color: themeConfig.iconMuted, opacity: 0.5 }}>
        <Icon className="h-16 w-16 mb-4 transition-colors" />
      </span>
      <h3 
        className="font-semibold text-lg mb-2"
        style={{ color: themeConfig.text }}
      >
        {title}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actions}
    </div>
  );
}

// Create Team Dialog
interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateTeamDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamDialogProps) {
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [isPublic, setIsPublic] = useState(false);

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      toast.success(t('teams.createSuccess'));
      onSuccess();
      // Reset form
      setName("");
      setTag("");
      setDescription("");
      setMaxMembers(5);
      setIsPublic(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate({
      name,
      tag: tag || undefined,
      description: description || undefined,
      maxMembers,
      isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="team-btn-primary transition-all"
          style={{
            background: themeConfig.gradient,
            color: themeConfig.primaryForeground,
            boxShadow: `0 0 12px ${themeConfig.glow}`,
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('teams.createTeam')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle style={{ color: themeConfig.text }}>
              {t('teams.createNew')}
            </DialogTitle>
            <DialogDescription>
              {t('teams.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('teams.teamName')} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('teams.teamNamePlaceholder')}
                required
                className="team-input"
                style={{
                  borderColor: name ? themeConfig.borderHover : undefined,
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tag">{t('teams.teamTag')}</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder={t('teams.teamTagPlaceholder')}
                maxLength={6}
                className="team-input"
              />
              <p className="text-xs text-muted-foreground">
                {t('teams.teamTagHint')}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('teams.teamDescription')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('teams.teamDescPlaceholder')}
                rows={3}
                className="team-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxMembers">{t('teams.maxMembersLabel')}</Label>
              <Input
                id="maxMembers"
                type="number"
                min={2}
                max={10}
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 5)}
                className="team-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic">{t('teams.publicTeam')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('teams.publicTeamHint')}
                </p>
              </div>
              <Switch
                id="isPublic"
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
              disabled={!name || createTeam.isPending}
              className="team-btn-primary"
              style={{
                background: themeConfig.gradient,
                color: themeConfig.primaryForeground,
              }}
            >
              {createTeam.isPending ? t('teams.creating') : t('teams.createTeam')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Join Team Dialog
interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function JoinTeamDialog({ open, onOpenChange, onSuccess }: JoinTeamDialogProps) {
  const { t } = useLanguage();
  const { themeConfig } = useTeamTheme();
  const [inviteCode, setInviteCode] = useState("");

  const joinTeam = trpc.team.join.useMutation({
    onSuccess: (team) => {
      toast.success(t('teams.joinSuccess').replace('{name}', team.name));
      onSuccess();
      setInviteCode("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinTeam.mutate({ inviteCode: inviteCode.toUpperCase() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="team-btn-outline transition-all"
          style={{
            borderColor: themeConfig.border,
            color: themeConfig.text,
          }}
        >
          <LogIn className="mr-2 h-4 w-4" style={{ color: themeConfig.icon }} />
          {t('teams.joinTeam')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle style={{ color: themeConfig.text }}>
              {t('teams.joinByCode')}
            </DialogTitle>
            <DialogDescription>{t('teams.joinByCodeDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">{t('teams.inviteCode')}</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t('teams.inviteCodePlaceholder')}
                className="font-mono text-center text-lg tracking-widest team-input"
                maxLength={8}
                style={{
                  borderColor: inviteCode.length === 8 ? themeConfig.borderHover : undefined,
                  boxShadow: inviteCode.length === 8 ? `0 0 10px ${themeConfig.glow}` : undefined,
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t('teams.inviteCodeHint')}
              </p>
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
              disabled={inviteCode.length < 8 || joinTeam.isPending}
              className="team-btn-primary"
              style={{
                background: themeConfig.gradient,
                color: themeConfig.primaryForeground,
              }}
            >
              {joinTeam.isPending ? t('teams.joining') : t('teams.joinTeam')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
