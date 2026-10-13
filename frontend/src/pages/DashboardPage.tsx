import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Grid, Users, HelpCircle, Moon, Plus,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Sparkles, Trash2
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface DashboardPageProps {
  seasonId: number;
  onBack: () => void;
}

// Backend Response Types
interface Contender {
  id: number;
  season_id: number;
  name: string;
  gender: string;
  joined_night: number;
  is_active: boolean;
}

interface TruthBoothDetail {
  id: number;
  male_id: number;
  female_id: number;
  is_match: boolean;
}

interface MatchingNightPairDetail {
  male_id: number;
  female_id: number;
}

interface MatchingNightDetail {
  id: number;
  night_number: number;
  lights_count: number;
  pairs: MatchingNightPairDetail[];
}

interface SeasonDetail {
  id: number;
  name: string;
  created_at: string;
  men_count: number;
  women_count: number;
  contenders: Contender[];
  truth_booths: TruthBoothDetail[];
  matching_nights: MatchingNightDetail[];
}

interface SolveData {
  season_id: number;
  men_count: number;
  women_count: number;
  remaining_combinations: number;
  men: Contender[];
  women: Contender[];
  probabilities: number[][];
}

type TabType = 'matrix' | 'contenders' | 'truthbooths' | 'matchingnights';

export const DashboardPage: React.FC<DashboardPageProps> = ({ seasonId, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('matrix');
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [solveData, setSolveData] = useState<SolveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);

  // Modals / Modal Controls
  const [modalType, setModalType] = useState<'contender' | 'tb' | 'mn' | null>(null);

  // Form States
  const [contenderName, setContenderName] = useState('');
  const [contenderGender, setContenderGender] = useState<'M' | 'F'>('M');
  const [contenderJoinedNight, setContenderJoinedNight] = useState<number>(1);

  const [tbMaleId, setTbMaleId] = useState<number>(0);
  const [tbFemaleId, setTbFemaleId] = useState<number>(0);
  const [tbIsMatch, setTbIsMatch] = useState<boolean>(false);

  const [mnNightNumber, setMnNightNumber] = useState<number>(1);
  const [mnLightsCount, setMnLightsCount] = useState<number>(0);
  const [mnPairs, setMnPairs] = useState<{ male_id: number; female_id: number }[]>([]);

  // Expanded Accordion state for Matching Nights
  const [openMN, setOpenMN] = useState<number | null>(null);

  // 1. Load only season master data (WITHOUT solver)
  const loadSeasonData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/seasons/${seasonId}`);
      if (res.ok) {
        const sData: SeasonDetail = await res.json();
        setSeason(sData);

        // Fallback IDs for Truth Booth form
        const men = sData.contenders?.filter(c => c.gender === 'M') || [];
        const women = sData.contenders?.filter(c => c.gender === 'F') || [];
        if (men.length > 0) setTbMaleId(men[0].id);
        if (women.length > 0) setTbFemaleId(women[0].id);

        setMnNightNumber((sData.matching_nights?.length || 0) + 1);
      }
    } catch (err) {
      console.error("Error loading season data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Trigger solver manually
  const handleSolve = async () => {
    setSolving(true);
    try {
      const res = await fetch(`/api/v1/seasons/${seasonId}/solve`);
      if (res.ok) {
        const solData: SolveData = await res.json();
        setSolveData(solData);
      }
    } catch (err) {
      console.error("Error during solving:", err);
    } finally {
      setSolving(false);
    }
  };

  useEffect(() => {
    loadSeasonData();
  }, [seasonId]);

  // Handlers for Creating
  const handleAddContender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenderName.trim()) return;

    await fetch(`/api/v1/seasons/${seasonId}/contenders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contenderName, gender: contenderGender, joined_night: Number(contenderJoinedNight) || 1 }),
    });

    setContenderName('');
    setContenderJoinedNight(1);
    setModalType(null);
    loadSeasonData();
  };

  const handleAddTruthBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tbMaleId || !tbFemaleId) return;

    await fetch(`/api/v1/seasons/${seasonId}/truth-booths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ male_id: tbMaleId, female_id: tbFemaleId, is_match: tbIsMatch }),
    });

    setModalType(null);
    loadSeasonData();
  };

  const handleAddMatchingNight = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/v1/seasons/${seasonId}/matching-nights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        night_number: mnNightNumber,
        lights_count: mnLightsCount,
        pairs: mnPairs,
      }),
    });

    setModalType(null);
    setMnPairs([]);
    loadSeasonData();
  };

  // Handlers for Deleting
  const handleDeleteContender = async (id: number, name: string) => {
    if (!confirm(`Möchtest du "${name}" wirklich löschen?`)) return;
    try {
      await fetch(`/api/v1/seasons/${seasonId}/contenders/${id}`, { method: 'DELETE' });
      loadSeasonData();
    } catch (err) {
      console.error("Error deleting contender:", err);
    }
  };

  const handleDeleteTruthBooth = async (id: number) => {
    if (!confirm("Diesen Truth Booth Eintrag wirklich löschen?")) return;
    try {
      await fetch(`/api/v1/seasons/${seasonId}/truth-booths/${id}`, { method: 'DELETE' });
      loadSeasonData();
    } catch (err) {
      console.error("Error deleting truth booth:", err);
    }
  };

  const handleDeleteMatchingNight = async (id: number, nightNumber: number) => {
    if (!confirm(`Matching Night #${nightNumber} wirklich löschen?`)) return;
    try {
      await fetch(`/api/v1/seasons/${seasonId}/matching-nights/${id}`, { method: 'DELETE' });
      loadSeasonData();
    } catch (err) {
      console.error("Error deleting matching night:", err);
    }
  };

  const getContenderName = (id: number) => {
    return season?.contenders?.find(c => c.id === id)?.name || `ID ${id}`;
  };

  if (loading && !season) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Lade Staffel-Daten...</p>
      </div>
    );
  }

  const hasMenAndWomen =
    (season?.contenders?.filter(c => c.gender === 'M').length || 0) > 0 &&
    (season?.contenders?.filter(c => c.gender === 'F').length || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{season?.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${solving ? 'bg-amber-500 animate-ping' : solveData ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              {solving
                ? 'Berechne Matrix...'
                : solveData
                  ? `${solveData.remaining_combinations.toLocaleString('de-DE')} Kombinationen`
                  : 'Berechnung bereit'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => {
              if (activeTab === 'contenders') setModalType('contender');
              else if (activeTab === 'truthbooths') setModalType('tb');
              else setModalType('mn');
            }}
            className="bg-indigo-600 active:bg-indigo-700 text-white p-2.5 rounded-xl flex items-center gap-1 text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Eintrag</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-lg mx-auto space-y-4">

        {/* 1. MATRIX TAB */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Wahrscheinlichkeits-Matrix
              </h2>
              <button
                onClick={handleSolve}
                disabled={solving || !hasMenAndWomen}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                {solving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {solving ? 'Berechne...' : 'Jetzt Berechnen'}
              </button>
            </div>

            {!solveData ? (
              <div className="p-8 text-center bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto mb-3" />
                <p className="text-slate-900 dark:text-slate-200 font-semibold text-sm mb-1">Matrix nicht berechnet</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  {hasMenAndWomen
                    ? 'Klicke auf den Button, um die aktuellen Wahrscheinlichkeiten zu berechnen.'
                    : 'Füge zuerst mindestens einen Mann und eine Frau hinzu.'}
                </p>
                <button
                  onClick={handleSolve}
                  disabled={solving || !hasMenAndWomen}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md"
                >
                  {solving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {solving ? 'Berechne...' : 'Berechnung starten'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Tabelle */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 overflow-x-auto shadow-sm">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-slate-500 font-semibold sticky left-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                          Mann \ Frau
                        </th>
                        {solveData.women.map(w => (
                          <th key={w.id} className="p-2 text-slate-700 dark:text-slate-300 font-semibold text-center border-b border-slate-200 dark:border-slate-800 min-w-[60px]">
                            {w.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {solveData.men.map((m, mIdx) => (
                        <tr key={m.id} className="border-b border-slate-200/60 dark:border-slate-800/50">
                          <td className="p-2 font-medium text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 whitespace-nowrap">
                            {m.name}
                          </td>
                          {solveData.women.map((w, wIdx) => {
                            const prob = solveData.probabilities[mIdx]?.[wIdx] ?? 0;
                            let bg = 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500';
                            if (prob === 100) bg = 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30';
                            else if (prob >= 50) bg = 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold';
                            else if (prob > 0) bg = 'bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300';

                            return (
                              <td key={w.id} className={`p-2 text-center rounded-lg my-0.5 ${bg}`}>
                                {prob.toFixed(0)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. Auswertung: Fixe Matches & Wahrscheinliche Paare (>= 50%) */}
                {(() => {
                  const allPairs: { male: string; female: string; prob: number; source?: string }[] = [];
                  solveData.men.forEach((m, mIdx) => {
                    solveData.women.forEach((w, wIdx) => {
                      const prob = solveData.probabilities[mIdx]?.[wIdx] ?? 0;
                      if (prob > 0) {
                        allPairs.push({ male: m.name, female: w.name, prob, source: 'solver' });
                      }
                    });
                  });

                  // 100% Paare, die der Solver rein durch Logik (z. B. nach Blackout) gefunden hat
                  const solverPerfectMatches = allPairs.filter(p => p.prob === 100);

                  // Bestätigte Paare aus der Matchbox (Truth Booths)
                  const tbPerfectMatches = (season?.truth_booths || [])
                    .filter(tb => tb.is_match)
                    .map(tb => ({
                      male: getContenderName(tb.male_id),
                      female: getContenderName(tb.female_id),
                      prob: 100,
                      source: 'matchbox'
                    }));

                  // Beide Listen kombinieren
                  const perfectMatches = [...tbPerfectMatches, ...solverPerfectMatches];

                  // Nur Paare unter 100% und mindestens 50% Wahrscheinlichkeit aus dem Solver
                  const probableMatches = allPairs
                    .filter(p => p.prob < 100 && p.prob >= 50)
                    .sort((a, b) => b.prob - a.prob);

                  return (
                    <div className="space-y-3 pt-2">
                      {/* A. Fixe Perfect Matches (100%) */}
                      {perfectMatches.length > 0 && (
                        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" /> Bestätigte Perfect Matches (100%)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perfectMatches.map((p, i) => (
                              <div key={i} className="bg-white dark:bg-slate-900/90 border border-emerald-500/40 px-3 py-2 rounded-xl text-xs flex justify-between items-center font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm">
                                <span>{p.male} & {p.female}</span>
                                <div className="flex gap-1.5">
                                  {p.source === 'matchbox' && (
                                    <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px]">Matchbox 🏝️</span>
                                  )}
                                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px]">100%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* B. Wahrscheinlichste Paare (nur >= 50%) */}
                      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2 shadow-sm">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                          Wahrscheinliche Kombinationen (≥ 50%)
                        </span>

                        {probableMatches.length > 0 ? (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {probableMatches.map((p, i) => (
                              <div key={i} className="bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs flex justify-between items-center text-slate-800 dark:text-slate-200">
                                <span className="font-medium">{p.male} & {p.female}</span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  {p.prob.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                            Keine weiteren unbestätigten Kombinationen mit 50 % oder höherer Wahrscheinlichkeit.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 2. KANDIDATEN TAB */}
        {activeTab === 'contenders' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Teilnehmer ({season?.contenders?.length || 0})
              </h2>
              <button
                onClick={() => setModalType('contender')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Männer */}
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-2 shadow-sm">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                  Männer ({season?.contenders?.filter(c => c.gender === 'M').length || 0})
                </span>
                <div className="space-y-1.5">
                  {season?.contenders?.filter(c => c.gender === 'M').map(c => (
                    <div
                      key={c.id}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between group border transition-all ${c.is_active
                        ? 'bg-slate-100/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200'
                        : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 text-rose-700 dark:text-rose-300 opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={!c.is_active ? 'line-through' : ''}>{c.name}</span>

                        {c.joined_night > 1 && c.is_active && (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-semibold">
                            ab Nacht {c.joined_night}
                          </span>
                        )}

                        {!c.is_active && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                            Honeymoon 🏝️
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteContender(c.id, c.name)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frauen */}
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-2 shadow-sm">
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400 block uppercase tracking-wider">
                  Frauen ({season?.contenders?.filter(c => c.gender === 'F').length || 0})
                </span>
                <div className="space-y-1.5">
                  {season?.contenders?.filter(c => c.gender === 'F').map(c => (
                    <div
                      key={c.id}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between group border transition-all ${c.is_active
                        ? 'bg-slate-100/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200'
                        : 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 text-rose-700 dark:text-rose-300 opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={!c.is_active ? 'line-through' : ''}>{c.name}</span>

                        {c.joined_night > 1 && c.is_active && (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-semibold">
                            ab Nacht {c.joined_night}
                          </span>
                        )}

                        {!c.is_active && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                            Honeymoon 🏝️
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteContender(c.id, c.name)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TRUTH BOOTHS TAB */}
        {activeTab === 'truthbooths' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Truth Booths ({season?.truth_booths?.length || 0})
              </h2>
              <button
                onClick={() => setModalType('tb')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            {!season?.truth_booths || season.truth_booths.length === 0 ? (
              <div className="p-8 text-center bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-sm shadow-sm">
                Noch keine Matchbox-Entscheidungen eingetragen.
              </div>
            ) : (
              <div className="space-y-2">
                {season.truth_booths.map((tb, idx) => (
                  <div key={tb.id} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-slate-400 dark:text-slate-500 text-xs">#{idx + 1}</span>
                      <span className="text-slate-900 dark:text-white">{getContenderName(tb.male_id)}</span>
                      <span className="text-slate-400 dark:text-slate-500">&</span>
                      <span className="text-slate-900 dark:text-white">{getContenderName(tb.female_id)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tb.is_match ? (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Match
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> No Match
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteTruthBooth(tb.id)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eintrag löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. MATCHING NIGHTS TAB */}
        {activeTab === 'matchingnights' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matching Nights ({season?.matching_nights?.length || 0})
              </h2>
              <button
                onClick={() => setModalType('mn')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            {!season?.matching_nights || season.matching_nights.length === 0 ? (
              <div className="p-8 text-center bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-sm shadow-sm">
                Noch keine Matching Nights ausgewertet.
              </div>
            ) : (
              <div className="space-y-2">
                {season.matching_nights.map((mn) => {
                  const isOpen = openMN === mn.id;
                  return (
                    <div key={mn.id} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm">
                      <div
                        onClick={() => setOpenMN(isOpen ? null : mn.id)}
                        className="w-full p-4 flex items-center justify-between text-left active:bg-slate-100 dark:active:bg-slate-800/50 cursor-pointer"
                      >
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Matching Night #{mn.night_number}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mn.pairs?.length || 0} Paarungen</p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold">
                            💡 {mn.lights_count} Lichter
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMatchingNight(mn.id, mn.night_number);
                            }}
                            className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Matching Night löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {mn.pairs?.map((p, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex justify-between text-slate-700 dark:text-slate-300">
                              <span>{getContenderName(p.male_id)}</span>
                              <span className="text-slate-400 dark:text-slate-500">&</span>
                              <span>{getContenderName(p.female_id)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL SYSTEM */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            {/* A. Contender Form */}
            {modalType === 'contender' && (
              <form onSubmit={handleAddContender} className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Teilnehmer hinzufügen</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={contenderName}
                  onChange={e => setContenderName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 placeholder-slate-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContenderGender('M')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${contenderGender === 'M' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'}`}
                  >
                    Mann
                  </button>
                  <button
                    type="button"
                    onClick={() => setContenderGender('F')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${contenderGender === 'F' ? 'bg-pink-600 text-white border-pink-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'}`}
                  >
                    Frau
                  </button>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Dabei ab Matching Night Nr.</label>
                  <input
                    type="number"
                    min={1}
                    value={contenderJoinedNight}
                    onChange={e => setContenderJoinedNight(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

            {/* B. Truth Booth Form */}
            {modalType === 'tb' && (
              <form onSubmit={handleAddTruthBooth} className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Truth Booth eintragen</h3>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">Mann</label>
                  <select
                    value={tbMaleId}
                    onChange={e => setTbMaleId(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    {season?.contenders?.filter(c => c.gender === 'M').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  <label className="text-xs text-slate-500 dark:text-slate-400 block pt-2">Frau</label>
                  <select
                    value={tbFemaleId}
                    onChange={e => setTbFemaleId(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    {season?.contenders?.filter(c => c.gender === 'F').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTbIsMatch(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${tbIsMatch ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'}`}
                  >
                    Match 🟢
                  </button>
                  <button
                    type="button"
                    onClick={() => setTbIsMatch(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${!tbIsMatch ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'}`}
                  >
                    No Match 🔴
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

            {/* C. Matching Night Form */}
            {modalType === 'mn' && (
              <form onSubmit={handleAddMatchingNight} className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Matching Night eintragen</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Nacht Nr.</label>
                    <input
                      type="number"
                      value={mnNightNumber}
                      onChange={e => setMnNightNumber(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Lichter</label>
                    <input
                      type="number"
                      value={mnLightsCount}
                      onChange={e => setMnLightsCount(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">Paarungen auswählen:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {season?.contenders?.filter(c => c.gender === 'M' && c.is_active).map(m => {
                    const currentPair = mnPairs.find(p => p.male_id === m.id);
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="w-1/3 text-slate-700 dark:text-slate-300 font-medium truncate">{m.name}</span>
                        <span className="text-slate-400 dark:text-slate-600">&</span>
                        <select
                          value={currentPair?.female_id || 0}
                          onChange={e => {
                            const fId = Number(e.target.value);
                            setMnPairs(prev => [
                              ...prev.filter(p => p.male_id !== m.id),
                              { male_id: m.id, female_id: fId }
                            ]);
                          }}
                          className="w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white outline-none"
                        >
                          <option value={0}>-- Wählen --</option>
                          {season?.contenders?.filter(c => c.gender === 'F' && c.is_active).map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'matrix' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('contenders')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'contenders' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Personen</span>
          </button>

          <button
            onClick={() => setActiveTab('truthbooths')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'truthbooths' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Matchbox</span>
          </button>

          <button
            onClick={() => setActiveTab('matchingnights')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'matchingnights' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Nights</span>
          </button>
        </div>
      </nav>
    </div>
  );
};