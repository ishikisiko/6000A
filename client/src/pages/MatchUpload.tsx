import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { miniDB } from "@/lib/miniDB";
import { ArrowLeft, Upload, FileUp, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MatchUpload() {
  const [, setLocation] = useLocation();
  const { user } = useLocalAuth();
  const { t } = useLanguage();
  
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
      if (selectedFile.name.endsWith(".dem")) {
        setFile(selectedFile);
        toast.success(t("upload.fileSelected"), { description: selectedFile.name });
      } else {
        toast.error(t("upload.selectDemFile"));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".dem")) {
      setFile(droppedFile);
      toast.success(t("upload.fileSelected"), { description: droppedFile.name });
    } else {
      toast.error(t("upload.selectDemFile"));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      return;
    }

    if (!file) {
      toast.error(t("upload.pleaseSelectFile"));
      return;
    }

    if (!mapName || !teamAName || !teamBName) {
      toast.error(t("upload.fillComplete"));
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

      toast.success(t("upload.success"), {
        description: `${t("upload.matchSaved")}: ${teamAName} vs ${teamBName}`,
      });
      
      setTimeout(() => setLocation("/matches"), 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("upload.failed"), { description: t("upload.checkFormat") });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">{t("auth.pleaseLogin")}</h3>
            <Button asChild>
              <Link href="/">{t("auth.returnLogin")}</Link>
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
            <h1 className="text-3xl font-bold">{t("upload.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("upload.description")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>{t("upload.selectFile")}</CardTitle>
              <CardDescription>{t("upload.supportedFormats")}</CardDescription>
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
                      {t("upload.reselect")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileUp className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{t("upload.clickOrDrag")}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("upload.maxSize")}
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
              <CardTitle>{t("upload.matchInfo")}</CardTitle>
              <CardDescription>{t("upload.fillBasicInfo")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapName">
                  {t("upload.mapName")} *
                </Label>
                <Input
                  id="mapName"
                  placeholder={t("upload.mapPlaceholder")}
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamA">
                    {t("upload.teamAName")} *
                  </Label>
                  <Input
                    id="teamA"
                    placeholder={t("upload.teamAPlaceholder")}
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scoreA">
                    {t("upload.teamAScore")} *
                  </Label>
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
                  <Label htmlFor="teamB">
                    {t("upload.teamBName")} *
                  </Label>
                  <Input
                    id="teamB"
                    placeholder={t("upload.teamBPlaceholder")}
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scoreB">
                    {t("upload.teamBScore")} *
                  </Label>
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
              {uploading ? t("upload.uploading") : t("upload.uploadAndAnalyze")}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">{t("common.cancel")}</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
