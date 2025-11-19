import { useEffect } from "react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { miniDB } from "@/lib/miniDB";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, User, Award, TrendingUp, Calendar, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Profile() {
  const { t } = useLanguage();
  const { user, loading, logout } = useLocalAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const myVotes = miniDB.getVotesByUser(user.id);
  const recentVotes = myVotes.slice(-5).reverse();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')} {t('nav.dashboard')}
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription>{t('profile.username')} ID: #{user.id}</CardDescription>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('profile.joinDate')}</p>
                  <p className="font-semibold mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('auth.username')}</p>
                  <p className="font-semibold mt-1">本地用户</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Team
                  </p>
                  <p className="font-semibold mt-1 text-primary">{user.team || 'FMH'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {t('profile.pointsSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">{t('profile.currentPoints')}</p>
                <p className="text-4xl font-bold text-primary">{user.points}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('topics.title')}</p>
                <p className="text-2xl font-semibold">{myVotes.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('profile.pointsHistory')}
            </CardTitle>
            <CardDescription>{t('topics.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('profile.noTransactions')}</p>
                <Button className="mt-4" asChild>
                  <Link href="/topics">{t('dashboard.joinVoting')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVotes.map((vote) => {
                  const topic = miniDB.getTopicById(vote.topicId);
                  if (!topic) return null;

                  return (
                    <div
                      key={vote.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{topic.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('topic.options')}: {topic.options[vote.choice]}
                          {vote.amount > 0 && ` · ${t('topic.betAmount')}: ${vote.amount}${t('topic.points')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(vote.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
