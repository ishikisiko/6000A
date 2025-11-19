import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bot, Power, PowerOff } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DiscordSettings() {
  const { t } = useLanguage();
  const [token, setToken] = useState("");
  const { data: status, refetch } = trpc.discord.status.useQuery();
  const startBot = trpc.discord.start.useMutation({
    onSuccess: () => {
      toast.success(t("discord.botStarted"));
      refetch();
    },
    onError: (error) => {
      toast.error(`${t("discord.startFailed")}: ${error.message}`);
    },
  });
  const stopBot = trpc.discord.stop.useMutation({
    onSuccess: () => {
      toast.success(t("discord.botStopped"));
      refetch();
    },
    onError: (error) => {
      toast.error(`${t("discord.stopFailed")}: ${error.message}`);
    },
  });

  const handleStart = () => {
    if (!token.trim()) {
      toast.error(t("discord.enterTokenFirst"));
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
            <h1 className="text-3xl font-bold">{t("discord.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("discord.description")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>{t("discord.botStatus")}</CardTitle>
              </div>
              <CardDescription>{t("discord.statusDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">{t("discord.runningStatus")}</p>
                  <p className="text-sm text-muted-foreground">
                    {status?.active ? t("discord.online") : t("discord.offline")}
                  </p>
                </div>
                <div className={`h-3 w-3 rounded-full ${status?.active ? "bg-green-500" : "bg-gray-500"}`} />
              </div>

              {status?.active && (
                <>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold">{t("discord.botUsername")}</p>
                    <p className="text-sm text-muted-foreground">{status.username}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold">{t("discord.serverCount")}</p>
                    <p className="text-sm text-muted-foreground">
                      {status.guilds} {t("discord.servers")}
                    </p>
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
                    {t("discord.stopBot")}
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    {t("discord.startBot")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("discord.botConfig")}</CardTitle>
              <CardDescription>{t("discord.configDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">{t("discord.enterToken")}</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder={t("discord.tokenPlaceholder")}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={status?.active}
                />
                <p className="text-xs text-muted-foreground">
                  {t("discord.tokenHelp")}
                </p>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">{t("discord.howToCreate")}:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("discord.step1")}
                    </a>
                  </li>
                  <li>{t("discord.step2")}</li>
                  <li>{t("discord.step3")}</li>
                  <li>{t("discord.step4")}</li>
                  <li>{t("discord.step5")}</li>
                </ol>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">{t("discord.requiredPermissions")}:</h4>
                <ul className="text-xs space-y-1">
                  <li>✓ {t("discord.permissionRead")}</li>
                  <li>✓ {t("discord.permissionSend")}</li>
                  <li>✓ {t("discord.permissionConnect")}</li>
                  <li>✓ {t("discord.permissionSpeak")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("discord.availableCommands")}</CardTitle>
              <CardDescription>{t("discord.commandsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">{t("discord.dataSectionTitle")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!stats</code> - {t("discord.statsCommand")}
                    </li>
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!matches</code> - {t("discord.matchesCommand")}
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">{t("discord.voiceSectionTitle")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!join</code> - {t("discord.joinCommand")}
                    </li>
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!leave</code> - {t("discord.leaveCommand")}
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">{t("discord.interactSectionTitle")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!topics</code> - {t("discord.topicsCommand")}
                    </li>
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!vote</code> - {t("discord.voteCommand")}
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">{t("discord.aiSectionTitle")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!ask</code> - {t("discord.askCommand")}
                    </li>
                    <li>
                      <code className="bg-background px-2 py-1 rounded">!help</code> - {t("discord.helpCommand")}
                    </li>
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
