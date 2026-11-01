import { useGame } from '@/game/GameContext';
import { DOMAIN_LABELS } from '@/game/constants';
import { AlertTriangle, X } from 'lucide-react';

export function EventModal() {
  const { campaignState, resolveEvent } = useGame();
  if (!campaignState || !campaignState.pendingEvent) return null;

  const event = campaignState.pendingEvent;
  const categoryColors: Record<string, string> = {
    crisis: 'var(--color-red)',
    opportunity: 'var(--color-green)',
    social: 'var(--color-amber)',
    infrastructure: 'var(--color-cyan)',
    governance: 'var(--color-blue)',
  };
  const color = categoryColors[event.category] || 'var(--color-amber)';

  return (
    <div className="modal-overlay">
      <div className="panel max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin slide-up">
        <div className="p-5 border-b border-app">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} style={{ color }} />
              <div>
                <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color }}>{event.category}</div>
                <h2 className="text-lg text-ivory font-medium">{event.title}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-muted leading-relaxed mb-4">{event.description}</p>

          {event.triggerDescription && (
            <div className="panel-2 p-3 mb-4">
              <div className="text-xs text-cyan mb-1">Trigger Conditions</div>
              <p className="text-xs text-dim">{event.triggerDescription}</p>
            </div>
          )}

          {event.affectedDomains.length > 0 && (
            <div className="flex gap-2 mb-4">
              {event.affectedDomains.map(d => (
                <span key={d} className="text-xs text-cyan bg-surface-2 px-2 py-1 rounded">{DOMAIN_LABELS[d]}</span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {event.options.map(opt => (
              <button
                key={opt.id}
                className="panel-2 p-4 text-left hover:border-app-light transition w-full group"
                onClick={() => resolveEvent(opt)}
              >
                <div className="text-sm text-ivory font-medium mb-1 group-hover:text-amber transition">{opt.label}</div>
                <p className="text-xs text-muted leading-relaxed mb-2">{opt.description}</p>
                <p className="text-xs text-dim italic">{opt.explanation}</p>

                {/* Show key effects */}
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
                    <span className="text-xs text-amber">Delayed effects in {opt.delayedEffects.length} quarter(s)</span>
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
