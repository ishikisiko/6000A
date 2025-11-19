import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, MessageSquare, Trophy, Users, Bot, User as UserIcon, Upload } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface DashboardProps {
  userName?: string;
}

export default function Dashboard({ userName }: DashboardProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {t('dashboard.welcome')}, {userName || t('dashboard.coach')}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">{t('dashboard.readyForNextMatch')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" asChild className="glass hover:bg-white/10">
              <Link href="/settings">{t('nav.settings')}</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalMatches')}</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.uploadFirstMatch')}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.avgTTD')}</CardTitle>
              <div className="p-2 bg-cyan-500/10 rounded-full">
                <Activity className="h-4 w-4 text-cyan-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.ttdAnalysis')}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.teamCollab')}</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <Users className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.comboWinRate')}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeTopics')}</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <BarChart3 className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.votingBetting')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">{t('dashboard.quickStart')}</CardTitle>
              <CardDescription>{t('dashboard.chooseFeature')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start h-12 text-base group" variant="outline" asChild>
                <Link href="/matches">
                  <div className="p-1 bg-primary/10 rounded mr-3 group-hover:bg-primary/20 transition-colors">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  {t('dashboard.viewMatches')}
                </Link>
              </Button>
              <Button className="w-full justify-start h-12 text-base group" variant="outline" asChild>
                <Link href="/topics">
                  <div className="p-1 bg-amber-500/10 rounded mr-3 group-hover:bg-amber-500/20 transition-colors">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                  </div>
                  {t('dashboard.joinVoting')}
                </Link>
              </Button>
              <Button className="w-full justify-start h-12 text-base group" variant="outline" asChild>
                <Link href="/profile">
                  <div className="p-1 bg-cyan-500/10 rounded mr-3 group-hover:bg-cyan-500/20 transition-colors">
                    <UserIcon className="h-5 w-5 text-cyan-500" />
                  </div>
                  {t('dashboard.personalCenter')}
                </Link>
              </Button>
              <Button className="w-full justify-start h-12 text-base group" variant="outline" asChild>
                <Link href="/discord-settings">
                  <div className="p-1 bg-violet-500/10 rounded mr-3 group-hover:bg-violet-500/20 transition-colors">
                    <Bot className="h-5 w-5 text-violet-500" />
                  </div>
                  {t('nav.discordBot')}
                </Link>
              </Button>
              <Button className="w-full justify-start h-12 text-base group" variant="outline" asChild>
                <Link href="/match-upload">
                  <div className="p-1 bg-green-500/10 rounded mr-3 group-hover:bg-green-500/20 transition-colors">
                    <Upload className="h-5 w-5 text-green-500" />
                  </div>
                  {t('dashboard.uploadDemo')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">{t('dashboard.features')}</CardTitle>
              <CardDescription>{t('dashboard.learnCapabilities')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <div className="rounded-xl bg-primary/20 p-3 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t('dashboard.smartPhaseDetection')}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('dashboard.autoDetectTurningPoints')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <div className="rounded-xl bg-cyan-500/20 p-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t('dashboard.collabAnalysis')}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('dashboard.findBestCombos')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <div className="rounded-xl bg-green-500/20 p-3 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  <MessageSquare className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t('dashboard.aiSuggestions')}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('dashboard.getActionableAdvice')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
