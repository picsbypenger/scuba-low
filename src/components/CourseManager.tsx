import { useState, useEffect, type FormEvent } from 'react';
import { getCourses, createCourse, createTee } from '../api';
import { MapPin, Plus, Flag } from 'lucide-react';

const CourseManager = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseLocation, setNewCourseLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  
  // New Tee form
  const [teeColor, setTeeColor] = useState('');
  const [teeRating, setTeeRating] = useState('');
  const [teeSlope, setTeeSlope] = useState('');
  const [teePar, setTeePar] = useState('72');

  const fetchCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    try {
      await createCourse(newCourseName, newCourseLocation);
      setNewCourseName('');
      setNewCourseLocation('');
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleCreateTee = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !teeColor || !teeRating || !teeSlope || !teePar) return;
    try {
      await createTee(
        selectedCourseId,
        teeColor,
        parseFloat(teeRating),
        parseInt(teeSlope),
        parseInt(teePar)
      );
      setTeeColor('');
      setTeeRating('');
      setTeeSlope('');
      fetchCourses();
    } catch (error) {
      console.error('Error creating tee:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
          <MapPin className="mr-3 text-blue-600" size={28} /> Golf Courses
        </h2>
        
        <form onSubmit={handleCreateCourse} className="mb-8 flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <input
            type="text"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder="Course Name (e.g. Pebble Beach)"
            className="flex-1 min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          />
          <input
            type="text"
            value={newCourseLocation}
            onChange={(e) => setNewCourseLocation(e.target.value)}
            placeholder="Location"
            className="flex-1 min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition shadow-lg active:scale-95"
          >
            <Plus size={18} className="mr-2" /> Add Course
          </button>
        </form>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className={`group relative p-6 border-2 rounded-2xl transition-all duration-300 ${selectedCourseId === course.id ? 'border-blue-500 bg-blue-50/30 shadow-lg' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl text-gray-900 tracking-tight">{course.name}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-1">{course.location || 'Unknown location'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  {course.tees?.map((tee: any) => (
                    <div key={tee.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gray-50 shadow-sm">
                      <span className="font-black text-gray-700 uppercase">{tee.color}</span>
                      <span className="text-gray-500 font-bold">{tee.rating} / {tee.slope} <span className="text-gray-300 mx-1">|</span> Par {tee.par}</span>
                    </div>
                  ))}
                  {(!course.tees || course.tees.length === 0) && <p className="text-xs text-gray-400 italic">No tees defined yet.</p>}
                </div>

                <button 
                  onClick={() => setSelectedCourseId(course.id === selectedCourseId ? null : course.id)}
                  className={`w-full py-2 rounded-lg text-sm font-black uppercase tracking-widest transition ${selectedCourseId === course.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {selectedCourseId === course.id ? 'Close' : 'Add Tee'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCourseId && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-blue-600 animate-in fade-in slide-in-from-top-4 max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Flag className="mr-3 text-blue-600" size={24} />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Add Tee for {courses.find(c => c.id === selectedCourseId)?.name}</h2>
          </div>
          <form onSubmit={handleCreateTee} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Color</label>
              <input
                type="text"
                value={teeColor}
                onChange={(e) => setTeeColor(e.target.value)}
                placeholder="e.g. Blue"
                className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rating</label>
              <input
                type="number"
                step="0.1"
                value={teeRating}
                onChange={(e) => setTeeRating(e.target.value)}
                placeholder="e.g. 72.1"
                className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slope</label>
              <input
                type="number"
                value={teeSlope}
                onChange={(e) => setTeeSlope(e.target.value)}
                placeholder="e.g. 131"
                className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Par</label>
              <input
                type="number"
                value={teePar}
                onChange={(e) => setTeePar(e.target.value)}
                placeholder="e.g. 72"
                className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
                required
              />
            </div>
            <div className="col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg transform active:scale-98"
              >
                Save Tee Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
