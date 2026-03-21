import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCourses, createRound } from '../api';
import { searchCourses } from '../api';
import { Calendar, Hash, Search, ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const AddRoundForm = ({ onRoundAdded }: { onRoundAdded?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { courseId?: number; courseName?: string } | null;

  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(state?.courseName || '');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [courseId, setCourseId] = useState(state?.courseId?.toString() || '');
  const [teeId, setTeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [grossScore, setGrossScore] = useState('');
  const [adjustedScore, setAdjustedScore] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await getCourses();
        setCourses(coursesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Click outside search to close
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Server-side search: query backend when user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return; // keep current list when empty

    const t = setTimeout(async () => {
      try {
        const res = await searchCourses(q);
        setCourses(res.data || []);
      } catch (err) {
        console.error('Search error', err);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCourse = (course: any) => {
    setCourseId(course.id.toString());
    setSearchQuery(course.name);
    setTeeId('');
    setShowSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!teeId) missing.push('Tee');
    if (!date) missing.push('Date');
    if (!grossScore) missing.push('Gross score');
    if (missing.length) {
      toast.error(`Please fill: ${missing.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      await createRound({
        tee: parseInt(teeId),
        date,
        gross_score: parseInt(grossScore),
        adjusted_gross_score: parseInt(adjustedScore || grossScore),
      });

      setGrossScore('');
      setAdjustedScore('');
      if (onRoundAdded) onRoundAdded();
      toast.success('Round recorded successfully!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Error adding round:', error);
      const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      toast.error(`Failed to record round: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === parseInt(courseId));

  if (loading) return (
    <div className="p-12 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Loading courses...</p>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col max-w-2xl w-full mx-auto">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="bg-blue-600 shrink-0 p-4 text-white flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="ml-1 text-xl font-black tracking-tight uppercase">Add Round</h2>
          </div>
          <p className="text-white text-[10px] font-black uppercase tracking-widest">WHS Compliant</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Date Played</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 relative" ref={searchRef}>
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Course Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search course name..."
                  className="w-full pl-10 pr-10 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {showSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCourse(c)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex flex-col transition"
                      >
                        <span className="font-bold text-gray-900">{c.name}</span>
                        <span className="text-xs text-gray-500">{c.location || 'No location'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No courses found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Tee Set</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedCourse?.tees?.map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeeId(t.id.toString())}
                  className={`p-3 border-2 rounded-xl text-sm font-bold transition flex flex-col items-center ${teeId === t.id.toString()
                    ? 'border-blue-600 bg-blue-50 text-blue-700 transform scale-102'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                    }`}
                >
                  <span className="mb-1">{t.color}</span>
                  <span className="text-[10px] font-black opacity-60 uppercase">{t.rating}/{t.slope}</span>
                </button>
              ))}
              {courseId && (!selectedCourse?.tees || selectedCourse.tees.length === 0) && (
                <div className="col-span-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-500 font-medium mb-3 text-sm">No tees available for this course.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/courses', { state: { courseId: selectedCourse?.id } })}
                    className="px-4 py-2 bg-dustyrose text-white rounded-lg font-bold text-sm hover:focus:ring-2 hover:opacity-90 transition flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Configure Tees
                  </button>
                </div>
              )}
              {!courseId && (
                <div className="col-span-full py-4 text-center text-gray-400 italic text-sm">
                  Please search and select a course first
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Gross Score</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={grossScore}
                  onChange={(e) => setGrossScore(e.target.value)}
                  placeholder="Required"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Adjusted Score</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={adjustedScore}
                  onChange={(e) => setAdjustedScore(e.target.value)}
                  placeholder="Optional"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold text-lg"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">(Max net double bogey limit)</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rust text-white font-black py-4 rounded-xl hover:opacity-90 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center uppercase tracking-widest"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              'Save Round'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoundForm;
