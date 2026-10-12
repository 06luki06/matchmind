import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  if (selectedSeasonId !== null) {
    return <DashboardPage seasonId={selectedSeasonId} onBack={() => setSelectedSeasonId(null)} />;
  }

  return <LandingPage onSelectSeason={(id) => setSelectedSeasonId(id)} />;
}

export default App;