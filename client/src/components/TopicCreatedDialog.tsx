import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Trophy, 
  Vote, 
  Target,
  Clock,
  X,
} from "lucide-react";

interface TopicCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: {
    topicId: string;
    title: string;
    description?: string;
    topicType: "bet" | "vote" | "mission";
    options: string[];
    revealAt?: Date | string;
    rewardPoints?: number;
  } | null;
  onViewTopic?: () => void;
}

/**
 * TopicCreatedDialog - 简洁的话题创建成功提示框
 * 与华丽的揭晓弹窗形成对比，保持朴素简约的风格
 */
export function TopicCreatedDialog({
  open,
  onOpenChange,
  topic,
  onViewTopic,
}: TopicCreatedDialogProps) {
  if (!topic) return null;

  const getTypeConfig = () => {
    switch (topic.topicType) {
      case "bet":
        return {
          label: "竞猜",
          icon: <Trophy className="h-4 w-4" />,
          badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "vote":
        return {
          label: "投票",
          icon: <Vote className="h-4 w-4" />,
          badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };
      case "mission":
        return {
          label: "任务",
          icon: <Target className="h-4 w-4" />,
          badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
        };
      default:
        return {
          label: "话题",
          icon: <Vote className="h-4 w-4" />,
          badgeClass: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        };
    }
  };

  const typeConfig = getTypeConfig();

  const formatRevealTime = () => {
    if (!topic.revealAt) return null;
    const date = new Date(topic.revealAt);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60" />
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative w-full max-w-md"
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* 简洁的卡片容器 */}
                <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {/* 关闭按钮 */}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors z-10"
                    aria-label="关闭"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {/* 头部 - 成功标识 */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Created Topic</span>
                    </div>
                  </div>

                  {/* 话题卡片内容 */}
                  <div className="px-5 pb-5">
                    <TopicCard
                      title={topic.title}
                      description={topic.description}
                      topicType={topic.topicType}
                      options={topic.options}
                      revealAt={formatRevealTime()}
                      rewardPoints={topic.rewardPoints}
                      typeConfig={typeConfig}
                    />
                  </div>

                  {/* 底部操作 */}
                  <div className="px-5 pb-5 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      关闭
                    </Button>
                    {onViewTopic && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onOpenChange(false);
                          onViewTopic();
                        }}
                      >
                        查看话题
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  );
}

/**
 * TopicCard - 简洁的话题卡片展示
 * 保持朴素风格，不使用渐变和发光效果
 */
function TopicCard({
  title,
  description,
  topicType,
  options,
  revealAt,
  rewardPoints,
  typeConfig,
}: {
  title: string;
  description?: string;
  topicType: "bet" | "vote" | "mission";
  options: string[];
  revealAt?: string | null;
  rewardPoints?: number;
  typeConfig: {
    label: string;
    icon: React.ReactNode;
    badgeClass: string;
  };
}) {
  return (
    <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
      {/* 类型标签 */}
      <div className="flex items-center justify-between mb-3">
        <Badge
          variant="outline"
          className={cn("text-xs", typeConfig.badgeClass)}
        >
          <span className="mr-1">{typeConfig.icon}</span>
          {typeConfig.label}
        </Badge>
        {topicType === "mission" && rewardPoints && (
          <span className="text-xs text-muted-foreground">
            奖励 +{rewardPoints} pts
          </span>
        )}
      </div>

      {/* 标题 */}
      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {/* 选项列表 */}
      <div className="space-y-1.5 mb-3">
        {options.slice(0, 4).map((option, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded bg-muted text-xs text-muted-foreground font-medium">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-foreground/80 truncate">{option}</span>
          </div>
        ))}
        {options.length > 4 && (
          <span className="text-xs text-muted-foreground ml-7">
            +{options.length - 4} 更多选项
          </span>
        )}
      </div>

      {/* 揭晓时间 */}
      {revealAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Clock className="h-3.5 w-3.5" />
          <span>揭晓时间: {revealAt}</span>
        </div>
      )}
    </div>
  );
}

export default TopicCreatedDialog;
