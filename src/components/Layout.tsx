import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Bell, UserCircle, MessageSquare, LogOut } from 'lucide-react';
import AIChatbot from './AIChatbot';

export default function Layout() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAuthPage && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden shadow-sm bg-white">
                    <img src="/amrita-logo.png" alt="Amrita Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">AmritaFind</span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-campus-800">Vishwa Vidyapeetham</span>
                  </div>
                </Link>
                
                {user && (
                  <nav className="hidden md:ml-8 md:flex md:space-x-8">
                    <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 px-3 py-2 font-medium">Dashboard</Link>
                    <Link to="/lost" className="text-slate-500 hover:text-slate-900 px-3 py-2 font-medium">Missing Registry</Link>
                    <Link to="/found" className="text-slate-500 hover:text-slate-900 px-3 py-2 font-medium">Recovered Archive</Link>
                  </nav>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <Link to="/create-lost" className="hidden sm:flex btn-primary !py-1.5 !px-3 text-sm">
                      + Report Item
                    </Link>
                    <Link to="/messages" className="text-slate-500 hover:text-slate-900 p-2 relative">
                      <MessageSquare className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-campus-600 rounded-full" />
                    </Link>
                    <Link to="/notifications" className="text-slate-500 hover:text-slate-900 p-2">
                      <Bell className="w-5 h-5" />
                    </Link>
                    <div className="relative group">
                      <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 p-2">
                        <UserCircle className="w-6 h-6" />
                      </button>
                      <div className="absolute right-0 w-48 mt-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100">
                        <div className="py-1">
                          <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</Link>
                          <Link to="/my-reports" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">My Reports</Link>
                          <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link to="/login" className="btn-primary !py-1.5">Log In</Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} AmritaFind. Official Amrita Vishwa Vidyapeetham Lost & Found System.</p>
        </div>
      </footer>

      {/* Global AI Floating Chatbot Widget */}
      <AIChatbot />
    </div>
  );
}
