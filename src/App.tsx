import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';

import { supabase } from './supabase';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import CourseManager from './components/CourseManager';
import AddRoundForm from './components/AddRoundForm';
import Auth from './components/Auth';
import { FlagTriangleRight, PlusCircle, LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const MobilePageTitle = () => {
    const location = useLocation();
    let title = '';
    switch (location.pathname) {
        case '/': title = 'Dashboard'; break;
        case '/profile': title = 'Profile'; break;
        case '/courses': title = 'Courses'; break;
        case '/add-round': title = 'Add Round'; break;
    }

    return title ? (
        <span className="sm:hidden text-lg font-bold text-gray-900">
            {title}
        </span>
    ) : null;
};

function App() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        // Source - Suggested by USER for clean keyboard-to-content reset
        const handleFocusOut = () => {
            // Short delay to see if another input is being focused (field switching)
            setTimeout(() => {
                const active = document.activeElement;
                const isInput = active && (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    active.getAttribute('contenteditable') === 'true'
                );

                // If no input is focused, reset the viewport to (0,0)
                if (!isInput) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        };

        document.addEventListener('focusout', handleFocusOut);
        return () => document.removeEventListener('focusout', handleFocusOut);
    }, []);

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
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: { background: '#333', color: '#fff' },
                    success: {
                        iconTheme: {
                            primary: '#a7d49b',
                            secondary: '#333',
                        },
                    },
                }}
            />
            <div className="w-full h-[100dvh] bg-gray-100 flex flex-col font-sans overflow-hidden">
                {/* Navigation */}
                <nav className="bg-white shrink-0 z-50">
                    <div className="max-w-7xl mx-auto pl-4 pr-0 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                {/* Mobile menu button on left */}
                                <button
                                    onClick={() => setShowMobileMenu(prev => !prev)}
                                    className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2"
                                    aria-label="Toggle navigation"
                                >
                                    {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                                </button>
                                <MobilePageTitle />
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
                                        <FlagTriangleRight size={18} className="mr-1" /> Courses
                                    </NavLink>
                                    {/* Data tab removed */}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-1 justify-end pr-4 sm:pr-0">
                                <Link
                                    to="/add-round"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="bg-rust text-white px-4 py-2 rounded-full text-sm font-bold flex items-center hover:opacity-90 transition transform hover:scale-105"
                                >
                                    <PlusCircle size={18} className="mr-1" /> Add Round
                                </Link>
                                <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                                <button
                                    onClick={() => supabase.auth.signOut()}
                                    className="hidden sm:inline-flex text-gray-500 hover:text-red-600 transition p-2"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile navigation panel */}
                    {showMobileMenu && (
                        <div className="sm:hidden bg-white">
                            <div className="px-4 pb-4 space-y-1">
                                <NavLink to="/" onClick={() => setShowMobileMenu(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/profile" onClick={() => setShowMobileMenu(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                                    Profile
                                </NavLink>
                                <NavLink to="/courses" onClick={() => setShowMobileMenu(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                                    Courses
                                </NavLink>
                                <Link to="/add-round" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-md text-base font-bold text-rust hover:opacity-80">
                                    Add Round
                                </Link>
                                <button onClick={() => { setShowMobileMenu(false); supabase.auth.signOut(); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Content */}
                <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-2 flex flex-col">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<ProfileManager />} />
                        <Route path="/courses" element={<CourseManager />} />
                        <Route path="/add-round" element={<AddRoundForm />} />
                        {/* Data route removed */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <footer className="shrink-0 bg-gray-100 pb-2 text-center text-gray-400 text-xs">
                    © {new Date().getFullYear()} Golf Handicap Tracker • Bug? Email <a href="mailto:[dryan008@gmail.com]">dryan008@gmail.com</a>
                </footer>
            </div>
        </Router>
    );
}

export default App;
