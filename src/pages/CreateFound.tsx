import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ShieldAlert, Loader2, Upload } from 'lucide-react';
import type { Location, ItemCategory } from '../types';

export default function CreateFound() {
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
    contactMethod: 'in-app' as 'in-app' | 'phone' | 'email',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await api.createFoundItem(formData, imageFile || undefined);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Found Item</h1>
        <p className="text-slate-500">Thank you for helping return this item to its rightful owner.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
              <input required type="text" className="input-field" placeholder="e.g. Black HP Laptop Charger"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Found</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Found</label>
              <input required type="date" className="input-field" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea required rows={4} className="input-field resize-none" placeholder="Provide general details. Don't reveal specific private identifying marks so the owner can use them to verify."
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

          <div className="bg-campus-50 border border-campus-200 rounded-xl p-5 mt-8">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-campus-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <h3 className="font-semibold text-campus-900 mb-1">Preferred Contact Method</h3>
                <p className="text-sm text-campus-700 mb-4">
                  🔒 Your contact information remains private. It will only be shared with a verified potential owner through the secure contact flow.
                </p>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white/50">
                    <input type="radio" name="contact" className="text-campus-600 focus:ring-campus-500" 
                      checked={formData.contactMethod === 'in-app'} onChange={() => setFormData({...formData, contactMethod: 'in-app'})} />
                    <span className="text-sm font-medium text-slate-700">In-app Notification (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white/50">
                    <input type="radio" name="contact" className="text-campus-600 focus:ring-campus-500" 
                      checked={formData.contactMethod === 'phone'} onChange={() => setFormData({...formData, contactMethod: 'phone'})} />
                    <span className="text-sm font-medium text-slate-700">Phone ({user?.phone})</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white transition-colors bg-white/50">
                    <input type="radio" name="contact" className="text-campus-600 focus:ring-campus-500" 
                      checked={formData.contactMethod === 'email'} onChange={() => setFormData({...formData, contactMethod: 'email'})} />
                    <span className="text-sm font-medium text-slate-700">Email ({user?.email})</span>
                  </label>
                </div>
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
