import { useState, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { Mail, LogIn, UserPlus, Key } from 'lucide-react';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage({ text: 'Account created successfully! Please check your email to verify your account before signing in.', type: 'success' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setMessage({ text: 'Signed in successfully.', type: 'success' });
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'Authentication failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gray-100 border-b border-gray-200 p-8 text-gray-900 text-center">
                    <img src="/favicon.svg" alt="Scuba Low Logo" className="mx-auto h-16 w-16 mb-4" />
                    <h1 className="text-2xl font-black tracking-tighter">"SCUBA LOW"<br></br> GOLF HANDICAP TRACKER</h1>
                    <p className="text-gray-500 mt-2"></p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <Mail size={16} className="mr-2" /> Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <Key size={16} className="mr-2" /> Password
                            </label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                required
                            />
                        </div>

                        <button
                            disabled={loading}
                            className={`w-full text-white font-bold py-3 rounded-lg transition flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0 ${mode === 'signup' ? 'bg-rust hover:opacity-90' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            ) : (
                                <>
                                    {mode === 'signup' ? <UserPlus size={20} className="mr-2" /> : <LogIn size={20} className="mr-2" />}
                                    {mode === 'signup' ? 'Create account' : 'Sign in'}
                                </>
                            )}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg text-sm text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-sm text-gray-600 hover:text-gray-800">
                            {mode === 'signin' ? 'Create an account' : 'Use email and password to sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
