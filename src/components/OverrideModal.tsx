import { useGame } from '@/game/GameContext';
import { DOMAIN_LABELS } from '@/game/constants';
import { Cpu, Eye, X, FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function OverrideModal() {
  const { campaignState, resolveOverride } = useGame();
  const [showExplanation, setShowExplanation] = useState(false);
  if (!campaignState || !campaignState.pendingOverride) return null;

  const ov = campaignState.pendingOverride;
  const color = 'var(--color-amber)';

  return (
    <div className="modal-overlay">
      <div className="panel max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin slide-up">
        {/* Header */}
        <div className="p-5 border-b border-app" style={{ borderBottomColor: color }}>
          <div className="flex items-start gap-2">
            <Cpu size={18} style={{ color: 'var(--color-cyan)' }} />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color }}>Human Override Required</div>
              <h2 className="text-lg text-ivory font-medium">{ov.title}</h2>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-muted leading-relaxed mb-4">{ov.description}</p>

          {/* System objective */}
          <div className="panel-2 p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={12} className="text-cyan" />
              <span className="text-xs text-cyan">System Objective</span>
            </div>
            <p className="text-xs text-ivory">{ov.systemObjective}</p>
          </div>

          {/* Recommendation */}
          <div className="panel-2 p-3 mb-3" style={{ borderColor: color }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={12} style={{ color }} />
              <span className="text-xs" style={{ color }}>Recommendation</span>
            </div>
            <p className="text-xs text-ivory leading-relaxed">{ov.recommendation}</p>
          </div>

          {/* Supporting data */}
          <div className="panel-2 p-3 mb-3">
            <div className="text-xs text-cyan mb-2">Supporting Data</div>
            <div className="grid grid-cols-2 gap-2">
              {ov.supportingData.map((d, i) => (
                <div key={i}>
                  <span className="text-xs text-dim">{d.label}</span>
                  <div className="text-sm text-ivory tabular">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Uncertainty + populations */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Uncertainty</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${ov.uncertainty}%`, backgroundColor: 'var(--color-amber)' }} />
                  </div>
                </div>
                <span className="tabular text-sm text-amber">{ov.uncertainty}%</span>
              </div>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Affected Populations</div>
              {ov.affectedPopulations.map((p, i) => (
                <p key={i} className="text-xs text-ivory leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* Benefits + risks */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="panel-2 p-3">
              <div className="text-xs text-green-fg mb-1">Potential Benefits</div>
              <ul className="space-y-1">
                {ov.potentialBenefits.map((b, i) => (
                  <li key={i} className="text-xs text-muted leading-relaxed">• {b}</li>
                ))}
              </ul>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-red-fg mb-1">Risks</div>
              <ul className="space-y-1">
                {ov.risks.map((r, i) => (
                  <li key={i} className="text-xs text-muted leading-relaxed">• {r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Explanation toggle */}
          <button
            className="text-xs text-cyan hover:text-amber transition mb-3 flex items-center gap-1"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <FileText size={12} />
            {showExplanation ? 'Hide' : 'Show'} decision engine explanation
          </button>
          {showExplanation && (
            <div className="panel-2 p-3 mb-4">
              <div className="text-xs text-cyan mb-2">How the Decision Engine Reached This Recommendation</div>
              {ov.explanationSteps.map((step, i) => (
                <p key={i} className="text-xs text-muted leading-relaxed mb-1">{step}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="text-xs text-cyan tracking-wider uppercase mb-2">Your Decision</div>
          <div className="space-y-2">
            {ov.options.map(opt => (
              <button
                key={opt.id}
                className="panel-2 p-3 text-left hover:border-app-light transition w-full group"
                onClick={() => resolveOverride(opt)}
              >
                <div className="text-sm text-ivory font-medium mb-1 group-hover:text-amber transition">{opt.label}</div>
                <p className="text-xs text-muted leading-relaxed mb-2">{opt.description}</p>
                <p className="text-xs text-dim italic">{opt.explanation}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {opt.effects.fiscalDelta && (
                    <span className={`text-xs tabular ${opt.effects.fiscalDelta > 0 ? 'text-green-fg' : 'text-red-fg'}`}>
                      {opt.effects.fiscalDelta > 0 ? '+' : ''}{opt.effects.fiscalDelta} credits
                    </span>
                  )}
                  {Object.entries(opt.effects).filter(([k]) => k !== 'fiscalDelta').map(([k, v]) => (
                    v !== 0 && (
                      <span key={k} className={`text-xs tabular ${v! > 0 ? 'text-green-fg' : 'text-red-fg'}`}>
                        {v! > 0 ? '+' : ''}{v} {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    )
                  ))}
                  {opt.delayedEffects && opt.delayedEffects.length > 0 && (
                    <span className="text-xs text-amber">Delayed effects</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
