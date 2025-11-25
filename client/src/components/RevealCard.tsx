import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Vote, Sparkles, Crown } from "lucide-react";

interface RevealCardProps {
  /** 话题标题 */
  title: string;
  /** 话题描述 */
  description?: string;
  /** 话题类型 */
  topicType: "bet" | "vote" | "mission";
  /** 选项列表 */
  options: string[];
  /** 用户的选择 (如果有) */
  userChoice?: string;
  /** 正确答案/获胜选项 */
  winningChoice: string;
  /** 是否已翻转 */
  isFlipped: boolean;
  /** 翻转回调 */
  onFlip: () => void;
  /** 投注金额 (如果是bet类型) */
  betAmount?: number;
  /** 奖励积分 (如果是mission类型) */
  rewardPoints?: number;
  /** 是否正在翻转动画中 */
  isFlipping?: boolean;
  className?: string;
}

/**
 * RevealCard - 3D 翻转卡片组件
 * 正面显示题目和选项，背面显示结果
 */
export function RevealCard({
  title,
  description,
  topicType,
  options,
  userChoice,
  winningChoice,
  isFlipped,
  onFlip,
  betAmount,
  rewardPoints,
  isFlipping,
  className,
}: RevealCardProps) {
  const isWinner = userChoice === winningChoice;
  const hasParticipated = !!userChoice;

  return (
    <div
      className={cn(
        "relative w-full perspective-1000",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.8,
          type: "spring",
          damping: 20,
          stiffness: 100,
        }}
        onClick={!isFlipped ? onFlip : undefined}
      >
        {/* 正面 - 题目卡片 */}
        <div
          className="absolute inset-0 w-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardFront
            title={title}
            description={description}
            topicType={topicType}
            options={options}
            userChoice={userChoice}
            betAmount={betAmount}
            rewardPoints={rewardPoints}
            isFlipping={isFlipping}
          />
        </div>

        {/* 背面 - 结果卡片 */}
        <div
          className="absolute inset-0 w-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardBack
            title={title}
            topicType={topicType}
            winningChoice={winningChoice}
            userChoice={userChoice}
            isWinner={isWinner}
            hasParticipated={hasParticipated}
            betAmount={betAmount}
            rewardPoints={rewardPoints}
          />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 卡片正面 - 显示题目和选项
 */
function CardFront({
  title,
  description,
  topicType,
  options,
  userChoice,
  betAmount,
  rewardPoints,
  isFlipping,
}: {
  title: string;
  description?: string;
  topicType: "bet" | "vote" | "mission";
  options: string[];
  userChoice?: string;
  betAmount?: number;
  rewardPoints?: number;
  isFlipping?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "relative w-full min-h-[280px] rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "border-2 border-slate-600/50",
        "shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
        topicType === "mission" 
          ? "hover:border-red-500/50 hover:shadow-[0_10px_50px_rgba(248,113,113,0.2)]"
          : "hover:border-amber-500/50 hover:shadow-[0_10px_50px_rgba(255,160,0,0.2)]",
        "transition-all duration-300"
      )}
    >
      {/* 顶部装饰条 */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        topicType === "mission" 
          ? "bg-gradient-to-r from-red-500 via-amber-400 to-red-500"
          : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
      )} />

      {/* 闪光效果 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, transparent 50%)",
        }}
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
      />

      <div className="relative p-5">
        {/* 标签 */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            className={cn(
              "px-3 py-1 text-xs font-bold uppercase tracking-wider",
              topicType === "bet"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                : topicType === "mission"
                ? "bg-red-500/20 text-red-400 border-red-500/50"
                : "bg-blue-500/20 text-blue-400 border-blue-500/50"
            )}
          >
            {topicType === "bet" ? (
              <>
                <Trophy className="w-3 h-3 mr-1" />
                BET
              </>
            ) : topicType === "mission" ? (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                MISSION
              </>
            ) : (
              <>
                <Vote className="w-3 h-3 mr-1" />
                VOTE
              </>
            )}
          </Badge>
          {userChoice && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <Sparkles className="w-3 h-3 mr-1" />
              Participated
            </Badge>
          )}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* 选项列表 */}
        <div className="space-y-2 mb-4">
          {options.slice(0, 4).map((option, index) => (
            <div
              key={index}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                userChoice === option
                  ? topicType === "mission"
                    ? "bg-red-500/20 border border-red-500/50 text-red-300"
                    : "bg-amber-500/20 border border-amber-500/50 text-amber-300"
                  : "bg-slate-800/50 border border-slate-700/50 text-slate-300"
              )}
            >
              <span className="mr-2 text-slate-500">{index + 1}.</span>
              {option}
              {userChoice === option && (
                <span className={cn(
                  "ml-2 text-xs",
                  topicType === "mission" ? "text-red-400" : "text-amber-400"
                )}>(Your pick)</span>
              )}
            </div>
          ))}
          {options.length > 4 && (
            <div className="text-xs text-slate-500 text-center">
              +{options.length - 4} more options
            </div>
          )}
        </div>

        {/* 投注金额 */}
        {topicType === "bet" && betAmount && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-700/50">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold">{betAmount}</span>
            <span className="text-slate-500 text-sm">points at stake</span>
          </div>
        )}

        {/* 任务奖励 */}
        {topicType === "mission" && rewardPoints && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-700/50">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-bold">+{rewardPoints}</span>
            <span className="text-slate-500 text-sm">points on success</span>
          </div>
        )}

        {/* 点击提示 */}
        <motion.div
          className="absolute bottom-3 left-0 right-0 text-center"
          animate={{ opacity: isFlipping ? 0 : [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className={cn(
            "text-xs uppercase tracking-widest",
            topicType === "mission" ? "text-red-400/70" : "text-amber-400/70"
          )}>
            👆 Tap to reveal
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * 卡片背面 - 显示结果
 */
function CardBack({
  title,
  topicType,
  winningChoice,
  userChoice,
  isWinner,
  hasParticipated,
  betAmount,
  rewardPoints,
}: {
  title: string;
  topicType: "bet" | "vote" | "mission";
  winningChoice: string;
  userChoice?: string;
  isWinner: boolean;
  hasParticipated: boolean;
  betAmount?: number;
  rewardPoints?: number;
}) {
  // 任务成功的配色方案
  const missionSuccessConfig = {
    gradient: "from-emerald-500 via-green-400 to-emerald-500",
    border: "border-emerald-500",
    shadow: "shadow-[0_0_60px_rgba(16,185,129,0.5)]",
    bgGradient: "from-emerald-900/40 via-green-900/20 to-emerald-900/40",
  };

  const resultConfig = topicType === "mission"
    ? (isWinner ? missionSuccessConfig : {
        gradient: "from-red-500 via-rose-500 to-red-500",
        border: "border-red-500/50",
        shadow: "shadow-[0_0_40px_rgba(239,68,68,0.3)]",
        bgGradient: "from-red-900/30 via-rose-900/20 to-red-900/30",
      })
    : isWinner
    ? {
        gradient: "from-amber-500 via-yellow-400 to-amber-500",
        border: "border-amber-500",
        shadow: "shadow-[0_0_60px_rgba(255,160,0,0.5)]",
        bgGradient: "from-amber-900/40 via-yellow-900/20 to-amber-900/40",
      }
    : hasParticipated
    ? {
        gradient: "from-red-500 via-rose-500 to-red-500",
        border: "border-red-500/50",
        shadow: "shadow-[0_0_40px_rgba(239,68,68,0.3)]",
        bgGradient: "from-red-900/30 via-rose-900/20 to-red-900/30",
      }
    : {
        gradient: "from-slate-400 via-slate-300 to-slate-400",
        border: "border-slate-500/50",
        shadow: "shadow-[0_0_30px_rgba(100,116,139,0.2)]",
        bgGradient: "from-slate-800/50 via-slate-700/30 to-slate-800/50",
      };

  return (
    <div
      className={cn(
        "relative w-full min-h-[280px] rounded-xl overflow-hidden",
        `bg-gradient-to-br ${resultConfig.bgGradient}`,
        `border-2 ${resultConfig.border}`,
        resultConfig.shadow,
        "backdrop-blur-sm"
      )}
    >
      {/* 顶部装饰条 */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          `bg-gradient-to-r ${resultConfig.gradient}`
        )}
      />

      {/* 胜利粒子效果 */}
      {isWinner && <WinnerParticles />}

      <div className="relative p-5 flex flex-col items-center justify-center min-h-[280px]">
        {/* 皇冠图标 (仅胜利时显示) */}
        {isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", damping: 10 }}
            className="mb-4"
          >
            <Crown className="w-16 h-16 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
          </motion.div>
        )}

        {/* 结果标题 */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-slate-400 mb-2">{title}</p>
          <div
            className={cn(
              "text-lg font-bold px-4 py-2 rounded-lg",
              `bg-gradient-to-r ${resultConfig.gradient}`,
              "bg-clip-text text-transparent"
            )}
          >
            {topicType === "mission" 
              ? `Outcome: ${winningChoice}`
              : `Winner: ${winningChoice}`}
          </div>
        </motion.div>

        {/* 用户结果 */}
        {hasParticipated && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-sm text-slate-400 mb-1">
              {topicType === "mission" ? "Status:" : "Your pick:"}
            </div>
            <div
              className={cn(
                "text-base font-medium px-3 py-1 rounded-lg",
                isWinner
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {userChoice}
            </div>

            {/* 积分变动 - bet类型 */}
            {topicType === "bet" && betAmount && (
              <motion.div
                className="mt-4 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Trophy
                  className={cn(
                    "w-5 h-5",
                    isWinner ? "text-amber-400" : "text-red-400"
                  )}
                />
                <span
                  className={cn(
                    "text-xl font-bold",
                    isWinner ? "text-green-400" : "text-red-400"
                  )}
                >
                  {isWinner ? `+${betAmount * 2}` : `-${betAmount}`}
                </span>
                <span className="text-slate-500 text-sm">points</span>
              </motion.div>
            )}

            {/* 积分变动 - mission类型 */}
            {topicType === "mission" && rewardPoints && (
              <motion.div
                className="mt-4 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Sparkles
                  className={cn(
                    "w-5 h-5",
                    isWinner ? "text-emerald-400" : "text-red-400"
                  )}
                />
                <span
                  className={cn(
                    "text-xl font-bold",
                    isWinner ? "text-green-400" : "text-red-400"
                  )}
                >
                  {isWinner ? `+${rewardPoints}` : "+0"}
                </span>
                <span className="text-slate-500 text-sm">points</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {!hasParticipated && topicType !== "mission" && (
          <motion.p
            className="text-slate-500 text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You didn't participate in this topic
          </motion.p>
        )}
      </div>
    </div>
  );
}

/**
 * 胜利粒子效果
 */
function WinnerParticles() {
  const particles = React.useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * -150 - 50,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `linear-gradient(135deg, #FFD700, #FFA500)`,
            boxShadow: `0 0 ${particle.size}px rgba(255,215,0,0.8)`,
            left: "50%",
            bottom: 0,
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default RevealCard;
