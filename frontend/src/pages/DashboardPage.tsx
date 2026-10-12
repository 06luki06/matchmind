import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Grid, Users, HelpCircle, Moon, Plus,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

interface DashboardPageProps {
  seasonId: number;
  onBack: () => void;
}

// Backend Response Typen
interface Contender {
  id: number;
  season_id: number;
  name: string;
  gender: string;
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

  // Modals / Modalkontrollen
  const [modalType, setModalType] = useState<'contender' | 'tb' | 'mn' | null>(null);

  // Formular-States
  const [contenderName, setContenderName] = useState('');
  const [contenderGender, setContenderGender] = useState<'M' | 'F'>('M');

  const [tbMaleId, setTbMaleId] = useState<number>(0);
  const [tbFemaleId, setTbFemaleId] = useState<number>(0);
  const [tbIsMatch, setTbIsMatch] = useState<boolean>(false);

  const [mnNightNumber, setMnNightNumber] = useState<number>(1);
  const [mnLightsCount, setMnLightsCount] = useState<number>(0);
  const [mnPairs, setMnPairs] = useState<{ male_id: number; female_id: number }[]>([]);

  // Expanded Accordion state für Matching Nights
  const [openMN, setOpenMN] = useState<number | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Parallel Detail-Daten und Solver-Berechnung abfragen
      const [seasonRes, solveRes] = await Promise.all([
        fetch(`/api/v1/seasons/${seasonId}`),
        fetch(`/api/v1/seasons/${seasonId}/solve`)
      ]);

      if (seasonRes.ok) {
        const sData: SeasonDetail = await seasonRes.json();
        setSeason(sData);

        // Fallback IDs für Truthbooth Formular setzen
        const men = sData.contenders.filter(c => c.gender === 'M');
        const women = sData.contenders.filter(c => c.gender === 'F');
        if (men.length > 0) setTbMaleId(men[0].id);
        if (women.length > 0) setTbFemaleId(women[0].id);

        setMnNightNumber((sData.matching_nights?.length || 0) + 1);
      }

      if (solveRes.ok) {
        const solData: SolveData = await solveRes.json();
        setSolveData(solData);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Staffel-Daten:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [seasonId]);

  // Handlers
  const handleAddContender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenderName.trim()) return;

    await fetch(`/api/v1/seasons/${seasonId}/contenders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: contenderName, gender: contenderGender }),
    });

    setContenderName('');
    setModalType(null);
    loadAllData();
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
    loadAllData();
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
    loadAllData();
  };

  const getContenderName = (id: number) => {
    return season?.contenders.find(c => c.id === id)?.name || `ID ${id}`;
  };

  if (loading && !season) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-slate-400 text-sm">Berechne Staffel-Telemetrie...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">{season?.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {solveData ? `${solveData.remaining_combinations.toLocaleString('de-DE')} Kombinationen` : 'Berechne...'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'contenders') setModalType('contender');
            else if (activeTab === 'truthbooths') setModalType('tb');
            else setModalType('mn');
          }}
          className="bg-indigo-600 active:bg-indigo-700 text-white p-2.5 rounded-xl flex items-center gap-1 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Eintrag</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-lg mx-auto space-y-4">

        {/* 1. MATRIX TAB */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Wahrscheinlichkeits-Matrix
              </h2>
              <span className="text-xs text-indigo-400 font-medium">Live berechnet</span>
            </div>

            {!solveData || solveData.men.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">Füge zuerst Männer und Frauen hinzu, um die Matrix zu sehen.</p>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 overflow-x-auto shadow-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-slate-500 font-semibold sticky left-0 bg-slate-900 border-b border-slate-800">
                        Mann \ Frau
                      </th>
                      {solveData.women.map(w => (
                        <th key={w.id} className="p-2 text-slate-300 font-semibold text-center border-b border-slate-800 min-w-[60px]">
                          {w.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solveData.men.map((m, mIdx) => (
                      <tr key={m.id} className="border-b border-slate-800/50">
                        <td className="p-2 font-medium text-slate-200 sticky left-0 bg-slate-900 border-r border-slate-800/80 whitespace-nowrap">
                          {m.name}
                        </td>
                        {solveData.women.map((w, wIdx) => {
                          const prob = solveData.probabilities[mIdx]?.[wIdx] ?? 0;
                          let bg = 'bg-slate-950/40 text-slate-500';
                          if (prob === 100) bg = 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30';
                          else if (prob >= 50) bg = 'bg-amber-500/20 text-amber-300 font-semibold';
                          else if (prob > 0) bg = 'bg-indigo-500/10 text-indigo-300';

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
            )}
          </div>
        )}

        {/* 2. KANDIDATEN TAB */}
        {activeTab === 'contenders' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Teilnehmer ({season?.contenders.length || 0})
              </h2>
              <button
                onClick={() => setModalType('contender')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Männer */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-indigo-400 block uppercase tracking-wider">
                  Männer ({season?.contenders.filter(c => c.gender === 'M').length})
                </span>
                <div className="space-y-1.5">
                  {season?.contenders.filter(c => c.gender === 'M').map(c => (
                    <div key={c.id} className="bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl text-xs font-medium text-slate-200">
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Frauen */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-pink-400 block uppercase tracking-wider">
                  Frauen ({season?.contenders.filter(c => c.gender === 'F').length})
                </span>
                <div className="space-y-1.5">
                  {season?.contenders.filter(c => c.gender === 'F').map(c => (
                    <div key={c.id} className="bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl text-xs font-medium text-slate-200">
                      {c.name}
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Truth Booths ({season?.truth_booths.length || 0})
              </h2>
              <button
                onClick={() => setModalType('tb')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            {season?.truth_booths.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                Noch keine Matchbox-Entscheidungen eingetragen.
              </div>
            ) : (
              <div className="space-y-2">
                {season?.truth_booths.map((tb, idx) => (
                  <div key={tb.id} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-slate-500 text-xs">#{idx + 1}</span>
                      <span className="text-white">{getContenderName(tb.male_id)}</span>
                      <span className="text-slate-500">&</span>
                      <span className="text-white">{getContenderName(tb.female_id)}</span>
                    </div>

                    {tb.is_match ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Match
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> No Match
                      </span>
                    )}
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Matching Nights ({season?.matching_nights.length || 0})
              </h2>
              <button
                onClick={() => setModalType('mn')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Hinzufügen
              </button>
            </div>

            {season?.matching_nights.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                Noch keine Matching Nights ausgewertet.
              </div>
            ) : (
              <div className="space-y-2">
                {season?.matching_nights.map((mn) => {
                  const isOpen = openMN === mn.id;
                  return (
                    <div key={mn.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                      <button
                        onClick={() => setOpenMN(isOpen ? null : mn.id)}
                        className="w-full p-4 flex items-center justify-between text-left active:bg-slate-800/50"
                      >
                        <div>
                          <h3 className="font-bold text-white text-sm">Matching Night #{mn.night_number}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{mn.pairs.length} Paarungen</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold">
                            💡 {mn.lights_count} Lichter
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {mn.pairs.map((p, i) => (
                            <div key={i} className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl flex justify-between text-slate-300">
                              <span>{getContenderName(p.male_id)}</span>
                              <span className="text-slate-500">&</span>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            {/* A. Contender Form */}
            {modalType === 'contender' && (
              <form onSubmit={handleAddContender} className="space-y-4">
                <h3 className="font-bold text-white text-base">Teilnehmer hinzufügen</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={contenderName}
                  onChange={e => setContenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContenderGender('M')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${contenderGender === 'M' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    Mann
                  </button>
                  <button
                    type="button"
                    onClick={() => setContenderGender('F')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${contenderGender === 'F' ? 'bg-pink-600 text-white border-pink-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    Frau
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

            {/* B. Truth Booth Form */}
            {modalType === 'tb' && (
              <form onSubmit={handleAddTruthBooth} className="space-y-4">
                <h3 className="font-bold text-white text-base">Truth Booth eintragen</h3>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Mann</label>
                  <select
                    value={tbMaleId}
                    onChange={e => setTbMaleId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {season?.contenders.filter(c => c.gender === 'M').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  <label className="text-xs text-slate-400 block pt-2">Frau</label>
                  <select
                    value={tbFemaleId}
                    onChange={e => setTbFemaleId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {season?.contenders.filter(c => c.gender === 'F').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTbIsMatch(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${tbIsMatch ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    Match 🟢
                  </button>
                  <button
                    type="button"
                    onClick={() => setTbIsMatch(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${!tbIsMatch ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    No Match 🔴
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

            {/* C. Matching Night Form */}
            {modalType === 'mn' && (
              <form onSubmit={handleAddMatchingNight} className="space-y-4">
                <h3 className="font-bold text-white text-base">Matching Night eintragen</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400">Nacht Nr.</label>
                    <input
                      type="number"
                      value={mnNightNumber}
                      onChange={e => setMnNightNumber(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Lichter</label>
                    <input
                      type="number"
                      value={mnLightsCount}
                      onChange={e => setMnLightsCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-400 pt-1">Paarungen auswählen:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {season?.contenders.filter(c => c.gender === 'M').map(m => {
                    const currentPair = mnPairs.find(p => p.male_id === m.id);
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="w-1/3 text-slate-300 font-medium truncate">{m.name}</span>
                        <span className="text-slate-600">&</span>
                        <select
                          value={currentPair?.female_id || 0}
                          onChange={e => {
                            const fId = Number(e.target.value);
                            setMnPairs(prev => [
                              ...prev.filter(p => p.male_id !== m.id),
                              { male_id: m.id, female_id: fId }
                            ]);
                          }}
                          className="w-2/3 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white outline-none"
                        >
                          <option value={0}>-- Wählen --</option>
                          {season?.contenders.filter(c => c.gender === 'F').map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-semibold">Abbrechen</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold">Speichern</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'matrix' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('contenders')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'contenders' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Personen</span>
          </button>

          <button
            onClick={() => setActiveTab('truthbooths')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'truthbooths' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Matchbox</span>
          </button>

          <button
            onClick={() => setActiveTab('matchingnights')}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${activeTab === 'matchingnights' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Nights</span>
          </button>
        </div>
      </nav>
    </div>
  );
};