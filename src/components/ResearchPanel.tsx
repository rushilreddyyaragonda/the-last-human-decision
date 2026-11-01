import { useState } from 'react';
import { useGame } from '@/game/GameContext';
import { RESEARCH_LABELS, RESEARCH_DESCRIPTIONS, FISCAL_UNIT } from '@/game/constants';
import { getResearchCost, canStartResearch } from '@/game/research';
import type { ResearchKey } from '@/game/types';
import { FlaskConical, Clock, CheckCircle2, Lock } from 'lucide-react';

export function ResearchPanel() {
  const { campaignState, startResearchProject } = useGame();
  const [confirmKey, setConfirmKey] = useState<ResearchKey | null>(null);
  if (!campaignState) return null;
  const cs = campaignState;

  const keys = Object.keys(RESEARCH_LABELS) as ResearchKey[];

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-lg text-ivory font-medium mb-2">Research & Investigation</h3>
      <p className="text-sm text-muted mb-4">
        Commission investigations to reveal information about the simulation state before making major decisions.
        Available: <span className="text-amber tabular">{cs.fiscalReserves}</span> {FISCAL_UNIT}
      </p>

      {cs.pendingResearch.length > 0 && (
        <div className="panel p-4 mb-4">
          <div className="text-xs text-cyan tracking-wider uppercase mb-2">In Progress</div>
          {cs.pendingResearch.map(r => (
            <div key={r.key} className="flex items-center justify-between py-2 border-b border-app last:border-0">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber blink" />
                <span className="text-sm text-ivory">{RESEARCH_LABELS[r.key]}</span>
              </div>
              <span className="text-xs text-muted">
                Completes in Q{r.completeQuarter + 1} ({r.completeQuarter - cs.quarter} quarter{r.completeQuarter - cs.quarter !== 1 ? 's' : ''})
              </span>
            </div>
          ))}
        </div>
      )}

      {cs.completedResearch.length > 0 && (
        <div className="panel p-4 mb-4">
          <div className="text-xs text-green-fg tracking-wider uppercase mb-2 flex items-center gap-1">
            <CheckCircle2 size={14} /> Completed Research Archive
          </div>
          <div className="space-y-3">
            {cs.completedResearch.map(r => (
              <div key={r.key} className="panel-2 p-3">
                <div className="text-sm text-ivory font-medium mb-1">{RESEARCH_LABELS[r.key]}</div>
                <div className="text-xs text-dim mb-2">Completed Q{r.quarterCompleted + 1}</div>
                <p className="text-xs text-muted leading-relaxed">{r.findings}</p>
                {Object.keys(r.data).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {Object.entries(r.data).map(([k, v]) => (
                      <span key={k} className="text-xs text-dim">
                        <span className="text-muted">{k}:</span> <span className="tabular text-ivory">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {keys.map(key => {
          const cost = getResearchCost(key);
          const inProgress = cs.pendingResearch.some(r => r.key === key);
          const completed = cs.completedResearch.some(r => r.key === key);
          const canStart = canStartResearch(cs, key);

          return (
            <div key={key} className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical size={14} className="text-cyan" />
                <span className="text-sm text-ivory font-medium">{RESEARCH_LABELS[key]}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-3">{RESEARCH_DESCRIPTIONS[key]}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">
                  <span className="text-amber tabular">{cost}</span> credits · 1-2 quarters
                </div>
                {completed ? (
                  <span className="text-xs text-green-fg flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                ) : inProgress ? (
                  <span className="text-xs text-amber flex items-center gap-1"><Clock size={12} className="blink" /> In progress</span>
                ) : canStart ? (
                  confirmKey === key ? (
                    <div className="flex gap-1">
                      <button className="btn btn-primary text-xs" style={{ padding: '4px 10px' }} onClick={() => { startResearchProject(key); setConfirmKey(null); }}>
                        Confirm
                      </button>
                      <button className="btn btn-secondary text-xs" style={{ padding: '4px 10px' }} onClick={() => setConfirmKey(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-cyan text-xs" style={{ padding: '4px 12px' }} onClick={() => setConfirmKey(key)}>
                      Commission
                    </button>
                  )
                ) : (
                  <span className="text-xs text-dim flex items-center gap-1"><Lock size={12} /> Need {cost} credits</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
