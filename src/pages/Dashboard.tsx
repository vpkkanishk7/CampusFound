import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Search, PlusCircle, CheckCircle, Package, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAppContext();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8 relative z-10 perspective-1000"
    >
      {/* Background Image Setup */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none transition-opacity duration-700"
        style={{ backgroundImage: "url('/avvp.png')" }}
      />

      {/* Header */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, rotateX: 2, rotateY: -1, z: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-campus-900/5 border border-white/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-campus-200/40 to-transparent rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Good morning, {user?.fullName ? user.fullName.split(' ')[0] : 'Student'}</h1>
          <p className="text-slate-500">Here's what's happening with your reports.</p>
        </div>
        <div className="text-sm text-slate-600 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div><span className="font-medium">Name:</span> {user?.fullName || 'Student'}</div>
            <div><span className="font-medium">Roll No:</span> {user?.rollNumber || 'STUDENT'}</div>
            <div><span className="font-medium">Email:</span> {user?.collegeEmail || user?.email || 'student@campus.edu'}</div>
            <div><span className="font-medium">Phone:</span> {user?.phone || '9876543210'}</div>
          </div>
        </div>
      </motion.div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-8 perspective-1000">
        <motion.div variants={itemVariants}>
          <Link to="/create-lost" className="group block h-full">
            <motion.div 
              whileHover={{ scale: 1.03, rotateY: 5, rotateX: 5, z: 40, boxShadow: "0 25px 50px -12px rgba(125, 18, 52, 0.25)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white/80 backdrop-blur-xl h-full p-10 rounded-[2rem] shadow-lg border border-white/60 hover:border-campus-300 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-campus-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <motion.div 
                className="absolute -right-10 -bottom-10 w-48 h-48 bg-campus-200/30 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <div>
                <div className="text-sm font-bold text-campus-800 tracking-wider uppercase mb-3">I lost something</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Report something<br />you cannot find.</h2>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <span className="text-campus-600 font-medium group-hover:text-campus-800 transition-colors flex items-center gap-2">
                  Report Lost <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="w-12 h-12 rounded-full bg-campus-50 text-campus-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-campus-100 transition-all">
                  <Search className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/create-found" className="group block h-full">
            <motion.div 
              whileHover={{ scale: 1.03, rotateY: -5, rotateX: 5, z: 40, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.25)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white/80 backdrop-blur-xl h-full p-10 rounded-[2rem] shadow-lg border border-white/60 hover:border-emerald-300 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <motion.div 
                className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-200/30 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              
              <div>
                <div className="text-sm font-bold text-emerald-600 tracking-wider uppercase mb-3">I found something</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Help return an item<br />to its owner.</h2>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <span className="text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                  Report Found <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                  <PlusCircle className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Quick Stats / Overview */}
      <div className="grid md:grid-cols-3 gap-6 perspective-1000">
        
        {/* Card 1 */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05, rotateY: 2, rotateX: 2, z: 20 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-900">My Active Reports</h3>
            </div>
            <p className="text-slate-500 text-sm mb-4">You have 1 active report.</p>
            <Link to="/my-reports" className="text-sm font-medium text-campus-800 hover:text-campus-900 inline-flex items-center gap-1 group/link">
              View reports <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05, rotateY: 0, rotateX: 2, z: 20 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-900">Possible Matches</h3>
            </div>
            <p className="text-slate-500 text-sm mb-4">1 possible match found.</p>
            <Link to="/notifications" className="text-sm font-medium text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 group/link">
              Review matches <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.05, rotateY: -2, rotateX: 2, z: 20 }} transition={{ type: "spring", stiffness: 300 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-slate-900">Recently Resolved</h3>
            </div>
            <div className="space-y-3">
              <p className="text-slate-500 text-sm">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mr-1 shadow-sm">AI Match</span>
                1 item auto-resolved recently.
              </p>
              <Link to="/my-reports" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group/link">
                View details <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}
