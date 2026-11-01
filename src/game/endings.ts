import type {
  CampaignState,
  EndingType,
  EndingResult,
  Indicators,
  IndicatorKey,
  DecisionRecord,
} from './types';
import {
  INDICATOR_LABELS,
  INDICATOR_KEYS,
  DOMAIN_KEYS,
  DOMAIN_LABELS,
} from './constants';
import { calcAutomationAuthority } from './engine';

interface ScoredEnding {
  type: EndingType;
  score: number;
}

export function evaluateEnding(state: CampaignState): EndingResult {
  const ind = state.indicators;
  const avgAutomation = calcAutomationAuthority(state.domains);
  const avgOversight = Math.round(Object.values(state.domains).reduce((s, d) => s + d.oversight, 0) / 5);
  const avgAppeal = Math.round(Object.values(state.domains).reduce((s, d) => s + d.appealAccess, 0) / 5);
  const avgTransparency = Math.round(Object.values(state.domains).reduce((s, d) => s + d.transparency, 0) / 5);

  const scores: ScoredEnding[] = [];

  // The Accountable Republic
  // Effective automated services + strong oversight + trust + appeal mechanisms
  scores.push({
    type: 'accountableRepublic',
    score:
      (ind.productivity >= 60 ? 20 : ind.productivity / 3) +
      (avgOversight >= 50 ? 20 : avgOversight / 2.5) +
      (avgAppeal >= 50 ? 15 : avgAppeal / 3.3) +
      (ind.publicTrust >= 60 ? 20 : ind.publicTrust / 3) +
      (ind.humanAgency >= 50 ? 15 : ind.humanAgency / 3.3) +
      (ind.civilLiberties >= 55 ? 10 : ind.civilLiberties / 5.5) -
      (avgAutomation > 80 ? 15 : 0),
  });

  // The Efficient Machine
  // High productivity + high automation + weakened human agency
  scores.push({
    type: 'efficientMachine',
    score:
      (ind.productivity >= 75 ? 30 : ind.productivity / 2.5) +
      (avgAutomation >= 75 ? 25 : avgAutomation / 3) +
      (ind.humanAgency < 40 ? 20 : 0) +
      (avgOversight < 35 ? 15 : 0) +
      (avgAppeal < 35 ? 10 : 0) -
      (ind.publicTrust > 60 ? 15 : 0),
  });

  // The Fractured Society
  // Uneven outcomes + deteriorating trust + legitimacy crisis
  scores.push({
    type: 'fracturedSociety',
    score:
      (ind.socialEquity < 35 ? 25 : Math.max(0, (50 - ind.socialEquity) / 1.5)) +
      (ind.publicTrust < 30 ? 25 : Math.max(0, (45 - ind.publicTrust) / 1.8)) +
      (ind.humanAgency < 35 ? 15 : 0) +
      (getGroupTrustRange(state) > 35 ? 15 : 0) +
      (state.overrideHistory.length > 5 ? 10 : 0) +
      (ind.civilLiberties < 40 ? 10 : 0),
  });

  // The Resilient Commonwealth
  // Invested in redundancy + human expertise + recovery capacity
  scores.push({
    type: 'resilientCommonwealth',
    score:
      (ind.systemResilience >= 65 ? 25 : ind.systemResilience / 2.6) +
      (ind.infrastructureHealth >= 65 ? 20 : ind.infrastructureHealth / 3.25) +
      (state.investments.redundancy.level >= 3 ? 15 : state.investments.redundancy.level * 4) +
      (state.investments.oversight.level >= 3 ? 15 : state.investments.oversight.level * 4) +
      (ind.workforceStability >= 55 ? 10 : ind.workforceStability / 5.5) +
      (avgOversight >= 45 ? 10 : 0) +
      (ind.humanAgency >= 45 ? 5 : 0),
  });

  // The Permanent Emergency
  // Repeated failures + restrictive emergency powers + deteriorated civil liberties
  scores.push({
    type: 'permanentEmergency',
    score:
      (ind.civilLiberties < 25 ? 30 : Math.max(0, (35 - ind.civilLiberties) / 1.17)) +
      (ind.systemResilience < 25 ? 20 : 0) +
      (ind.infrastructureHealth < 25 ? 15 : 0) +
      (state.domains.publicSafety.automation > 80 ? 15 : 0) +
      (ind.publicTrust < 30 ? 10 : 0) +
      (ind.humanAgency < 25 ? 10 : 0),
  });

  // The Last Human Decision
  // A final consequential choice about delegating an exceptionally important decision
  // This ending triggers when the society is at a crossroads — moderate across dimensions
  // with high automation and a key decision point
  scores.push({
    type: 'lastHumanDecision',
    score:
      (avgAutomation >= 70 ? 15 : 0) +
      (ind.humanAgency >= 35 && ind.humanAgency <= 55 ? 15 : 0) +
      (ind.publicTrust >= 35 && ind.publicTrust <= 60 ? 10 : 0) +
      (state.overrideHistory.length >= 3 ? 10 : 0) +
      (ind.productivity >= 55 && ind.productivity <= 75 ? 10 : 0) +
      (Math.abs(ind.humanAgency - 45) < 15 ? 10 : 0) +
      (state.quarter >= 22 ? 10 : 0),
  });

  // The Unfinished Transition
  // Functional but unresolved tension
  scores.push({
    type: 'unfinishedTransition',
    score:
      (ind.productivity >= 45 && ind.productivity <= 65 ? 15 : 0) +
      (ind.publicTrust >= 40 && ind.publicTrust <= 60 ? 15 : 0) +
      (ind.humanAgency >= 35 && ind.humanAgency <= 50 ? 15 : 0) +
      (ind.socialEquity >= 40 && ind.socialEquity <= 55 ? 10 : 0) +
      (avgAutomation >= 55 && avgAutomation <= 70 ? 10 : 0) +
      (state.overrideHistory.length >= 1 && state.overrideHistory.length <= 4 ? 10 : 0) +
      (avgOversight >= 35 && avgOversight <= 50 ? 10 : 0),
  });

  // Sort by score, highest first
  scores.sort((a, b) => b.score - a.score);
  const winning = scores[0];

  return buildEndingResult(state, winning.type);
}

function getGroupTrustRange(state: CampaignState): number {
  const trusts = Object.values(state.populationGroups).map(g => g.trust);
  return Math.max(...trusts) - Math.min(...trusts);
}

function buildEndingResult(state: CampaignState, type: EndingType): EndingResult {
  const ind = state.indicators;
  const avgAutomation = calcAutomationAuthority(state.domains);

  const endingData: Record<EndingType, {
    title: string;
    narrative: string;
    summary: string;
  }> = {
    accountableRepublic: {
      title: 'The Accountable Republic',
      narrative: `After six years of careful governance, your society has achieved something rare: a balance between algorithmic efficiency and human accountability. Automated systems handle routine decisions with speed and consistency, while meaningful oversight ensures that consequential choices remain in human hands. Citizens trust their institutions because those institutions can explain their decisions, correct their errors, and be challenged when they are wrong.\n\nProductivity stands at ${ind.productivity}%, public trust at ${ind.publicTrust}%, and human agency at ${ind.humanAgency}%. The appeal mechanisms you built mean that no citizen is entirely powerless before an algorithm. The oversight you maintained means that no system operates beyond understanding.\n\nThis did not come free. The oversight infrastructure cost resources that could have been invested elsewhere. Some efficiency gains were sacrificed to preserve human judgment. But the society that emerged is one that works not just efficiently, but legitimately.`,
      summary: 'A society that combined effective automated services with strong oversight, institutional trust, and meaningful human appeal mechanisms.',
    },
    efficientMachine: {
      title: 'The Efficient Machine',
      narrative: `Your society has achieved remarkable productivity. At ${ind.productivity}%, the economy outperforms any previous era. Automated systems manage transportation, resource allocation, healthcare, and public safety with a speed and consistency that human administrators could never match.\n\nBut efficiency has come at a cost that the metrics do not capture. Human agency stands at ${ind.humanAgency}%. Oversight has been reduced to a formality. The appeal mechanisms that once gave citizens recourse against algorithmic decisions have been streamlined into irrelevance. Few people understand how the systems work, and fewer still can challenge them.\n\nThe society functions. It may even flourish, by certain measures. But when a system makes a wrong decision — and systems always do, eventually — there is no one left who can question it. The last human decision was not a single dramatic moment. It was a thousand small surrenders, each one rational, each one efficient, each one bringing the society one step closer to a future where questioning the machine is no longer an option.`,
      summary: 'Productivity is high, but institutional dependence has increased and human agency has weakened.',
    },
    fracturedSociety: {
      title: 'The Fractured Society',
      narrative: `The aggregate numbers told a story of success. Productivity at ${ind.productivity}%, services running smoothly on average. But averages concealed a deeper reality.\n\nTrust between population groups diverged dramatically. While some communities experienced the benefits of automation, others were consistently left behind. Social equity fell to ${ind.socialEquity}%. The remote communities and industrial workers who bore the costs of automation had no meaningful way to challenge the systems that shaped their lives. Human agency at ${ind.humanAgency}% meant that the people most affected by algorithmic decisions had the least power to influence them.\n\nThe institutions did not fail catastrophically. They simply lost legitimacy, slowly and then suddenly. Citizens stopped believing that the system could be reformed from within. The society remains technically functional, but it governs with the consent of only some of its people. The question is no longer whether algorithms make good decisions, but whether a society can hold together when only half its members believe it serves them.`,
      summary: 'Uneven outcomes and deteriorating trust undermined the legitimacy of public institutions.',
    },
    resilientCommonwealth: {
      title: 'The Resilient Commonwealth',
      narrative: `Your society did not achieve the highest productivity. At ${ind.productivity}%, it lagged behind more aggressively automated peers. But when disruptions came — and they came — your society was ready.\n\nSystem resilience at ${ind.systemResilience}% and infrastructure health at ${ind.infrastructureHealth}% meant that failures did not cascade. The redundancy you invested in, the human expertise you preserved, the emergency reserves you maintained — all of these cost resources that could have boosted quarterly productivity. But when the network faltered, when systems failed, when conditions changed beyond what the algorithms were designed for, your society recovered.\n\nHuman agency at ${ind.humanAgency}% means that citizens retained the ability to influence decisions that affected them. The workforce transition programs you funded meant that displaced workers found new roles. The oversight you maintained meant that failures were caught and corrected.\n\nThis society sacrificed some efficiency for resilience. In a world of perfect systems, that sacrifice would have been unnecessary. But systems are never perfect, and the society that can absorb failure is the one that endures.`,
      summary: 'A society that invested in redundancy, human expertise, and recovery capacity, even at some cost to short-term efficiency.',
    },
    permanentEmergency: {
      title: 'The Permanent Emergency',
      narrative: `It started with a crisis. Then another. Then another. Each one justified emergency measures — expanded surveillance, suspended appeal rights, automated enforcement without oversight. Each measure was temporary, until it was not.\n\nCivil liberties fell to ${ind.civilLiberties}%. The public safety system operates at ${state.domains.publicSafety.automation}% automation with minimal oversight. Emergency powers granted during a crisis were never fully revoked because the next crisis always arrived before the previous one was resolved.\n\nThe society is safe, by certain definitions. Crime is low. Response times are fast. But safety purchased with freedom is not safety — it is control. Citizens at ${ind.publicTrust}% trust do not trust their institutions; they comply with them. Human agency at ${ind.humanAgency}% means that people have learned to expect decisions to be made for them, not by them or with them.\n\nThe permanent emergency is not a single catastrophe. It is the gradual normalization of exception. Each emergency was real. Each response was justified. But the accumulation of justified exceptions produced a society that has forgotten what normal means.`,
      summary: 'Repeated failures led to increasingly restrictive emergency powers and a deterioration of civil liberties.',
    },
    lastHumanDecision: {
      title: 'The Last Human Decision',
      narrative: `After six years, your society stands at a crossroads. Automation authority is at ${avgAutomation}%. Productivity is ${ind.productivity}%, public trust is ${ind.publicTrust}%, and human agency hovers at ${ind.humanAgency}%. The balance between human and algorithmic authority has never been fully resolved.\n\nNow, a final decision approaches. The systems have proposed a comprehensive integration that would unify all automated decision-making under a single optimization framework. It would be more efficient, more consistent, and more profitable than the current patchwork of human and automated authority.\n\nBut it would also mean that the last meaningful domain of human decision-making — the decision about which decisions to delegate — would itself be delegated.\n\nThis is the last human decision: not whether algorithms can make good decisions, but whether the decision to let them should itself be automated. Everything your society has experienced — the overrides, the investigations, the reforms, the crises — has led to this moment.\n\nThe question is not whether the machine will make the right choice. The question is whether the choice should be the machine's to make.`,
      summary: 'The society faces a final consequential choice about whether to delegate an exceptionally important decision or retain human authority.',
    },
    unfinishedTransition: {
      title: 'The Unfinished Transition',
      narrative: `Six years have passed, and your society remains in a state of unresolved tension. Productivity at ${ind.productivity}% is adequate but not exceptional. Public trust at ${ind.publicTrust}% is stable but not strong. Human agency at ${ind.humanAgency}% exists but is constrained.\n\nThe society works, in the sense that it has not failed. Institutions function, services are delivered, and most citizens live without acute crisis. But the central question — what should remain human when algorithms can decide everything — has not been answered.\n\nSome domains are highly automated with minimal oversight. Others retain human authority at the cost of efficiency. The result is neither the efficiency of a fully automated society nor the accountability of a human-governed one. It is a compromise, and like all compromises, it satisfies no one entirely.\n\nThe transition is unfinished. The question remains open. Perhaps that is the honest outcome: a society that has not pretended to resolve a question that may not have a single answer, and that continues to struggle with it, thoughtfully, imperfectly, and humanly.`,
      summary: 'The society remains functional but has not resolved the central tension between automation, accountability, and human agency.',
    },
  };

  const data = endingData[type];

  // Identify strongest and weakest areas
  const sortedIndicators = [...INDICATOR_KEYS].sort((a, b) => ind[b] - ind[a]);
  const strongestAreas = sortedIndicators.slice(0, 3).map(k => INDICATOR_LABELS[k]);
  const weakestAreas = sortedIndicators.slice(-3).reverse().map(k => INDICATOR_LABELS[k]);

  // Identify most consequential decisions
  const keyDecisions = state.decisionLedger
    .filter(d => d.delayedEffects.length > 0 || d.domains.length > 1)
    .slice(-5);

  // Identify tradeoffs
  const tradeoffs: string[] = [];
  if (ind.productivity > 70 && ind.humanAgency < 45) {
    tradeoffs.push('Accepted higher productivity in exchange for reduced human agency');
  }
  if (ind.systemResilience > 60 && ind.productivity < 60) {
    tradeoffs.push('Sacrificed productivity to maintain system resilience');
  }
  if (ind.socialEquity > 60 && state.fiscalReserves < 200) {
    tradeoffs.push('Invested in social equity at the cost of fiscal reserves');
  }
  if (state.investments.redundancy.level > 2 && ind.productivity < 65) {
    tradeoffs.push('Invested in redundancy rather than maximizing efficiency');
  }
  if (state.overrideHistory.length > 3) {
    tradeoffs.push('Frequently overrode automated recommendations, accepting inefficiency for human judgment');
  }
  if (state.domains.publicSafety.automation > 70 && ind.civilLiberties < 50) {
    tradeoffs.push('Expanded automated public safety at the expense of civil liberties');
  }
  if (state.investments.transparency.level > 2 && ind.publicTrust > 55) {
    tradeoffs.push('Invested in transparency to strengthen public trust');
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push('Maintained a general balance across dimensions without extreme trade-offs');
  }

  return {
    type,
    title: data.title,
    narrative: data.narrative,
    summary: data.summary,
    strongestAreas,
    weakestAreas,
    keyDecisions,
    tradeoffs,
  };
}

export function createCampaignSummary(state: CampaignState, ending: EndingResult) {
  return {
    campaignId: state.campaignId,
    campaignName: state.campaignName,
    seed: state.seed,
    difficulty: state.difficulty,
    endingType: ending.type,
    endingTitle: ending.title,
    finalIndicators: { ...state.indicators },
    finalFiscalReserves: state.fiscalReserves,
    totalOverrides: state.overrideHistory.length,
    completedQuarters: state.quarter,
    dateCompleted: new Date().toISOString(),
  };
}
