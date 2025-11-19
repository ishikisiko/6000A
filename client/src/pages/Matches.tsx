import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { miniDB } from "@/lib/miniDB";
import { ArrowLeft, Calendar, Map, Trophy, Upload, Trash2, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Matches() {
  const { user } = useLocalAuth();
  const { t } = useLanguage();
  const [matches, setMatches] = useState(miniDB.getMatches());

  const handleDelete = (matchId: number) => {
    if (confirm(t('matches.deleteConfirm'))) {
      miniDB.deleteMatch(matchId);
      setMatches(miniDB.getMatches());
      toast.success(t('matches.deleted'));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">{t('auth.pleaseLogin')}</h3>
            <Button asChild>
              <Link href="/">{t('auth.returnLogin')}</Link>
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
              <h1 className="text-3xl font-bold">{t('matches.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('matches.description')}</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/match-upload">
              <Upload className="mr-2 h-4 w-4" />
              {t('matches.uploadDemo')}
            </Link>
          </Button>
        </div>

        {matches.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">{t('matches.noMatches')}</h3>
                <p className="text-muted-foreground mt-2">
                  {t('matches.uploadToStart')}
                </p>
              </div>
              <Button asChild>
                <Link href="/match-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('matches.uploadFirst')}
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => {
              const uploader = miniDB.getUserById(match.uploadedBy);
              return (
                <Card key={match.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{match.fileName}</CardTitle>
                      {user.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(match.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <CardDescription>
                      {match.teamAName} vs {match.teamBName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Map className="h-4 w-4 text-muted-foreground" />
                      <span>{match.mapName}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 py-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{match.scoreA}</div>
                        <div className="text-xs text-muted-foreground">{match.teamAName}</div>
                      </div>
                      <div className="text-muted-foreground">:</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{match.scoreB}</div>
                        <div className="text-xs text-muted-foreground">{match.teamBName}</div>
                      </div>
                    </div>

                    {match.scoreA > match.scoreB ? (
                      <Badge variant="default" className="w-full justify-center">
                        {match.teamAName} {t('matches.winner')}
                      </Badge>
                    ) : match.scoreB > match.scoreA ? (
                      <Badge variant="secondary" className="w-full justify-center">
                        {match.teamBName} {t('matches.winner')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-full justify-center">
                        {t('matches.draw')}
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(match.uploadedAt).toLocaleString('zh-CN')}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t('matches.uploader')}: {uploader?.name || 'Unknown'}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1" variant="outline" disabled>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {t('matches.viewAnalysis')}
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
