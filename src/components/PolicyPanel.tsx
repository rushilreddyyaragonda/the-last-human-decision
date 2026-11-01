import { useGame } from '@/game/GameContext';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from '@/game/constants';
import { previewPolicyChange } from '@/game/engine';
import type { PolicyDomainKey, DomainPolicy } from '@/game/types';
import { useState } from 'react';
import { Shield, Eye, FileText, MessageSquare, Cpu, DollarSign } from 'lucide-react';

const DOMAIN_ICONS: Record<PolicyDomainKey, typeof Shield> = {
  economic: Cpu,
  resourceAllocation: FileText,
  transportation: Shield,
  publicSafety: Shield,
  healthcare: Eye,
};

export function PolicyPanel() {
  const { campaignState, changePolicy } = useGame();
  const [selectedDomain, setSelectedDomain] = useState<PolicyDomainKey | null>(null);
  const [draft, setDraft] = useState<Partial<DomainPolicy> | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!campaignState) return null;
  const cs = campaignState;

  const domains = Object.keys(cs.domains) as PolicyDomainKey[];

  if (selectedDomain && draft) {
    const current = cs.domains[selectedDomain];
    const preview = previewPolicyChange(cs, selectedDomain, draft);
    const Icon = DOMAIN_ICONS[selectedDomain] || Shield;

    const settings: Array<{ key: keyof DomainPolicy; label: string; icon: typeof Shield; desc: string }> = [
      { key: 'automation', label: 'Automation Authority', icon: Cpu, desc: 'Degree of authority delegated to automated systems.' },
      { key: 'oversight', label: 'Human Oversight', icon: Eye, desc: 'Level of human review over automated decisions.' },
      { key: 'transparency', label: 'Transparency', icon: FileText, desc: 'How openly decision criteria are published.' },
      { key: 'appealAccess', label: 'Appeal Access', icon: MessageSquare, desc: 'Citizens\' ability to challenge decisions.' },
    ];

    return (
      <div className="max-w-4xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-4" onClick={() => { setSelectedDomain(null); setDraft(null); }}>
          ← Back to domains
        </button>

        <div className="panel p-5 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon size={20} className="text-cyan" />
            <h3 className="text-lg text-ivory font-medium">{DOMAIN_LABELS[selectedDomain]}</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">{DOMAIN_DESCRIPTIONS[selectedDomain]}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="panel-2 p-2">
              <div className="text-xs text-muted">Reliability</div>
              <div className="tabular text-sm text-ivory">{current.reliability}%</div>
            </div>
            <div className="panel-2 p-2">
              <div className="text-xs text-muted">Cooldown</div>
              <div className="tabular text-sm text-ivory">
                {cs.quarter < current.cooldownUntilQuarter ? `Q${current.cooldownUntilQuarter + 1}` : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-5 mb-4">
          <div className="text-xs text-cyan tracking-wider uppercase mb-4">Policy Adjustments</div>
          <div className="space-y-5">
            {settings.map(s => {
              const val = draft[s.key] ?? current[s.key];
              const SIcon = s.icon;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SIcon size={14} className="text-muted" />
                      <span className="text-sm text-ivory">{s.label}</span>
                    </div>
                    <span className="tabular text-sm text-amber">{val as number}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val as number}
                    onChange={e => setDraft({ ...draft, [s.key]: parseInt(e.target.value) })}
                    className="w-full accent-amber"
                    style={{ accentColor: 'var(--color-amber)' }}
                  />
                  <p className="text-xs text-dim mt-1">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="panel p-5 mb-4">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Estimated Effects (Preview)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Implementation Cost</div>
              <div className="flex items-center gap-1">
                <DollarSign size={14} className="text-amber" />
                <span className="tabular text-sm text-ivory">{preview.cost}</span>
              </div>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">New Automation Authority</div>
              <span className="tabular text-sm text-ivory">{preview.automationAuthority}%</span>
            </div>
          </div>
          {Object.keys(preview.indicatorEffects).length > 0 && (
            <div className="mt-3 space-y-1">
              {Object.entries(preview.indicatorEffects).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  <span className={v! > 0 ? 'text-green-fg tabular' : 'text-red-fg tabular'}>
                    {v! > 0 ? '+' : ''}{v}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-dim mt-3 italic">Forecasts are estimates, not guaranteed outcomes.</p>
        </div>

        {showConfirm ? (
          <div className="panel p-4 border-amber" style={{ borderColor: 'var(--color-amber)' }}>
            <p className="text-sm text-ivory mb-3">Confirm policy change for {DOMAIN_LABELS[selectedDomain]}? Cost: {preview.cost} credits.</p>
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  changePolicy(selectedDomain, draft);
                  setSelectedDomain(null);
                  setDraft(null);
                  setShowConfirm(false);
                }}
              >
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              disabled={preview.cost > cs.fiscalReserves}
              onClick={() => setShowConfirm(true)}
            >
              Apply Changes ({preview.cost} credits)
            </button>
            <button className="btn btn-secondary" onClick={() => { setSelectedDomain(null); setDraft(null); }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-lg text-ivory font-medium mb-2">Domain Policy Management</h3>
      <p className="text-sm text-muted mb-4">Inspect and modify automation, oversight, transparency, and appeal settings for each domain.</p>

      <div className="grid md:grid-cols-2 gap-3">
        {domains.map(dk => {
          const d = cs.domains[dk];
          const Icon = DOMAIN_ICONS[dk] || Shield;
          return (
            <button
              key={dk}
              className="panel p-4 text-left hover:border-app-light transition"
              onClick={() => { setSelectedDomain(dk); setDraft({}); }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-cyan" />
                <span className="text-sm text-ivory font-medium">{DOMAIN_LABELS[dk]}</span>
              </div>
              <p className="text-xs text-muted mb-3 leading-relaxed">{DOMAIN_DESCRIPTIONS[dk]}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-xs text-dim">Auto</div>
                  <div className="tabular text-sm text-cyan">{d.automation}</div>
                </div>
                <div>
                  <div className="text-xs text-dim">Oversight</div>
                  <div className="tabular text-sm text-amber">{d.oversight}</div>
                </div>
                <div>
                  <div className="text-xs text-dim">Transp.</div>
                  <div className="tabular text-sm text-ivory">{d.transparency}</div>
                </div>
                <div>
                  <div className="text-xs text-dim">Appeal</div>
                  <div className="tabular text-sm text-ivory">{d.appealAccess}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
