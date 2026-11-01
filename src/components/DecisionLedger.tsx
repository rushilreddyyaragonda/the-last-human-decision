import { useState } from 'react';
import { useGame } from '@/game/GameContext';
import { DOMAIN_LABELS } from '@/game/constants';
import type { DecisionRecord } from '@/game/types';
import { Search, Filter, FileText } from 'lucide-react';

export function DecisionLedger() {
  const { campaignState } = useGame();
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DecisionRecord | null>(null);

  if (!campaignState) return null;
  const cs = campaignState;

  let records = cs.decisionLedger;
  if (filterDomain !== 'all') {
    records = records.filter(r => r.domains.includes(filterDomain as any));
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    records = records.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.chosenAction.toLowerCase().includes(q) ||
      r.situation.toLowerCase().includes(q)
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-lg text-ivory font-medium mb-2">Decision Ledger</h3>
      <p className="text-sm text-muted mb-4">
        Complete history of major decisions, their context, and consequences. {cs.decisionLedger.length} total records.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 panel-2 px-3 py-2 flex-1">
          <Search size={14} className="text-dim" />
          <input
            type="text"
            placeholder="Search decisions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-ivory outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2 panel-2 px-3 py-2">
          <Filter size={14} className="text-dim" />
          <select
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            className="bg-transparent text-sm text-ivory outline-none"
          >
            <option value="all" className="bg-surface">All Domains</option>
            <option value="economic" className="bg-surface">Economic</option>
            <option value="resourceAllocation" className="bg-surface">Resource Allocation</option>
            <option value="transportation" className="bg-surface">Transportation</option>
            <option value="publicSafety" className="bg-surface">Public Safety</option>
            <option value="healthcare" className="bg-surface">Healthcare</option>
          </select>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="panel p-8 text-center">
          <FileText size={32} className="text-dim mx-auto mb-3" />
          <p className="text-sm text-muted">No decisions match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...records].reverse().map(r => (
            <button
              key={r.id}
              className="panel p-3 text-left hover:border-app-light transition w-full"
              onClick={() => setSelected(r)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-ivory font-medium">{r.title}</span>
                <span className="text-xs text-dim tabular">Y{r.year} Q{(r.quarter % 4) + 1}</span>
              </div>
              <p className="text-xs text-muted truncate">{r.chosenAction}</p>
              {r.domains.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {r.domains.map(d => (
                    <span key={d} className="text-xs text-cyan bg-surface-2 px-2 py-0.5 rounded">
                      {DOMAIN_LABELS[d]}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="panel p-6 max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg text-ivory font-medium">{selected.title}</h3>
                <span className="text-xs text-dim tabular">Year {selected.year}, Quarter {(selected.quarter % 4) + 1}</span>
              </div>
              <button className="text-muted hover:text-ivory" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-cyan tracking-wider uppercase mb-1">Situation</div>
                <p className="text-sm text-muted leading-relaxed">{selected.situation}</p>
              </div>

              <div>
                <div className="text-xs text-cyan tracking-wider uppercase mb-1">Chosen Action</div>
                <p className="text-sm text-amber">{selected.chosenAction}</p>
              </div>

              {selected.immediateEffects.length > 0 && (
                <div>
                  <div className="text-xs text-cyan tracking-wider uppercase mb-1">Immediate Effects</div>
                  <ul className="space-y-1">
                    {selected.immediateEffects.map((e, i) => (
                      <li key={i} className="text-sm text-muted leading-relaxed">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.delayedEffects.length > 0 && (
                <div>
                  <div className="text-xs text-amber tracking-wider uppercase mb-1">Delayed Effects</div>
                  <ul className="space-y-1">
                    {selected.delayedEffects.map((e, i) => (
                      <li key={i} className="text-sm text-muted leading-relaxed">• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="text-xs text-cyan tracking-wider uppercase mb-1">Explanation</div>
                <p className="text-sm text-muted leading-relaxed">{selected.explanation}</p>
              </div>

              {selected.domains.length > 0 && (
                <div>
                  <div className="text-xs text-cyan tracking-wider uppercase mb-1">Affected Domains</div>
                  <div className="flex gap-2 flex-wrap">
                    {selected.domains.map(d => (
                      <span key={d} className="text-xs text-cyan bg-surface-2 px-2 py-1 rounded">{DOMAIN_LABELS[d]}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
