import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { updateProfile, getProfiles, getRounds, updateRound, deleteRound, getCourses, getHandicaps, getUser } from '../api';
import { User, Save, Trash2, Edit2, X, Check } from 'lucide-react';

const ProfileManager = () => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [handicap, setHandicap] = useState<number | null>(null);

  const [rounds, setRounds] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      setUserId(uid);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await updateProfile(name);
      if ((res as any).error) throw (res as any).error;
      await fetchData();
      alert('Profile updated!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
      alert(error.message || 'Failed to update round');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this round?')) return;
    try {
      await deleteRound(id);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to delete round', error);
      alert(error.message || 'Failed to delete round');
    }
  };

  const teesForCourse = (courseId: number | null) => {
    if (!courseId) return [];
    const c = courses.find(c => c.id === courseId);
    return c?.tees || [];
  };

  return (
    <div className="space-y-8">
      {/* My Profile & Handicap */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
          <User className="mr-3 text-blue-600" size={28} /> My Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Handicap Index</label>
              <div className="bg-gray-50 p-3 rounded-xl font-black text-center text-blue-700">{handicap !== null ? handicap : '--'}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
            >
              {saving ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Save size={16} className="mr-2" /> Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* My Rounds */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black mb-4 text-gray-900">My Rounds</h2>

        <div className="space-y-4">
          {rounds.map(r => (
            <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{r.tee?.course?.name} <span className="text-xs text-gray-500">({r.tee?.color})</span></p>
                    <p className="text-sm text-gray-500">{r.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900">{r.gross_score}</div>
                    <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {r.differential ?? '--'}</div>
                  </div>
                </div>

                {editingRoundId === r.id ? (
                  <div className="mt-4 grid md:grid-cols-4 gap-3">
                    <input type="date" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} className="p-2 border rounded" />
                    <select value={editData.course_id || ''} onChange={e => setEditData({...editData, course_id: parseInt(e.target.value), tee_id: null})} className="p-2 border rounded">
                      <option value="">Select course</option>
                      {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                    <select value={editData.tee_id || ''} onChange={e => setEditData({...editData, tee_id: parseInt(e.target.value)})} className="p-2 border rounded">
                      <option value="">Select tee</option>
                      {teesForCourse(editData.course_id).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.color} ({t.rating}/{t.slope})</option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <input type="number" value={editData.gross_score} onChange={e => setEditData({...editData, gross_score: e.target.value})} className="p-2 border rounded w-full" />
                      <input type="number" value={editData.adjusted_gross_score} onChange={e => setEditData({...editData, adjusted_gross_score: e.target.value})} className="p-2 border rounded w-full" />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="ml-4 flex flex-col items-end space-y-2">
                {editingRoundId === r.id ? (
                  <div className="flex space-x-2">
                    <button onClick={() => saveRound(r.id)} className="p-2 bg-green-600 text-white rounded"><Check size={16} /></button>
                    <button onClick={cancelEdit} className="p-2 bg-gray-100 rounded"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button onClick={() => startEdit(r)} className="p-2 bg-blue-50 text-blue-700 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 bg-red-50 text-red-600 rounded"><Trash2 size={16} /></button>
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
