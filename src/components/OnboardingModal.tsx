import { useState } from 'react';
import { Shield, Search, MessageSquare, ArrowRight, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to AmritaFind",
      subtitle: "The official campus-wide Lost & Found ecosystem for Amrita Vishwa Vidyapeetham.",
      icon: <Shield className="w-12 h-12 text-campus-600" />,
      badge: "Student Verified"
    },
    {
      title: "Post Missing & Recovered Items",
      subtitle: "Quickly post item details, locations, and photos to report lost items or help your peers.",
      icon: <Search className="w-12 h-12 text-amber-500" />,
      badge: "Real-time Listing"
    },
    {
      title: "AI Matching & Direct Chat",
      subtitle: "Our automated Gemini AI algorithm finds matches and lets you chat securely to arrange returns.",
      icon: <MessageSquare className="w-12 h-12 text-emerald-500" />,
      badge: "AI Powered"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative overflow-hidden text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
          {slides[slide].icon}
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-campus-50 text-campus-800 text-xs font-bold uppercase tracking-wider mb-4">
          {slides[slide].badge}
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">{slides[slide].title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">{slides[slide].subtitle}</p>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide === i ? 'w-8 bg-campus-800' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {slide < slides.length - 1 ? (
            <>
              <button onClick={onClose} className="btn-secondary flex-1">Skip Tour</button>
              <button onClick={() => setSlide(s => s + 1)} className="btn-primary flex-1 gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn-primary w-full gap-2 !py-3">
              Explore AmritaFind <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
