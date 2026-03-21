import { useState, useEffect } from 'react';
import { getHandicaps, getRounds, getUser } from '../api';
import { History, Users } from 'lucide-react';

const Dashboard = () => {
  const [handicaps, setHandicaps] = useState<any[]>([]);
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [profileQuery, setProfileQuery] = useState('');
  const [matchedProfiles, setMatchedProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [profileRounds, setProfileRounds] = useState<any[]>([]);
  const [loadingProfileRounds, setLoadingProfileRounds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rounds' | 'players'>('rounds');

  // Dashboard is read-only for rounds (editing moved to Profile)

  const fetchData = async () => {
    try {
      const { data: { user } } = await getUser();
      setCurrentUserId(user?.id || null);

      const [handicapsRes, roundsRes] = await Promise.all([getHandicaps(), getRounds()]);
      setHandicaps(handicapsRes.data || []);
      // compute differential client-side when backend/view doesn't provide it
      const rounds = (roundsRes.data || []).map((r: any) => {
        const adjusted = r.adjusted_gross_score ?? r.gross_score;
        if (r.tee && r.tee.slope && typeof r.tee.rating === 'number' && typeof adjusted === 'number') {
          const diff = (113 / r.tee.slope) * (adjusted - r.tee.rating);
          return { ...r, differential: Math.round(diff * 10) / 10 };
        }
        return { ...r, differential: null };
      });
      setRecentRounds(rounds.slice(0, 10));
      // initialize matchedProfiles to all handicaps
      setMatchedProfiles((handicapsRes.data || []).slice().sort((a: any, b: any) => (a.profile?.name || '').localeCompare(b.profile?.name || '')));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profileQuery) {
      setMatchedProfiles(handicaps.slice().sort((a: any, b: any) => (a.profile?.name || '').localeCompare(b.profile?.name || '')));
    } else {
      const q = profileQuery.trim().toLowerCase();
      setMatchedProfiles(handicaps.filter(h => (h.profile?.name || '').toLowerCase().includes(q)).slice().sort((a: any, b: any) => (a.profile?.name || '').localeCompare(b.profile?.name || '')));
    }
  }, [profileQuery, handicaps]);

  const handleSelectProfile = async (p: any) => {
    if (selectedProfile?.golfer_id === p.golfer_id) {
      setSelectedProfile(null);
      setProfileRounds([]);
      return;
    }
    setSelectedProfile(p);
    setLoadingProfileRounds(true);
    try {
      const roundsRes = await getRounds(p.golfer_id);
      const rounds = (roundsRes.data || []).map((r: any) => {
        const adjusted = r.adjusted_gross_score ?? r.gross_score;
        if (r.tee && r.tee.slope && typeof r.tee.rating === 'number' && typeof adjusted === 'number') {
          const diff = (113 / r.tee.slope) * (adjusted - r.tee.rating);
          return { ...r, differential: Math.round(diff * 10) / 10 };
        }
        return { ...r, differential: null };
      });
      setProfileRounds(rounds);
    } catch (err) {
      console.error('Error fetching profile rounds', err);
      setProfileRounds([]);
    } finally {
      setLoadingProfileRounds(false);
    }
  };


  if (loading) return (
    <div className="p-8 text-center flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">


      <div className="flex-1 min-h-0 grid lg:grid-cols-3 gap-4">
        {/* Main Column */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-100 flex flex-col flex-1 min-h-0">
          <div className="flex items-center space-x-6 mb-6 border-b border-gray-100 pb-2">
            <h2
              onClick={() => setActiveTab('rounds')}
              className={`text-xl font-black flex items-center tracking-tight cursor-pointer lg:cursor-text lg:text-gray-900 transition ${activeTab === 'rounds' ? 'text-gray-900 border-b-2 border-blue-500 -mb-[10px] pb-[10px]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <History className={`mr-2 ${activeTab === 'rounds' ? 'text-blue-500' : 'text-gray-400'} lg:text-blue-500`} /> Recent Rounds
            </h2>
            <h2
              onClick={() => setActiveTab('players')}
              className={`text-xl font-black flex items-center tracking-tight cursor-pointer lg:hidden transition ${activeTab === 'players' ? 'text-gray-900 border-b-2 border-blue-500 -mb-[10px] pb-[10px]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Users className={`mr-2 ${activeTab === 'players' ? 'text-blue-500' : 'text-gray-400'}`} /> Players
            </h2>
          </div>

          <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'rounds' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar divide-y divide-gray-100">
              {recentRounds.map(round => (
                <div key={round.id} className="group flex justify-between items-center py-3">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-bold text-gray-900">{round.profile?.name || 'Anonymous'}</p>
                      {round.golfer_id === currentUserId && (
                        <span className="ml-2 text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">You</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{round.date} • {round.tee?.course?.name} ({round.tee?.color})</p>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900 leading-none">{round.gross_score}</div>
                      <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {round.differential || '--'}</div>
                    </div>
                  </div>
                </div>
              ))}
              {recentRounds.length === 0 && (
                <p className="text-center text-gray-400 py-8 italic font-medium">No activity to show.</p>
              )}
            </div>
          </div>

          <div className={`flex-1 min-h-0 flex flex-col lg:hidden ${activeTab === 'players' ? 'flex' : 'hidden'}`}>
            {!selectedProfile ? (
              <>
                <input
                  type="search"
                  placeholder="Search by name"
                  value={profileQuery}
                  onChange={(e) => setProfileQuery(e.target.value)}
                  className="w-full p-2.5 mb-2.5 border rounded-lg border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 text-sm"
                />
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar divide-y divide-gray-100">
                  {matchedProfiles.map((h) => (
                    <button key={h.golfer_id} onClick={() => handleSelectProfile(h)} className="w-full text-left py-2.5 bg-white hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-gray-900 truncate">{h.profile?.name || 'Anonymous'}</div>
                          <div className="text-[10px] text-gray-400 truncate">{h.profile?.email || ''}</div>
                        </div>
                        <div className="text-blue-600 font-black text-xs">{h.handicap_index ?? '--'}</div>
                      </div>
                    </button>
                  ))}
                  {matchedProfiles.length === 0 && <p className="text-xs text-gray-400 italic py-4 text-center">No players found.</p>}
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mb-4 flex items-center justify-between shrink-0">
                  <button onClick={() => setSelectedProfile(null)} className="bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-wider flex items-center px-3 py-1.5 rounded-xl transition active:scale-95">
                    <Users className="mr-1.5" size={12} /> All Players
                  </button>
                  <div className="text-right">
                    <div className="font-black text-sm text-gray-900">{selectedProfile.profile?.name}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase">Index: {selectedProfile.handicap_index ?? '--'}</div>
                  </div>
                </div>

                <div className="mt-2 border-t pt-4 flex-1 flex flex-col min-h-0">
                  <h3 className="font-black text-sm text-gray-900 mb-2 shrink-0">Recent rounds</h3>
                  <div className="divide-y divide-gray-100 flex-1 overflow-auto custom-scrollbar">
                    {loadingProfileRounds ? (
                      <div className="py-4 flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /></div>
                    ) : (
                      <>
                        {profileRounds.map(r => (
                          <div key={r.id} className="py-2.5">
                            <div className="flex justify-between items-center gap-2">
                              <div className="text-[11px] font-bold text-gray-900 truncate flex-1">{r.tee?.course?.name || 'Course'}</div>
                              <div className="text-[10px] font-black text-blue-600 shrink-0">Diff: {r.differential ?? '--'}</div>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{r.date} • {r.tee?.color} • Score: {r.gross_score}</div>
                          </div>
                        ))}
                        {profileRounds.length === 0 && <p className="text-xs text-gray-400 italic py-2">No rounds for this player.</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: search other users */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 hidden lg:flex flex-col flex-1 min-h-0">
          <h2 className="text-xl font-black mb-6 flex items-center text-gray-900 tracking-tight border-b border-gray-100 pb-2">
            <Users className="mr-2 text-blue-500" /> Players
          </h2>
          <input
            type="search"
            placeholder="Search by name"
            value={profileQuery}
            onChange={(e) => setProfileQuery(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="space-y-3 overflow-auto custom-scrollbar pr-1 py-1">
              {matchedProfiles.map((h) => (
                <button 
                  key={h.golfer_id} 
                  onClick={() => handleSelectProfile(h)} 
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${selectedProfile?.golfer_id === h.golfer_id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-gray-900 truncate">{h.profile?.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-gray-400 truncate">{h.profile?.email || ''}</div>
                    </div>
                    <div className="text-blue-600 font-black text-sm">{h.handicap_index ?? '--'}</div>
                  </div>
                </button>
              ))}
              {matchedProfiles.length === 0 && <p className="text-xs text-gray-400 italic py-4 text-center">No players found.</p>}
            </div>

            {selectedProfile && (
              <div className="mt-4 border-t pt-4 flex flex-col min-h-0 flex-1">
                <h3 className="font-black text-sm text-gray-900 mb-2 shrink-0">Recent rounds for {selectedProfile.profile?.name}</h3>
                <div className="divide-y divide-gray-100 flex-1 overflow-auto custom-scrollbar">
                  {loadingProfileRounds ? (
                    <div className="py-4 flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /></div>
                  ) : (
                    <>
                      {profileRounds.map(r => (
                        <div key={r.id} className="py-2">
                          <div className="flex justify-between items-center gap-2">
                            <div className="text-[11px] font-bold text-gray-900 truncate flex-1">{r.tee?.course?.name || 'Course'}</div>
                            <div className="text-[10px] font-black text-blue-600 shrink-0">Diff: {r.differential ?? '--'}</div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{r.date} • {r.tee?.color} • Score: {r.gross_score}</div>
                        </div>
                      ))}
                      {profileRounds.length === 0 && <p className="text-xs text-gray-400 italic py-2">No rounds for this player.</p>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
