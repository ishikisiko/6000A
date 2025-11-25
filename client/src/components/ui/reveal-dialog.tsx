import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * RevealDialog - 电竞风格的揭晓弹窗
 * 用于投票/竞猜结果揭晓，带有粒子爆炸和光晕效果
 */
export function RevealDialog({
  open,
  onOpenChange,
  children,
  className,
}: RevealDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <AnimatePresence>
          {open && (
            <motion.div
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                className
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                // 点击背景关闭对话框
                if (e.target === e.currentTarget) {
                  onOpenChange(false);
                }
              }}
            >
              {/* 背景光晕效果 */}
              <motion.div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,160,0,0.1) 40%, transparent 70%)",
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* 粒子效果 */}
              <RevealParticles />

              {/* 主内容 */}
              <motion.div
                className="relative z-10 w-full max-w-lg"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                }}
              >
                {children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  );
}

/**
 * 粒子爆炸效果组件
 */
function RevealParticles() {
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 1.5,
      color:
        i % 3 === 0
          ? "#FFD700"
          : i % 3 === 1
          ? "#FFA500"
          : "#FF6B00",
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
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            left: "50%",
            top: "50%",
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: particle.x * 8,
            y: particle.y * 8,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 揭晓弹窗标题组件 - "LET'S SEE WHO WINS"
 */
export function RevealDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("text-center mb-6", className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.h2
        className="text-3xl md:text-4xl font-black tracking-wider"
        style={{
          background: "linear-gradient(135deg, #FFE082 0%, #FFD700 50%, #FFA000 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 40px rgba(255,215,0,0.5)",
        }}
        animate={{
          textShadow: [
            "0 0 40px rgba(255,215,0,0.5)",
            "0 0 60px rgba(255,215,0,0.8)",
            "0 0 40px rgba(255,215,0,0.5)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.h2>
      <motion.div
        className="h-1 w-32 mx-auto mt-3 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

/**
 * 揭晓弹窗内容容器
 */
export function RevealDialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-gray-900/95 to-black/95",
        "border border-amber-500/30 rounded-2xl",
        "p-6 shadow-[0_0_50px_rgba(255,160,0,0.2)]",
        "backdrop-blur-xl",
        className
      )}
    >
      {/* 边框光效 */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)",
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      {children}
    </div>
  );
}

export default RevealDialog;
