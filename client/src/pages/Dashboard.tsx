import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, MessageSquare, Trophy, Users, Bot, User as UserIcon, Upload } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardProps {
  userName?: string;
}

export default function Dashboard({ userName }: DashboardProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {userName || t('dashboard.coach')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.readyForNextMatch')}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/settings">{t('nav.settings')}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalMatches')}</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.uploadFirstMatch')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.avgTTD')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.ttdAnalysis')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.teamCollab')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.comboWinRate')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeTopics')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.votingBetting')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickStart')}</CardTitle>
              <CardDescription>{t('dashboard.chooseFeature')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/matches">
                  <Trophy className="mr-2 h-4 w-4" />
                  {t('dashboard.viewMatches')}
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/topics">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('dashboard.joinVoting')}
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  {t('dashboard.personalCenter')}
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/discord-settings">
                  <Bot className="mr-2 h-4 w-4" />
                  {t('nav.discordBot')}
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/match-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('dashboard.uploadDemo')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.features')}</CardTitle>
              <CardDescription>{t('dashboard.learnCapabilities')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t('dashboard.smartPhaseDetection')}</h4>
                  <p className="text-xs text-muted-foreground">{t('dashboard.autoDetectTurningPoints')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-cyan-500/10 p-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t('dashboard.collabAnalysis')}</h4>
                  <p className="text-xs text-muted-foreground">{t('dashboard.findBestCombos')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{t('dashboard.aiSuggestions')}</h4>
                  <p className="text-xs text-muted-foreground">{t('dashboard.getActionableAdvice')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
