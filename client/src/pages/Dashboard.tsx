import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, MessageSquare, Trophy, Users, Bot, User as UserIcon, Upload } from "lucide-react";
import { Link } from "wouter";

interface DashboardProps {
  userName?: string;
}

export default function Dashboard({ userName }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">欢迎回来, {userName || '教练'}</h1>
            <p className="text-muted-foreground mt-1">准备好分析您的下一场比赛了吗?</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/settings">设置</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总比赛数</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">开始上传您的第一场比赛</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均TTD</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">决策时间分析</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团队协同</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">组合胜率统计</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃话题</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">投票与下注</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>选择一个功能开始使用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/matches">
                  <Trophy className="mr-2 h-4 w-4" />
                  查看比赛记录
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/topics">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  参与投票话题
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  个人中心
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/discord-settings">
                  <Bot className="mr-2 h-4 w-4" />
                  Discord Bot设置
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/match-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  上传比赛Demo
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>功能亮点</CardTitle>
              <CardDescription>了解平台核心能力</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">智能阶段识别</h4>
                  <p className="text-xs text-muted-foreground">自动检测比赛中的关键转折点</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-cyan-500/10 p-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">协同效率分析</h4>
                  <p className="text-xs text-muted-foreground">发现最佳配合组合</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">AI驱动建议</h4>
                  <p className="text-xs text-muted-foreground">获得可执行的改进方案</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
