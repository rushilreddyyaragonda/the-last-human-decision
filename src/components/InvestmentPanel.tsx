import { useGame } from '@/game/GameContext';
import { DOMAIN_LABELS, INVESTMENT_LABELS, INVESTMENT_DESCRIPTIONS, FISCAL_UNIT } from '@/game/constants';
import { getInvestmentCost, getInvestmentEffects } from '@/game/engine';
import type { InvestmentKey } from '@/game/types';
import { DollarSign, Check, Lock } from 'lucide-react';
import { useState } from 'react';

export function InvestmentPanel() {
  const { campaignState, invest } = useGame();
  const [confirmKey, setConfirmKey] = useState<InvestmentKey | null>(null);
  if (!campaignState) return null;
  const cs = campaignState;

  const keys = Object.keys(cs.investments) as InvestmentKey[];

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-lg text-ivory font-medium mb-2">Strategic Investment</h3>
      <p className="text-sm text-muted mb-4">
        Allocate fiscal reserves to long-term programs. Each investment has diminishing returns at higher levels.
        Available: <span className="text-amber tabular">{cs.fiscalReserves}</span> {FISCAL_UNIT}
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {keys.map(key => {
          const inv = cs.investments[key];
          const cost = getInvestmentCost(cs, key);
          const maxed = inv.level >= inv.maxLevel;
          const canAfford = cs.fiscalReserves >= cost;
          const effects = getInvestmentEffects(cs, key);

          return (
            <div key={key} className="panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-ivory font-medium">{INVESTMENT_LABELS[key]}</span>
                <span className="text-xs text-muted">Level {inv.level}/{inv.maxLevel}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-3">{INVESTMENT_DESCRIPTIONS[key]}</p>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: inv.maxLevel }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-sm"
                    style={{ backgroundColor: i < inv.level ? 'var(--color-amber)' : 'var(--color-surface-2)' }}
                  />
                ))}
              </div>

              <div className="panel-2 p-2 mb-3">
                <p className="text-xs text-dim leading-relaxed">{effects.description}</p>
                {!maxed && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(effects.indicators).map(([k, v]) => (
                      <span key={k} className={`text-xs tabular ${v! > 0 ? 'text-green-fg' : 'text-red-fg'}`}>
                        {v! > 0 ? '+' : ''}{v} {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {maxed ? (
                <div className="flex items-center gap-2 text-xs text-green-fg">
                  <Check size={14} /> Maximum level reached
                </div>
              ) : confirmKey === key ? (
                <div className="flex gap-2">
                  <button className="btn btn-primary text-xs" style={{ padding: '6px 12px' }} onClick={() => { invest(key); setConfirmKey(null); }}>
                    Confirm ({cost} credits)
                  </button>
                  <button className="btn btn-secondary text-xs" style={{ padding: '6px 12px' }} onClick={() => setConfirmKey(null)}>Cancel</button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary text-xs w-full"
                  style={{ padding: '6px 12px' }}
                  disabled={!canAfford}
                  onClick={() => setConfirmKey(key)}
                >
                  {canAfford ? (
                    <><DollarSign size={12} /> Invest ({cost} credits)</>
                  ) : (
                    <><Lock size={12} /> Need {cost} credits</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
