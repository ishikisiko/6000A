import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Users, Clock, Trophy, Vote, Plus, Trash2, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Topics() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useLocalAuth();
  
  // 使用tRPC从数据库获取数据
  const { data: allTopics, isLoading, refetch } = trpc.topics.list.useQuery({});
  const { data: myPointsData } = trpc.topics.myPoints.useQuery();
  const { data: myVotes } = trpc.topics.myVotes.useQuery();
  
  const myPoints = typeof user?.points === 'number'
    ? user.points
    : (typeof myPointsData?.points === 'number' ? myPointsData.points : 0);
  const topics = allTopics || [];

  const deleteTopic = trpc.topics.delete.useMutation({
    onSuccess: () => {
      toast.success(t('topics.deleted'));
      refetch(); // 重新获取数据
    },
    onError: () => {
      toast.error('删除失败');
    },
  });

  const handleDelete = (topicId: string) => {
    deleteTopic.mutate({ topicId });
  };

  const activeTopics = topics.filter(t => t.status === 'active');
  const closedTopics = topics.filter(t => t.status === 'closed');
  const revealedTopics = topics.filter(t => t.status === 'revealed');

  const getTopicStats = (topicId: string) => {
    const votes = myVotes?.filter(v => v.topicId === topicId) || [];
    const totalVotes = votes.length;
    const totalAmount = votes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
    return { totalVotes, totalAmount };
  };

  const renderTopicCard = (topic: any) => {
    const stats = getTopicStats(topic.topicId);
    const userVote = myVotes?.find(v => v.topicId === topic.topicId);
    const isMission = topic.topicType === 'mission';
    const missionMeta = (topic.metadata as any) || {};
    const missionReward = missionMeta.rewardPoints ?? 10;
    const missionRewardText = t('topics.missionReward').replace('{points}', missionReward);
    
    return (
      <Card 
        key={topic.topicId} 
        className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 relative"
        onClick={() => setLocation(`/topic/${topic.topicId}`)}
      >
        {user?.role === 'admin' && (
          <AlertDialog>
            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('topics.deleteConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(topic.topicId)}>
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <CardTitle className="text-xl mb-2">
                {isMission ? (missionMeta.missionTitle || topic.title) : topic.title}
              </CardTitle>
              <CardDescription>
                {isMission ? (missionMeta.missionDetail || '隐秘任务') : topic.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge
              variant={
                topic.topicType === 'bet'
                  ? 'default'
                  : topic.topicType === 'mission'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {topic.topicType === 'bet'
                ? t('topics.bet')
                : topic.topicType === 'mission'
                ? t('topics.mission')
                : t('topics.vote')}
            </Badge>
            {userVote && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                已参与
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {isMission ? (
                <>
                  <span className="flex items-center gap-1 text-red-500">
                    <Shield className="h-4 w-4" />
                    {missionRewardText}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {t('topics.missionOutcome')}
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stats.totalVotes} {t('topics.participants')}
                  </span>
                  {topic.topicType === 'bet' && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {stats.totalAmount} {t('topic.points')}
                    </span>
                  )}
                </>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {topic.revealAt ? new Date(topic.revealAt).toLocaleDateString() : '未设置'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('topics.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('topics.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button asChild>
                <Link href="/create-topic">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('topics.createTopic')}
                </Link>
              </Button>
            )}
            <Card className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('topics.myPoints')}</p>
                <p className="text-2xl font-bold">{myPoints}</p>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Topics */}
        {activeTopics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              {t('topics.active')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTopics.map(renderTopicCard)}
            </div>
          </div>
        )}

        {/* Closed Topics */}
        {closedTopics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              {t('topics.closed')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedTopics.map(renderTopicCard)}
            </div>
          </div>
        )}

        {/* Revealed Topics */}
        {revealedTopics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-500" />
              {t('topics.revealed')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revealedTopics.map(renderTopicCard)}
            </div>
          </div>
        )}

        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </Card>
        ) : topics.length === 0 ? (
          <Card className="p-12 text-center">
            <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t('topics.noTopics')}</h3>
            <p className="text-muted-foreground mb-4">
              {user?.role === 'admin'
                ? t('topics.createFirst')
                : t('topics.waitForAdmin')}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
