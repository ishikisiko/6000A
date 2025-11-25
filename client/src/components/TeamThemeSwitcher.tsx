import { useTeamTheme, TeamTheme, teamThemes } from "@/contexts/TeamThemeContext";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette, Check, Flame, Trophy, Sparkles, Shield } from "lucide-react";

const themeIcons: Record<TeamTheme, React.ComponentType<{ className?: string }>> = {
  deepBlue: Shield,
  crimson: Flame,
  gold: Trophy,
  purple: Sparkles,
};

interface TeamThemeSwitcherProps {
  variant?: "dropdown" | "inline" | "compact";
  className?: string;
}

export function TeamThemeSwitcher({
  variant = "dropdown",
  className,
}: TeamThemeSwitcherProps) {
  const { theme, setTheme, themeConfig } = useTeamTheme();
  const { t } = useLanguage();

  const getThemeName = (themeId: TeamTheme) => {
    const names: Record<TeamTheme, string> = {
      deepBlue: t("teamTheme.deepBlue") || "Deep Blue",
      crimson: t("teamTheme.crimson") || "Crimson Fire",
      gold: t("teamTheme.gold") || "Glory Gold",
      purple: t("teamTheme.purple") || "Electric Purple",
    };
    return names[themeId];
  };

  const getThemeDesc = (themeId: TeamTheme) => {
    const descs: Record<TeamTheme, string> = {
      deepBlue: t("teamTheme.deepBlueDesc") || "Classic esports theme",
      crimson: t("teamTheme.crimsonDesc") || "Battle & Passion",
      gold: t("teamTheme.goldDesc") || "Elite & Management",
      purple: t("teamTheme.purpleDesc") || "Community & Trend",
    };
    return descs[themeId];
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 team-glow-hover transition-all",
              className
            )}
            style={{ color: themeConfig.primary }}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("teamTheme.selectTheme") || "Select Theme"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(teamThemes) as TeamTheme[]).map((themeId) => {
            const config = teamThemes[themeId];
            const Icon = themeIcons[themeId];
            return (
              <DropdownMenuItem
                key={themeId}
                onClick={() => setTheme(themeId)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: config.gradient }}
                />
                <span style={{ color: config.primary }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{getThemeName(themeId)}</span>
                {theme === themeId && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {(Object.keys(teamThemes) as TeamTheme[]).map((themeId) => {
          const config = teamThemes[themeId];
          const Icon = themeIcons[themeId];
          const isActive = theme === themeId;

          return (
            <button
              key={themeId}
              onClick={() => setTheme(themeId)}
              className={cn(
                "relative flex items-center justify-center h-10 w-10 rounded-lg border-2 transition-all duration-300",
                isActive
                  ? "scale-110"
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              )}
              style={{
                borderColor: isActive ? config.primary : config.border,
                background: isActive ? config.cardBg : "transparent",
                boxShadow: isActive ? config.cardHoverShadow : "none",
              }}
              title={getThemeName(themeId)}
            >
              <span style={{ color: config.primary }}>
                <Icon className="h-5 w-5" />
              </span>
              {isActive && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full"
                  style={{ background: config.gradient }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 team-btn-outline",
            className
          )}
        >
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: themeConfig.gradient }}
          />
          <span className="hidden sm:inline">{getThemeName(theme)}</span>
          <Palette className="h-4 w-4 sm:ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {t("teamTheme.title") || "Team Theme"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(teamThemes) as TeamTheme[]).map((themeId) => {
          const config = teamThemes[themeId];
          const Icon = themeIcons[themeId];
          const isActive = theme === themeId;

          return (
            <DropdownMenuItem
              key={themeId}
              onClick={() => setTheme(themeId)}
              className={cn(
                "flex items-center gap-3 cursor-pointer py-3",
                isActive && "bg-accent"
              )}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: config.gradient,
                  boxShadow: `0 0 10px ${config.glow}`,
                }}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: config.text }}>
                  {getThemeName(themeId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getThemeDesc(themeId)}
                </p>
              </div>
              {isActive && <Check className="h-4 w-4 text-green-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 预览卡片组件 - 用于展示主题效果
export function TeamThemePreview() {
  const { themeConfig } = useTeamTheme();

  return (
    <div
      className="p-4 rounded-lg border transition-all duration-300"
      style={{
        background: themeConfig.cardBg,
        borderColor: themeConfig.cardBorder,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: themeConfig.gradient }}
        >
          T
        </div>
        <div>
          <h3
            className="font-semibold"
            style={{ color: themeConfig.text }}
          >
            Team Alpha
          </h3>
          <p className="text-xs text-muted-foreground">5/5 Members</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            background: themeConfig.badge,
            color: themeConfig.badgeForeground,
          }}
        >
          Active
        </span>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            background: themeConfig.crownBg,
            color: themeConfig.crown,
          }}
        >
          Owner
        </span>
      </div>
    </div>
  );
}

export default TeamThemeSwitcher;
