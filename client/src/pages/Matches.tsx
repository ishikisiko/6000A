import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  Map,
  Trophy,
  Upload,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

type MatchMetadata = {
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  duration?: number;
  demoFile?: string;
};

export default function Matches() {
  const { user } = useLocalAuth();
  const { t } = useLanguage();

  const {
    data: matches,
    isLoading,
    refetch,
    isFetching,
    error,
  } = trpc.match.list.useQuery(
    { limit: 50 },
    { enabled: !!user, staleTime: 10_000 }
  );

  const formatDuration = (start?: Date, end?: Date, fallbackMs?: number) => {
    if (fallbackMs) {
      const minutes = Math.round(fallbackMs / 60000);
      return minutes > 0
        ? `${minutes} min`
        : `${Math.max(1, Math.round(fallbackMs / 1000))} s`;
    }
    if (!start || !end) return t("matches.unknownDuration");
    const diff = end.getTime() - start.getTime();
    return formatDuration(undefined, undefined, diff);
  };

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
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t("matches.title")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("matches.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button asChild>
              <Link href="/match-upload">
                <Upload className="mr-2 h-4 w-4" />
                {t("matches.uploadDemo")}
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-destructive/40">
            <CardContent className="py-4 text-sm text-destructive">
              {error.message}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          </Card>
        ) : !matches || matches.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">
                  {t("matches.noMatches")}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {t("matches.uploadToStart")}
                </p>
              </div>
              <Button asChild>
                <Link href="/match-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {t("matches.uploadFirst")}
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => {
              const metadata = (match.metadata || {}) as MatchMetadata;
              const scoreA =
                typeof metadata.scoreA === "number" ? metadata.scoreA : null;
              const scoreB =
                typeof metadata.scoreB === "number" ? metadata.scoreB : null;
              const [teamA, teamB] = Array.isArray(match.teamIds)
                ? match.teamIds
                : ["Team A", "Team B"];
              const winner =
                typeof metadata.winner === "string" ? metadata.winner : null;
              const duration =
                typeof metadata.duration === "number"
                  ? metadata.duration
                  : match.endTs && match.startTs
                  ? new Date(match.endTs).getTime() -
                    new Date(match.startTs).getTime()
                  : undefined;

              return (
                <Card
                  key={match.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg truncate">
                        {match.matchId}
                      </CardTitle>
                      <Badge variant="secondary">{match.game}</Badge>
                    </div>
                    <CardDescription>
                      {teamA} vs {teamB}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Map className="h-4 w-4 text-muted-foreground" />
                      <span>{match.map}</span>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {scoreA ?? "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teamA}
                        </div>
                      </div>
                      <div className="text-muted-foreground">:</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {scoreB ?? "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teamB}
                        </div>
                      </div>
                    </div>

                    {winner ? (
                      <Badge variant="default" className="w-full justify-center">
                        {winner}
                      </Badge>
                    ) : scoreA !== null && scoreB !== null ? (
                      <Badge
                        variant={scoreA > scoreB ? "default" : "secondary"}
                        className="w-full justify-center"
                      >
                        {(scoreA > scoreB ? teamA : teamB) +
                          ` ${t("matches.winner")}`}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="w-full justify-center"
                      >
                        {t("matches.pendingScore")}
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(match.startTs).toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t("matches.duration")}:{" "}
                      {formatDuration(match.startTs, match.endTs, duration)}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1" variant="outline" asChild>
                        <Link href={`/match/${match.id}`}>
                          {t("matches.viewDetail")}
                        </Link>
                      </Button>
                      <Button size="sm" className="flex-1" variant="default" asChild>
                        <Link href={`/analysis/${match.id}`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {t("matches.viewAnalysis")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
