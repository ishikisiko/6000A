import type React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Combo, Event, Phase, TTDSample } from "@shared/types";
import { RotateCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  LineChart,
  Line,
  Legend,
} from "recharts";

type VoiceStats = {
  avgClarity?: number;
  avgInfoDensity?: number;
  interruptionRate?: number;
};

type ChartWrapperProps = {
  title: string;
  description: string;
  empty: boolean;
  children: React.ReactNode;
};

export function PhaseBreakdownChart({ phases }: { phases: Phase[] }) {
  const { t } = useLanguage();
  const data = phases.reduce<Record<Phase["phaseType"], number>>(
    (acc, phase) => {
      const duration =
        new Date(phase.endTs).getTime() - new Date(phase.startTs).getTime();
      acc[phase.phaseType] = (acc[phase.phaseType] || 0) + duration / 60000;
      return acc;
    },
    { hot: 0, normal: 0, slump: 0, recovery: 0 }
  );

  const chartData = Object.entries(data).map(([key, value]) => ({
    type: key,
    minutes: Number(value.toFixed(1)),
  }));

  return (
    <ChartWrapper
      title={t("analysis.phaseBreakdown")}
      description={t("analysis.phaseBreakdownDesc")}
      empty={phases.length === 0}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="type" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937" }} />
          <Bar dataKey="minutes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export function EventBreakdownChart({ events }: { events: Event[] }) {
  const { t } = useLanguage();
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.action] = (acc[event.action] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(counts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <ChartWrapper
      title={t("analysis.eventBreakdown")}
      description={t("analysis.eventBreakdownDesc")}
      empty={events.length === 0}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="action" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937" }} />
          <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// Match TTD trend data type for recent matches
type MatchTTDTrend = {
  matchId: number;
  matchName: string;
  game: string;
  map: string;
  roundData: { round: number; avgTtd: number }[];
  color: string;
};

// Line colors for the 5 matches - gaming theme gradient colors
const MATCH_COLORS = [
  "#22d3ee", // cyan
  "#a855f7", // purple
  "#f43f5e", // rose
  "#facc15", // yellow
  "#4ade80", // green
];

export function TTDDistributionChart({ 
  samples, 
  recentMatchesTTD 
}: { 
  samples: TTDSample[];
  recentMatchesTTD?: MatchTTDTrend[];
}) {
  const { t } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);

  // Distribution chart data
  const buckets = [
    { label: "<250", min: 0, max: 250 },
    { label: "250-500", min: 250, max: 500 },
    { label: "500-750", min: 500, max: 750 },
    { label: "750-1000", min: 750, max: 1000 },
    { label: "1000-1500", min: 1000, max: 1500 },
    { label: ">1500", min: 1500, max: Infinity },
  ];

  const chartData = buckets.map((bucket) => {
    const count = samples.filter(
      (s) => s.ttdMs >= bucket.min && s.ttdMs < bucket.max
    ).length;
    return { bucket: bucket.label, count };
  });

  // Transform recent matches TTD data for line chart
  const lineChartData = useMemo(() => {
    if (!recentMatchesTTD || recentMatchesTTD.length === 0) return [];
    
    // Find max rounds across all matches
    const maxRounds = Math.max(...recentMatchesTTD.map(m => m.roundData.length));
    
    // Create data points for each round
    const data: Record<string, number | string>[] = [];
    for (let i = 0; i < maxRounds; i++) {
      const point: Record<string, number | string> = { round: `R${i + 1}` };
      recentMatchesTTD.forEach((match, idx) => {
        const roundData = match.roundData[i];
        if (roundData) {
          point[`match${idx}`] = roundData.avgTtd;
        }
      });
      data.push(point);
    }
    return data;
  }, [recentMatchesTTD]);

  const hasRecentMatchData = recentMatchesTTD && recentMatchesTTD.length > 0;

  return (
    <Card className="relative overflow-hidden bg-[#1A1B2E] border-white/5 h-full" style={{ perspective: '1000px' }}>
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      {/* Top highlight border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Flip button */}
      {hasRecentMatchData && (
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group"
          title={isFlipped ? t("analysis.showDistribution") : t("analysis.showTrends")}
        >
          <RotateCw 
            className={`h-4 w-4 text-cyan-400 transition-transform duration-500 group-hover:text-cyan-300 ${isFlipped ? 'rotate-180' : ''}`} 
          />
        </button>
      )}

      {/* Card flip container */}
      <div 
        className="relative w-full h-full transition-transform duration-700 ease-in-out"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front side - TTD Trend Lines */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {t("analysis.ttdTrends")}
              </span>
              <span className="text-xs font-normal text-muted-foreground">({t("analysis.last5Matches")})</span>
            </CardTitle>
            <CardDescription className="text-xs">{t("analysis.ttdTrendsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] relative z-10">
            {!hasRecentMatchData ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
              </div>
            ) : (
              <div className="w-full h-full">
                {/* Match legend */}
                <div className="flex flex-wrap gap-2 mb-2 px-2">
                  {recentMatchesTTD.map((match, idx) => (
                    <div 
                      key={match.matchId} 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
                      style={{ 
                        backgroundColor: `${MATCH_COLORS[idx]}15`,
                        border: `1px solid ${MATCH_COLORS[idx]}30`
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: MATCH_COLORS[idx] }}
                      />
                      <span style={{ color: MATCH_COLORS[idx] }}>
                        {match.game} - {match.map}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-purple-500/5 to-transparent rounded-lg blur-xl" />
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        {MATCH_COLORS.map((color, idx) => (
                          <linearGradient key={`gradient-${idx}`} id={`lineGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(34, 211, 238, 0.1)" strokeWidth={0.5} />
                      <XAxis 
                        dataKey="round" 
                        stroke="rgba(34, 211, 238, 0.4)" 
                        tick={{ fill: 'rgba(34, 211, 238, 0.6)', fontSize: 9 }}
                        axisLine={{ stroke: 'rgba(34, 211, 238, 0.2)' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="rgba(34, 211, 238, 0.4)" 
                        tick={{ fill: 'rgba(34, 211, 238, 0.6)', fontSize: 9 }}
                        axisLine={{ stroke: 'rgba(34, 211, 238, 0.2)' }}
                        domain={['dataMin - 50', 'dataMax + 50']}
                        tickFormatter={(v) => `${v}ms`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "rgba(15, 23, 42, 0.95)", 
                          border: "1px solid rgba(34, 211, 238, 0.3)",
                          borderRadius: '8px',
                          backdropFilter: 'blur(8px)',
                          fontSize: '11px'
                        }}
                        formatter={(value: number, name: string) => {
                          const matchIdx = parseInt(name.replace('match', ''));
                          const match = recentMatchesTTD[matchIdx];
                          return [`${value}ms`, match ? `${match.game} - ${match.map}` : name];
                        }}
                      />
                      {recentMatchesTTD.map((match, idx) => (
                        <Line
                          key={match.matchId}
                          type="monotone"
                          dataKey={`match${idx}`}
                          stroke={MATCH_COLORS[idx]}
                          strokeWidth={2}
                          dot={{ fill: MATCH_COLORS[idx], strokeWidth: 0, r: 2 }}
                          activeDot={{ r: 4, fill: MATCH_COLORS[idx], stroke: '#fff', strokeWidth: 2 }}
                          style={{ filter: `drop-shadow(0 0 6px ${MATCH_COLORS[idx]}60)` }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </div>

        {/* Back side - TTD Distribution (original) */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-lg">{t("analysis.ttdDistribution")}</CardTitle>
            <CardDescription className="text-xs">{t("analysis.ttdDistributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center relative z-10">
            {samples.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
            ) : (
              <div className="w-full h-full">
                <div className="relative">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 via-transparent to-transparent rounded-lg blur-xl" />
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      {/* Radar-style grid lines */}
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(34, 211, 238, 0.15)" strokeWidth={0.5} />
                      <XAxis 
                        dataKey="bucket" 
                        stroke="rgba(34, 211, 238, 0.5)" 
                        tick={{ fill: 'rgba(34, 211, 238, 0.7)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(34, 211, 238, 0.3)' }}
                      />
                      <YAxis 
                        stroke="rgba(34, 211, 238, 0.5)" 
                        allowDecimals={false}
                        tick={{ fill: 'rgba(34, 211, 238, 0.7)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(34, 211, 238, 0.3)' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "rgba(15, 23, 42, 0.95)", 
                          border: "1px solid rgba(34, 211, 238, 0.3)",
                          borderRadius: '8px',
                          backdropFilter: 'blur(8px)'
                        }} 
                      />
                      {/* Gradient bar with striped pattern */}
                      <defs>
                        <linearGradient id="greenGradientBack" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6ee7b7" stopOpacity={1} />
                          <stop offset="50%" stopColor="#34d399" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                        </linearGradient>
                        <pattern id="stripesBack" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                          <rect width="2" height="4" fill="rgba(255,255,255,0.1)" />
                        </pattern>
                      </defs>
                      <Bar 
                        dataKey="count" 
                        fill="url(#greenGradientBack)" 
                        radius={[8, 8, 0, 0]}
                        style={{ filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))' }}
                      >
                        {chartData.map((entry, index) => (
                          <rect key={`pattern-back-${index}`} fill="url(#stripesBack)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

export function VoiceQualityChart({ voice }: { voice: VoiceStats }) {
  const { t } = useLanguage();
  const chartData = [
    { metric: t("matchDetail.clarity"), value: Number((voice.avgClarity ?? 0).toFixed(2)) },
    { metric: t("matchDetail.infoDensity"), value: Number((voice.avgInfoDensity ?? 0).toFixed(2)) },
    { metric: t("matchDetail.interruptions"), value: Number(((voice.interruptionRate ?? 0) * 100).toFixed(1)) },
  ];

  const empty = chartData.every((item) => item.value === 0);

  return (
    <ChartWrapper
      title={t("analysis.voiceQuality")}
      description={t("analysis.voiceQualityDesc")}
      empty={empty}
    >
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
          <PolarRadiusAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
          <RechartsRadar
            dataKey="value"
            stroke="#f472b6"
            fill="#f472b6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937" }} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export function ComboWinRateChart({ combos }: { combos: Combo[] }) {
  const { t } = useLanguage();
  const chartData = combos
    .slice(0, 6)
    .map((combo) => ({
      name: combo.members.join(" + "),
      winRate: combo.winRate ? Math.round(combo.winRate * 100) : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  return (
    <ChartWrapper
      title={t("analysis.comboPerformance")}
      description={t("analysis.comboPerformanceDesc")}
      empty={combos.length === 0}
    >
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent rounded-lg blur-xl" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            {/* Radar-style grid lines */}
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(34, 211, 238, 0.15)" strokeWidth={0.5} horizontal={false} vertical={true} />
            <XAxis 
              type="number"
              stroke="rgba(34, 211, 238, 0.5)" 
              unit="%"
              tick={{ fill: 'rgba(34, 211, 238, 0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(34, 211, 238, 0.3)' }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="rgba(34, 211, 238, 0.5)" 
              tick={{ fill: 'rgba(34, 211, 238, 0.7)', fontSize: 10 }} 
              width={110}
              axisLine={{ stroke: 'rgba(34, 211, 238, 0.3)' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: "rgba(15, 23, 42, 0.95)", 
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: '8px',
                backdropFilter: 'blur(8px)'
              }} 
            />
            {/* Gradient bar */}
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity={1} />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.8} />
              </linearGradient>
              <pattern id="blueStripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <rect width="2" height="4" fill="rgba(255,255,255,0.1)" />
              </pattern>
            </defs>
            <Bar 
              dataKey="winRate" 
              fill="url(#blueGradient)" 
              radius={[0, 4, 4, 0]}
              barSize={24}
              style={{ filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' }}
            >
              {/* Add striped pattern overlay */}
              {chartData.map((entry, index) => (
                <rect key={`pattern-${index}`} fill="url(#blueStripes)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}

function ChartWrapper({ title, description, empty, children }: ChartWrapperProps) {
  const { t } = useLanguage();

  return (
    <Card className="relative overflow-hidden bg-[#1A1B2E] border-white/5">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      {/* Top highlight border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] flex items-center justify-center relative z-10">
        {empty ? (
          <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
