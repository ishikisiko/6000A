import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Combo, Event, Phase, TTDSample } from "@shared/types";
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

export function TTDDistributionChart({ samples }: { samples: TTDSample[] }) {
  const { t } = useLanguage();
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

  return (
    <ChartWrapper
      title={t("analysis.ttdDistribution")}
      description={t("analysis.ttdDistributionDesc")}
      empty={samples.length === 0}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bucket" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937" }} />
          <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
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
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
          <YAxis stroke="rgba(255,255,255,0.5)" unit="%" />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937" }} />
          <Bar dataKey="winRate" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function ChartWrapper({ title, description, empty, children }: ChartWrapperProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] flex items-center justify-center">
        {empty ? (
          <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
