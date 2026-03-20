import { useState, useEffect } from 'react';
import { getHandicaps, getRounds, deleteRound, updateRound, getUser } from '../api';
import { Trophy, History, TrendingUp, Trash2, Edit2, X, Check } from 'lucide-react';

const Dashboard = () => {
  const [handicaps, setHandicaps] = useState<any[]>([]);
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Edit State
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState('');
  const [editAdjusted, setEditAdjusted] = useState('');

  const fetchData = async () => {
    try {
      const { data: { user } } = await getUser();
      setCurrentUserId(user?.id || null);

      const [handicapsRes, roundsRes] = await Promise.all([getHandicaps(), getRounds()]);
      setHandicaps(handicapsRes.data || []);
      setRecentRounds(roundsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this round?')) return;
    try {
      await deleteRound(id);
      fetchData();
    } catch (error) {
      alert('Failed to delete round');
    }
  };

  const startEdit = (round: any) => {
    setEditingRoundId(round.id);
    setEditScore(round.gross_score.toString());
    setEditAdjusted(round.adjusted_gross_score.toString());
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateRound(id, {
        gross_score: parseInt(editScore),
        adjusted_gross_score: parseInt(editAdjusted)
      });
      setEditingRoundId(null);
      fetchData();
    } catch (error) {
      alert('Failed to update round');
    }
  };

  if (loading) return (
    <div className="p-8 text-center flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Handicap Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {handicaps.map(h => (
          <div key={h.golfer_id} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 flex justify-between items-center transform transition hover:scale-102">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Handicap Index</p>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">{h.profile?.name || 'Anonymous'}</h3>
            </div>
            <div className="text-4xl font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              {h.handicap_index !== null ? h.handicap_index : '--'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Rounds - Larger column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
            <History className="mr-2 text-blue-500" /> All Activity
          </h2>
          <div className="space-y-4">
            {recentRounds.map(round => (
              <div key={round.id} className="group flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 transition hover:bg-white hover:shadow-md">
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
                  {editingRoundId === round.id ? (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number" 
                        value={editScore} 
                        onChange={e => setEditScore(e.target.value)}
                        className="w-16 p-1 border rounded text-center font-bold"
                      />
                      <button onClick={() => handleUpdate(round.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={18}/></button>
                      <button onClick={() => setEditingRoundId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900 leading-none">{round.gross_score}</div>
                      <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {round.differential || '--'}</div>
                    </div>
                  )}

                  {/* Actions for current user's rounds */}
                  {round.golfer_id === currentUserId && editingRoundId !== round.id && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => startEdit(round)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(round.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {recentRounds.length === 0 && (
              <p className="text-center text-gray-400 py-8 italic font-medium">No activity to show.</p>
            )}
          </div>
        </div>

        {/* Stats / Info - Smaller column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-6 flex items-center tracking-tight">
                <TrendingUp className="mr-2" /> WHS System
              </h2>
              <div className="space-y-6 text-blue-100 text-sm leading-relaxed">
                <p>Calculated using the official **World Handicap System (WHS)** formula.</p>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl font-mono text-xs border border-white/10 shadow-inner">
                  Diff = (113 / Slope) * (Score - Rating)
                </div>
                <p>Your index is the average of your <strong>best 8 differentials</strong> out of your <strong>last 20 rounds</strong>.</p>
              </div>
            </div>
            <Trophy size={160} className="absolute -bottom-10 -right-10 text-white/5 transform -rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
