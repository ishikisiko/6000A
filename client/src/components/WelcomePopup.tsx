import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Trophy, Target, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomePopupProps {
  onClose?: () => void;
}

export function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsOpen(true);
      sessionStorage.setItem("hasSeenWelcome", "true");
    } else {
      // If already seen, trigger onClose immediately so parent can animate
      onClose?.();
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence onExitComplete={() => onClose?.()}>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Popup Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              bounce: 0.3
            }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] shadow-2xl"
          >
            {/* Decorative Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
            
            {/* Content */}
            <div className="relative p-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {t('welcome.title')}
                  </h2>
                </div>
                <button 
                  onClick={handleClose}
                  className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <p className="text-lg text-white/80">
                  {t('welcome.subtitle')}
                </p>
                
                <div className="grid grid-cols-2 gap-3 py-4">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-cyan-500/30">
                    <Target className="mb-2 h-5 w-5 text-cyan-400" />
                    <div className="text-sm font-medium text-white">{t('welcome.analysisReady')}</div>
                    <div className="text-xs text-white/50">{t('welcome.latestStats')}</div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-purple-500/30">
                    <Zap className="mb-2 h-5 w-5 text-purple-400" />
                    <div className="text-sm font-medium text-white">{t('welcome.aiCoach')}</div>
                    <div className="text-xs text-white/50">{t('welcome.standingBy')}</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={handleClose}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  {t('welcome.dismiss')}
                </Button>
                <Button 
                  onClick={handleClose}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
                >
                  {t('welcome.enter')}
                </Button>
              </div>
            </div>

            {/* Animated Border Line */}
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
