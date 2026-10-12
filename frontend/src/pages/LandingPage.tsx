import React, { useEffect, useState } from 'react';
import { Plus, Tv, ChevronRight, Sparkles } from 'lucide-react';

interface Season {
  id: number;
  name: string;
  created_at: string;
}

interface LandingPageProps {
  onSelectSeason: (id: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectSeason }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Staffeln vom Backend laden
  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/v1/seasons');
      if (res.ok) {
        const data = await res.json();
        setSeasons(data || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Staffeln:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  // 2. Neue Staffel erstellen
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;

    try {
      const res = await fetch('/api/v1/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSeasonName }),
      });

      if (res.ok) {
        setNewSeasonName('');
        setIsModalOpen(false);
        fetchSeasons(); // Liste neu laden
      }
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
    }
  };

  return (
    <div className="min-h-screen pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">MatchMind</h1>
            <p className="text-xs text-slate-400">AYTO Solver Engine</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 active:bg-indigo-700 text-white p-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Staffel</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verfügbare Staffeln ({seasons.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-900/50 border border-slate-800/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-900/30">
            <Tv className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">Noch keine Staffeln angelegt</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Erstelle deine erste Staffel, um Berechnungen zu starten.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs px-4 py-2 rounded-xl font-medium"
            >
              Staffel anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => (
              <div
                key={season.id}
                onClick={() => onSelectSeason(season.id)}
                className="group relative bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.98] border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {season.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Erstellt am {new Date(season.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="p-2 text-slate-500 group-hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal / Bottom Sheet für "Neue Staffel" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <h3 className="text-lg font-bold text-white mb-1">Neue Staffel anlegen</h3>
            <p className="text-xs text-slate-400 mb-4">Vergib einen eindeutigen Namen für die Staffel.</p>

            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="z.B. AYTO VIP Staffel 4"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!newSeasonName.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};