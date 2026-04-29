import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
}

export default function CelebrationModal({ isOpen, onClose, planName = "Pro" }: CelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
          >
            <div
              className="absolute left-0 top-0 h-1 w-full bg-[#2F6BFF]"
              aria-hidden
            />
            
            <button 
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-6 mt-2 flex justify-center">
              <div className="rounded-full bg-emerald-500/15 p-4 ring-1 ring-emerald-500/30">
                <CheckCircle className="h-12 w-12 text-emerald-400" strokeWidth={3} />
              </div>
            </div>

            <h2 className="mb-2 text-3xl font-bold text-white">
              Congratulations!
            </h2>
            
            <p className="mb-6 text-lg text-zinc-400">
              You&apos;ve successfully upgraded to the{" "}
              <span className="font-semibold text-white">{planName}</span> plan.
            </p>

            <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
               <p className="text-sm text-zinc-500">
                 Your new limits are active immediately. Create something amazing!
               </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#2F6BFF] py-3 px-6 font-semibold text-white shadow-[0_4px_16px_rgba(47,107,255,0.4)] transition-all duration-200 hover:bg-[#2a5fe3] hover:shadow-[0_6px_20px_rgba(47,107,255,0.45)] active:scale-[0.98]"
            >
              Start creating
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
