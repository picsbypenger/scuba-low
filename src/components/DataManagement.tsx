import { useState, type ChangeEvent } from 'react';
import { getProfiles, getCourses, getRounds, createCourse, createTee, createRound } from '../api';
import { Database, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase.ts';

const DataManagement = () => {
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const exportData = async () => {
    setStatus({ type: 'loading', message: 'Preparing export...' });
    try {
      const [profilesRes, coursesRes, roundsRes] = await Promise.all([
        getProfiles(),
        getCourses(),
        getRounds(),
      ]);

      const exportObj = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          profiles: profilesRes.data,
          courses: coursesRes.data,
          rounds: roundsRes.data,
        },
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `golf-handicap-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ type: 'error', message: 'Export failed. Check console for details.' });
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'loading', message: 'Importing data (this may take a moment)...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // 1. Fetch the user once before processing the file
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error("You must be logged in to import rounds.");
        }

        const content = JSON.parse(event.target?.result as string);
        const { courses, rounds } = content.data;

        // ID Mapping to maintain relationships
        const teeMap: Record<number, number> = {};

        // 2. Import Courses & Tees
        for (const c of courses) {
          const courseRes = await createCourse(c.name, c.location);
          if (courseRes.error) throw courseRes.error;
          
          for (const t of (c.tees || [])) {
            const teeRes = await createTee(courseRes.data.id, t.color, t.rating, t.slope, t.par);
            if (teeRes.error) throw teeRes.error;
            teeMap[t.id] = teeRes.data.id;
          }
        }

        // 3. Import Rounds (Associated with CURRENT user)
        for (const r of rounds) {
          const newTeeId = teeMap[r.tee_id || r.tee];

          if (newTeeId) {
            await createRound({
              tee: newTeeId,
              date: r.date,
              gross_score: r.gross_score,
              adjusted_gross_score: r.adjusted_gross_score,
            });
          }
        }

        setStatus({ type: 'success', message: `Import complete! Restored ${courses?.length || 0} courses and ${rounds?.length || 0} rounds to your account.` });
      } catch (error: any) {
        console.error('Import failed:', error);
        setStatus({ type: 'error', message: error.message || 'Import failed. Ensure the file is a valid backup JSON.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg mr-4 text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
            <p className="text-gray-500 text-sm">Backup and restore your local golf database</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Export Card */}
          <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 transition group">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <Download size={18} className="mr-2 text-blue-500" /> Export
            </h3>
            <p className="text-sm text-gray-500 mb-4">Download all golfers, courses, and rounds as a JSON file.</p>
            <button
              onClick={exportData}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Download Backup
            </button>
          </div>

          {/* Import Card */}
          <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 transition group relative">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <Upload size={18} className="mr-2 text-green-500" /> Import
            </h3>
            <p className="text-sm text-gray-500 mb-4">Restore courses and rounds from a backup file.</p>
            <label className="block">
              <span className="sr-only">Choose backup file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={status.type === 'loading'}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Status Messages */}
        {status.type !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-start ${
            status.type === 'loading' ? 'bg-blue-50 text-blue-700' :
            status.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {status.type === 'loading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3" />}
            {status.type === 'success' && <CheckCircle2 size={20} className="mr-3 mt-0.5" />}
            {status.type === 'error' && <AlertCircle size={20} className="mr-3 mt-0.5" />}
            <span className="font-medium">{status.message}</span>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Imported rounds will be associated with your current account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;