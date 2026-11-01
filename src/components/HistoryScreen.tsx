import { useGame } from '@/game/GameContext';
import { History, ArrowLeft, Play, Trash2 } from 'lucide-react';

export function HistoryScreen() {
  const { setScreen, savedCampaigns, continueCampaign, deleteSavedCampaign, campaignHistory } = useGame();

  const activeSaves = savedCampaigns.filter(c => c.state.status === 'active');

  return (
    <div className="min-h-screen bg-app grid-bg p-6 md:p-10 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto">
        <button className="text-muted hover:text-ivory text-sm mb-6 flex items-center gap-1" onClick={() => setScreen('title')}>
          <ArrowLeft size={14} /> Back to Main Menu
        </button>

        <div className="flex items-center gap-3 mb-6">
          <History size={24} className="text-amber" />
          <h1 className="text-2xl text-ivory font-bold">Campaign History</h1>
        </div>

        {/* Active saves */}
        <div className="mb-8">
          <h3 className="text-sm text-cyan font-medium mb-3">Saved Campaigns</h3>
          {activeSaves.length === 0 ? (
            <div className="panel p-6 text-center">
              <p className="text-sm text-muted">No active saved campaigns. Start a new one from the campaign selection screen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSaves.map(({ campaignId, state }) => (
                <div key={campaignId} className="panel p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-ivory font-medium">{state.campaignName}</div>
                      <div className="text-xs text-muted">
                        Year {state.year}, Quarter {(state.quarter % 4) + 1} · {state.difficulty}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-cyan text-xs" style={{ padding: '6px 12px' }} onClick={() => continueCampaign(campaignId)}>
                        <Play size={12} /> Continue
                      </button>
                      <button
                        className="btn btn-danger text-xs"
                        style={{ padding: '6px 12px' }}
                        onClick={() => { if (confirm('Delete this saved campaign?')) deleteSavedCampaign(campaignId); }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed campaigns */}
        {campaignHistory.length > 0 && (
          <div>
            <h3 className="text-sm text-cyan font-medium mb-3">Completed Campaigns</h3>
            <div className="space-y-2">
              {[...campaignHistory].reverse().map((h, i) => (
                <div key={i} className="panel p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ivory">{h.campaignName}</div>
                    <div className="text-xs text-muted">{h.endingTitle} · {h.difficulty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-dim tabular">{new Date(h.dateCompleted).toLocaleDateString()}</div>
                    <div className="text-xs text-amber tabular">{h.totalOverrides} overrides</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <button className="btn btn-primary" onClick={() => setScreen('campaignSelect')}>
            Start New Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
