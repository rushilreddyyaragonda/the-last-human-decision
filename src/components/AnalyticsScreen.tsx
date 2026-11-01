import { useGame } from '@/game/GameContext';
import { INDICATOR_LABELS, DOMAIN_LABELS, GROUP_LABELS } from '@/game/constants';
import { calcAutomationAuthority } from '@/game/engine';
import type { IndicatorKey, PolicyDomainKey } from '@/game/types';
import { BarChart3, TrendingUp, Clock, DollarSign, Activity } from 'lucide-react';

export function AnalyticsScreen() {
  const { campaignState, endingResult, campaignHistory, setScreen } = useGame();
  if (!campaignState) return null;
  const cs = campaignState;

  const history = cs.indicatorHistory;
  const indicatorKeys = Object.keys(INDICATOR_LABELS) as IndicatorKey[];
  const domainKeys = Object.keys(DOMAIN_LABELS) as PolicyDomainKey[];

  // Simple line chart as SVG
  const chartH = 120;
  const chartW = 100;

  function makePath(values: number[]): string {
    if (values.length < 2) return '';
    const step = chartW / (values.length - 1);
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)} ${(chartH - (v / 100) * chartH).toFixed(2)}`).join(' ');
  }

  const indicatorColors: Record<string, string> = {
    productivity: '#4a8fd9',
    publicTrust: '#d4a843',
    socialEquity: '#5cb374',
    civilLiberties: '#4dccc7',
    systemResilience: '#c94e4e',
    humanAgency: '#d4a843',
    workforceStability: '#4a8fd9',
    infrastructureHealth: '#5cb374',
    informationIntegrity: '#4dccc7',
  };

  return (
    <div className="min-h-screen bg-app grid-bg overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <button className="text-muted hover:text-ivory text-sm mb-6" onClick={() => setScreen('ending')}>
          ← Back to Ending
        </button>

        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={24} className="text-amber" />
          <h1 className="text-2xl text-ivory font-bold">Campaign Analysis</h1>
        </div>

        {endingResult && (
          <div className="panel p-4 mb-6">
            <div className="text-xs text-cyan tracking-wider uppercase mb-1">Final Ending</div>
            <div className="text-lg text-amber font-medium">{endingResult.title}</div>
          </div>
        )}

        {/* Indicator trends */}
        <div className="panel p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-cyan" />
            <h3 className="text-sm text-ivory font-medium">Indicator Trends (24 Quarters)</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {indicatorKeys.map(key => {
              const values = history.map(h => h.indicators[key]);
              const color = indicatorColors[key] || 'var(--color-cyan)';
              const start = values[0] ?? 0;
              const end = values[values.length - 1] ?? 0;
              const diff = Math.round(end - start);
              return (
                <div key={key} className="panel-2 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ivory">{INDICATOR_LABELS[key]}</span>
                    <span className={`text-xs tabular ${diff > 0 ? 'text-green-fg' : diff < 0 ? 'text-red-fg' : 'text-dim'}`}>
                      {diff > 0 ? '+' : ''}{diff} → {Math.round(end)}
                    </span>
                  </div>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '50px' }}>
                    <path d={makePath(values)} fill="none" stroke={color} strokeWidth="0.8" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fiscal reserves */}
        <div className="panel p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-amber" />
            <h3 className="text-sm text-ivory font-medium">Fiscal Reserves Over Time</h3>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '80px' }}>
            <path
              d={makePath(history.map(h => Math.min(100, (h.fiscalReserves / 1000) * 100)))}
              fill="none"
              stroke="var(--color-amber)"
              strokeWidth="1"
            />
          </svg>
          <div className="flex justify-between text-xs text-dim mt-1">
            <span>Start: {history[0]?.fiscalReserves ?? 0}</span>
            <span>End: {history[history.length - 1]?.fiscalReserves ?? 0}</span>
          </div>
        </div>

        {/* Automation authority over time */}
        <div className="panel p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-cyan" />
            <h3 className="text-sm text-ivory font-medium">Automation Authority Over Time</h3>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '80px' }}>
            <path
              d={makePath(history.map(h => h.automationAuthority))}
              fill="none"
              stroke="var(--color-cyan)"
              strokeWidth="1"
            />
          </svg>
          <div className="flex justify-between text-xs text-dim mt-1">
            <span>Start: {history[0]?.automationAuthority ?? 0}%</span>
            <span>End: {history[history.length - 1]?.automationAuthority ?? 0}%</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="panel p-4">
            <div className="text-xs text-muted mb-1">Total Overrides</div>
            <div className="tabular text-2xl text-amber font-bold">{cs.overrideHistory.length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-xs text-muted mb-1">Total Decisions</div>
            <div className="tabular text-2xl text-ivory font-bold">{cs.decisionLedger.length}</div>
          </div>
          <div className="panel p-4">
            <div className="text-xs text-muted mb-1">Research Completed</div>
            <div className="tabular text-2xl text-cyan font-bold">{cs.completedResearch.length}</div>
          </div>
        </div>

        {/* Campaign comparison */}
        {campaignHistory.length > 0 && (
          <div className="panel p-5 mb-6">
            <div className="text-xs text-cyan tracking-wider uppercase mb-3">Campaign History</div>
            <div className="space-y-2">
              {[...campaignHistory].reverse().map((h, i) => (
                <div key={i} className="panel-2 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ivory">{h.campaignName}</div>
                    <div className="text-xs text-muted">{h.endingTitle} · {h.difficulty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-dim tabular">{new Date(h.dateCompleted).toLocaleDateString()}</div>
                    <div className="text-xs text-amber tabular">{h.totalOverrides} overrides</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-dim leading-relaxed mb-6">
          <div className="text-xs text-cyan tracking-wider uppercase mb-2">Methodology Note</div>
          All indicators are calculated from game state using explicit rules: quarterly income is derived from productivity,
          expenditure from automation and oversight levels, and indicator changes from policy configurations, event outcomes,
          and delayed effect resolutions. This is a fictional simulation that explores computational systems and human
          decision-making. It does not predict real-world societal outcomes.
        </div>

        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => setScreen('campaignSelect')}>New Campaign</button>
          <button className="btn btn-secondary" onClick={() => setScreen('title')}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
