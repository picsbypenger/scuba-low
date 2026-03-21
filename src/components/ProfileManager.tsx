import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { updateProfile, getProfiles, getRounds, updateRound, deleteRound, getCourses, getHandicaps } from '../api';
import { Save, Edit2, Filter } from 'lucide-react';
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

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterScoreOp, setFilterScoreOp] = useState<string>('<=');
  const [filterScoreVal, setFilterScoreVal] = useState('');
  const [filterDiffOp, setFilterDiffOp] = useState<string>('<=');
  const [filterDiffVal, setFilterDiffVal] = useState('');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');

  const filteredRounds = rounds.filter(r => {
    if (filterCourse && !r.tee?.course?.name?.toLowerCase().includes(filterCourse.toLowerCase())) return false;
    if (filterLocation && !r.tee?.course?.location?.toLowerCase().includes(filterLocation.toLowerCase())) return false;

    if (filterScoreVal) {
      const s = parseInt(filterScoreVal);
      if (!isNaN(s)) {
        if (filterScoreOp === '<=' && r.gross_score > s) return false;
        if (filterScoreOp === '>=' && r.gross_score < s) return false;
        if (filterScoreOp === '=' && r.gross_score !== s) return false;
      }
    }

    if (filterDiffVal) {
      const d = parseFloat(filterDiffVal);
      if (!isNaN(d) && r.differential !== null) {
        if (filterDiffOp === '<=' && r.differential > d) return false;
        if (filterDiffOp === '>=' && r.differential < d) return false;
        if (filterDiffOp === '=' && r.differential !== d) return false;
      } else if (!isNaN(d) && r.differential === null) {
        return false;
      }
    }

    if (filterDateStart && r.date < filterDateStart) return false;
    if (filterDateEnd && r.date > filterDateEnd) return false;

    return true;
  });

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
    <div className="flex-1 min-h-0 flex flex-col gap-2 w-full max-w-4xl mx-auto">
      {/* My Profile & Handicap */}
      <div className="shrink-0 bg-white px-5 pb-5 pt-4 rounded-2xl border border-gray-100">
        {/* <h2 className="text-xl font-black mb-4 flex items-center text-gray-900 tracking-tight">
          My Profile
        </h2> */}

        <div className="flex flex-col items-start w-full">
          <div className="w-full flex items-center gap-2">
            {!isEditingName ? (
              <>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">{name || 'Anonymous'}</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition shrink-0"
                  title="Edit Name"
                >
                  <Edit2 size={20} />
                </button>
              </>
            ) : (
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  className="w-full p-2 pl-3 border border-gray-200 rounded-xl text-gray-900 bg-white text-xl font-bold shadow-sm ring-2 ring-blue-500/20 focus:outline-none"
                />
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
              </div>
            )}
          </div>

          <div className="mt-1">
            <label className="block text-sm font-black text-blue-700">Handicap Index: {handicap !== null ? handicap : '--'}</label>
          </div>
        </div>
      </div>

      {/* My Rounds */}
      <div className="flex flex-col flex-1 min-h-0 bg-white py-5 pl-5 pr-4 rounded-2xl border border-gray-100">
        <div className="shrink-0 flex justify-between items-center mb-3">
          <h2 className="text-xl font-black text-gray-900">My Rounds</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            title="Filter Rounds"
          >
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="shrink-0 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700">Filter Rounds</h3>
              <button onClick={() => {
                setFilterCourse(''); setFilterLocation(''); setFilterScoreVal(''); setFilterDiffVal(''); setFilterDateStart(''); setFilterDateEnd('');
              }} className="text-xs font-bold text-blue-600 hover:underline">Clear All</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course Name</label>
                <input type="text" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</label>
                <input type="text" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="" />
              </div>

              <div className="flex space-x-2">
                <div className="w-1/3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score</label>
                  <select value={filterScoreOp} onChange={e => setFilterScoreOp(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs appearance-none">
                    <option value="<=">&le;</option>
                    <option value="=">=</option>
                    <option value=">=">&ge;</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-[10px] font-black text-transparent uppercase tracking-widest mb-1">.</label>
                  <input type="number" value={filterScoreVal} onChange={e => setFilterScoreVal(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="##" />
                </div>
              </div>

              <div className="flex space-x-2">
                <div className="w-1/3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Diff</label>
                  <select value={filterDiffOp} onChange={e => setFilterDiffOp(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs appearance-none">
                    <option value="<=">&le;</option>
                    <option value="=">=</option>
                    <option value=">=">&ge;</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-[10px] font-black text-transparent uppercase tracking-widest mb-1">.</label>
                  <input type="number" step="0.1" value={filterDiffVal} onChange={e => setFilterDiffVal(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="##" />
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">End Date</label>
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-xs bg-white "

                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar divide-y divide-gray-100">
          {filteredRounds.map(r => (
            <div key={r.id} className="w-full py-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <p className="font-bold text-gray-900">{r.tee?.course?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.date} • {r.tee?.color}</p>

                  <div className="flex items-center space-x-3 mt-1">
                    {editingRoundId === r.id ? (
                      <>
                        <button onClick={() => saveRound(r.id)} className="text-xs font-regular text-blue-600 hover:text-blue-800 underline underline-offset-2 transition">Save</button>
                        <button onClick={cancelEdit} className="text-xs font-regular text-gray-400 hover:text-gray-700 underline underline-offset-2 transition">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)} className="text-xs font-regular text-gray-400 hover:text-blue-600 underline underline-offset-2 transition">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs font-regular text-gray-400 hover:text-rust underline underline-offset-2 transition">Delete</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-xl font-black text-gray-900 leading-none">{r.gross_score}</div>
                  <div className="text-sm font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-50 rounded">Diff: {r.differential ?? '--'}</div>
                </div>
              </div>

              {editingRoundId === r.id ? (
                <div className="mt-4 grid md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                    <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className="p-2 border rounded w-vw text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course</label>
                    <select value={editData.course_id || ''} onChange={e => setEditData({ ...editData, course_id: parseInt(e.target.value), tee_id: null })} className="p-2 border rounded w-full text-sm font-medium">
                      <option value="">Select course</option>
                      {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tee Set</label>
                    <select value={editData.tee_id || ''} onChange={e => setEditData({ ...editData, tee_id: parseInt(e.target.value) })} className="p-2 border rounded w-full text-sm font-medium">
                      <option value="">Select tee</option>
                      {teesForCourse(editData.course_id).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.color} ({t.rating}/{t.slope})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-1/2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross</label>
                      <input type="number" value={editData.gross_score} onChange={e => setEditData({ ...editData, gross_score: e.target.value })} className="p-2 border rounded w-full text-sm font-medium" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adj</label>
                      <input type="number" value={editData.adjusted_gross_score} onChange={e => setEditData({ ...editData, adjusted_gross_score: e.target.value })} className="p-2 border rounded w-full text-sm font-medium" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {filteredRounds.length === 0 && (
            <p className="text-center text-gray-400 italic py-6">No rounds found matching your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
