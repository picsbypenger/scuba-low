import { useState, useEffect } from 'react';
import { getHandicaps, getRounds } from '../api';
import { Trophy, History, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [handicaps, setHandicaps] = useState<any[]>([]);
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [handicapsRes, roundsRes] = await Promise.all([getHandicaps(), getRounds()]);
      setHandicaps(handicapsRes.data || []);
      setRecentRounds((roundsRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        {handicaps.length === 0 && (
          <div className="col-span-3 p-12 bg-white rounded-xl shadow-inner border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
            <Trophy size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No rounds recorded yet.</h3>
            <p className="text-gray-400 text-sm mt-1">Record a round to see your handicap index appear here!</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Rounds */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
            <History className="mr-2 text-blue-500" /> Recent Rounds
          </h2>
          <div className="space-y-4">
            {recentRounds.map(round => (
              <div key={round.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 transition hover:bg-white hover:shadow-md">
                <div>
                  <p className="font-bold text-gray-900">{round.profile?.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{round.date} • {round.tee?.course?.name} ({round.tee?.color})</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-gray-900 leading-none">{round.gross_score}</div>
                  <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {round.differential || '--'}</div>
                </div>
              </div>
            ))}
            {recentRounds.length === 0 && (
              <p className="text-center text-gray-400 py-8 italic font-medium">No activity to show.</p>
            )}
          </div>
        </div>

        {/* Stats / Info */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-6 flex items-center tracking-tight">
              <TrendingUp className="mr-2" /> WHS Handicap System
            </h2>
            <div className="space-y-6 text-blue-100 text-sm leading-relaxed">
              <p>Your Handicap Index is calculated using the official **World Handicap System (WHS)** formula:</p>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl font-mono text-xs border border-white/10 shadow-inner">
                Score Differential = (113 / Slope Rating) * (Adjusted Gross Score - Course Rating)
              </div>
              <p>The index is the average of your <strong>best 8 differentials</strong> out of your <strong>last 20 rounds</strong>. If you have fewer than 20 rounds, we apply a specific weighted calculation.</p>
              <div className="flex items-center pt-4 border-t border-white/10">
                <div className="p-2 bg-yellow-400/20 rounded-lg mr-3">
                  <Trophy className="text-yellow-400" size={20} />
                </div>
                <span className="font-bold text-white">Keep playing to lower your index!</span>
              </div>
            </div>
          </div>
          {/* Decorative Background Icon */}
          <Trophy size={160} className="absolute -bottom-10 -right-10 text-white/5 transform -rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
