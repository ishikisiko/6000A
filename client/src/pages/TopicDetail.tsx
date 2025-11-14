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
import { miniDB } from "@/lib/miniDB";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function TopicDetail() {
  const [, params] = useRoute("/topic/:topicId");
  const [, setLocation] = useLocation();
  const topicId = parseInt(params?.topicId || "0");

  const { user } = useLocalAuth();
  const topic = miniDB.getTopicById(topicId);
  const myPoints = user?.points || 0;
  
  const [selectedChoice, setSelectedChoice] = useState<number>(-1);
  const [betPoints, setBetPoints] = useState<number>(10);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 计算统计数据
  const getStats = () => {
    if (!topic) return null;
    
    const votes = miniDB.getVotesByTopic(topicId);
    const totalVotes = votes.length;
    const totalPoints = votes.reduce((sum, v) => sum + v.amount, 0);
    
    const choiceStats = topic.options.map((option, index) => {
      const optionVotes = votes.filter(v => v.choice === index);
      const voteCount = optionVotes.length;
      const pointsSum = optionVotes.reduce((sum, v) => sum + v.amount, 0);
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      
      return {
        choice: option,
        choiceIndex: index,
        votes: voteCount,
        points: pointsSum,
        percentage,
      };
    });
    
    return {
      totalVotes,
      totalPoints,
      choiceStats,
      isAnonymous: votes.some(v => v.amount === 0), // 简单判断是否有匿名
    };
  };

  const stats = getStats();
  const userVote = user ? miniDB.getUserVoteForTopic(user.id, topicId) : null;

  const handleSubmit = () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (selectedChoice === -1) {
      toast.error("请选择一个选项");
      return;
    }

    if (topic?.type === 'bet' && betPoints < 1) {
      toast.error("下注积分必须大于0");
      return;
    }

    if (topic?.type === 'bet' && betPoints > myPoints) {
      toast.error("积分不足");
      return;
    }

    // 检查是否已经投过票
    if (userVote) {
      toast.error("您已经参与过此话题");
      return;
    }

    // 创建投票
    const amount = topic?.type === 'bet' ? betPoints : 0;
    miniDB.createVote({
      topicId,
      userId: user.id,
      choice: selectedChoice,
      amount,
    });

    // 扣除积分并记录交易
    if (topic?.type === 'bet') {
      miniDB.updateUserPointsWithTransaction(
        user.id,
        -betPoints,
        'bet',
        `参与下注: ${topic.title}`,
        topicId
      );
    }

    toast.success("提交成功!", { description: "您的选择已记录" });
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setLocation("/topics"), 1000);
  };

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
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <Badge variant={topic.type === 'bet' ? 'default' : 'secondary'}>
                {topic.type === 'bet' ? '🎲 下注' : '📊 投票'}
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
            {/* Participation Form */}
            {isActive && !userVote && (
              <Card>
                <CardHeader>
                  <CardTitle>参与{topic.type === 'bet' ? '下注' : '投票'}</CardTitle>
                  <CardDescription>
                    选择您认为正确的选项{topic.type === 'bet' && ',并设置下注积分'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={selectedChoice.toString()} onValueChange={(v) => setSelectedChoice(parseInt(v))}>
                    <div className="space-y-3">
                      {topic.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {topic.type === 'bet' && (
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
                    disabled={selectedChoice === -1}
                  >
                    确认提交
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Already Voted */}
            {userVote && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">您已参与此话题</h3>
                      <p className="text-sm text-muted-foreground">
                        您选择了: {topic.options[userVote.choice]}
                        {topic.type === 'bet' && ` (下注 ${userVote.amount} 积分)`}
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
                  {stats.choiceStats.map((stat) => (
                    <div key={stat.choiceIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.choice}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {stat.votes} 票 ({stat.percentage}%)
                          </span>
                          {topic.type === 'bet' && (
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
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">总参与人数</p>
                    <p className="text-xl font-bold">{stats?.totalVotes || 0}</p>
                  </div>
                </div>
                {topic.type === 'bet' && (
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
