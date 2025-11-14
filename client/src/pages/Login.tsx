import { useState } from "react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { User, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const { login } = useLocalAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
      setLocation("/dashboard");
    }
  };

  const quickLogin = (name: string) => {
    login(name);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            {t('app.title')}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {t('app.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {t('auth.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder={t('auth.enterUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('auth.firstLoginGift')}
              </p>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Zap className="mr-2 h-4 w-4" />
              {t('auth.enterSystem')}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.quickLogin')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickLogin("管理员")}
              className="text-xs"
            >
              管理员
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickLogin("玩家A")}
              className="text-xs"
            >
              玩家A
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickLogin("玩家B")}
              className="text-xs"
            >
              玩家B
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t('auth.localStorageNote')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
