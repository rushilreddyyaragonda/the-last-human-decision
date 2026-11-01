import { useGame } from '@/game/GameContext';
import { Info, ArrowLeft } from 'lucide-react';

export function AboutScreen() {
  const { setScreen } = useGame();

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6 flex items-center gap-1" onClick={() => setScreen('title')}>
          <ArrowLeft size={14} /> Back to Main Menu
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Info size={24} className="text-amber" />
          <h1 className="text-2xl text-ivory font-bold">About the Project</h1>
        </div>

        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">What This Is</h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            The Last Human Decision is an original strategy simulation that explores the relationship between
            automated decision-making and human agency. You govern a fictional society over six years, deciding
            which decisions to delegate to algorithms and which to keep in human hands.
          </p>
          <p className="text-sm text-muted leading-relaxed mb-4">
            The game does not argue that automation is inherently good or bad. Instead, it asks you to navigate
            the trade-offs: efficiency vs. accountability, speed vs. oversight, optimization vs. fairness.
            Every decision has consequences, and no single strategy produces the best outcome on every dimension.
          </p>
        </div>

        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">What It Simulates</h3>
          <p className="text-sm text-muted leading-relaxed mb-3">
            The simulation uses explicit rules to model societal indicators, resource flows, regional conditions,
            and public sentiment. Events are triggered by actual game state — not random punishment. Delayed
            effects resolve over multiple quarters, creating chains of consequence that reward long-term thinking.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            This is a fictional simulation designed to provoke thoughtful engagement with real-world questions.
            It does not predict actual societal outcomes, nor has it been scientifically validated.
          </p>
        </div>

        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">Technical Approach</h3>
          <p className="text-sm text-muted leading-relaxed">
            Built as a browser-based React application with a deterministic simulation engine. All game logic
            runs client-side — no backend server, no API calls, no required account. Campaign progress is
            saved to browser-local storage. The simulation uses a seeded random number generator for
            reproducible event selection.
          </p>
        </div>

        <div className="panel p-6 mb-4">
          <h3 className="text-sm text-cyan font-medium mb-3">Limitations</h3>
          <ul className="space-y-2">
            <li className="text-sm text-muted leading-relaxed">• The simulation simplifies complex social dynamics into tractable game mechanics.</li>
            <li className="text-sm text-muted leading-relaxed">• Population groups are analytical categories, not representations of real communities.</li>
            <li className="text-sm text-muted leading-relaxed">• Event scenarios are authored, not generated, and the set is finite.</li>
            <li className="text-sm text-muted leading-relaxed">• Browser-local saves are device-specific and may be lost if site data is cleared.</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setScreen('developer')}>Meet the Developer</button>
          <button className="btn btn-primary" onClick={() => setScreen('campaignSelect')}>Play the Game</button>
        </div>
      </div>
    </div>
  );
}
