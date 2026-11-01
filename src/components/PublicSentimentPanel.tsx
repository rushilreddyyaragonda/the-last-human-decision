import { useState } from 'react';
import { useGame } from '@/game/GameContext';
import { INDICATOR_LABELS } from '@/game/constants';
import { getIndicatorDescriptor, getIndicatorDirection, getIndicatorContributors } from '@/game/engine';
import type { CampaignState, IndicatorKey } from '@/game/types';
import { StatBar } from '@/components/IndicatorDisplay';

export function PublicSentimentPanel() {
  const { campaignState } = useGame();
  if (!campaignState) return null;
  const cs = campaignState;

  const groups = Object.entries(cs.populationGroups);
  const groupLabels: Record<string, string> = {
    urbanProfessionals: 'Urban Professionals',
    industrialWorkers: 'Industrial Workers',
    remoteCommunities: 'Remote Communities',
    publicServiceInstitutions: 'Public Service Institutions',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-lg text-ivory font-medium mb-2">Public Sentiment Analysis</h3>
      <p className="text-sm text-muted mb-4">The population is represented by four analytical groups with distinct experiences and concerns.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map(([key, group]) => {
          const attrs: Array<{ k: keyof typeof group; label: string }> = [
            { k: 'trust', label: 'Trust' },
            { k: 'serviceAccess', label: 'Service Access' },
            { k: 'perceivedFairness', label: 'Perceived Fairness' },
            { k: 'employmentStability', label: 'Employment Stability' },
            { k: 'automationTolerance', label: 'Automation Tolerance' },
            { k: 'appealAbility', label: 'Appeal Ability' },
          ];

          return (
            <div key={key} className="panel p-4">
              <h4 className="text-sm text-cyan font-medium mb-3">{groupLabels[key]}</h4>
              <div className="space-y-2">
                {attrs.map(a => {
                  const val = group[a.k] as number;
                  return (
                    <div key={a.k}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-muted">{a.label}</span>
                        <span className="tabular text-xs text-ivory">{val}</span>
                      </div>
                      <StatBar
                        value={val}
                        color={val > 60 ? 'var(--color-green)' : val > 35 ? 'var(--color-amber)' : 'var(--color-red)'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel p-4 mt-4">
        <div className="text-xs text-cyan tracking-wider uppercase mb-3">Group Trust Comparison</div>
        <div className="space-y-2">
          {groups.map(([key, group]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted w-40">{groupLabels[key]}</span>
              <div className="flex-1">
                <StatBar value={group.trust} color="var(--color-amber)" />
              </div>
              <span className="tabular text-xs text-ivory w-8 text-right">{group.trust}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-dim mt-3">
          Trust disparity between groups indicates unequal experiences. Large gaps can lead to social instability.
        </p>
      </div>
    </div>
  );
}
