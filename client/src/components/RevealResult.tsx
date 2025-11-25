import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Frown, Sparkles, Star, Target, XCircle } from "lucide-react";

interface RevealResultProps {
  /** 是否显示 */
  show: boolean;
  /** 是否获胜 */
  isWinner: boolean;
  /** 积分变动 */
  pointsChange?: number;
  /** 话题类型 */
  topicType?: "bet" | "vote" | "mission";
  /** 关闭回调 */
  onClose?: () => void;
  /** 自动关闭延迟 (ms) */
  autoCloseDelay?: number;
  className?: string;
}

/**
 * RevealResult - 结果揭晓大字组件
 * 显示 "YOU WIN" 或 "YOU LOSE" 或 "MISSION COMPLETE/FAILED" 的震撼动效
 */
export function RevealResult({
  show,
  isWinner,
  pointsChange,
  topicType = "bet",
  onClose,
  autoCloseDelay = 4000,
  className,
}: RevealResultProps) {
  // 自动关闭
  React.useEffect(() => {
    if (show && autoCloseDelay > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoCloseDelay, onClose]);

  // 根据类型决定显示的文字
  const getResultText = () => {
    if (topicType === "mission") {
      return isWinner ? "MISSION COMPLETE!" : "MISSION FAILED";
    }
    return isWinner ? "YOU WIN!" : "YOU LOSE";
  };

  // 根据类型决定渐变色
  const getGradient = () => {
    if (topicType === "mission") {
      return isWinner
        ? "linear-gradient(135deg, #10B981 0%, #059669 30%, #047857 70%, #065F46 100%)"
        : "linear-gradient(135deg, #EF4444 0%, #DC2626 30%, #B91C1C 70%, #991B1B 100%)";
    }
    return isWinner
      ? "linear-gradient(135deg, #FFE082 0%, #FFD700 30%, #FFA000 70%, #FF8F00 100%)"
      : "linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #64748b 100%)";
  };

  // 根据类型决定阴影色
  const getTextShadow = () => {
    if (topicType === "mission") {
      return isWinner
        ? "0 0 80px rgba(16,185,129,0.8)"
        : "0 0 60px rgba(239,68,68,0.6)";
    }
    return isWinner
      ? "0 0 80px rgba(255,215,0,0.8)"
      : "0 0 40px rgba(100,116,139,0.5)";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            "bg-black/90 backdrop-blur-md",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* 背景特效 */}
          {isWinner ? (
            topicType === "mission" ? <MissionSuccessBackground /> : <WinnerBackground />
          ) : (
            topicType === "mission" ? <MissionFailedBackground /> : <LoserBackground />
          )}

          {/* 主要内容 */}
          <div className="relative z-10 text-center">
            {/* 图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 10,
                stiffness: 100,
                delay: 0.2,
              }}
              className="mb-6"
            >
              {topicType === "mission" ? (
                isWinner ? (
                  <div className="relative">
                    <Target className="w-24 h-24 text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,1)]" />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    >
                      <Sparkles className="w-24 h-24 text-green-300" />
                    </motion.div>
                  </div>
                ) : (
                  <XCircle className="w-24 h-24 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                )
              ) : isWinner ? (
                <div className="relative">
                  <Trophy className="w-24 h-24 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,1)]" />
                  {/* 闪光效果 */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  >
                    <Sparkles className="w-24 h-24 text-yellow-300" />
                  </motion.div>
                </div>
              ) : (
                <Frown className="w-24 h-24 text-slate-400 drop-shadow-[0_0_20px_rgba(148,163,184,0.5)]" />
              )}
            </motion.div>

            {/* 大字标题 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 8,
                stiffness: 100,
                delay: 0.4,
              }}
            >
              <h1
                className={cn(
                  "text-5xl md:text-7xl font-black tracking-wider uppercase",
                  "drop-shadow-[0_0_30px_currentColor]"
                )}
                style={{
                  background: getGradient(),
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: getTextShadow(),
                }}
              >
                {getResultText()}
              </h1>
            </motion.div>

            {/* 积分变动 */}
            {pointsChange !== undefined && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div
                  className={cn(
                    "inline-flex items-center gap-3 px-8 py-4 rounded-2xl",
                    "border-2",
                    topicType === "mission"
                      ? isWinner
                        ? "bg-emerald-500/10 border-emerald-500/50"
                        : "bg-red-500/10 border-red-500/30"
                      : isWinner
                        ? "bg-amber-500/10 border-amber-500/50"
                        : "bg-slate-500/10 border-slate-500/30"
                  )}
                >
                  {topicType === "mission" ? (
                    <Target
                      className={cn(
                        "w-8 h-8",
                        isWinner ? "text-emerald-400" : "text-red-400"
                      )}
                    />
                  ) : (
                    <Trophy
                      className={cn(
                        "w-8 h-8",
                        isWinner ? "text-amber-400" : "text-slate-400"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "text-4xl md:text-5xl font-bold tabular-nums",
                      isWinner ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {pointsChange > 0 ? `+${pointsChange}` : pointsChange}
                  </span>
                  <span className="text-xl text-slate-400">pts</span>
                </div>
              </motion.div>
            )}

            {/* 点击关闭提示 */}
            <motion.p
              className="mt-8 text-sm text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>

          {/* Confetti 粒子 (仅胜利时) */}
          {isWinner && <Confetti />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 胜利背景效果
 */
function WinnerBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 金色光芒 */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,160,0,0.2) 30%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 射线效果 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-[50vh] origin-top"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,215,0,0.3), transparent)",
            transform: `rotate(${i * 30}deg)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            scaleY: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 失败背景效果
 */
function LoserBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(circle, rgba(100,116,139,0.2) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/**
 * Mission成功背景效果
 */
function MissionSuccessBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 绿色光芒 */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.2) 30%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 射线效果 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-[50vh] origin-top"
          style={{
            background:
              "linear-gradient(to bottom, rgba(16,185,129,0.3), transparent)",
            transform: `rotate(${i * 30}deg)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            scaleY: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Mission失败背景效果
 */
function MissionFailedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/**
 * Confetti 彩带粒子效果
 */
function Confetti() {
  const confetti = React.useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
      size: Math.random() * 10 + 5,
      color: [
        "#FFD700",
        "#FFA500",
        "#FF6B00",
        "#FFE082",
        "#FFCA28",
        "#FF8F00",
      ][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      swayX: Math.random() * 100 - 50,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: -20,
            width: particle.size,
            height: particle.size * 0.6,
            backgroundColor: particle.color,
            borderRadius: "2px",
          }}
          initial={{
            y: -20,
            x: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            x: [0, particle.swayX, -particle.swayX, particle.swayX, 0],
            rotate: [0, particle.rotation, particle.rotation * 2],
            opacity: [1, 1, 1, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 简化版结果展示 - 用于内嵌显示
 */
export function RevealResultBadge({
  isWinner,
  pointsChange,
  topicType = "bet",
  className,
}: {
  isWinner: boolean;
  pointsChange?: number;
  topicType?: "bet" | "vote" | "mission";
  className?: string;
}) {
  const getText = () => {
    if (topicType === "mission") {
      return isWinner ? "COMPLETE" : "FAILED";
    }
    return isWinner ? "WIN" : "LOSE";
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold",
        topicType === "mission"
          ? isWinner
            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/50"
            : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30"
          : isWinner
            ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/50"
            : "bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/30",
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 10 }}
    >
      {topicType === "mission" ? (
        isWinner ? (
          <Target className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )
      ) : isWinner ? (
        <Star className="w-4 h-4 fill-amber-400" />
      ) : (
        <Frown className="w-4 h-4" />
      )}
      <span>{getText()}</span>
      {pointsChange !== undefined && (
        <span className={isWinner ? "text-green-400" : "text-red-400"}>
          ({pointsChange > 0 ? `+${pointsChange}` : pointsChange})
        </span>
      )}
    </motion.div>
  );
}

export default RevealResult;
