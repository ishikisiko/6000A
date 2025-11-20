import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, MessageSquare, Trophy, Users, Bot, User as UserIcon, Upload, Crosshair } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { trpc } from "@/lib/trpc";

import { AbilityRadarChart, ActivityLineChart } from "@/components/ActiveTopicsChart";

interface DashboardProps {
  userName?: string;
  teamName?: string;
}

export default function Dashboard({ userName, teamName }: DashboardProps) {
  const { t } = useLanguage();
  const { data: activeTopics, isLoading: isLoadingTopics } = trpc.topics.list.useQuery({ status: 'active' });
  const recentTopics = activeTopics?.slice(0, 2) || [];
  const statsByUser: Record<string, { totalMatches: number; avgTTD: string; teamCollab: string; avgKD: string }> = {
    admin: { totalMatches: 24, avgTTD: "0.82s", teamCollab: "73%", avgKD: "1.45" },
    hzy: { totalMatches: 16, avgTTD: "0.94s", teamCollab: "68%", avgKD: "1.21" },
  };
  const normalizedName = userName?.trim().toLowerCase();
  const personalizedStats = (normalizedName && statsByUser[normalizedName]) || { totalMatches: 0, avgTTD: "--", teamCollab: "--", avgKD: "--" };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {t('dashboard.welcome')}, {userName || t('dashboard.coach')}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {t('dashboard.readyForNextMatch')} • Team: <span className="text-primary font-semibold">{teamName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" asChild className="glass hover:bg-white/10">
              <Link href="/settings">{t('nav.settings')}</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <Card className="border-t-4 border-t-primary h-full bg-[#1A1B2E] border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg font-semibold">Performance Snapshot</CardTitle>
              <CardDescription>{t('dashboard.readyForNextMatch')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-lg border bg-background/40 backdrop-blur-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-muted-foreground">{t('dashboard.totalMatches')}</p>
                  <div className="p-1.5 bg-primary/10 rounded-full">
                    <Trophy className="h-3 w-3 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold font-gaming bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{personalizedStats.totalMatches}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">let's continue !</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-background/40 backdrop-blur-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-muted-foreground">{t('dashboard.avgTTD')}</p>
                  <div className="p-1.5 bg-cyan-500/10 rounded-full">
                    <Activity className="h-3 w-3 text-cyan-500" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold font-gaming bg-gradient-to-b from-cyan-300 to-white bg-clip-text text-transparent">{personalizedStats.avgTTD}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Decision Time Analysis</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-background/40 backdrop-blur-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-muted-foreground">{t('dashboard.teamCollab')}</p>
                  <div className="p-1.5 bg-green-500/10 rounded-full">
                    <Users className="h-3 w-3 text-green-500" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold font-gaming bg-gradient-to-b from-green-300 to-white bg-clip-text text-transparent">{personalizedStats.teamCollab}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Combo Win Rate Stats</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-background/40 backdrop-blur-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-muted-foreground">Avg K/D</p>
                  <div className="p-1.5 bg-red-500/10 rounded-full">
                    <Crosshair className="h-3 w-3 text-red-500" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold font-gaming bg-gradient-to-b from-red-400 to-orange-300 bg-clip-text text-transparent">{personalizedStats.avgKD}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Kill/Death Ratio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AbilityRadarChart />
          <ActivityLineChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">{t('dashboard.quickStart')}</CardTitle>
              <CardDescription>{t('dashboard.chooseFeature')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {/* Matches - Blue */}
              <Link href="/matches">
                <div className="group relative h-40 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-black/40 p-5 transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] cursor-pointer">
                  <Trophy className="absolute -bottom-8 -right-8 h-32 w-32 text-blue-500/5 rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
                  
                  <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-blue-500/30 transition-colors group-hover:border-blue-400" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2 border-blue-500/30 transition-colors group-hover:border-blue-400" />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-3">
                        <Trophy className="h-8 w-8 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                        {t('dashboard.viewMatches')}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-blue-200/60 flex items-center gap-1">
                      Latest: 2h ago
                    </p>
                  </div>
                </div>
              </Link>

              {/* Voting - Orange */}
              <Link href="/topics">
                <div className="group relative h-40 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/5 to-black/40 p-5 transition-all hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer">
                  <MessageSquare className="absolute -bottom-8 -right-8 h-32 w-32 text-amber-500/5 rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
                  
                  <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-amber-500/30 transition-colors group-hover:border-amber-400" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2 border-amber-500/30 transition-colors group-hover:border-amber-400" />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-3">
                        <MessageSquare className="h-8 w-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                        {t('dashboard.joinVoting')}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-amber-200/60 flex items-center gap-1">
                      {activeTopics?.length || 0} Active Topics
                    </p>
                  </div>
                </div>
              </Link>

              {/* Personal - Cyan */}
              <Link href="/profile">
                <div className="group relative h-40 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-black/40 p-5 transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer">
                  <UserIcon className="absolute -bottom-8 -right-8 h-32 w-32 text-cyan-500/5 rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
                  
                  <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-cyan-500/30 transition-colors group-hover:border-cyan-400" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2 border-cyan-500/30 transition-colors group-hover:border-cyan-400" />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-3">
                        <UserIcon className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)] transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {t('dashboard.personalCenter')}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-cyan-200/60 flex items-center gap-1">
                      Tier: Diamond
                    </p>
                  </div>
                </div>
              </Link>

              {/* Discord - Purple */}
              <Link href="/discord-settings">
                <div className="group relative h-40 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/5 to-black/40 p-5 transition-all hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] cursor-pointer">
                  <Bot className="absolute -bottom-8 -right-8 h-32 w-32 text-violet-500/5 rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
                  
                  <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-violet-500/30 transition-colors group-hover:border-violet-400" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2 border-violet-500/30 transition-colors group-hover:border-violet-400" />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-3">
                        <Bot className="h-8 w-8 text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                        {t('nav.discordBot')}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-violet-200/60 flex items-center gap-1">
                      Status: Online
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">{t('dashboard.features')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTopics ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentTopics.length > 0 ? (
                recentTopics.map((topic) => (
                  <div key={topic.topicId} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`rounded-xl p-3 shadow-[0_0_20px_rgba(139,92,246,0.2)] ${topic.topicType === 'bet' ? 'bg-amber-500/5 shadow-amber-500/20' : 'bg-blue-500/5 shadow-blue-500/20'}`}>
                      {topic.topicType === 'bet' ? <Trophy className="h-6 w-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> : <MessageSquare className="h-6 w-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{topic.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{topic.description || "No description"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {topic.options.slice(0, 2).map((opt) => {
                          const isYes = opt.toUpperCase() === 'YES';
                          const isNo = opt.toUpperCase() === 'NO';
                          let className = "text-xs border border-white/10 bg-white/5 rounded-full px-3 py-1";
                          
                          if (isYes) {
                            className = "text-xs border border-green-500/50 text-green-500 bg-black/40 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
                          } else if (isNo) {
                            className = "text-xs border border-red-500/50 text-red-500 bg-black/40 rounded-full px-3 py-1 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
                          }
                          
                          return (
                            <span key={opt} className={className}>{opt}</span>
                          );
                        })}
                        {topic.options.length > 2 && <span className="text-xs text-muted-foreground self-center">+{topic.options.length - 2}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  No active topics
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
