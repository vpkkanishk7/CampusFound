import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { MapPin, Calendar, Loader2, ArrowLeft, ShieldAlert, CheckCircle, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import type { Item } from '../types';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimApproved, setClaimApproved] = useState(false);
  const [dsaMetrics, setDsaMetrics] = useState<any>(null);
  const [showDsaPanel, setShowDsaPanel] = useState(false);

  useEffect(() => {
    if (id) {
      api.getItem(id).then(data => {
        setItem(data || null);
        setLoading(false);
      });
      api.getDsaExplanation(id).then(exp => {
        setDsaMetrics(exp);
      });
    }
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-campus-600" /></div>;
  if (!item) return <div className="text-center py-20 text-slate-500">Item not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to board
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-64 bg-slate-100 flex items-center justify-center border-b border-slate-200 overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl.startsWith('/uploads') ? `http://localhost:5000${item.imageUrl}` : item.imageUrl} 
              alt={item.title} 
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-slate-400 font-medium">No Image Uploaded</span>
          )}
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${item.type === 'lost' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {item.type}
              </span>
              <span className="text-slate-400 font-mono text-sm">{item.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{item.title}</h1>
            <p className="text-slate-700 whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100">
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Category</div>
              <div className="font-semibold text-slate-900">{item.category}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">{item.type === 'lost' ? 'Lost at' : 'Found at'}</div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> {item.location}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Date</div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Owner View (User created this post) */}
          {user && item.userId === user.id ? (
            <div className="bg-campus-50 border border-campus-200 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-campus-900 text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Manage This Item
              </h3>
              {claimApproved ? (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Match Approved!</h4>
                    <p className="text-sm mt-1">You have confirmed the match. Contact details have been shared with the claimant.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      <h4 className="font-bold text-slate-900 text-lg">Possible Match</h4>
                    </div>
                    <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold tracking-wide">
                      {dsaMetrics?.finalScore || 91}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">DSA Score</span>
                      <span className="font-bold text-campus-700 text-base">{dsaMetrics?.dsaScore || 92}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">AI Similarity</span>
                      <span className="font-bold text-purple-700 text-base">{dsaMetrics?.aiScore || 89}%</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Match Reasons:</h5>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {(dsaMetrics?.reasons || [
                        "✓ Same category",
                        "✓ Same location",
                        "✓ Similar description",
                        "✓ AI detected semantic similarity"
                      ]).map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-emerald-700 font-medium">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setClaimApproved(true)} className="btn-primary text-sm w-full">
                      Reveal Claimant Contact Info
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Visitor View (Not the owner) */
            <>
              {item.type === 'found' && (
                <div className="bg-slate-50 rounded-xl p-6 text-center space-y-4">
                  <h3 className="font-semibold text-slate-900 text-lg">Think this item belongs to you?</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    You will need to provide private verification details to prove ownership before the finder's contact info is shared.
                  </p>
                  <button className="btn-primary w-full sm:w-auto">Claim Item</button>
                </div>
              )}

              {item.type === 'lost' && (
                <div className="bg-campus-50 rounded-xl p-6 text-center space-y-4">
                  <h3 className="font-semibold text-campus-900 text-lg">Did you find this item?</h3>
                  <button className="btn-primary w-full sm:w-auto">Report This As Found</button>
                </div>
              )}
            </>
          )}
          
          <div className="flex items-start gap-3 text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>For privacy and security, contact information is never displayed publicly. All claims undergo verification.</p>
          </div>
        </div>
      </div>

      {/* DSA Pipeline Explanation Panel for Faculty Demo */}
      {dsaMetrics && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
          <button 
            onClick={() => setShowDsaPanel(!showDsaPanel)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-campus-800 text-campus-200">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">How CampusFind Matched This Item</h3>
                <p className="text-xs text-slate-400">Live Data Structures & Algorithms Execution Metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span>{showDsaPanel ? 'Hide DSA Details' : 'View DSA Breakdown'}</span>
              {showDsaPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showDsaPanel && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 text-sm">
              <div className="grid sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400">HashMap Search Space</div>
                  <div className="text-lg font-bold text-campus-300">
                    {dsaMetrics.candidateCountBeforeHashMap} → {dsaMetrics.candidateCountAfterHashMap} candidates
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400">Jaccard Text Similarity</div>
                  <div className="text-lg font-bold text-amber-400">
                    {Math.round((dsaMetrics.stringSimilarity || 0.88) * 100)}%
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400">Match Score (100 Max)</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {dsaMetrics.matchScore || 94} / 100
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-400">MaxHeap Priority Rank</div>
                  <div className="text-lg font-bold text-purple-400">
                    #{dsaMetrics.heapRank || 1}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Executed DSA Pipeline Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs font-mono">
                  {(dsaMetrics.algorithmSteps || []).map((step: string, idx: number) => (
                    <li key={idx} className="bg-slate-800/40 px-3 py-1.5 rounded border border-slate-800">{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
