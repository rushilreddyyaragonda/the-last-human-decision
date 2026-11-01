import { useGame } from '@/game/GameContext';
import { CAMPAIGN_DEFINITIONS } from '@/game/campaigns';
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from '@/game/constants';
import type { Difficulty } from '@/game/types';
import { ChevronRight, Check } from 'lucide-react';

export function CampaignSelectScreen() {
  const { setScreen, selectCampaign, selectedDifficulty, setDifficulty, savedCampaigns } = useGame();

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6" onClick={() => setScreen('title')}>
          ← Back
        </button>

        <h2 className="text-3xl font-bold text-ivory mb-2">Select Campaign</h2>
        <p className="text-muted text-sm mb-8">Each scenario presents a distinct strategic challenge.</p>

        {/* Difficulty selector */}
        <div className="mb-8">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Difficulty</div>
          <div className="flex flex-col sm:flex-row gap-3">
            {(['guided', 'standard', 'expert'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`panel-2 px-4 py-3 text-left flex-1 transition ${selectedDifficulty === d ? 'border-app-light' : 'opacity-60 hover:opacity-90'}`}
                style={selectedDifficulty === d ? { borderColor: 'var(--color-amber)' } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  {selectedDifficulty === d && <Check size={14} className="text-amber" />}
                  <span className="text-sm text-ivory font-medium">{DIFFICULTY_LABELS[d]}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{DIFFICULTY_DESCRIPTIONS[d]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Campaign cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {CAMPAIGN_DEFINITIONS.map((def, idx) => {
            const hasSave = savedCampaigns.some(c => c.campaignId === def.id && c.state.status === 'active');
            return (
              <button
                key={def.id}
                onClick={() => selectCampaign(def, selectedDifficulty)}
                className="panel p-5 text-left hover:border-app-light transition group flex flex-col"
              >
                <div className="text-xs text-dim mb-2">Campaign {String(idx + 1).padStart(2, '0')}</div>
                <h3 className="text-lg text-ivory font-medium mb-1">{def.name}</h3>
                <p className="text-amber text-xs italic mb-3">{def.tagline}</p>
                <p className="text-muted text-sm leading-relaxed mb-4 flex-1">{def.description}</p>
                <div className="border-t border-app pt-3">
                  <p className="text-xs text-cyan mb-3">{def.strategicQuestion}</p>
                  <div className="flex items-center justify-between">
                    {hasSave && <span className="text-xs text-green-fg">Save exists</span>}
                    <span className="text-xs text-muted group-hover:text-amber transition flex items-center gap-1">
                      View Briefing <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
