import type {
  CampaignState,
  ResearchKey,
  CompletedResearch,
  PendingResearch,
} from './types';
import { SeededRNG } from './rng';
import { RESEARCH_COSTS, RESEARCH_LABELS } from './constants';

export function canStartResearch(state: CampaignState, key: ResearchKey): boolean {
  if (state.pendingResearch.some(r => r.key === key)) return false;
  if (state.completedResearch.some(r => r.key === key)) return false;
  const cost = RESEARCH_COSTS[key].cost;
  return state.fiscalReserves >= cost;
}

export function getResearchCost(key: ResearchKey): number {
  return RESEARCH_COSTS[key].cost;
}

export function startResearch(state: CampaignState, key: ResearchKey): CampaignState | { error: string } {
  if (state.pendingResearch.some(r => r.key === key)) {
    return { error: `${RESEARCH_LABELS[key]} is already in progress.` };
  }
  if (state.completedResearch.some(r => r.key === key)) {
    return { error: `${RESEARCH_LABELS[key]} has already been completed.` };
  }
  const cost = RESEARCH_COSTS[key].cost;
  if (state.fiscalReserves < cost) {
    return { error: `Insufficient funds. ${RESEARCH_LABELS[key]} costs ${cost} credits. Available: ${state.fiscalReserves}.` };
  }

  const pending: PendingResearch = {
    key,
    startQuarter: state.quarter,
    completeQuarter: state.quarter + RESEARCH_COSTS[key].duration,
    cost,
  };

  return {
    ...state,
    fiscalReserves: state.fiscalReserves - cost,
    pendingResearch: [...state.pendingResearch, pending],
  };
}

export function resolveCompletedResearch(state: CampaignState): {
  state: CampaignState;
  newlyCompleted: CompletedResearch[];
} {
  const stillPending: PendingResearch[] = [];
  const newlyCompleted: CompletedResearch[] = [];

  for (const pending of state.pendingResearch) {
    if (state.quarter >= pending.completeQuarter) {
      const completed = generateResearchFindings(state, pending.key);
      newlyCompleted.push(completed);
    } else {
      stillPending.push(pending);
    }
  }

  return {
    state: {
      ...state,
      pendingResearch: stillPending,
      completedResearch: [...state.completedResearch, ...newlyCompleted],
    },
    newlyCompleted,
  };
}

function generateResearchFindings(state: CampaignState, key: ResearchKey): CompletedResearch {
  const rng = new SeededRNG(state.seed + state.quarter * 113 + key.length * 7);

  switch (key) {
    case 'algorithmicBias': {
      const remoteDisparity = state.populationGroups.remoteCommunities.serviceAccess - state.populationGroups.urbanProfessionals.serviceAccess;
      const industrialFairness = state.populationGroups.industrialWorkers.perceivedFairness;
      const biasScore = Math.abs(remoteDisparity) + (50 - industrialFairness);
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The investigation found that automated systems produce a bias score of ${Math.round(biasScore)} on the disparity index. ${
          biasScore > 30
            ? 'This indicates significant algorithmic bias affecting remote communities and industrial workers. The systems optimize for aggregate outcomes without accounting for structural disadvantages.'
            : biasScore > 15
              ? 'Moderate bias was detected. Some systems produce slightly worse outcomes for disadvantaged groups, though the disparity is not severe.'
              : 'Minimal bias was detected. The systems appear to be producing reasonably equitable outcomes across population groups.'
        }`,
        data: {
          biasScore: Math.round(biasScore),
          remoteCommunityDisparity: Math.round(remoteDisparity),
          industrialWorkerFairness: Math.round(industrialFairness),
          recommendation: biasScore > 30 ? 'Implement fairness constraints and regular audits' : 'Monitor for emerging bias',
        },
      };
    }
    case 'infrastructureDependencies': {
      const avgDependence = Math.round(Object.values(state.regions).reduce((s, r) => s + r.infrastructureDependence, 0) / 5);
      const criticalNodes = avgDependence > 75 ? 3 : avgDependence > 60 ? 2 : 1;
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The dependency audit identified ${criticalNodes} critical single point${criticalNodes > 1 ? 's' : ''} of failure in the infrastructure network. Average infrastructure interdependence is ${avgDependence}%. ${
          criticalNodes > 2
            ? 'The high number of critical nodes indicates significant cascade failure risk. Decentralization or redundancy investment is strongly recommended.'
            : 'The number of critical nodes is manageable but should be monitored. Current redundancy levels may be adequate.'
        }`,
        data: {
          averageDependence: avgDependence,
          criticalNodes,
          cascadeRisk: criticalNodes > 2 ? 'High' : 'Moderate',
          recommendation: criticalNodes > 2 ? 'Invest in decentralization' : 'Maintain current redundancy',
        },
      };
    }
    case 'publicTrust': {
      const groups = state.populationGroups;
      const avgTrust = Math.round((groups.urbanProfessionals.trust + groups.industrialWorkers.trust + groups.remoteCommunities.trust + groups.publicServiceInstitutions.trust) / 4);
      const trustRange = Math.max(groups.urbanProfessionals.trust, groups.industrialWorkers.trust, groups.remoteCommunities.trust, groups.publicServiceInstitutions.trust) -
        Math.min(groups.urbanProfessionals.trust, groups.industrialWorkers.trust, groups.remoteCommunities.trust, groups.publicServiceInstitutions.trust);
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The trust survey measured an average group trust of ${avgTrust}% with a disparity of ${trustRange} percentage points between groups. ${
          trustRange > 30
            ? 'The large trust gap between groups indicates that some populations feel significantly disenfranchised. Targeted engagement is needed.'
            : 'Trust levels are relatively consistent across groups, though absolute levels may need improvement.'
        }`,
        data: {
          averageTrust: avgTrust,
          trustDisparity: trustRange,
          urbanProfessionals: groups.urbanProfessionals.trust,
          industrialWorkers: groups.industrialWorkers.trust,
          remoteCommunities: groups.remoteCommunities.trust,
          publicServiceInstitutions: groups.publicServiceInstitutions.trust,
        },
      };
    }
    case 'workforceDisruption': {
      const stability = state.indicators.workforceStability;
      const automation = state.domains.economic.automation;
      const displacement = automation > 70 ? Math.round((automation - 60) * 50) : Math.round(automation * 0.3);
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The workforce analysis estimates ${displacement} workers are at risk of displacement in the next year. Current workforce stability is ${stability}%. Economic automation is at ${automation}%. ${
          displacement > 500
            ? 'The displacement risk is significant. Retraining and transition support are urgently needed.'
            : 'The displacement risk is moderate. Current transition programs may be adequate if maintained.'
        }`,
        data: {
          workersAtRisk: displacement,
          workforceStability: stability,
          economicAutomation: automation,
          retrainingCapacity: state.investments.workforceTransition.level,
        },
      };
    }
    case 'dataQuality': {
      const integrity = state.indicators.informationIntegrity;
      const conflicts = integrity < 50 ? Math.round(rng.float(3, 8)) : Math.round(rng.float(0, 2));
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The data quality assessment found ${conflicts} active data conflict${conflicts !== 1 ? 's' : ''} across automated systems. Information integrity is rated at ${integrity}%. ${
          conflicts > 3
            ? 'Multiple data conflicts indicate systemic quality issues. A data governance framework is needed.'
            : 'The low number of conflicts suggests data quality is generally acceptable, though monitoring should continue.'
        }`,
        data: {
          activeConflicts: conflicts,
          informationIntegrity: integrity,
          dataQualityScore: Math.round(integrity * 0.8 + (10 - conflicts) * 2),
        },
      };
    }
    case 'institutionalAccountability': {
      const avgTransparency = Math.round(Object.values(state.domains).reduce((s, d) => s + d.transparency, 0) / 5);
      const avgAppeal = Math.round(Object.values(state.domains).reduce((s, d) => s + d.appealAccess, 0) / 5);
      const accountabilityScore = Math.round((avgTransparency + avgAppeal + state.indicators.humanAgency) / 3);
      return {
        key,
        quarterCompleted: state.quarter,
        findings: `The accountability review rated the society at ${accountabilityScore}% on the accountability index. Average transparency is ${avgTransparency}%, appeal access is ${avgAppeal}%, and human agency is ${state.indicators.humanAgency}%. ${
          accountabilityScore < 40
            ? 'Low accountability scores indicate that citizens have limited ability to understand, challenge, or appeal automated decisions. Structural reforms are needed.'
            : 'Accountability mechanisms are present but could be strengthened. The current level provides a reasonable foundation.'
        }`,
        data: {
          accountabilityScore,
          averageTransparency: avgTransparency,
          averageAppealAccess: avgAppeal,
          humanAgency: state.indicators.humanAgency,
        },
      };
    }
  }
}
