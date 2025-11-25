import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  MessageSquare,
  Trophy,
  Zap,
  Brain,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPoints } from '@/hooks/useUserPoints';
import { Link } from 'wouter';
import { toast } from 'sonner';
import {
  RevealDialog,
  RevealDialogTitle,
  RevealDialogContent,
} from '@/components/ui/reveal-dialog';
import { RevealCard } from '@/components/RevealCard';
import { RevealResult } from '@/components/RevealResult';
import { SecretMissionCard } from '@/components/SecretMissionCard';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type BotStatus = 'idle' | 'analyzing' | 'ready' | 'thinking';

// 揭晓弹窗状态类型
interface RevealState {
  isOpen: boolean;
  topic: {
    topicId: string;
    title: string;
    description?: string;
    topicType: 'bet' | 'vote' | 'mission';
    options: string[];
  } | null;
  winningChoice: string;
  userChoice?: string;
  betAmount?: number;
  rewardPoints?: number;
  isCardFlipped: boolean;
  showResult: boolean;
  isWinner: boolean;
  pointsChange?: number;
}

interface MissionState {
  isOpen: boolean;
  topicId?: string;
  missionTitle: string;
  missionDetail: string;
  rewardPoints: number;
  outcomeOptions: string[];
  isFlipped: boolean;
}

interface AICopilotProps {
  latestMatchId?: number;
  className?: string;
}

export function AICopilot({ latestMatchId, className }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [botStatus, setBotStatus] = useState<BotStatus>('idle');
  const [winPrediction, setWinPrediction] = useState<number | null>(null);
  const { points: competitionPoints, refetch: refetchPoints } = useUserPoints();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useLocalAuth();
  const { t } = useLanguage();

  // 揭晓弹窗状态
  const [revealState, setRevealState] = useState<RevealState>({
    isOpen: false,
    topic: null,
    winningChoice: '',
    isCardFlipped: false,
    showResult: false,
    isWinner: false,
  });
  const [missionState, setMissionState] = useState<MissionState>({
    isOpen: false,
    topicId: undefined,
    missionTitle: '',
    missionDetail: '',
    rewardPoints: 10,
    outcomeOptions: ["Mission Completed", "Mission Failed"],
    isFlipped: false,
  });

  const { data: activeTopics, isLoading: isTopicsLoading, refetch: refetchTopics } = trpc.topics.list.useQuery(
    { status: 'active' },
    { refetchOnWindowFocus: false, staleTime: 60000 } // Cache for 1 minute
  );

  // 获取用户的投票记录
  const { data: myVotes } = trpc.topics.myVotes.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const recentTopics = activeTopics?.slice(0, 3) || [];

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if ((data as any)?.mission) {
        const missionPayload = (data as any).mission;
        setMissionState({
          isOpen: true,
          topicId: missionPayload.topicId,
          missionTitle: missionPayload.missionTitle,
          missionDetail: missionPayload.missionDetail,
          rewardPoints: missionPayload.rewardPoints ?? 10,
          outcomeOptions: missionPayload.outcomeOptions || ["Mission Completed", "Mission Failed"],
          isFlipped: false,
        });
        refetchTopics();
      }
      setBotStatus('ready');
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      setBotStatus('idle');
    },
  });

  const revealWinnerMutation = trpc.topics.settle.useMutation({
    onError: (error) => {
      console.error('Failed to reveal winner:', error);
      toast.error(error.message);
      setBotStatus('idle');
    },
  });
  const settleMissionMutation = trpc.topics.settle.useMutation({
    onError: (error) => {
      console.error('Failed to settle mission:', error);
      toast.error(error.message);
    },
  });

  const autoTopicMutation = trpc.chat.sendMessage.useMutation({
    onError: (error) => {
      console.error('Failed to auto create topic:', error);
      toast.error(error.message || t('chat.autoCreateFailed'));
      setBotStatus('idle');
    },
  });

  // Simulate AI analysis on mount
  useEffect(() => {
    if (latestMatchId) {
      setBotStatus('analyzing');
      const timer = setTimeout(() => {
        setBotStatus('ready');
        setWinPrediction(78);
        setMessages([
          {
            role: 'assistant',
            content: `🎯 Analysis complete! Based on your latest match data, I've identified key improvement areas. Your team collaboration rate is strong at 85%, but TTD could be optimized. Would you like specific recommendations?`
          }
        ]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [latestMatchId]);

  useEffect(() => {
    // Only auto-scroll when new messages are added
    if (scrollRef.current && messages.length > 0) {
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages.length]); // Only depend on message count, not content

  const handleSend = () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setBotStatus('thinking');

    sendMessageMutation.mutate({
      message: userMessage.content,
      userId: user?.id,
      history: messages.map(m => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRevealWinner = async () => {
    if (!user) {
      toast.error(t('chat.revealLoginRequired'));
      return;
    }

    const availableTopics =
      activeTopics?.filter(
        (topic) =>
          topic.status === "active" &&
          Array.isArray(topic.options) &&
          topic.options.length > 0
      ) || [];

    if (availableTopics.length === 0) {
      toast.info(t('chat.noActiveTopics'));
      return;
    }

    // 随机选择一个话题
    const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const winningChoice = topic.options[Math.floor(Math.random() * topic.options.length)];

    // 查找用户在这个话题上的投票
    const userVote = myVotes?.find((v: any) => v.topicId === topic.topicId);
    const userChoice = userVote?.choice as string | undefined;
    const metadata = userVote?.metadata as { points?: number; rewardPoints?: number } | undefined;
    const betAmount = metadata?.points || 0;
    const rewardPoints = metadata?.rewardPoints || (topic.topicType === 'mission' ? 10 : undefined);
    
    // 计算积分变动
    let isWinner: boolean;
    let pointsChange: number | undefined;
    
    if (topic.topicType === 'mission') {
      // Mission 类型：选择成功选项即为获胜
      isWinner = winningChoice === topic.options[0]; // 第一个选项通常是成功
      pointsChange = isWinner ? (rewardPoints || 10) : 0;
    } else {
      // Bet/Vote 类型
      isWinner = userChoice === winningChoice;
      pointsChange = isWinner ? betAmount * 2 : (betAmount > 0 ? -betAmount : 0);
    }

    // 打开揭晓弹窗
    setRevealState({
      isOpen: true,
      topic: {
        topicId: topic.topicId,
        title: topic.title,
        description: topic.description || undefined,
        topicType: topic.topicType as 'bet' | 'vote' | 'mission',
        options: topic.options,
      },
      winningChoice,
      userChoice: topic.topicType === 'mission' ? winningChoice : userChoice,
      betAmount: betAmount > 0 ? betAmount : undefined,
      rewardPoints: topic.topicType === 'mission' ? (rewardPoints || 10) : undefined,
      isCardFlipped: false,
      showResult: false,
      isWinner,
      pointsChange: userChoice || topic.topicType === 'mission' ? pointsChange : undefined,
    });
  };

  // 处理卡片翻转
  const handleCardFlip = async () => {
    if (!revealState.topic) return;

    setRevealState(prev => ({ ...prev, isCardFlipped: true }));

    // 翻转动画完成后，调用 settle API
    setTimeout(async () => {
      try {
        await revealWinnerMutation.mutateAsync({
          topicId: revealState.topic!.topicId,
          correctChoice: revealState.winningChoice,
        });
        await refetchTopics();
        await refetchPoints();

        // 显示结果页面 (用户参与了或者是mission类型)
        if (revealState.userChoice || revealState.topic!.topicType === 'mission') {
          setTimeout(() => {
            setRevealState(prev => ({ ...prev, showResult: true }));
          }, 1000);
        }

        const revealMessage = revealState.topic!.topicType === 'mission'
          ? `🎯 Mission "${revealState.topic!.title}" completed! Outcome: ${revealState.winningChoice}`
          : t('chat.revealMessage')
              .replace('{title}', revealState.topic!.title)
              .replace('{choice}', revealState.winningChoice);

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: revealMessage,
          },
        ]);

        setBotStatus('ready');
      } catch (error: any) {
        const message = error?.message || t('chat.revealFailed');
        toast.error(message);
        setBotStatus('idle');
      }
    }, 800); // 等待翻转动画
  };

  const resetMissionState = () => {
    setMissionState({
      isOpen: false,
      topicId: undefined,
      missionTitle: '',
      missionDetail: '',
      rewardPoints: 10,
      outcomeOptions: ["Mission Completed", "Mission Failed"],
      isFlipped: false,
    });
  };

  const handleMissionFlip = () => {
    setMissionState((prev) => ({ ...prev, isFlipped: true }));
  };

  const handleMissionOutcome = async (isSuccess: boolean) => {
    if (!missionState.topicId) return;

    const choice =
      missionState.outcomeOptions[isSuccess ? 0 : 1] ||
      (isSuccess ? "Mission Completed" : "Mission Failed");

    try {
      await settleMissionMutation.mutateAsync({
        topicId: missionState.topicId,
        correctChoice: choice,
      });
      await refetchTopics();
      await refetchPoints();

      // 关闭任务对话框
      resetMissionState();

      // 显示 RevealResult 结果页面
      const pointsChange = isSuccess ? missionState.rewardPoints : 0;
      setRevealState({
        isOpen: false,
        topic: {
          topicId: missionState.topicId,
          title: missionState.missionTitle,
          description: missionState.missionDetail,
          topicType: 'mission',
          options: missionState.outcomeOptions,
        },
        winningChoice: choice,
        userChoice: choice,
        rewardPoints: missionState.rewardPoints,
        isCardFlipped: true,
        showResult: true,
        isWinner: isSuccess,
        pointsChange,
      });
    } catch (error: any) {
      const message = error?.message || "Failed to settle mission.";
      toast.error(message);
    }
  };

  // 关闭揭晓弹窗
  const handleCloseReveal = () => {
    setRevealState({
      isOpen: false,
      topic: null,
      winningChoice: '',
      isCardFlipped: false,
      showResult: false,
      isWinner: false,
    });
  };

  // 关闭结果展示
  const handleCloseResult = () => {
    setRevealState(prev => ({ ...prev, showResult: false }));
    // 延迟关闭弹窗
    setTimeout(() => {
      handleCloseReveal();
    }, 300);
  };

  const handleAutoCreateTopic = async () => {
    if (!user) {
      toast.error(t('chat.revealLoginRequired'));
      return;
    }

    setBotStatus('thinking');
    const prompt = `Create a concise betting or voting topic based on recent matches and points context. Use the tool JSON schema to call create_topic directly with 2-4 clear options and revealInHours of 24. Keep the title short and relevant to FPS performance.`;

    try {
      const response = await autoTopicMutation.mutateAsync({
        message: prompt,
        userId: user.id,
        history: [],
      });

      await refetchTopics();
      await refetchPoints();

      const autoMessage = response.reply || t('chat.autoCreateSuccess');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: autoMessage,
        },
      ]);
      toast.success(t('chat.autoCreateSuccess'));
      setBotStatus('ready');
    } catch (error: any) {
      const message = error?.message || t('chat.autoCreateFailed');
      toast.error(message);
      setBotStatus('idle');
    }
  };

  const getStatusConfig = () => {
    switch (botStatus) {
      case 'analyzing':
        return {
          text: 'Analyzing match data...',
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-blue-400'
        };
      case 'thinking':
        return {
          text: 'Thinking...',
          icon: <Brain className="h-4 w-4 animate-pulse" />,
          color: 'text-purple-400'
        };
      case 'ready':
        return {
          text: 'Ready to assist',
          icon: <Zap className="h-4 w-4" />,
          color: 'text-green-400'
        };
      default:
        return {
          text: 'Standby',
          icon: <Bot className="h-4 w-4" />,
          color: 'text-gray-400'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={cn(
      "relative overflow-hidden border-white/10 bg-gradient-to-br from-violet-500/5 to-black/40",
      "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
      "h-full lg:min-h-[900px]",
      className
    )}>
      {/* Animated Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
      
      <CardHeader className="relative z-10 pb-4">
        {/* Competition Points Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* AI Avatar - 3D Holographic Effect */}
            <div className="relative w-14 h-14 group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 rounded-2xl animate-[spin_8s_linear_infinite] blur-sm opacity-75" />
              <div className="absolute inset-0.5 bg-gradient-to-br from-violet-400 via-purple-400 to-blue-400 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
              </div>
              {/* Orbiting particles */}
              <div className="absolute -inset-2">
                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-violet-400 rounded-full animate-[orbit_3s_linear_infinite] blur-[1px]" />
                <div className="absolute top-1/2 right-0 w-1 h-1 bg-blue-400 rounded-full animate-[orbit_4s_linear_infinite] blur-[1px]" style={{ animationDelay: '1s' }} />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                AI Co-Pilot
              </h3>
              <div className={cn("flex items-center gap-1.5 text-xs", statusConfig.color)}>
                {statusConfig.icon}
                <span>{statusConfig.text}</span>
              </div>
            </div>
          </div>

          {/* Competition Points - Game Currency Style */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-xl rounded-full" />
            <div className="relative bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl px-4 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <div>
                  <div className="text-[10px] text-amber-300/60 font-medium">Competition Points</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent tabular-nums">
                    {competitionPoints.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Win Prediction Bar */}
        {winPrediction !== null && (
          <div className="bg-black/40 rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Next Match Win Prediction</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                {winPrediction}%
              </span>
            </div>
            <div className="h-2 bg-black/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                style={{ width: `${winPrediction}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Chat Messages Area */}
        <div className="bg-black/40 rounded-lg border border-white/5 min-h-[320px] lg:min-h-[420px] flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 [&_[data-slot=scroll-area-viewport]]:scroll-smooth" type="auto">
            <div className="space-y-3 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Brain className="h-12 w-12 text-violet-400/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    I'm your AI co-pilot. Ask me anything about your performance!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-2 items-start",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        msg.role === 'user'
                          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                          : "bg-muted/50 text-foreground border border-white/5"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="bg-muted/50 rounded-lg px-3 py-2 border border-white/5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-white/5">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sendMessageMutation.isPending}
                className="bg-black/40 border-white/10 focus-visible:ring-violet-500"
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={sendMessageMutation.isPending || !inputValue.trim()}
                className="bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-black/40 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-300"
            onClick={() => {
              const message = "Analyze my latest match";
              setInputValue(message);
              // Auto-send the message
              const userMessage: Message = { role: 'user', content: message };
              setMessages((prev) => [...prev, userMessage]);
              setBotStatus('thinking');
              sendMessageMutation.mutate({
                message: message,
                userId: user?.id,
              });
            }}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Analyze Match
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-black/40 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-300"
            asChild
          >
            <Link href="/create-topic">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Create Topic
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20 text-emerald-200"
            onClick={handleRevealWinner}
            disabled={revealWinnerMutation.isPending || isTopicsLoading}
          >
            {revealWinnerMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
            )}
            {t('topics.revealed')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 bg-gradient-to-r from-blue-500/15 via-violet-500/10 to-cyan-500/15 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/20 text-blue-100"
            onClick={handleAutoCreateTopic}
            disabled={autoTopicMutation.isPending}
          >
            {autoTopicMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {t('chat.autoCreateTopic')}
          </Button>
        </div>

        {/* Recent Voting Section */}
        <div className="bg-black/40 rounded-lg border border-white/5 p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Recent Voting
            </h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/topics">View All</Link>
            </Button>
          </div>
          
          <div className="space-y-2">
            {recentTopics.length > 0 ? (
              recentTopics.map((topic) => (
                <Link key={topic.topicId} href={`/topics/${topic.topicId}`}>
                  <div className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 mt-0.5",
                          topic.topicType === 'bet'
                            ? "border-amber-500/50 text-amber-400"
                            : topic.topicType === "mission"
                            ? "border-red-500/50 text-red-400"
                            : "border-blue-500/50 text-blue-400"
                        )}
                      >
                        {topic.topicType === 'bet'
                          ? 'BET'
                          : topic.topicType === 'mission'
                          ? 'MISSION'
                          : 'VOTE'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/90 line-clamp-1 group-hover:text-violet-300 transition-colors">
                          {topic.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {topic.options.slice(0, 2).join(' • ')}
                          {topic.options.length > 2 && ` +${topic.options.length - 2}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-xs text-muted-foreground py-4">
                No active topics
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* 揭晓弹窗 */}
      <RevealDialog
        open={revealState.isOpen && !revealState.showResult}
        onOpenChange={(open) => {
          if (!open) handleCloseReveal();
        }}
      >
        <RevealDialogContent>
          <RevealDialogTitle>
            {t('reveal.letsSeWhoWins') || "LET'S SEE WHO WINS"}
          </RevealDialogTitle>

          {revealState.topic && (
            <div className="mt-4">
              <RevealCard
                title={revealState.topic.title}
                description={revealState.topic.description}
                topicType={revealState.topic.topicType}
                options={revealState.topic.options}
                userChoice={revealState.userChoice}
                winningChoice={revealState.winningChoice}
                isFlipped={revealState.isCardFlipped}
                onFlip={handleCardFlip}
                betAmount={revealState.betAmount}
                rewardPoints={revealState.rewardPoints}
                isFlipping={revealWinnerMutation.isPending}
              />
            </div>
          )}

          {/* 关闭按钮 */}
          {revealState.isCardFlipped && !revealState.userChoice && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleCloseReveal}
                className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
              >
                {t('common.close') || 'Close'}
              </Button>
            </div>
          )}
        </RevealDialogContent>
      </RevealDialog>

      {/* Secret Mission Dialog */}
      <RevealDialog
        open={missionState.isOpen}
        onOpenChange={(open) => {
          if (!open) resetMissionState();
        }}
      >
        <RevealDialogContent className="max-w-xl">
          {/* 关闭按钮 - 右上角 */}
          <button
            onClick={resetMissionState}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <XCircle className="h-5 w-5" />
          </button>

          <RevealDialogTitle>
            🔴 Secret Mission Briefing
          </RevealDialogTitle>

          <div className="mt-4">
            <SecretMissionCard
              missionTitle={missionState.missionTitle}
              missionDetail={missionState.missionDetail}
              rewardPoints={missionState.rewardPoints}
              isFlipped={missionState.isFlipped}
              onFlip={handleMissionFlip}
            />
          </div>

          <div className="mt-5 space-y-3">
            <div className="text-sm text-muted-foreground">
              Flip to reveal the covert objective. Log the outcome after the
              next match to trigger rewards.
            </div>
            {missionState.isFlipped ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleMissionOutcome(true)}
                  disabled={settleMissionMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                >
                  {settleMissionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMissionOutcome(false)}
                  disabled={settleMissionMutation.isPending}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Failed
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                Flip the mission card to unlock outcome buttons.
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={resetMissionState}
                className="text-muted-foreground"
              >
                {t('common.close') || 'Close'}
              </Button>
            </div>
          </div>
        </RevealDialogContent>
      </RevealDialog>

      {/* 胜负结果全屏展示 */}
      <RevealResult
        show={revealState.showResult}
        isWinner={revealState.isWinner}
        pointsChange={revealState.pointsChange}
        topicType={revealState.topic?.topicType}
        onClose={handleCloseResult}
        autoCloseDelay={5000}
      />

      <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(32px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(32px) rotate(-360deg);
          }
        }
      `}</style>
    </Card>
  );
}
