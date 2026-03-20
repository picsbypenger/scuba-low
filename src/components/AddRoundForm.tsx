import React, { useState, useEffect } from 'react';
import { getCourses, createRound } from '../api';
import { Calendar, Flag, Hash, Trophy } from 'lucide-react';
// IMPORTANT: Adjust this path to point to your actual Supabase setup file
import { supabase } from '../supabaseClient'; 

const AddRoundForm = ({ onRoundAdded }: { onRoundAdded?: () => void }) => {
  const [courses, setCourses] = useState<any[]>([]);
  
  const [courseId, setCourseId] = useState('');
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teeId || !date || !grossScore) return;

    setSubmitting(true);
    try {
      // 1. Fetch the currently logged-in user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert("You must be logged in to record a round.");
        setSubmitting(false);
        return;
      }

      // 2. Send the full payload including golfer_id
      await createRound({
        golfer_id: user.id,
        tee_id: parseInt(teeId), // Changed from 'tee' to 'tee_id' to match DB
        date,
        gross_score: parseInt(grossScore),
        adjusted_gross_score: parseInt(adjustedScore || grossScore),
      });
      
      // 3. Reset form on success
      setGrossScore('');
      setAdjustedScore('');
      if (onRoundAdded) onRoundAdded();
      alert('Round recorded successfully!');
      
    } catch (error: any) {
      console.error('Error adding round:', error);
      // Added error.message so you can see exactly why it fails if it happens again
      alert(`Failed to record round: ${error?.message || 'Unknown error'}`);
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="mr-3" size={24} />
            <h2 className="text-xl font-black tracking-tight uppercase">Record a Round</h2>
          </div>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">WHS Compliant</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Course</label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setTeeId('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium bg-white appearance-none"
                  required
                >
                  <option value="">Select a Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
                  className={`p-3 border-2 rounded-xl text-sm font-bold transition flex flex-col items-center ${
                    teeId === t.id.toString() 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md transform scale-102' 
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                  }`}
                >
                  <span className="mb-1">{t.color}</span>
                  <span className="text-[10px] font-black opacity-60 uppercase">{t.rating}/{t.slope}</span>
                </button>
              ))}
              {!courseId && (
                <div className="col-span-full py-4 text-center text-gray-400 italic text-sm">
                  Please select a course first
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
                  placeholder="e.g. 82"
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
                  placeholder="Same as gross if unsure"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold text-lg"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Max net double bogey limit</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition shadow-lg transform active:scale-