import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CreateTopic() {
  const [, setLocation] = useLocation();
  const { user } = useLocalAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicType, setTopicType] = useState<"bet" | "vote">("vote");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [revealDate, setRevealDate] = useState("");
  const [revealTime, setRevealTime] = useState("");

  // 使用 tRPC mutation 创建话题
  const createTopic = trpc.topics.create.useMutation({
    onSuccess: () => {
      toast.success("话题创建成功!", { description: "用户现在可以参与投票或下注了" });
      setLocation("/topics");
    },
    onError: (error) => {
      toast.error("创建失败", { description: error.message });
    },
  });

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error("至少需要2个选项");
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (user.role !== 'admin') {
      toast.error("权限不足", { description: "只有管理员可以创建话题" });
      return;
    }

    // 验证表单
    if (!title.trim()) {
      toast.error("请输入话题标题");
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error("至少需要2个有效选项");
      return;
    }

    if (!revealDate || !revealTime) {
      toast.error("请选择揭晓时间");
      return;
    }

    // 组合日期和时间
    const revealAt = new Date(`${revealDate}T${revealTime}`);
    if (revealAt <= new Date()) {
      toast.error("揭晓时间必须在未来");
      return;
    }

    // 创建话题
    createTopic.mutate({
      title: title.trim(),
      description: description.trim(),
      topicType,
      options: validOptions,
      expiresAt: revealAt,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">请先登录</h3>
            <Button asChild>
              <Link href="/">返回登录</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">权限不足</h3>
            <p className="text-muted-foreground">只有管理员可以创建话题</p>
            <Button asChild>
              <Link href="/topics">返回话题列表</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/topics">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">创建话题</h1>
            <p className="text-muted-foreground mt-1">创建投票或下注话题,让社区参与互动</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>话题信息</CardTitle>
              <CardDescription>填写话题的基本信息和选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">话题标题 *</Label>
                <Input
                  id="title"
                  placeholder="例如: 下一场比赛MVP预测"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">话题描述</Label>
                <Textarea
                  id="description"
                  placeholder="详细描述话题内容..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Topic Type */}
              <div className="space-y-2">
                <Label>话题类型 *</Label>
                <RadioGroup value={topicType} onValueChange={(v) => setTopicType(v as "bet" | "vote")}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vote" id="vote" />
                      <Label htmlFor="vote" className="cursor-pointer">
                        📊 投票 (不消耗积分)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bet" id="bet" />
                      <Label htmlFor="bet" className="cursor-pointer">
                        🎲 下注 (消耗积分,猜对有奖励)
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label>选项 * (至少2个)</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`选项 ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加选项
                </Button>
              </div>

              {/* Reveal Time */}
              <div className="space-y-2">
                <Label>揭晓时间 *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="date"
                      value={revealDate}
                      onChange={(e) => setRevealDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      value={revealTime}
                      onChange={(e) => setRevealTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  话题将在此时间后停止接受新的投票/下注
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  创建话题
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/topics">取消</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
