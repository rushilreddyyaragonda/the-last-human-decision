import { useGame } from '@/game/GameContext';
import { IndicatorGrid } from '@/components/IndicatorDisplay';
import { DIFFICULTY_LABELS } from '@/game/constants';
import { calcAutomationAuthority } from '@/game/engine';
import { Play, ArrowLeft } from 'lucide-react';

export function BriefingScreen() {
  const { setScreen, selectedCampaignDef, selectedDifficulty, startNewCampaign, savedCampaigns, continueCampaign } = useGame();

  if (!selectedCampaignDef) {
    setScreen('campaignSelect');
    return null;
  }

  const hasSave = savedCampaigns.some(c => c.campaignId === selectedCampaignDef.id && c.state.status === 'active');
  const saved = savedCampaigns.find(c => c.campaignId === selectedCampaignDef.id && c.state.status === 'active');

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6 flex items-center gap-1" onClick={() => setScreen('campaignSelect')}>
          <ArrowLeft size={14} /> Back to Campaign Selection
        </button>

        <div className="text-xs text-cyan tracking-wider uppercase mb-2">Campaign Briefing</div>
        <h2 className="text-3xl font-bold text-ivory mb-2">{selectedCampaignDef.name}</h2>
        <p className="text-amber italic mb-6">{selectedCampaignDef.tagline}</p>

        <div className="panel p-6 mb-6">
          <p className="text-ivory text-sm leading-relaxed mb-6">{selectedCampaignDef.briefing}</p>

          <div className="border-t border-app pt-4">
            <div className="text-xs text-cyan tracking-wider uppercase mb-3">Strategic Question</div>
            <p className="text-ivory text-sm italic">{selectedCampaignDef.strategicQuestion}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="panel p-4">
            <div className="text-xs text-muted tracking-wider uppercase mb-3">Difficulty</div>
            <div className="text-lg text-amber">{DIFFICULTY_LABELS[selectedDifficulty]}</div>
          </div>
          <div className="panel p-4">
            <div className="text-xs text-muted tracking-wider uppercase mb-3">Campaign Duration</div>
            <div className="text-lg text-ivory">24 Quarters (6 Years)</div>
          </div>
        </div>

        {hasSave && saved && (
          <div className="panel p-4 mb-6 border-amber" style={{ borderColor: 'var(--color-amber)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-amber mb-1">Existing Save Found</div>
                <p className="text-xs text-muted">
                  Year {saved.state.year}, Quarter {saved.state.quarter + 1}. You can continue from your previous progress.
                </p>
              </div>
              <button
                className="btn btn-cyan"
                onClick={() => continueCampaign(selectedCampaignDef.id)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={startNewCampaign}>
            <Play size={16} />
            {hasSave ? 'Start New Campaign' : 'Begin Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
