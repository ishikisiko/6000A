import React, { createContext, useContext, useEffect, useState } from "react";

// 战队主题色方案
export type TeamTheme = "deepBlue" | "crimson" | "gold" | "purple";

export interface TeamThemeConfig {
  id: TeamTheme;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  // 主色调
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  // 辅助光晕
  glow: string;
  glowHover: string;
  // 渐变
  gradient: string;
  gradientHover: string;
  // 边框
  border: string;
  borderHover: string;
  // 文字
  text: string;
  textMuted: string;
  // 徽章/标签
  badge: string;
  badgeForeground: string;
  // 图标
  icon: string;
  iconMuted: string;
  // 卡片
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardHoverShadow: string;
  // Owner 皇冠
  crown: string;
  crownBg: string;
  // 页面背景
  pageBg: string;
  pageBgGradient: string;
  pageBgAccent: string;
}

// 主题配置定义
export const teamThemes: Record<TeamTheme, TeamThemeConfig> = {
  // 原始深蓝/紫色主题 (默认)
  deepBlue: {
    id: "deepBlue",
    name: "Deep Blue",
    nameKey: "teamTheme.deepBlue",
    description: "Classic esports theme",
    descriptionKey: "teamTheme.deepBlueDesc",
    primary: "#6366f1", // Indigo
    primaryHover: "#818cf8",
    primaryForeground: "#ffffff",
    glow: "rgba(99, 102, 241, 0.4)",
    glowHover: "rgba(99, 102, 241, 0.6)",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    gradientHover: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
    border: "rgba(99, 102, 241, 0.3)",
    borderHover: "rgba(99, 102, 241, 0.6)",
    text: "#818cf8",
    textMuted: "#a5b4fc",
    badge: "rgba(99, 102, 241, 0.2)",
    badgeForeground: "#818cf8",
    icon: "#818cf8",
    iconMuted: "#6366f1",
    cardBg: "rgba(99, 102, 241, 0.05)",
    cardBorder: "rgba(99, 102, 241, 0.2)",
    cardHoverBorder: "rgba(99, 102, 241, 0.5)",
    cardHoverShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
    crown: "#fbbf24",
    crownBg: "rgba(251, 191, 36, 0.2)",
    pageBg: "#0b0c15",
    pageBgGradient: "radial-gradient(ellipse at top, #1e1b4b 0%, #0b0c15 100%)",
    pageBgAccent: "#1e1b4b",
  },

  // 方案 A：绯红/熔岩橙 - 战斗与激情
  crimson: {
    id: "crimson",
    name: "Crimson Fire",
    nameKey: "teamTheme.crimson",
    description: "Battle & Passion",
    descriptionKey: "teamTheme.crimsonDesc",
    primary: "#FF4655", // Valorant Red
    primaryHover: "#ff6b78",
    primaryForeground: "#ffffff",
    glow: "rgba(255, 70, 85, 0.4)",
    glowHover: "rgba(255, 70, 85, 0.6)",
    gradient: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)",
    gradientHover: "linear-gradient(135deg, #ff6b50 0%, #e84d8a 100%)",
    border: "rgba(255, 70, 85, 0.3)",
    borderHover: "rgba(255, 70, 85, 0.6)",
    text: "#ff6b78",
    textMuted: "#ff9aa2",
    badge: "rgba(255, 70, 85, 0.2)",
    badgeForeground: "#FF4655",
    icon: "#FF4655",
    iconMuted: "#ff6b78",
    cardBg: "rgba(255, 70, 85, 0.05)",
    cardBorder: "rgba(255, 70, 85, 0.2)",
    cardHoverBorder: "rgba(255, 70, 85, 0.5)",
    cardHoverShadow: "0 0 20px rgba(255, 70, 85, 0.3)",
    crown: "#FF5722", // Deep Orange crown for crimson theme
    crownBg: "rgba(255, 87, 34, 0.2)",
    pageBg: "#1a0505",
    pageBgGradient: "radial-gradient(ellipse at top, #450a0a 0%, #1a0505 100%)",
    pageBgAccent: "#450a0a",
  },

  // 方案 B：荣耀金/琥珀色 - 精英与管理
  gold: {
    id: "gold",
    name: "Glory Gold",
    nameKey: "teamTheme.gold",
    description: "Elite & Management",
    descriptionKey: "teamTheme.goldDesc",
    primary: "#FFA000", // Amber
    primaryHover: "#ffb333",
    primaryForeground: "#1a1a1a",
    glow: "rgba(255, 160, 0, 0.4)",
    glowHover: "rgba(255, 160, 0, 0.6)",
    gradient: "linear-gradient(135deg, #FFE082 0%, #FFCA28 100%)",
    gradientHover: "linear-gradient(135deg, #ffe8a0 0%, #ffd54f 100%)",
    border: "rgba(255, 160, 0, 0.3)",
    borderHover: "rgba(255, 160, 0, 0.6)",
    text: "#FFD700",
    textMuted: "#ffe082",
    badge: "rgba(255, 215, 0, 0.2)",
    badgeForeground: "#FFA000",
    icon: "#FFD700",
    iconMuted: "#FFA000",
    cardBg: "rgba(255, 160, 0, 0.05)",
    cardBorder: "rgba(255, 160, 0, 0.2)",
    cardHoverBorder: "rgba(255, 160, 0, 0.5)",
    cardHoverShadow: "0 0 20px rgba(255, 160, 0, 0.3)",
    crown: "#FFD700",
    crownBg: "rgba(255, 215, 0, 0.25)",
    pageBg: "#1a1002",
    pageBgGradient: "radial-gradient(ellipse at top, #422006 0%, #1a1002 100%)",
    pageBgAccent: "#422006",
  },

  // 方案 C：电光紫/品红 - 社区与潮流
  purple: {
    id: "purple",
    name: "Electric Purple",
    nameKey: "teamTheme.purple",
    description: "Community & Trend",
    descriptionKey: "teamTheme.purpleDesc",
    primary: "#D500F9", // Neon Purple
    primaryHover: "#e040fb",
    primaryForeground: "#ffffff",
    glow: "rgba(213, 0, 249, 0.4)",
    glowHover: "rgba(213, 0, 249, 0.6)",
    gradient: "linear-gradient(135deg, #D500F9 0%, #7C4DFF 100%)",
    gradientHover: "linear-gradient(135deg, #e040fb 0%, #9575ff 100%)",
    border: "rgba(213, 0, 249, 0.3)",
    borderHover: "rgba(213, 0, 249, 0.6)",
    text: "#e040fb",
    textMuted: "#ea80fc",
    badge: "rgba(213, 0, 249, 0.2)",
    badgeForeground: "#D500F9",
    icon: "#D500F9",
    iconMuted: "#e040fb",
    cardBg: "rgba(213, 0, 249, 0.05)",
    cardBorder: "rgba(213, 0, 249, 0.2)",
    cardHoverBorder: "rgba(213, 0, 249, 0.5)",
    cardHoverShadow: "0 0 20px rgba(213, 0, 249, 0.3)",
    crown: "#ea80fc",
    crownBg: "rgba(234, 128, 252, 0.2)",
    pageBg: "#0f0518",
    pageBgGradient: "radial-gradient(ellipse at top, #3b0764 0%, #0f0518 100%)",
    pageBgAccent: "#3b0764",
  },
};

interface TeamThemeContextType {
  theme: TeamTheme;
  themeConfig: TeamThemeConfig;
  setTheme: (theme: TeamTheme) => void;
  themes: typeof teamThemes;
}

const TeamThemeContext = createContext<TeamThemeContextType | undefined>(
  undefined
);

interface TeamThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: TeamTheme;
}

export function TeamThemeProvider({
  children,
  defaultTheme = "deepBlue",
}: TeamThemeProviderProps) {
  const [theme, setThemeState] = useState<TeamTheme>(() => {
    const stored = localStorage.getItem("team-theme");
    return (stored as TeamTheme) || defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem("team-theme", theme);
    // 更新 CSS 变量
    const root = document.documentElement;
    const config = teamThemes[theme];

    root.style.setProperty("--team-primary", config.primary);
    root.style.setProperty("--team-primary-hover", config.primaryHover);
    root.style.setProperty("--team-primary-foreground", config.primaryForeground);
    root.style.setProperty("--team-glow", config.glow);
    root.style.setProperty("--team-glow-hover", config.glowHover);
    root.style.setProperty("--team-gradient", config.gradient);
    root.style.setProperty("--team-gradient-hover", config.gradientHover);
    root.style.setProperty("--team-border", config.border);
    root.style.setProperty("--team-border-hover", config.borderHover);
    root.style.setProperty("--team-text", config.text);
    root.style.setProperty("--team-text-muted", config.textMuted);
    root.style.setProperty("--team-badge", config.badge);
    root.style.setProperty("--team-badge-foreground", config.badgeForeground);
    root.style.setProperty("--team-icon", config.icon);
    root.style.setProperty("--team-icon-muted", config.iconMuted);
    root.style.setProperty("--team-card-bg", config.cardBg);
    root.style.setProperty("--team-card-border", config.cardBorder);
    root.style.setProperty("--team-card-hover-border", config.cardHoverBorder);
    root.style.setProperty("--team-card-hover-shadow", config.cardHoverShadow);
    root.style.setProperty("--team-crown", config.crown);
    root.style.setProperty("--team-crown-bg", config.crownBg);
    
    // 新增页面背景变量
    root.style.setProperty("--team-page-bg", config.pageBg);
    root.style.setProperty("--team-page-bg-gradient", config.pageBgGradient);
    root.style.setProperty("--team-page-bg-accent", config.pageBgAccent);
  }, [theme]);

  const setTheme = (newTheme: TeamTheme) => {
    setThemeState(newTheme);
  };

  const themeConfig = teamThemes[theme];

  return (
    <TeamThemeContext.Provider
      value={{ theme, themeConfig, setTheme, themes: teamThemes }}
    >
      {children}
    </TeamThemeContext.Provider>
  );
}

export function useTeamTheme() {
  const context = useContext(TeamThemeContext);
  if (!context) {
    throw new Error("useTeamTheme must be used within TeamThemeProvider");
  }
  return context;
}

// 辅助 hook：获取主题配置中的特定颜色类名
export function useTeamThemeClasses() {
  const { themeConfig } = useTeamTheme();

  return {
    // 页面背景
    page: `bg-[var(--team-page-bg)] bg-[image:var(--team-page-bg-gradient)]`,

    // 按钮样式
    buttonPrimary: `bg-[var(--team-primary)] hover:bg-[var(--team-primary-hover)] text-[var(--team-primary-foreground)]`,
    buttonGradient: `bg-gradient-to-r from-[var(--team-primary)] to-[var(--team-primary-hover)]`,
    buttonOutline: `border-[var(--team-border)] hover:border-[var(--team-border-hover)] text-[var(--team-text)]`,

    // 卡片样式
    card: `bg-[var(--team-card-bg)] border-[var(--team-card-border)]`,
    cardHover: `hover:border-[var(--team-card-hover-border)] hover:shadow-[var(--team-card-hover-shadow)]`,

    // 徽章样式
    badge: `bg-[var(--team-badge)] text-[var(--team-badge-foreground)]`,

    // 文字样式
    textPrimary: `text-[var(--team-text)]`,
    textMuted: `text-[var(--team-text-muted)]`,

    // 图标样式
    icon: `text-[var(--team-icon)]`,
    iconMuted: `text-[var(--team-icon-muted)]`,

    // 皇冠样式
    crown: `text-[var(--team-crown)] bg-[var(--team-crown-bg)]`,

    // 光晕效果
    glow: `shadow-[0_0_15px_var(--team-glow)]`,
    glowHover: `hover:shadow-[0_0_25px_var(--team-glow-hover)]`,

    // 边框光效
    borderGlow: `border-[var(--team-border-hover)] shadow-[0_0_10px_var(--team-glow)]`,

    // Tab 样式
    tabActive: `border-b-2 border-[var(--team-primary)] text-[var(--team-text)]`,
  };
}
