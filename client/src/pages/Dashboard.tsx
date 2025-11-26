import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, MessageSquare, Trophy, Users, Bot, User as UserIcon, Upload, Mic } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { trpc } from "@/lib/trpc";
import { TTDDistributionChart, ComboWinRateChart, VoiceQualityChart } from "@/components/analytics/MatchAnalysisCharts";
import { PerformanceTrendChart } from "@/components/analytics/PerformanceTrendChart";
import { AICopilot } from "@/components/AICopilot";
import { WelcomePopup } from "@/components/WelcomePopup";

interface DashboardProps {
  userName?: string;
  teamName?: string;
}

export default function Dashboard({ userName, teamName }: DashboardProps) {
  const { t } = useLanguage();
  const { data: activeTopics, isLoading: isLoadingTopics } = trpc.topics.list.useQuery(
    { status: 'active' },
    { refetchOnWindowFocus: false }
  );
  const recentTopics = activeTopics?.slice(0, 2) || [];
  const { data: matches, isLoading: matchesLoading } = trpc.match.list.useQuery(
    { limit: 20 },
    { enabled: Boolean(userName), refetchOnWindowFocus: false }
  );
  const latestMatchId = matches?.[0]?.id;
  const { data: ttdStats } = trpc.ttd.analyze.useQuery(
    { matchId: latestMatchId as number },
    { enabled: Boolean(latestMatchId), refetchOnWindowFocus: false }
  );
  const { data: ttdSamples } = trpc.ttd.list.useQuery(
    { matchId: latestMatchId as number },
    { enabled: Boolean(latestMatchId), refetchOnWindowFocus: false }
  );
  const { data: combos } = trpc.collab.list.useQuery(
    { matchId: latestMatchId as number },
    { enabled: Boolean(latestMatchId), refetchOnWindowFocus: false }
  );
  const { data: voiceStats } = trpc.voice.analyze.useQuery(
    { matchId: latestMatchId as number },
    { enabled: Boolean(latestMatchId), refetchOnWindowFocus: false }
  );

  // Get TTD data for the last 5 matches
  const last5MatchIds = useMemo(() => matches?.slice(0, 5).map(m => m.id) || [], [matches]);
  
  // Query TTD samples for each of the last 5 matches
  const ttdQueries = trpc.useQueries((t) => 
    last5MatchIds.map(matchId => 
      t.ttd.list({ matchId }, { enabled: Boolean(matchId), refetchOnWindowFocus: false })
    )
  );

  // Process TTD data for the chart
  const recentMatchesTTD = useMemo(() => {
    if (!matches || last5MatchIds.length === 0) return [];
    
    return last5MatchIds.map((matchId, idx) => {
      const match = matches.find(m => m.id === matchId);
      const samples = ttdQueries[idx]?.data || [];
      
      // Group samples by round and calculate average TTD per round
      const roundMap = new Map<number, number[]>();
      
      samples.forEach(sample => {
        const meta = sample.metadata as Record<string, unknown> | null;
        const round = meta?.round as number | undefined;
        if (round && meta?.isRoundTTD) {
          if (!roundMap.has(round)) {
            roundMap.set(round, []);
          }
          roundMap.get(round)!.push(sample.ttdMs);
        }
      });
      
      // If no round data, try to create from samples based on time
      if (roundMap.size === 0 && samples.length > 0) {
        // Sort by event time and group into "virtual rounds"
        const sortedSamples = [...samples].sort((a, b) => 
          new Date(a.eventSrcTs).getTime() - new Date(b.eventSrcTs).getTime()
        );
        const samplesPerRound = Math.ceil(sortedSamples.length / 15);
        sortedSamples.forEach((sample, i) => {
          const virtualRound = Math.floor(i / samplesPerRound) + 1;
          if (!roundMap.has(virtualRound)) {
            roundMap.set(virtualRound, []);
          }
          roundMap.get(virtualRound)!.push(sample.ttdMs);
        });
      }
      
      // Calculate average TTD per round
      const roundData = Array.from(roundMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([round, ttds]) => ({
          round,
          avgTtd: Math.round(ttds.reduce((a, b) => a + b, 0) / ttds.length)
        }));
      
      return {
        matchId,
        matchName: `Match ${idx + 1}`,
        game: match?.game || 'Unknown',
        map: match?.map || 'Unknown',
        roundData,
        color: '' // Will be set in the component
      };
    }).filter(m => m.roundData.length > 0);
  }, [matches, last5MatchIds, ttdQueries]);

  const totalMatches = matches?.length ?? 0;
  const avgTTD = ttdStats?.mean ? `${(ttdStats.mean / 1000).toFixed(2)}s` : "--";
  const teamCollab = combos && combos.length
    ? `${Math.round((combos.reduce((sum, c) => sum + (c.winRate ?? 0), 0) / combos.length) * 100)}%`
    : "--";
  const voiceClarity = voiceStats?.avgClarity ? voiceStats.avgClarity.toFixed(2) : "--";

  return (
    <div className="min-h-screen bg-transparent">
      <WelcomePopup />
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
          <div className="flex items-center gap-3">
            {/* Quick Start Capsule Buttons */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
              <Link href="/matches">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 h-8 hover:bg-blue-500/20 hover:text-blue-300 transition-all group"
                >
                  <Trophy className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  {t('dashboard.viewMatches')}
                </Button>
              </Link>
              <Link href="/topics">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 h-8 hover:bg-amber-500/20 hover:text-amber-300 transition-all group"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  {t('dashboard.joinVoting')}
                </Button>
              </Link>
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 h-8 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all group"
                >
                  <UserIcon className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  {t('dashboard.personalCenter')}
                </Button>
              </Link>
              <Link href="/discord-settings">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 h-8 hover:bg-violet-500/20 hover:text-violet-300 transition-all group"
                >
                  <Bot className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  {t('nav.discordBot')}
                </Button>
              </Link>
            </div>
            
            <LanguageSwitcher />
            <Button variant="outline" asChild className="glass hover:bg-white/10">
              <Link href="/settings">{t('nav.settings')}</Link>
            </Button>
          </div>
        </div>

        {/* Main layout: 2 columns on left, AI Co-pilot on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left side: all content */}
          <div className="space-y-8">
            {/* First row: Performance Snapshot and TTD Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-t-4 border-t-primary h-full bg-[#1A1B2E] border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
                {/* Top highlight border */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg font-semibold">Performance Snapshot</CardTitle>
              <CardDescription>{t('dashboard.readyForNextMatch')}</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {/* Main layout: Featured metric + grid */}
              <div className="flex flex-col gap-4">
                {/* Featured Metric: Avg TTD */}
                <div className="relative group">
                  {/* Hexagon background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-6 rounded-2xl border-2 border-cyan-500/30 bg-black/40 backdrop-blur-sm overflow-hidden">
                    {/* Top highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                    {/* Animated glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/10 to-cyan-500/5 animate-pulse" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-cyan-400/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5" />
                          {t('dashboard.avgTTD')}
                        </p>
                        <p className="text-6xl font-black tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontStretch: 'expanded' }}>
                          <span className="bg-gradient-to-br from-cyan-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                            {avgTTD}
                          </span>
                        </p>
                        <p className="text-xs text-cyan-400/50 mt-1 font-medium">Decision Time Analysis</p>
                      </div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Activity className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid of other metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Total Matches */}
                  <div className="relative group">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="p-3 rounded-lg border border-white/5 bg-black/30 backdrop-blur-sm flex flex-col justify-between h-full hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dashboard.totalMatches')}</p>
                        <div className="p-1 bg-primary/10 rounded-md">
                          <Trophy className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-black bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {matchesLoading ? t('common.loading') : totalMatches}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-0.5 font-medium">let's continue !</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Collab */}
                  <div className="relative group">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="p-3 rounded-lg border border-white/5 bg-black/30 backdrop-blur-sm flex flex-col justify-between h-full hover:border-green-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dashboard.teamCollab')}</p>
                        <div className="p-1 bg-green-500/10 rounded-md">
                          <Users className="h-3 w-3 text-green-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-black bg-gradient-to-b from-green-300 via-green-200 to-white bg-clip-text text-transparent" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {teamCollab}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-0.5 font-medium">Win Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Voice Quality */}
                  <div className="relative group">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="p-3 rounded-lg border border-white/5 bg-black/30 backdrop-blur-sm flex flex-col justify-between h-full hover:border-red-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('matchDetail.voiceQuality')}</p>
                        <div className="p-1 bg-red-500/10 rounded-md">
                          <Mic className="h-3 w-3 text-red-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-black bg-gradient-to-b from-red-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {voiceClarity}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-0.5 font-medium">Clarity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

              <TTDDistributionChart samples={ttdSamples || []} recentMatchesTTD={recentMatchesTTD} />
            </div>

            {/* Second row: Performance Trend and Combo Win Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PerformanceTrendChart matches={matches || []} />
              
              <ComboWinRateChart combos={combos || []} />
            </div>
          </div>

          {/* Right side: AI Co-pilot (full height) */}
          <div className="lg:row-span-1">
            <AICopilot latestMatchId={latestMatchId} />
          </div>
        </div>
      </div>
    </div>
  );
}
