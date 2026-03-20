import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { updateProfile, getProfiles } from '../api';
import { User, Save, Users } from 'lucide-react';

const ProfileManager = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      const res = await getProfiles();
      const allProfiles = res.data || [];
      setProfiles(allProfiles);
      
      const myProfile = allProfiles.find(p => p.id === user?.id);
      if (myProfile) setName(myProfile.name || '');
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile(name);
      await fetchData();
      alert('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* My Profile Section */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-xl mx-auto">
        <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
          <User className="mr-3 text-blue-600" size={28} /> My Profile
        </h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 p-3 border rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
              >
                {saving ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Save size={18} className="mr-2" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-black mb-6 flex items-center text-gray-900 tracking-tight">
          <Users className="mr-3 text-blue-600" size={28} /> Leaderboard
        </h2>
        
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles.map((profile) => (
                <tr key={profile.id} className={`hover:bg-blue-50/30 transition ${profile.id === userId ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{profile.name || 'Anonymous'}</span>
                    {profile.id === userId && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">You</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && <p className="p-8 text-center text-gray-400 font-medium italic">No players found.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
