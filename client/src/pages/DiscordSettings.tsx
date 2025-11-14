import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bot, Power, PowerOff } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DiscordSettings() {
  const [token, setToken] = useState("");
  const { data: status, refetch } = trpc.discord.status.useQuery();
  const startBot = trpc.discord.start.useMutation({
    onSuccess: () => {
      toast.success("Discord Bot已启动");
      refetch();
    },
    onError: (error) => {
      toast.error(`启动失败: ${error.message}`);
    },
  });
  const stopBot = trpc.discord.stop.useMutation({
    onSuccess: () => {
      toast.success("Discord Bot已停止");
      refetch();
    },
    onError: (error) => {
      toast.error(`停止失败: ${error.message}`);
    },
  });

  const handleStart = () => {
    if (!token.trim()) {
      toast.error("请输入Discord Bot Token");
      return;
    }
    startBot.mutate({ token });
  };

  const handleStop = () => {
    stopBot.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Discord Bot设置</h1>
            <p className="text-muted-foreground mt-1">配置和管理Discord语音助手</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Bot状态</CardTitle>
              </div>
              <CardDescription>查看Discord Bot当前运行状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">运行状态</p>
                  <p className="text-sm text-muted-foreground">
                    {status?.active ? '在线' : '离线'}
                  </p>
                </div>
                <div className={`h-3 w-3 rounded-full ${status?.active ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>

              {status?.active && (
                <>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold">Bot用户名</p>
                    <p className="text-sm text-muted-foreground">{status.username}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold">服务器数量</p>
                    <p className="text-sm text-muted-foreground">{status.guilds} 个服务器</p>
                  </div>
                </>
              )}

              <Button
                variant={status?.active ? "destructive" : "default"}
                className="w-full"
                onClick={status?.active ? handleStop : handleStart}
                disabled={startBot.isPending || stopBot.isPending}
              >
                {status?.active ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    停止Bot
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    启动Bot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bot配置</CardTitle>
              <CardDescription>配置Discord Bot Token和权限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Discord Bot Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="输入你的Discord Bot Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={status?.active}
                />
                <p className="text-xs text-muted-foreground">
                  从Discord Developer Portal获取Bot Token
                </p>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">如何创建Discord Bot:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>访问 <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Discord Developer Portal</a></li>
                  <li>创建新应用并添加Bot</li>
                  <li>在Bot设置中启用"Message Content Intent"</li>
                  <li>复制Bot Token并粘贴到上方输入框</li>
                  <li>使用OAuth2 URL邀请Bot到你的服务器</li>
                </ol>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">所需权限:</h4>
                <ul className="text-xs space-y-1">
                  <li>✓ 读取消息</li>
                  <li>✓ 发送消息</li>
                  <li>✓ 连接语音频道</li>
                  <li>✓ 在语音频道中说话</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>可用命令</CardTitle>
              <CardDescription>在Discord中使用以下命令与Bot互动</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">📊 数据查询</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li><code className="bg-background px-2 py-1 rounded">!stats</code> - 查看比赛统计</li>
                    <li><code className="bg-background px-2 py-1 rounded">!matches</code> - 查看比赛列表</li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 语音功能</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li><code className="bg-background px-2 py-1 rounded">!join</code> - 加入语音频道</li>
                    <li><code className="bg-background px-2 py-1 rounded">!leave</code> - 离开语音频道</li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">🎲 互动功能</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li><code className="bg-background px-2 py-1 rounded">!topics</code> - 查看投票话题</li>
                    <li><code className="bg-background px-2 py-1 rounded">!vote</code> - 参与投票</li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">🤖 AI助手</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li><code className="bg-background px-2 py-1 rounded">!ask</code> - 向AI教练提问</li>
                    <li><code className="bg-background px-2 py-1 rounded">!help</code> - 查看帮助</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
