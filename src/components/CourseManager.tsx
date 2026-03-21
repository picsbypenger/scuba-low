import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCourses, createCourse, createTee } from '../api';
import { MapPin, Plus, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

const CourseManager = () => {
 const navigate = useNavigate();
 const [courses, setCourses] = useState<any[]>([]);
 const [newCourseName, setNewCourseName] = useState('');
 const [newCourseLocation, setNewCourseLocation] = useState('');
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const location = useLocation();
 const state = location.state as { courseId?: number } | null;
 const [selectedCourseId, setSelectedCourseId] = useState<number | null>(state?.courseId || null);
 const [showAddCourse, setShowAddCourse] = useState(false);

 // New Tee form
 const [teeColor, setTeeColor] = useState('');
 const [teeRating, setTeeRating] = useState('');
 const [teeSlope, setTeeSlope] = useState('');
 const [teePar, setTeePar] = useState('72');
 const teeColorRef = useRef<HTMLInputElement | null>(null);
 const panelRef = useRef<HTMLDivElement | null>(null);

 const fetchCourses = async () => {
 try {
 const response = await getCourses();
 const rawData = response.data || [];
 const sortedData = [...rawData].sort((a: any, b: any) => {
   const normalize = (name: string) => {
     let n = (name || '').trim().toLowerCase();
     return n.startsWith('the ') ? n.substring(4).trim() : n;
   };
   return normalize(a.name).localeCompare(normalize(b.name));
 });
 setCourses(sortedData);
 } catch (error) {
 console.error('Error fetching courses:', error);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchCourses();
 }, []);

 useEffect(() => {
 if (selectedCourseId) {
 // small delay to ensure element is mounted
 setTimeout(() => {
 teeColorRef.current?.focus();
 }, 50);
 }
 }, [selectedCourseId]);

 // Scroll panel into view on small screens when a course is selected
 useEffect(() => {
 if (selectedCourseId && panelRef.current) {
 const smallScreen = window.innerWidth < 1024; // tailwind lg breakpoint
 if (smallScreen) {
 panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 }
 }, [selectedCourseId]);

 // Filter courses when user types in the search box or the create inputs
 const activeFilter = (newCourseName || newCourseLocation).trim().toLowerCase();
 const filteredCourses = activeFilter
 ? courses.filter(c => {
 const name = (c.name || '').toLowerCase();
 const loc = (c.location || '').toLowerCase();
 return name.includes(activeFilter) || loc.includes(activeFilter);
 })
 : courses;

 const displayedCourses = selectedCourseId ? filteredCourses.filter(c => c.id === selectedCourseId) : filteredCourses;

 const handleCreateCourse = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCourseName.trim()) return;

 setSubmitting(true);
 try {
 const res: any = await createCourse(newCourseName, newCourseLocation);
 const created = res.data || res; // support different shapes
 await fetchCourses();
 if (created && created.id) {
 setSelectedCourseId(created.id);
 setShowAddCourse(false);
 }
 setNewCourseName('');
 setNewCourseLocation('');
 toast.success('Course added! You can now add tees.');
 } catch (error: any) {
 toast.error(error.message || 'Failed to create course');
 } finally {
 setSubmitting(false);
 }
 };

 const handleCreateTee = async (e: React.FormEvent) => {
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
 await fetchCourses();
 toast.success('Tee set added!');
 } catch (error) {
 console.error('Error creating tee:', error);
 toast.error('Failed to create tee set');
 }
 };

 return (
 <div className="space-y-6">
 <div className="bg-white p-8 rounded-2xl border border-gray-100">
 <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
 <MapPin className="mr-3 text-blue-600" size={28} /> Golf Courses
 </h2>
 <div className="mb-6">
 <form onSubmit={handleCreateCourse} className="flex flex-col sm:flex-row gap-3 w-full">
 <input
 type="text"
 value={newCourseName}
 onChange={(e) => setNewCourseName(e.target.value)}
 placeholder="Course Name"
 className={`flex-1 w-full sm:min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${selectedCourseId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
 required
 disabled={Boolean(selectedCourseId)}
 />
 <input
 type="text"
 value={newCourseLocation}
 onChange={(e) => setNewCourseLocation(e.target.value)}
 placeholder="Location (City, ST)"
 className={`flex-1 w-full sm:min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${selectedCourseId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
 disabled={Boolean(selectedCourseId)}
 />
 <button
 type="submit"
 disabled={submitting || Boolean(selectedCourseId)}
 className={`w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 rounded-xl sm:rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${selectedCourseId ? 'cursor-not-allowed' : ''}`}
 >
 {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" /> : 'Add'}
 </button>
 </form>
 </div>

 {loading ? (
 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" onClick={() => setShowAddCourse(false)}>
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
 </div>
 ) : (
 <>
 {showAddCourse && (
 <div className="mb-6 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
 <form onSubmit={handleCreateCourse} className="flex flex-col sm:flex-row flex-wrap gap-4">
 <input
 type="text"
 value={newCourseName}
 onChange={(e) => setNewCourseName(e.target.value)}
 placeholder="Course Name (e.g. Pebble Beach)"
 className={`flex-1 w-full sm:min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${selectedCourseId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
 required
 disabled={Boolean(selectedCourseId)}
 />
 <input
 type="text"
 value={newCourseLocation}
 onChange={(e) => setNewCourseLocation(e.target.value)}
 placeholder="Location (City, State)"
 className={`flex-1 w-full sm:min-w-[200px] p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium ${selectedCourseId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
 disabled={Boolean(selectedCourseId)}
 />
 <button
 type="submit"
 disabled={submitting || Boolean(selectedCourseId)}
 className={`w-full sm:w-auto bg-blue-600 justify-center text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 ${selectedCourseId ? 'opacity-60 cursor-not-allowed' : ''}`}
 >
 {submitting ? (
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
 ) : (
 <>
 <Plus size={18} className="mr-2" /> Add Course
 </>
 )}
 </button>
 </form>
 </div>
 )}

 <div className="flex flex-col lg:flex-row gap-6">
 <div className="flex-1">
 <div className={`grid gap-6 md:grid-cols-2 ${selectedCourseId ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
 {displayedCourses.map((course) => (
 <div
 key={course.id}
 onClick={() => {
 if (course.id === selectedCourseId) {
 setSelectedCourseId(null);
 } else {
 setSelectedCourseId(course.id);
 }
 }}
 className={`cursor-pointer flex flex-col h-full group relative p-6 border-2 rounded-2xl transition-all duration-300 ${selectedCourseId === course.id ? 'border-blue-500 bg-blue-50/30 ' : 'border-gray-100 bg-white hover:border-blue-200 '}`}
 >
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-black text-xl text-gray-900 tracking-tight">{course.name}</h3>
 <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-1">{course.location || 'Unknown location'}</p>
 </div>
 </div>

 <div className="space-y-2 mb-6 text-left">
 {course.tees?.map((tee: any) => (
 <div key={tee.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-gray-50 ">
 <span className="font-black text-gray-700 uppercase">{tee.color}</span>
 <span className="text-gray-500 font-bold">{tee.rating} / {tee.slope} <span className="text-gray-300 mx-1">|</span> Par {tee.par}</span>
 </div>
 ))}
 {(!course.tees || course.tees.length === 0) && <p className="text-xs text-gray-400 italic">No tees defined yet.</p>}
 </div>

 <div className="flex gap-2 w-full mt-auto">
 <button
 onClick={(e) => {
 e.stopPropagation();
 if (course.id === selectedCourseId) {
 setSelectedCourseId(null);
 } else {
 setSelectedCourseId(course.id);
 setShowAddCourse(false);
 }
 }}
 className={`flex-1 py-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition ${selectedCourseId === course.id ? 'bg-rust text-white ' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
 >
 {selectedCourseId === course.id ? 'Close' : 'Add Tee'}
 </button>

 <button
 onClick={(e) => {
 e.stopPropagation();
 navigate('/add-round', { state: { courseId: course.id, courseName: course.name } });
 }}
 className="flex-1 py-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition bg-rust text-white hover:opacity-90 "
 >
 Add Round
 </button>
 </div>
 </div>
 ))}
 </div>
 {filteredCourses.length === 0 && (
 <p className="text-center text-gray-400 italic mt-6">No matching courses found.</p>
 )}
 </div>

 {/* Add Tee panel: right on wide, below on small (panelRef used to scroll on small) */}
 {selectedCourseId && (
 <aside ref={panelRef} className="w-full lg:w-96">
 <div className="bg-white p-6 rounded-2xl border border-gray-100">
 <div className="flex items-center mb-4">
 <Flag className="mr-3 text-blue-600" size={20} />
 <h3 className="text-lg font-black text-gray-900">Add Tee for {courses.find(c => c.id === selectedCourseId)?.name}</h3>
 </div>
 <form onSubmit={handleCreateTee} className="grid grid-cols-1 gap-3">
 <div className="space-y-1">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</label>
 <input
 ref={teeColorRef}
 type="text"
 value={teeColor}
 onChange={(e) => setTeeColor(e.target.value)}
 placeholder=""
 className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
 required
 />
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div className="space-y-1">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</label>
 <input
 type="number"
 step="0.1"
 value={teeRating}
 onChange={(e) => setTeeRating(e.target.value)}
 placeholder=""
 className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
 required
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slope</label>
 <input
 type="number"
 value={teeSlope}
 onChange={(e) => setTeeSlope(e.target.value)}
 placeholder=""
 className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
 required
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Par</label>
 <input
 type="number"
 value={teePar}
 onChange={(e) => setTeePar(e.target.value)}
 placeholder="72"
 className="w-full p-3 border rounded-xl border-gray-300 text-gray-900 font-bold"
 required
 />
 </div>
 </div>
 <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700">Save Tee Set</button>
 </form>
 </div>
 </aside>
 )}
 </div>
 </>
 )}
 </div>


 </div>
 );
};

export default CourseManager;
