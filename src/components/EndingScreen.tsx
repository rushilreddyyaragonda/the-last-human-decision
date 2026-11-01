import { useGame } from '@/game/GameContext';
import { IndicatorGrid } from '@/components/IndicatorDisplay';
import { calcAutomationAuthority } from '@/game/engine';
import { INDICATOR_LABELS, DOMAIN_LABELS } from '@/game/constants';
import { Play, BarChart3 } from 'lucide-react';

export function EndingScreen() {
  const { endingResult, campaignState, setScreen } = useGame();
  if (!endingResult || !campaignState) return null;

  const cs = campaignState;
  const ending = endingResult;

  const endingColors: Record<string, string> = {
    accountableRepublic: 'var(--color-green)',
    efficientMachine: 'var(--color-cyan)',
    fracturedSociety: 'var(--color-red)',
    resilientCommonwealth: 'var(--color-blue)',
    permanentEmergency: 'var(--color-red)',
    lastHumanDecision: 'var(--color-amber)',
    unfinishedTransition: 'var(--color-text-muted)',
  };
  const color = endingColors[ending.type] || 'var(--color-amber)';

  return (
    <div className="min-h-screen bg-app grid-bg overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="text-center mb-8 fade-in">
          <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color }}>
            Campaign Complete
          </div>
          <h1 className="text-4xl font-bold text-ivory mb-4" style={{ color }}>
            {ending.title}
          </h1>
          <p className="text-sm text-muted italic">{ending.summary}</p>
        </div>

        <div className="panel p-6 mb-6 fade-in">
          <p className="text-sm text-ivory leading-relaxed whitespace-pre-line">{ending.narrative}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="panel p-4">
            <div className="text-xs text-green-fg tracking-wider uppercase mb-3">Strongest Areas</div>
            <ul className="space-y-1">
              {ending.strongestAreas.map((s, i) => (
                <li key={i} className="text-sm text-ivory">• {s}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="text-xs text-red-fg tracking-wider uppercase mb-3">Weakest Areas</div>
            <ul className="space-y-1">
              {ending.weakestAreas.map((s, i) => (
                <li key={i} className="text-sm text-ivory">• {s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel p-4 mb-6">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Final Indicators</div>
          <IndicatorGrid state={cs} compact />
        </div>

        <div className="panel p-4 mb-6">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Trade-offs You Accepted</div>
          <ul className="space-y-2">
            {ending.tradeoffs.map((t, i) => (
              <li key={i} className="text-sm text-muted leading-relaxed">• {t}</li>
            ))}
          </ul>
        </div>

        {ending.keyDecisions.length > 0 && (
          <div className="panel p-4 mb-6">
            <div className="text-xs text-cyan tracking-wider uppercase mb-3">Most Consequential Decisions</div>
            <div className="space-y-2">
              {ending.keyDecisions.map(d => (
                <div key={d.id} className="panel-2 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ivory">{d.title}</span>
                    <span className="text-xs text-dim tabular">Y{d.year} Q{(d.quarter % 4) + 1}</span>
                  </div>
                  <p className="text-xs text-muted">{d.chosenAction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button className="btn btn-cyan" onClick={() => setScreen('analytics')}>
            <BarChart3 size={16} />
            View Analytics
          </button>
          <button className="btn btn-primary" onClick={() => setScreen('campaignSelect')}>
            <Play size={16} />
            New Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
