import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flame,
  Map,
  Mic,
  Share2,
  Timer,
  Users,
  Waves,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { trpc } from "@/lib/trpc";
import type {
  Combo,
  Event,
  Phase,
  TTDSample,
  VoiceTurn,
} from "@shared/types";

type MatchMetadata = {
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  duration?: number;
  demoFile?: string;
};

type PhaseType = Phase["phaseType"];

function PhasePill({ type }: { type: PhaseType }) {
  const map: Record<PhaseType, string> = {
    hot: "bg-red-500/10 text-red-400 border border-red-500/30",
    normal: "bg-blue-500/10 text-blue-300 border border-blue-500/30",
    slump: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    recovery: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  };
  return <span className={`px-3 py-1 rounded-full text-xs ${map[type]}`}>{type}</span>;
}

function formatDateTime(ts?: Date) {
  return ts ? new Date(ts).toLocaleString() : "--";
}

function formatDurationMs(ms?: number) {
  if (!ms || ms <= 0) return "--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatMs(ms?: number) {
  if (!ms) return "--";
  return `${Math.round(ms)} ms`;
}

export default function MatchDetail() {
  const { t } = useLanguage();
  const { user } = useLocalAuth();
  const [, params] = useRoute("/match/:id");
  const matchId = params?.id ? Number(params.id) : NaN;

  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
  } = trpc.match.get.useQuery(
    { id: Number.isFinite(matchId) ? matchId : undefined },
    { enabled: !!user && Number.isFinite(matchId) }
  );

  const { data: phases, isLoading: phasesLoading } = trpc.phase.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: events, isLoading: eventsLoading } = trpc.event.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: ttdSamples, isLoading: ttdLoading } = trpc.ttd.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: ttdStats } = trpc.ttd.analyze.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: voiceTurns, isLoading: voiceLoading } = trpc.voice.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: voiceStats } = trpc.voice.analyze.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );
  const { data: combos, isLoading: combosLoading } = trpc.collab.list.useQuery(
    { matchId: match?.id ?? 0 },
    { enabled: !!match?.id }
  );

  const metadata = useMemo(
    () => (match?.metadata || {}) as MatchMetadata,
    [match?.metadata]
  );
  const [teamA, teamB] = useMemo(
    () =>
      Array.isArray(match?.teamIds) && match.teamIds.length >= 2
        ? match.teamIds
        : ["Team A", "Team B"],
    [match?.teamIds]
  );
  const durationMs = useMemo(() => {
    if (typeof metadata.duration === "number") return metadata.duration;
    if (match?.startTs && match?.endTs) {
      return (
        new Date(match.endTs).getTime() - new Date(match.startTs).getTime()
      );
    }
    return undefined;
  }, [metadata.duration, match?.startTs, match?.endTs]);

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

  if (!Number.isFinite(matchId)) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {t("matches.invalidMatch")}
          </CardContent>
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
              <h1 className="text-3xl font-bold">
                {t("matchDetail.title", { id: match?.matchId || matchId })}
              </h1>
              <p className="text-muted-foreground">
                {match?.game} • {match?.map}
              </p>
            </div>
          </div>
          <Badge variant="outline">{t("matchDetail.liveData")}</Badge>
        </div>

        {matchError && (
          <Card>
            <CardContent className="py-4 text-destructive text-sm">
              {matchError.message}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("matchDetail.overview")}</CardTitle>
              <CardDescription>{t("matchDetail.overviewDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("matchDetail.teams")}
                    </span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mt-1">
                    {teamA} vs {teamB}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("matchDetail.score")}
                    </span>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mt-1">
                    {metadata.scoreA ?? "--"} : {metadata.scoreB ?? "--"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("matchDetail.duration")}
                    </span>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mt-1">{formatDurationMs(durationMs)}</p>
                </div>
                <div className="p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("matchDetail.schedule")}
                    </span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mt-1">
                    {formatDateTime(match?.startTs)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  {match?.map}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t("matchDetail.endTime")}: {formatDateTime(match?.endTs)}
                </span>
                {metadata.demoFile && (
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {metadata.demoFile}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("matchDetail.summary")}</CardTitle>
              <CardDescription>{t("matchDetail.summaryDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("matchDetail.ttdLabel")}
                  </p>
                  <p className="text-xl font-bold">
                    {formatMs(ttdStats?.p50)} / {formatMs(ttdStats?.p90)}
                  </p>
                </div>
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("matchDetail.voiceQuality")}
                  </p>
                  <p className="text-xl font-bold">
                    {(voiceStats?.avgClarity ?? 0).toFixed(2)}
                  </p>
                </div>
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("matchDetail.comboLabel")}
                  </p>
                  <p className="text-xl font-bold">
                    {combos?.[0]?.winRate
                      ? `${Math.round((combos[0].winRate ?? 0) * 100)}%`
                      : "--"}
                  </p>
                </div>
                <Waves className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("matchDetail.phases")}</CardTitle>
              <CardDescription>{t("matchDetail.phasesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {phasesLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : !phases || phases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("matchDetail.noPhases")}
                </p>
              ) : (
                phases.map((phase) => (
                  <div
                    key={phase.id}
                    className="border rounded-lg p-3 bg-background/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <PhasePill type={phase.phaseType} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(phase.startTs)} → {formatDateTime(phase.endTs)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t("matchDetail.phaseDuration")}:{" "}
                        {formatDurationMs(
                          new Date(phase.endTs).getTime() -
                            new Date(phase.startTs).getTime()
                        )}
                      </span>
                      {typeof phase.changePointScore === "number" && (
                        <span>
                          {t("matchDetail.changePoint")}:{" "}
                          {phase.changePointScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("matchDetail.events")}</CardTitle>
              <CardDescription>{t("matchDetail.eventsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : !events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("matchDetail.noEvents")}
                </p>
              ) : (
                (events as Event[])
                  .sort(
                    (a, b) =>
                      new Date(a.eventTs).getTime() - new Date(b.eventTs).getTime()
                  )
                  .slice(0, 10)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-semibold">
                          {event.actor}{" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          {event.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.target ? `${event.target} • ` : ""}
                          {event.metadata?.["team"] || ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.eventTs)}
                      </span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("matchDetail.ttd")}</CardTitle>
              <CardDescription>{t("matchDetail.ttdDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ttdLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : !ttdSamples || ttdSamples.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("matchDetail.noTtd")}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBlock label="P50" value={formatMs(ttdStats?.p50)} />
                    <StatBlock label="P90" value={formatMs(ttdStats?.p90)} />
                    <StatBlock label={t("matchDetail.mean")} value={formatMs(ttdStats?.mean)} />
                    <StatBlock label={t("matchDetail.samples")} value={ttdStats?.count ?? t("matchDetail.noData")} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {ttdSamples.slice(0, 6).map((sample: TTDSample) => (
                      <div
                        key={sample.id}
                        className="p-3 rounded-lg border bg-background/40"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{formatMs(sample.ttdMs)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(sample.eventSrcTs)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sample.metadata?.["situation"] || "context"} •{" "}
                          {sample.metadata?.["pressure"] || "--"}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("matchDetail.voice")}</CardTitle>
              <CardDescription>{t("matchDetail.voiceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {voiceLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : !voiceTurns || voiceTurns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("matchDetail.noVoice")}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBlock
                      label={t("matchDetail.clarity")}
                      value={(voiceStats?.avgClarity ?? 0).toFixed(2)}
                    />
                    <StatBlock
                      label={t("matchDetail.infoDensity")}
                      value={(voiceStats?.avgInfoDensity ?? 0).toFixed(2)}
                    />
                    <StatBlock
                      label={t("matchDetail.interruptions")}
                      value={`${Math.round(
                        (voiceStats?.interruptionRate ?? 0) * 100
                      )}%`}
                    />
                    <StatBlock
                      label={t("matchDetail.turns")}
                      value={voiceStats?.totalTurns ?? 0}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {voiceTurns.slice(0, 6).map((turn: VoiceTurn) => (
                      <div
                        key={turn.id}
                        className="p-3 rounded-lg border bg-background/40"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{turn.speakerId}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(turn.startTs)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {turn.text || t("matchDetail.noTranscript")}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{t("matchDetail.clarity")}: {(turn.clarity ?? 0).toFixed(2)}</span>
                          <span>{t("matchDetail.sentiment")}: {turn.sentiment || "--"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("matchDetail.combos")}</CardTitle>
            <CardDescription>{t("matchDetail.combosDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {combosLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : !combos || combos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("matchDetail.noCombos")}
              </p>
            ) : (
              (combos as Combo[]).map((combo) => (
                <div
                  key={combo.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-background/40"
                >
                  <div>
                    <p className="font-semibold">{combo.members.join(" + ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {combo.context || t("matchDetail.comboContext")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("matchDetail.attempts")}
                    </p>
                    <p className="font-semibold">{combo.attempts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("matchDetail.success")}
                    </p>
                    <p className="font-semibold">
                      {combo.successes} / {combo.attempts}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("matchDetail.winRate")}
                    </p>
                    <p className="font-semibold">
                      {combo.winRate !== null && combo.winRate !== undefined
                        ? `${Math.round(combo.winRate * 100)}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg border bg-background/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
