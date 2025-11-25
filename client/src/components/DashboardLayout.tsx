import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LayoutDashboard, LogOut, PanelLeft, Users, UsersRound } from "lucide-react";
import { TeamStatusDrawer } from "./TeamStatusDrawer";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: UsersRound, labelKey: "teams.title", path: "/teams" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

const presenceStatusColors: Record<string, string> = {
  online: "bg-emerald-500",
  "in-game": "bg-violet-500",
  away: "bg-amber-400",
  offline: "bg-slate-400",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, login } = useLocalAuth();
  const [username, setUsername] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) return;
    setIsLoggingIn(true);
    try {
      login(username.trim());
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-16 w-16 rounded-xl object-cover shadow"
              />
              <div>
                <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Please sign in to continue
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoggingIn}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={!username.trim() || isLoggingIn}
              size="lg"
              className="w-full"
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useLocalAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
              <SidebarMenu className="px-2 py-1">
                {menuItems.map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={t(item.labelKey)}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <SidebarTeamPresence isCollapsed={isCollapsed} />
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center justify-center mb-2 group-data-[collapsible=icon]:hidden">
              <LanguageSwitcher />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    {user?.avatar && (
                      <AvatarImage src={user.avatar} alt={user?.name || 'User'} />
                    )}
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem ? t(activeMenuItem.labelKey) : APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <TeamStatusDrawer />
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}

type SidebarTeamPresenceProps = {
  isCollapsed: boolean;
};

function SidebarTeamPresence({ isCollapsed }: SidebarTeamPresenceProps) {
  const { t } = useLanguage();
  const { data: teams, isLoading: teamsLoading } = trpc.team.list.useQuery();

  const fmhTeam = teams?.find(
    team =>
      team.name?.toLowerCase() === "fmh elite" ||
      team.tag?.toLowerCase() === "fmh"
  );

  const {
    data: fmhTeamData,
    isLoading: teamLoading,
  } = trpc.team.get.useQuery(
    { teamId: fmhTeam?.teamId || "" },
    { enabled: !!fmhTeam?.teamId, refetchInterval: 30000 }
  );

  const members = fmhTeamData?.members || [];
  const isLoading = teamsLoading || teamLoading;
  const onlineCount =
    members.filter(
      member => member.status === "online" || member.status === "in-game"
    ).length || 0;

  if (!isLoading && !fmhTeam) {
    return null;
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return t("teamStatus.online");
      case "in-game":
        return t("teamStatus.inGame");
      case "away":
        return t("teamStatus.away");
      case "offline":
      default:
        return t("teamStatus.offline");
    }
  };

  return (
    <div className="px-3 pb-3 pt-1">
      <div className="rounded-xl border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold uppercase tracking-wide">
                  FMH Elite
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {onlineCount}/{members.length} {t("teamStatus.online")}
                </span>
              </div>
            )}
          </div>
          {isCollapsed && (
            <span className="text-[11px] text-muted-foreground">
              {onlineCount}/{members.length}
            </span>
          )}
        </div>

        <div
          className={`mt-3 ${
            isCollapsed
              ? "flex flex-col items-center gap-2"
              : "space-y-2"
          }`}
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex w-full items-center gap-3"
              >
                <Skeleton className="h-9 w-9 rounded-full" />
                {!isCollapsed && (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                )}
              </div>
            ))
          ) : members.length > 0 ? (
            members.map(member => (
              <SidebarMemberRow
                key={member.id}
                member={member}
                isCollapsed={isCollapsed}
                getStatusLabel={getStatusLabel}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("teamStatus.waitingToJoin")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type SidebarMemberRowProps = {
  member: {
    id: number;
    status: "online" | "offline" | "in-game" | "away" | null;
    nickname: string | null;
    user: { name: string | null; avatar: string | null };
  };
  isCollapsed: boolean;
  getStatusLabel: (status: string) => string;
};

function SidebarMemberRow({
  member,
  isCollapsed,
  getStatusLabel,
}: SidebarMemberRowProps) {
  const status = member.status || "offline";
  const statusColor =
    presenceStatusColors[status] || presenceStatusColors.offline;
  const displayName = member.nickname || member.user.name || "Teammate";

  return (
    <div className="flex w-full items-center gap-3 rounded-lg">
      <div className="relative">
        <Avatar className="h-9 w-9 border border-border">
          {member.user.avatar && (
            <AvatarImage
              src={member.user.avatar}
              alt={displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="text-xs font-medium">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusColor}`}
        />
      </div>
      {!isCollapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span className="truncate">{getStatusLabel(status)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
