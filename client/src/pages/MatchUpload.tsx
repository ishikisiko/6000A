import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { miniDB } from "@/lib/miniDB";
import { ArrowLeft, Upload, FileUp, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MatchUpload() {
  const [, setLocation] = useLocation();
  const { user } = useLocalAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [mapName, setMapName] = useState("");
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.dem')) {
        setFile(selectedFile);
        toast.success("文件已选择", { description: selectedFile.name });
      } else {
        toast.error("请选择.dem格式的CS demo文件");
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.dem')) {
      setFile(droppedFile);
      toast.success("文件已选择", { description: droppedFile.name });
    } else {
      toast.error("请选择.dem格式的CS demo文件");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (!file) {
      toast.error("请选择demo文件");
      return;
    }

    if (!mapName || !teamAName || !teamBName) {
      toast.error("请填写完整的比赛信息");
      return;
    }

    setUploading(true);

    try {
      // 读取文件内容
      const fileContent = await file.arrayBuffer();
      
      // 简单解析demo文件头(实际项目中需要使用专门的demo解析库)
      const header = new Uint8Array(fileContent.slice(0, 8));
      const headerString = new TextDecoder().decode(header);
      
      // 创建比赛记录
      const match = miniDB.createMatch({
        fileName: file.name,
        mapName,
        teamAName,
        teamBName,
        scoreA,
        scoreB,
        duration: 0, // 实际应从demo中解析
        uploadedBy: user.id,
        demoData: {
          fileSize: file.size,
          header: headerString,
          // 这里应该包含完整的demo解析数据
        },
      });

      // 创建示例回合数据
      for (let i = 1; i <= scoreA + scoreB; i++) {
        miniDB.createRound({
          matchId: match.id,
          roundNumber: i,
          winnerTeam: i <= scoreA ? 'A' : 'B',
          reason: 'elimination',
          duration: 120,
          kills: 5,
          deaths: 5,
        });
      }

      toast.success("上传成功!", { 
        description: `比赛 ${teamAName} vs ${teamBName} 已保存` 
      });
      
      setTimeout(() => setLocation("/matches"), 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("上传失败", { description: "请检查文件格式" });
    } finally {
      setUploading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">上传比赛Demo</h1>
            <p className="text-muted-foreground mt-1">上传CS官方demo文件进行赛后分析</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>选择Demo文件</CardTitle>
              <CardDescription>支持CS:GO和CS2的.dem格式文件</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {file ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                    <div>
                      <p className="font-semibold text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      重新选择
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileUp className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-semibold">点击或拖拽文件到此处</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        支持.dem格式,最大100MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".dem"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle>比赛信息</CardTitle>
              <CardDescription>填写比赛的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapName">地图名称 *</Label>
                <Input
                  id="mapName"
                  placeholder="例如: de_dust2, de_mirage"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamA">队伍A名称 *</Label>
                  <Input
                    id="teamA"
                    placeholder="队伍A"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scoreA">队伍A得分 *</Label>
                  <Input
                    id="scoreA"
                    type="number"
                    min="0"
                    max="16"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamB">队伍B名称 *</Label>
                  <Input
                    id="teamB"
                    placeholder="队伍B"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scoreB">队伍B得分 *</Label>
                  <Input
                    id="scoreB"
                    type="number"
                    min="0"
                    max="16"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={uploading || !file}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "上传中..." : "上传并分析"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">取消</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
