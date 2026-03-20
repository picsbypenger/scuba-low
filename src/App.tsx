import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import CourseManager from './components/CourseManager';
import AddRoundForm from './components/AddRoundForm';
import Auth from './components/Auth';
import { Trophy, Map, PlusCircle, LayoutDashboard, LogOut, User } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!session) return <Auth />;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Navigation */}
        <nav className="bg-white shadow-md border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <Trophy className="h-8 w-8 text-blue-600 mr-2" />
                  <span className="text-xl font-black text-gray-900 tracking-tighter">GOLF<span className="text-blue-600">HANDICAP</span></span>
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => 
                      `inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    <LayoutDashboard size={18} className="mr-1" /> Dashboard
                  </NavLink>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => 
                      `inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    <User size={18} className="mr-1" /> Profile
                  </NavLink>
                  <NavLink 
                    to="/courses" 
                    className={({ isActive }) => 
                      `inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  >
                    <Map size={18} className="mr-1" /> Courses
                  </NavLink>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/add-round"
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center hover:bg-blue-700 transition transform hover:scale-105"
                >
                  <PlusCircle size={18} className="mr-1" /> New Round
                </Link>
                <div className="h-8 w-px bg-gray-200" />
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-gray-500 hover:text-red-600 transition p-2"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileManager />} />
            <Route path="/courses" element={<CourseManager />} />
            <Route path="/add-round" element={<AddRoundForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-t py-4 text-center text-gray-400 text-xs">
          © {new Date().getFullYear()} Golf Handicap Tracker • Built with React & Supabase
        </footer>
      </div>
    </Router>
  );
}

export default App;
