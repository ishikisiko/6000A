import { Link, useRoute } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PhaseBreakdownChart,
  EventBreakdownChart,
  TTDDistributionChart,
  VoiceQualityChart,
  ComboWinRateChart,
} from "@/components/analytics/MatchAnalysisCharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BarChart3, Calendar, Map } from "lucide-react";
import type { Combo, Event, Phase, TTDSample } from "@shared/types";

export default function Analysis() {
  const { t } = useLanguage();
  const { user } = useLocalAuth();
  const [, params] = useRoute("/analysis/:matchId");
  const matchId = params?.matchId ? Number(params.matchId) : NaN;

  const { data: match, isLoading: matchLoading } = trpc.match.get.useQuery(
    { id: Number.isFinite(matchId) ? matchId : undefined },
    { enabled: !!user && Number.isFinite(matchId) }
  );
  const { data: phases } = trpc.phase.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: events } = trpc.event.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: ttdSamples } = trpc.ttd.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: voiceStats } = trpc.voice.analyze.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: combos } = trpc.collab.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );

  const metadata = useMemo(
    () => (match?.metadata || {}) as Record<string, unknown>,
    [match?.metadata]
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">{t("auth.pleaseLogin")}</h3>
            <Button asChild>
              <Link href="/">{t("auth.returnLogin")}</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/matches">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                {t("pages.analysis")}
              </h1>
              <p className="text-muted-foreground">
                {match?.matchId
                  ? `${match.matchId} • ${match.map}`
                  : t("analysis.loading")}
              </p>
            </div>
          </div>
          <Badge variant="outline">{t("analysis.live")}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {t("matchDetail.score")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {typeof metadata["scoreA"] === "number" &&
                typeof metadata["scoreB"] === "number"
                  ? `${metadata["scoreA"]} : ${metadata["scoreB"]}`
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {match?.teamIds?.join(" vs ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Map className="h-4 w-4" />
                {t("upload.mapName")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{match?.map || "--"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {match?.game}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("matchDetail.schedule")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {match?.startTs
                  ? new Date(match.startTs).toLocaleString()
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("matchDetail.endTime")}:{" "}
                {match?.endTs ? new Date(match.endTs).toLocaleString() : "--"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PhaseBreakdownChart phases={(phases as Phase[]) || []} />
          <EventBreakdownChart events={(events as Event[]) || []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TTDDistributionChart samples={(ttdSamples as TTDSample[]) || []} />
          <VoiceQualityChart voice={voiceStats ?? {}} />
        </div>

        <ComboWinRateChart combos={(combos as Combo[]) || []} />

        {matchLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
      </div>
    </div>
  );
}
