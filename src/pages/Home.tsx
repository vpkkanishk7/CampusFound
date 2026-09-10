import { Link } from 'react-router-dom';
import { Shield, ArrowRight, MapPin, ShieldCheck, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero3DScene from '../components/Hero3DScene';

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-luminosity bg-cover bg-center" style={{ backgroundImage: "url('/avvp-image.jpeg')" }}>
          <div className="w-full h-full bg-gradient-to-br from-campus-950/90 to-slate-900/90" />
        </div>
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-campus-400/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * -500],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 px-8 py-16 sm:py-20 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Text Content */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
            <motion.div 
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-campus-100 text-sm font-bold mb-6 backdrop-blur-xl shadow-lg cursor-default"
            >
              <Shield className="w-4 h-4 text-campus-400" /> Official Amrita Campus Platform
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight drop-shadow-2xl"
            >
              Find what's missing, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-200 via-campus-400 to-campus-300">restore what's found.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-300/90 max-w-xl mb-8 font-medium"
            >
              The official, student-verified Missing Registry and Recovered Archive for Amrita Vishwa Vidyapeetham.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-campus-600 to-campus-800 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(125,18,52,0.5)] border border-campus-500/50 group">
                  Get Started 
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:text-campus-200" />
                  </motion.span>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/lost" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl font-bold text-lg backdrop-blur-xl shadow-lg">
                  Missing Registry
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Real 3D Interactive Graphics */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full flex justify-center"
          >
            <Hero3DScene />
          </motion.div>
        </div>
      </section>

      {/* Features with Scroll-Linked Animations */}
      <section className="grid md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.03, y: -5 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center flex flex-col items-center group transition-all duration-300"
        >
          <div className="w-16 h-16 bg-campus-50 text-campus-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Report Missing</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Easily post details and photos of items lost anywhere across the campus.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.03, y: -5 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center flex flex-col items-center group transition-all duration-300"
        >
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">AI Matching</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Our automated confidence algorithm connects lost items with recovered reports.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.03, y: -5 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center flex flex-col items-center group transition-all duration-300"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Handover</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Claimants must verify secret item details before contact information is shared.
          </p>
        </motion.div>
      </section>

      {/* Statistics */}
      <section className="bg-campus-900 rounded-2xl p-12 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-campus-700">
          <div className="py-4">
            <div className="text-4xl font-bold text-campus-400 mb-2">1,240+</div>
            <div className="text-slate-300 font-medium">Items Reported</div>
          </div>
          <div className="py-4">
            <div className="text-4xl font-bold text-campus-400 mb-2">680+</div>
            <div className="text-slate-300 font-medium">Items Found</div>
          </div>
          <div className="py-4">
            <div className="text-4xl font-bold text-campus-400 mb-2">520+</div>
            <div className="text-slate-300 font-medium">Successful Recoveries</div>
          </div>
        </div>
      </section>
    </div>
  );
}
