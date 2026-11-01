import { useGame } from '@/game/GameContext';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { hasSavedCampaign } from '@/game/persistence';
import { CAMPAIGN_DEFINITIONS } from '@/game/campaigns';
import { Save, BookOpen, Info, Code2, RotateCcw } from 'lucide-react';

export function TitleScreen() {
  const { setScreen, savedCampaigns } = useGame();

  const hasSave = savedCampaigns.length > 0 && savedCampaigns.some(c => c.state.status === 'active');

  return (
    <div className="min-h-screen bg-app grid-bg flex flex-col items-center justify-center relative overflow-hidden">
      <NetworkCanvas className="absolute inset-0 w-full h-full opacity-40" nodeCount={25} />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        <div className="mb-2 text-cyan text-xs tracking-[0.3em] uppercase">Civic Systems Initiative</div>

        <h1 className="text-5xl md:text-6xl font-bold text-ivory tracking-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
          The Last Human Decision
        </h1>

        <p className="text-amber text-lg italic mb-8" style={{ fontWeight: 300 }}>
          When algorithms control everything, what should remain human?
        </p>

        <p className="text-muted text-sm leading-relaxed mb-10 max-w-lg mx-auto">
          Year 2049. Most decisions that once defined human society are now made by systems faster,
          cheaper, and more consistent than their human counterparts. You have been appointed director
          of the Civic Systems Initiative. Your mandate is simple: build a society that works. Your real
          challenge is deciding what "works" should mean.
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            className="btn btn-primary w-64"
            onClick={() => setScreen('campaignSelect')}
          >
            Begin Simulation
          </button>

          {hasSave && (
            <button
              className="btn btn-cyan w-64"
              onClick={() => setScreen('history')}
            >
              <Save size={16} />
              Continue Campaign
            </button>
          )}

          <div className="flex gap-3 mt-2">
            <button className="btn btn-secondary" onClick={() => setScreen('tutorial')}>
              <BookOpen size={14} />
              How to Play
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('developer')}>
              <Code2 size={14} />
              The Developer
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('about')}>
              <Info size={14} />
              About
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-dim">
        A strategy simulation about automation, power, and the future of human decision-making
      </div>
    </div>
  );
}
