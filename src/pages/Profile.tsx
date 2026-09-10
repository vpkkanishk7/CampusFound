import { useAppContext } from '../context/AppContext';
import { UserCircle, Mail, Phone, Hash, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAppContext();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-500">Manage your personal information and privacy settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-campus-800"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-sm">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <UserCircle className="w-16 h-16" />
              </div>
            </div>
            <button className="btn-secondary text-sm">Edit Profile</button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.fullName}</h2>
              <div className="flex items-center gap-2 mt-1 text-campus-600 bg-campus-50 px-2 py-1 rounded-md inline-flex text-sm font-medium">
                <Shield className="w-4 h-4" /> Verified Student
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="w-4 h-4 text-slate-400" /> {user.collegeEmail || user.email}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Roll Number</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Hash className="w-4 h-4 text-slate-400" /> {user.rollNumber}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Phone className="w-4 h-4 text-slate-400" /> {user.phone}
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Private
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
