import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { updateProfile, getProfiles, getRounds, updateRound, deleteRound, getCourses, getHandicaps } from '../api';
import { Save, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileManager = () => {
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handicap, setHandicap] = useState<number | null>(null);

  const [rounds, setRounds] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;

      // Profile name
      const profilesRes = await getProfiles();
      const myProfile = (profilesRes.data || []).find((p: any) => p.id === uid);
      if (myProfile) setName(myProfile.name || '');

      // Handicap index for current user
      const handicapsRes = await getHandicaps();
      const myHandicap = (handicapsRes.data || []).find((h: any) => h.golfer_id === uid);
      setHandicap(myHandicap ? myHandicap.handicap_index : null);

      // Rounds for current user
      const roundsRes = await getRounds(uid || undefined);
      const roundsList = (roundsRes.data || []).map((r: any) => {
        const adjusted = r.adjusted_gross_score ?? r.gross_score;
        if (r.tee && r.tee.slope && typeof r.tee.rating === 'number' && typeof adjusted === 'number') {
          const diff = (113 / r.tee.slope) * (adjusted - r.tee.rating);
          return { ...r, differential: Math.round(diff * 10) / 10 };
        }
        return { ...r, differential: null };
      });
      setRounds(roundsList);

      // Courses for editing selections
      const coursesRes = await getCourses();
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const startEdit = (r: any) => {
    setEditingRoundId(r.id);
    setEditData({
      date: r.date,
      course_id: r.tee?.course?.id || null,
      tee_id: r.tee?.id || null,
      gross_score: r.gross_score,
      adjusted_gross_score: r.adjusted_gross_score ?? r.gross_score,
    });
  };

  const cancelEdit = () => {
    setEditingRoundId(null);
    setEditData({});
  };

  const saveRound = async (id: number) => {
    try {
      const payload: any = {
        date: editData.date,
        tee_id: editData.tee_id,
        gross_score: parseInt(editData.gross_score),
        adjusted_gross_score: parseInt(editData.adjusted_gross_score),
      };
      await updateRound(id, payload);
      await fetchData();
      setEditingRoundId(null);
    } catch (error: any) {
      console.error('Failed to update round', error);
      toast.error(error.message || 'Failed to update round');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this round?')) return;
    try {
      await deleteRound(id);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to delete round', error);
      toast.error(error.message || 'Failed to delete round');
    }
  };

  const teesForCourse = (courseId: number | null) => {
    if (!courseId) return [];
    const c = courses.find(c => c.id === courseId);
    return c?.tees || [];
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* My Profile & Handicap */}
      <div className="shrink-0 bg-white p-5 rounded-2xl border border-gray-100">
        <h2 className="text-xl font-black mb-4 flex items-center text-gray-900 tracking-tight">
          My Profile
        </h2>

        <div className="flex flex-col md:flex-row items-end gap-3 w-full">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={!isEditingName}
                className={`w-full p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors ${isEditingName
                  ? 'border border-gray-300 text-gray-900 bg-white'
                  : 'border border-transparent text-gray-900 bg-gray-50'
                  }`}
              />
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition"
                  title="Edit Name"
                >
                  <Edit2 size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving || !name.trim()}
                  onClick={async () => {
                    if (!name.trim()) return;
                    setSaving(true);
                    try {
                      const res = await updateProfile(name);
                      if ((res as any).error) throw (res as any).error;
                      await fetchData();
                      setIsEditingName(false);
                      toast.success('Profile updated!');
                    } catch (error: any) {
                      console.error('Error updating profile:', error);
                      toast.error(error.message || 'Failed to update profile');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition"
                  title="Save Name"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  ) : (
                    <Save size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-32 shrink-0">
            <label className="block text-sm font-black text-gray-700 mb-2">Handicap Index</label>
            <div className="bg-gray-50 p-3 rounded-xl font-black text-center text-blue-700">{handicap !== null ? handicap : '--'}</div>
          </div>
        </div>
      </div>

      {/* My Rounds */}
      <div className="flex flex-col flex-1 min-h-0 bg-white p-5 rounded-2xl border border-gray-100">
        <h2 className="shrink-0 text-xl font-black mb-3 text-gray-900">My Rounds</h2>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar divide-y divide-gray-100">
          {rounds.map(r => (
            <div key={r.id} className="w-full py-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{r.tee?.course?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.date} • {r.tee?.color}</p>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-xl font-black text-gray-900 leading-none">{r.gross_score}</div>
                    <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {r.differential ?? '--'}</div>
                  </div>
                </div>

                {editingRoundId === r.id ? (
                  <div className="mt-4 grid md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                      <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className="p-2 border rounded w-full text-sm font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course</label>
                      <select value={editData.course_id || ''} onChange={e => setEditData({ ...editData, course_id: parseInt(e.target.value), tee_id: null })} className="p-2 border rounded w-full text-sm font-bold">
                        <option value="">Select course</option>
                        {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tee Set</label>
                      <select value={editData.tee_id || ''} onChange={e => setEditData({ ...editData, tee_id: parseInt(e.target.value) })} className="p-2 border rounded w-full text-sm font-bold">
                        <option value="">Select tee</option>
                        {teesForCourse(editData.course_id).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.color} ({t.rating}/{t.slope})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-1/2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross</label>
                        <input type="number" value={editData.gross_score} onChange={e => setEditData({ ...editData, gross_score: e.target.value })} className="p-2 border rounded w-full text-sm font-bold" />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adj</label>
                        <input type="number" value={editData.adjusted_gross_score} onChange={e => setEditData({ ...editData, adjusted_gross_score: e.target.value })} className="p-2 border rounded w-full text-sm font-bold" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="ml-4 flex flex-col items-end space-y-2">
                {editingRoundId === r.id ? (
                  <div className="flex flex-col space-y-1">
                    <button onClick={() => saveRound(r.id)} className="p-2 bg-limegreen hover:bg-limegreen-dark text-white rounded transition"><Check size={16} /></button>
                    <button onClick={cancelEdit} className="p-2 bg-gray-100 rounded"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <button onClick={() => startEdit(r)} className="p-2 bg-blue-50 text-blue-700 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 bg-rust-light text-rust rounded hover:bg-rust hover:text-white transition"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {rounds.length === 0 && (
            <p className="text-center text-gray-400 italic">You have no recorded rounds.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
