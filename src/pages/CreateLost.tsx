import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Lock, Loader2, Upload } from 'lucide-react';
import type { Location, ItemCategory } from '../types';

export default function CreateLost() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics' as ItemCategory,
    location: 'Library' as Location,
    date: new Date().toISOString().split('T')[0],
    description: '',
    privateDetails: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Attach userId so the item is properly owned
      await api.createLostItem({ ...formData, userId: user.id }, imageFile || undefined);
      navigate('/my-reports');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Lost Item</h1>
        <p className="text-slate-500">Provide details about what you lost to help us find a match.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Read Only User Info */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Student</label>
              <div className="text-slate-900 font-medium">{user?.fullName}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Roll Number</label>
              <div className="text-slate-900 font-medium">{user?.rollNumber}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
              <input required type="text" className="input-field" placeholder="e.g. Blue Water Bottle"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select className="input-field bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ItemCategory})}>
                  <option value="Electronics">Electronics</option>
                  <option value="ID Cards">ID Cards</option>
                  <option value="Books">Books</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Wallet / Money">Wallet / Money</option>
                  <option value="Keys">Keys</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Documents">Documents</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Lost</label>
                <select className="input-field bg-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value as Location})}>
                  <option value="Library">Library</option>
                  <option value="Canteen">Canteen</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Lab">Lab</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Sports Ground">Sports Ground</option>
                  <option value="Parking Area">Parking Area</option>
                  <option value="Bus Area">Bus Area</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Lost</label>
              <input required type="date" className="input-field" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea required rows={4} className="input-field resize-none" placeholder="Provide any visible details that would help identify it..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image (Optional)</label>
              <label className="mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-campus-400 transition-colors cursor-pointer bg-slate-50 hover:bg-campus-50 relative min-h-[120px]">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }} 
                />
                {imagePreview ? (
                  <div className="text-center space-y-2 pointer-events-none">
                    <img src={imagePreview} alt="Selected Preview" className="h-28 w-auto object-cover rounded-lg mx-auto shadow-sm border border-slate-200" />
                    <p className="text-xs text-emerald-600 font-bold">✓ Image Selected: {imageFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center pointer-events-none">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="text-sm text-slate-600">
                      <span className="text-campus-600 font-medium">Upload a file</span> or drag and drop
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-8">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Private Verification Details</h3>
                <p className="text-sm text-amber-700 mb-3">
                  Only used to verify that you are the rightful owner. These details will <strong>never</strong> appear on the public Lost & Found board.
                </p>
                <textarea required rows={2} className="input-field bg-white border-amber-300 focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Serial number, private note, or specific scratch location..."
                  value={formData.privateDetails} onChange={e => setFormData({...formData, privateDetails: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
