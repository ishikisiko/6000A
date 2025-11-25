import { motion } from "framer-motion";
import { Shield, Flame, Sparkles, Sword, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SecretMissionCardProps {
  missionTitle: string;
  missionDetail: string;
  rewardPoints?: number;
  isFlipped: boolean;
  onFlip: () => void;
}

export function SecretMissionCard({
  missionTitle,
  missionDetail,
  rewardPoints = 10,
  isFlipped,
  onFlip,
}: SecretMissionCardProps) {
  return (
    <div className="relative w-full min-h-[260px]" style={{ perspective: "1000px" }}>
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.9,
          type: "spring",
          damping: 18,
          stiffness: 90,
        }}
        onClick={!isFlipped ? onFlip : undefined}
      >
        <div
          className="absolute inset-0 w-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          <FrontFace rewardPoints={rewardPoints} />
        </div>

        <div
          className="absolute inset-0 w-full"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <BackFace
            missionTitle={missionTitle}
            missionDetail={missionDetail}
            rewardPoints={rewardPoints}
          />
        </div>
      </motion.div>
    </div>
  );
}

function FrontFace({ rewardPoints }: { rewardPoints: number }) {
  return (
    <div
      className={cn(
        "relative w-full min-h-[260px] rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-950 via-slate-900 to-black",
        "border border-red-600/40 shadow-[0_0_40px_rgba(248,113,113,0.3)]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(248,113,113,0.08),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(248,113,113,0.15),transparent_35%)]" />

      <motion.div
        className="absolute inset-0 opacity-70"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 45deg, transparent, rgba(248,113,113,0.25), transparent)",
        }}
      />

      <div className="relative p-6 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <Badge className="bg-red-600/20 text-red-300 border-red-500/40 uppercase tracking-[0.2em]">
            Secret Mission
          </Badge>
          <div className="flex items-center gap-2 text-red-200/80 text-xs">
            <Sparkles className="w-4 h-4" />
            Tap to unveil
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-red-300">
            <Shield className="w-5 h-5" />
            <Sword className="w-5 h-5" />
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-red-500 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]">
            SECRET MISSION
          </h3>
          <p className="text-sm text-slate-300/80">
            Flip to expose the covert objective forged for your squad.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-amber-200">
          <Zap className="w-4 h-4" />
          Complete for +{rewardPoints} points • No risk on failure
        </div>
      </div>
    </div>
  );
}

function BackFace({
  missionTitle,
  missionDetail,
  rewardPoints,
}: {
  missionTitle: string;
  missionDetail: string;
  rewardPoints: number;
}) {
  return (
    <div
      className={cn(
        "relative w-full min-h-[260px] rounded-xl overflow-hidden",
        "bg-gradient-to-br from-amber-50 to-red-100 text-slate-900",
        "border border-amber-500/60 shadow-[0_10px_40px_rgba(251,191,36,0.45)]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.25),transparent_35%)]" />
      <div className="absolute inset-0 opacity-40 mix-blend-overlay">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grid" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(248,113,113,0.3)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M0 50h400M0 100h400M0 150h400M0 200h400M0 250h400M0 300h400M0 350h400M50 0v400M100 0v400M150 0v400M200 0v400M250 0v400M300 0v400M350 0v400"
            stroke="url(#grid)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="relative p-6 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            Reward +{rewardPoints} pts
          </Badge>
          <Crown className="w-5 h-5 text-amber-600" />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-600">
            Mission Unsealed
          </p>
          <h3 className="text-2xl font-black text-red-700 drop-shadow-[0_4px_18px_rgba(248,113,113,0.35)]">
            {missionTitle}
          </h3>
          <p className="text-sm leading-relaxed text-slate-800">
            {missionDetail}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-red-700">
          <Sparkles className="w-4 h-4" />
          Rally the squad. Mark outcome when the dust settles.
        </div>
      </div>
    </div>
  );
}
