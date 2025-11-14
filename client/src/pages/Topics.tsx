import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Users, Clock, Trophy, Vote, Plus, Trash2 } from "lucide-react";
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
import { miniDB } from "@/lib/miniDB";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Topics() {
  const [, setLocation] = useLocation();
  const { user } = useLocalAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const topics = miniDB.getTopics();
  const myPoints = user?.points || 0;

  const handleDelete = (topicId: number) => {
    miniDB.deleteTopic(topicId);
    toast.success('话题已删除');
    setRefreshKey(prev => prev + 1); // 触发重新渲染
  };

  const activeTopics = topics.filter(t => t.status === 'active');
  const closedTopics = topics.filter(t => t.status === 'closed');
  const revealedTopics = topics.filter(t => t.status === 'revealed');

  const getTopicStats = (topicId: number) => {
    const votes = miniDB.getVotesByTopic(topicId);
    const totalVotes = votes.length;
    const totalAmount = votes.reduce((sum, v) => sum + v.amount, 0);
    return { totalVotes, totalAmount };
  };

  const renderTopicCard = (topic: any) => {
    const stats = getTopicStats(topic.id);
    const userVote = user ? miniDB.getUserVoteForTopic(user.id, topic.id) : null;
    
    return (
      <Card 
        key={topic.id} 
        className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 relative"
        onClick={() => setLocation(`/topic/${topic.id}`)}
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
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除话题"{topic.title}"吗?此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(topic.id)}>
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
              <CardDescription>{topic.description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge variant={topic.type === 'bet' ? 'default' : 'secondary'}>
              {topic.type === 'bet' ? '下注' : '投票'}
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
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats.totalVotes} 人参与
              </span>
              {topic.type === 'bet' && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {stats.totalAmount} 积分
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(topic.revealAt).toLocaleDateString()}
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
              <h1 className="text-3xl font-bold">投票与下注</h1>
              <p className="text-muted-foreground mt-1">参与社区互动,赢取积分奖励</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Button asChild>
                <Link href="/create-topic">
                  <Plus className="mr-2 h-4 w-4" />
                  创建话题
                </Link>
              </Button>
            )}
            <Card className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">我的积分</p>
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
              活跃话题
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
              等待揭晓
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
              已揭晓
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revealedTopics.map(renderTopicCard)}
            </div>
          </div>
        )}

        {topics.length === 0 && (
          <Card className="p-12 text-center">
            <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">暂无话题</h3>
            <p className="text-muted-foreground mb-4">
              {user?.role === 'admin' 
                ? '点击上方"创建话题"按钮开始创建第一个话题' 
                : '等待管理员创建话题'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
