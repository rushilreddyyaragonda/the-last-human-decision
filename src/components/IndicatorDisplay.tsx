import type { Indicators, IndicatorKey } from '@/game/types';
import { INDICATOR_LABELS, INDICATOR_DESCRIPTIONS, INDICATOR_KEYS } from '@/game/constants';
import { getIndicatorDirection, getIndicatorContributors, getIndicatorDescriptor } from '@/game/engine';
import type { CampaignState } from '@/game/types';

export function StatBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="stat-bar w-full">
      <div className="stat-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function IndicatorRow({ state, k, compact }: { state: CampaignState; k: IndicatorKey; compact?: boolean }) {
  const val = state.indicators[k];
  const dir = getIndicatorDirection(state, k);
  const desc = getIndicatorDescriptor(val);
  const label = INDICATOR_LABELS[k];
  const contributors = compact ? [] : getIndicatorContributors(state, k);

  const dirIcon = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '◆';
  const dirColor = dir === 'up' ? 'text-green-fg' : dir === 'down' ? 'text-red-fg' : 'text-dim';

  const colorMap: Record<string, string> = {
    success: 'var(--color-green)',
    primary: 'var(--color-cyan)',
    warning: 'var(--color-amber)',
    error: 'var(--color-red)',
  };
  const barColor = colorMap[desc.color] || 'var(--color-cyan)';

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-ivory">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${dirColor}`}>{dirIcon}</span>
          <span className="tabular text-sm text-ivory font-medium">{Math.round(val)}</span>
        </div>
      </div>
      <StatBar value={val} color={barColor} />
      {!compact && (
        <>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted">{desc.label}</span>
          </div>
          {contributors.length > 0 && contributors[0] !== 'No significant contributing factors at this time' && (
            <ul className="mt-1 space-y-0.5">
              {contributors.slice(0, 3).map((c, i) => (
                <li key={i} className="text-xs text-dim leading-relaxed">• {c}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export function IndicatorGrid({ state, compact }: { state: CampaignState; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-0" : "space-y-0"}>
      {INDICATOR_KEYS.map(k => (
        <IndicatorRow key={k} state={state} k={k} compact={compact} />
      ))}
    </div>
  );
}

export function YearLabel({ quarter, year }: { quarter: number; year: number }) {
  return (
    <span className="tabular text-ivory">
      Year {year} · Q{(quarter % 4) + 1}
    </span>
  );
}
