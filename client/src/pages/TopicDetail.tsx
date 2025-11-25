import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Users, Trophy, Shield } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function TopicDetail() {
  const [, paramsSingular] = useRoute("/topic/:topicId");
  const [, paramsPlural] = useRoute("/topics/:topicId");
  const [, setLocation] = useLocation();
  
  const topicId = paramsSingular?.topicId || paramsPlural?.topicId || "";

  const { user } = useLocalAuth();
  
  // 使用 tRPC 从服务器获取数据
  const { data: topic, isLoading: topicLoading } = trpc.topics.getById.useQuery({ topicId });
  const { data: myPointsData } = trpc.topics.myPoints.useQuery();
  const { data: votes } = trpc.topics.getVotes.useQuery({ topicId });
  const { data: myVotes } = trpc.topics.myVotes.useQuery();
  
  const myPoints = typeof user?.points === 'number'
    ? user.points
    : (typeof myPointsData?.points === 'number' ? myPointsData.points : 0);
  
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [betPoints, setBetPoints] = useState<number>(10);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 使用 tRPC mutation 提交投票
  const submitVote = trpc.topics.submit.useMutation({
    onSuccess: () => {
      toast.success("提交成功!", { description: "您的选择已记录" });
      setTimeout(() => setLocation("/topics"), 1000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 计算统计数据
  const getStats = () => {
    if (!topic || !votes) return null;
    
    const totalVotes = votes.length;
    const totalPoints = votes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
    
    const choiceStats = topic.options.map((option) => {
      const optionVotes = votes.filter(v => v.choice === option);
      const voteCount = optionVotes.length;
      const pointsSum = optionVotes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      
      return {
        choice: option,
        votes: voteCount,
        points: pointsSum,
        percentage,
      };
    });
    
    return {
      totalVotes,
      totalPoints,
      choiceStats,
      isAnonymous: votes.some(v => v.voterAnonId.startsWith('anon_')),
    };
  };

  const stats = getStats();
  const userVote = myVotes?.find(v => v.topicId === topicId);

  const handleSubmit = () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (!selectedChoice) {
      toast.error("请选择一个选项");
      return;
    }

    if (topic?.topicType === 'bet' && betPoints < 1) {
      toast.error("下注积分必须大于0");
      return;
    }

    if (topic?.topicType === 'bet' && betPoints > myPoints) {
      toast.error("积分不足");
      return;
    }

    // 检查是否已经投过票
    if (userVote) {
      toast.error("您已经参与过此话题");
      return;
    }

    // 使用 tRPC 提交投票
    submitVote.mutate({
      topicId,
      choice: selectedChoice,
      points: topic?.topicType === 'bet' ? betPoints : undefined,
      isAnonymous,
    });
  };

  if (topicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">话题不存在</h3>
            <Button asChild>
              <Link href="/topics">返回列表</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isActive = topic.status === 'active';
  const isRevealed = topic.status === 'revealed';
  const isMission = topic.topicType === 'mission';
  const missionMeta = (topic.metadata as any) || {};
  const missionReward = missionMeta.rewardPoints ?? 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/topics">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">
                {isMission ? (missionMeta.missionTitle || topic.title) : topic.title}
              </h1>
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
                  ? '🎲 下注'
                  : topic.topicType === 'mission'
                  ? '🜸 隐秘任务'
                  : '📊 投票'}
              </Badge>
              <Badge variant={isActive ? 'default' : isRevealed ? 'destructive' : 'outline'}>
                {isActive ? '进行中' : isRevealed ? '已揭晓' : '已关闭'}
              </Badge>
            </div>
            {topic.description && (
              <p className="text-muted-foreground mt-2">{topic.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {isMission && (
              <Card className="bg-red-950/40 border-red-500/30">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-red-200">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm uppercase tracking-[0.2em]">
                      Secret Mission
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {missionMeta.missionTitle || 'Mission Briefing'}
                  </h3>
                  <p className="text-sm text-red-100/80 leading-relaxed">
                    {missionMeta.missionDetail || topic.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                      完成奖励 +{missionReward} 积分
                    </Badge>
                    <Badge variant="outline" className="border-red-400/50 text-red-200">
                      失败不扣分
                    </Badge>
                    <span className="text-muted-foreground">
                      完成后由创建者或管理员在揭晓面板中结算
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participation Form */}
            {isActive && !userVote && !isMission && (
              <Card>
                <CardHeader>
                  <CardTitle>参与{topic.topicType === 'bet' ? '下注' : '投票'}</CardTitle>
                  <CardDescription>
                    选择您认为正确的选项{topic.topicType === 'bet' && ',并设置下注积分'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice}>
                    <div className="space-y-3">
                      {topic.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {topic.topicType === 'bet' && (
                    <div className="space-y-2">
                      <Label htmlFor="points">下注积分</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="points"
                          type="number"
                          min="1"
                          max={myPoints}
                          value={betPoints}
                          onChange={(e) => setBetPoints(parseInt(e.target.value) || 0)}
                          className="max-w-xs"
                        />
                        <span className="text-sm text-muted-foreground">
                          可用: {myPoints} 积分
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    />
                    <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                      匿名参与(不显示我的身份)
                    </Label>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!selectedChoice || submitVote.isPending}
                  >
                    {submitVote.isPending ? '提交中...' : '确认提交'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Already Voted */}
            {userVote && !isMission && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">您已参与此话题</h3>
                      <p className="text-sm text-muted-foreground">
                        您选择了: {userVote.choice}
                        {topic.topicType === 'bet' && ` (下注 ${(userVote.metadata as any)?.points || 0} 积分)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {stats && stats.totalVotes > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>当前统计</CardTitle>
                  <CardDescription>
                    {isRevealed ? '最终结果已揭晓' : '实时统计数据'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.choiceStats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.choice}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {stat.votes} 票 ({stat.percentage}%)
                          </span>
                          {topic.topicType === 'bet' && (
                            <Badge variant="outline">{stat.points} 积分</Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">参与信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isMission ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">奖励</p>
                        <p className="text-xl font-bold text-red-200">
                          +{missionReward} 积分
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-100">
                      由创建者在任务结束后决定完成/失败，失败不扣分。
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">总参与人数</p>
                        <p className="text-xl font-bold">{stats?.totalVotes || 0}</p>
                      </div>
                    </div>
                    {topic.topicType === 'bet' && (
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">总奖池积分</p>
                          <p className="text-xl font-bold">{stats?.totalPoints || 0}</p>
                        </div>
                      </div>
                    )}
                    {stats?.isAnonymous && (
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          🔒 包含匿名参与者
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {topic.revealAt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">揭晓时间</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(topic.revealAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
