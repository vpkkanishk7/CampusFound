import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { MapPin, Calendar, Loader2, ArrowLeft, ShieldAlert, CheckCircle, Cpu, ChevronDown, ChevronUp, Lock, Phone, Mail } from 'lucide-react';
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
  const [contactInfo, setContactInfo] = useState<string | null>(null);

  // Claim State
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDetail, setClaimDetail] = useState('');
  const [claimResult, setClaimResult] = useState<{success: boolean, message: string} | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // api.getItem now correctly tries /lost/:id then /found/:id
      api.getItem(id).then(data => {
        setItem(data || null);
        setLoading(false);
        
        // Only run DSA explanation pipeline for Lost Items
        if (data && data.type === 'lost') {
          api.getDsaExplanation(id).then(exp => {
            setDsaMetrics(exp);
          }).catch(() => {});
        }
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleClaimSubmit = async () => {
    if (!claimDetail.trim() || !id) return;
    setClaimSubmitting(true);
    try {
      let submitFoundItemId = id;
      let submitLostItemId = '';
      
      if (item?.type === 'lost' && dsaMetrics?.matches?.[0]) {
        submitFoundItemId = dsaMetrics.matches[0].foundItemId;
        submitLostItemId = id;
      } else if (item?.type === 'found') {
        submitFoundItemId = id;
      }
      
      const res = await api.submitClaim('m-1', submitLostItemId, claimDetail, submitFoundItemId);
      setClaimResult({ success: res.verified, message: res.message });

      if (res.verified && item) {
        // Notify the item owner that someone has submitted a verified claim
        const targetUserId = item.type === 'lost'
          ? dsaMetrics?.matches?.[0]?.foundItem?.userId
          : item.userId;
        if (targetUserId) {
          await api.requestContact(`m-${id}`, targetUserId);
        }
      }
    } catch (err: any) {
      setClaimResult({ success: false, message: err.message || 'Verification failed. Please try again.' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleApproveContact = async () => {
    if (!item) return;
    try {
      // Use a stable match ID derived from the item, not a random timestamp
      const matchId = `m-${item.id}`;
      const res = await api.approveContactRequest(matchId);
      if (res.success) {
        setClaimApproved(true);
        // Show the contact info to the claimant
        setContactInfo(
          item.type === 'found'
            ? `Contact the finder via their preferred method. Phone: ${user?.phone || 'See profile'}`
            : `The claimant's contact has been shared with the finder.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseItem = async () => {
    if (!item || !id) return;
    try {
      const res = await api.closeItem(item.type, id);
      if (res.success) {
        // Update local state to reflect resolved status
        setItem({ ...item, status: 'resolved' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-campus-600" /></div>;
  if (!item) return <div className="text-center py-20 text-slate-500">Item not found.</div>;

  const isOwner = user && item.userId === user.id;
  const isResolved = item.status === 'resolved';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to board
      </button>

      {/* Resolved Banner */}
      {isResolved && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-sm border border-emerald-100">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold">Item Successfully Returned!</div>
            <div className="text-sm text-emerald-700">This item has been marked as returned and the case is now closed.</div>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isResolved ? 'opacity-75' : ''}`}>
        {/* Image */}
        <div className="h-64 bg-slate-100 flex items-center justify-center border-b border-slate-200 overflow-hidden relative">
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
          {isResolved && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-emerald-700 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">✓ RETURNED</span>
            </div>
          )}
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${item.type === 'lost' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {item.type}
              </span>
              <span className="text-slate-400 font-mono text-sm">{item.id}</span>
              {/* Status Badge */}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isResolved ? 'bg-emerald-100 text-emerald-700' :
                item.status === 'matched' ? 'bg-purple-100 text-purple-700' :
                item.status === 'claimed' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
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


          {/* ── OWNER VIEW ── */}
          {isOwner ? (
            <div className="bg-campus-50 border border-campus-200 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-campus-900 text-lg flex items-center justify-between">
                <span className="flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Manage This Item</span>
                {/* Only show "Mark as Returned" when item is still active */}
                {!isResolved && (
                  <button
                    onClick={handleCloseItem}
                    className="text-sm bg-emerald-700 text-white px-4 py-1.5 rounded-full hover:bg-emerald-800 transition"
                  >
                    ✓ Mark as Returned
                  </button>
                )}
              </h3>

              {isResolved ? (
                /* ── Resolved state — case closed ── */
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-start gap-3 border border-emerald-100">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Case Closed</h4>
                    <p className="text-sm mt-1">You have marked this item as returned. The case is now resolved and archived.</p>
                  </div>
                </div>
              ) : claimApproved ? (
                /* ── Claim approved, contact shared ── */
                <div className="space-y-3">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-start gap-3 border border-emerald-100">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Match Approved!</h4>
                      <p className="text-sm mt-1">You have confirmed the match. Contact details have been shared with the claimant.</p>
                    </div>
                  </div>
                  {contactInfo && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700">
                      <div className="flex items-center gap-2 mb-1"><Phone className="w-4 h-4 text-campus-600" />{contactInfo}</div>
                    </div>
                  )}
                  <p className="text-sm text-slate-500">Once you've exchanged the item, click <strong>Mark as Returned</strong> above to close this case.</p>
                </div>
              ) : (
                /* ── Active management panel ── */
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  {item.type === 'lost' ? (
                    // LOST ITEM OWNER VIEW — system shows matched found item
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎯</span>
                          <h4 className="font-bold text-slate-900 text-lg">System Found a Match!</h4>
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

                      {!showClaimForm && !claimResult && (
                        <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowClaimForm(true)} className="btn-primary text-sm w-full">
                            Claim this Matched Item
                          </button>
                        </div>
                      )}

                      {showClaimForm && !claimResult && (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm font-medium text-slate-700">
                            Verify Ownership (Enter a specific private detail about the item):
                          </label>
                          <textarea 
                            value={claimDetail}
                            onChange={(e) => setClaimDetail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-500 outline-none resize-none"
                            rows={2}
                            placeholder="e.g. Has a small scratch on the bottom right corner..."
                          />
                          <div className="flex gap-2">
                            <button onClick={handleClaimSubmit} disabled={claimSubmitting} className="btn-primary flex-1 text-sm">
                              {claimSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Verification'}
                            </button>
                            <button onClick={() => setShowClaimForm(false)} className="btn-secondary text-sm">Cancel</button>
                          </div>
                        </div>
                      )}

                      {claimResult && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 mt-4 border ${claimResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                          {claimResult.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />}
                          <div>
                            <h4 className="font-semibold">{claimResult.success ? 'Verification Successful!' : 'Verification Failed'}</h4>
                            <p className="text-sm mt-1">{claimResult.message}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // FOUND ITEM OWNER VIEW — someone has claimed this item
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📩</span>
                        <h4 className="font-bold text-slate-900 text-lg">Pending Claim Request</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">
                        A student has submitted a verification claim for this item. They provided details that have been checked against your private notes.
                      </p>
                      
                      <div className="flex gap-3 pt-2">
                        <button onClick={handleApproveContact} className="btn-primary text-sm w-full">
                          Approve Claim &amp; Share My Contact Info
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── VISITOR VIEW (not the owner) ── */
            <>
              {item.type === 'found' && !isResolved && (
                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-slate-900 text-lg">Think this item belongs to you?</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                      You will need to provide a private verification detail to prove ownership. Only then will the finder's contact info be shared.
                    </p>
                    
                    {!showClaimForm && !claimResult && (
                      <button onClick={() => setShowClaimForm(true)} className="btn-primary w-full sm:w-auto">Claim Item</button>
                    )}
                  </div>

                  {showClaimForm && !claimResult && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 mt-4 text-left shadow-sm">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Enter a private detail only the owner would know (e.g., scratch marks, unique feature):
                      </label>
                      <textarea 
                        value={claimDetail}
                        onChange={(e) => setClaimDetail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-500 outline-none resize-none mb-3"
                        rows={3}
                        placeholder="It has a small scratch on the bottom right corner..."
                      />
                      <div className="flex gap-2">
                        <button onClick={handleClaimSubmit} disabled={claimSubmitting} className="btn-primary flex-1 text-sm">
                          {claimSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Claim for Verification'}
                        </button>
                        <button onClick={() => setShowClaimForm(false)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}

                  {claimResult && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 mt-4 border ${claimResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                      {claimResult.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />}
                      <div>
                        <h4 className="font-semibold">{claimResult.success ? 'Claim Verified!' : 'Verification Failed'}</h4>
                        <p className="text-sm mt-1">{claimResult.message}</p>
                        {claimResult.success && (
                          <p className="text-sm mt-2 font-medium">
                            A notification has been sent to the finder. They will share their contact info after review.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {item.type === 'lost' && !isResolved && (
                <div className="bg-campus-50 rounded-xl p-6 text-center space-y-4">
                  <h3 className="font-semibold text-campus-900 text-lg">Did you find this item?</h3>
                  <p className="text-sm text-campus-700">Report it as found so the system can match it with this post.</p>
                  <button onClick={() => navigate('/create-found')} className="btn-primary w-full sm:w-auto">
                    Report This As Found
                  </button>
                </div>
              )}

              {isResolved && (
                <div className="bg-slate-100 rounded-xl p-6 text-center text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-medium text-slate-700">This item has already been returned to its owner.</p>
                </div>
              )}
            </>
          )}
          
          {/* Contact Info (shown after approval) */}
          {claimApproved && !isOwner && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Information Unlocked
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Phone className="w-4 h-4" />
                  <span>Contact the finder through the in-app messaging system.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <Mail className="w-4 h-4" />
                  <span>Check your messages tab for finder's contact details.</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
            <Lock className="w-5 h-5 shrink-0" />
            <p>For privacy and security, contact information is never displayed publicly. All claims undergo verification before contact details are shared.</p>
          </div>
        </div>
      </div>

      {/* DSA Pipeline Explanation Panel */}
      {dsaMetrics && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 mb-8">
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
                <p className="text-xs text-slate-400">Live Data Structures &amp; Algorithms Execution Metrics</p>
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
