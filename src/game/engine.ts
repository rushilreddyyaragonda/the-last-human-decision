import type {
  CampaignState,
  Indicators,
  DomainPolicyMap,
  PolicyDomainKey,
  DomainPolicy,
  PopulationGroupMap,
  PopulationGroupKey,
  RegionMap,
  InvestmentKey,
  InvestmentMap,
  DelayedEffect,
  DecisionRecord,
  Difficulty,
} from './types';
import {
  INDICATOR_KEYS,
  DOMAIN_KEYS,
  GROUP_KEYS,
  INVESTMENT_KEYS,
  DIFFICULTY_MODIFIERS,
  INVESTMENT_COSTS,
  INVESTMENT_LABELS,
  TOTAL_QUARTERS,
} from './constants';

const MIN_VAL = 0;
const MAX_VAL = 100;

export function clamp(v: number, min = MIN_VAL, max = MAX_VAL): number {
  return Math.max(min, Math.min(max, v));
}

export function clampIndicators(ind: Indicators): Indicators {
  const result = { ...ind };
  for (const key of INDICATOR_KEYS) {
    result[key] = clamp(result[key]);
  }
  return result;
}

export function clampDomainPolicy(d: DomainPolicy): DomainPolicy {
  return {
    ...d,
    automation: clamp(d.automation),
    oversight: clamp(d.oversight),
    transparency: clamp(d.transparency),
    appealAccess: clamp(d.appealAccess),
    reliability: clamp(d.reliability),
    implementationCost: Math.max(0, d.implementationCost),
    cooldownUntilQuarter: Math.max(0, d.cooldownUntilQuarter),
  };
}

export function clampDomains(domains: DomainPolicyMap): DomainPolicyMap {
  const result = { ...domains };
  for (const key of DOMAIN_KEYS) {
    result[key] = clampDomainPolicy(result[key]);
  }
  return result;
}

export function clampGroups(groups: PopulationGroupMap): PopulationGroupMap {
  const result = { ...groups };
  for (const key of GROUP_KEYS) {
    result[key] = {
      trust: clamp(result[key].trust),
      serviceAccess: clamp(result[key].serviceAccess),
      perceivedFairness: clamp(result[key].perceivedFairness),
      employmentStability: clamp(result[key].employmentStability),
      automationTolerance: clamp(result[key].automationTolerance),
      appealAbility: clamp(result[key].appealAbility),
    };
  }
  return result;
}

export function clampRegions(regions: RegionMap): RegionMap {
  const result = { ...regions };
  for (const key of Object.keys(result) as (keyof RegionMap)[]) {
    result[key] = {
      ...result[key],
      infrastructureDependence: clamp(result[key].infrastructureDependence),
      economicActivity: clamp(result[key].economicActivity),
      serviceAccess: clamp(result[key].serviceAccess),
      vulnerability: clamp(result[key].vulnerability),
      populationShare: clamp(result[key].populationShare, 0, 100),
    };
  }
  return result;
}

export function calcAutomationAuthority(domains: DomainPolicyMap): number {
  const vals = Object.values(domains).map(d => d.automation);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export function calcQuarterlyIncome(state: CampaignState): number {
  const mod = DIFFICULTY_MODIFIERS[state.difficulty];
  return Math.round((200 + state.indicators.productivity * 3) * mod.incomeMultiplier);
}

export function calcQuarterlyExpenditure(state: CampaignState): number {
  const mod = DIFFICULTY_MODIFIERS[state.difficulty];
  const totalAutomation = Object.values(state.domains).reduce((s, d) => s + d.automation, 0);
  const totalOversight = Object.values(state.domains).reduce((s, d) => s + d.oversight, 0);
  const investmentUpkeep = Object.entries(state.investments).reduce((s, [, v]) => s + v.level * 10, 0);
  return Math.round((50 + totalAutomation * 0.4 + totalOversight * 0.6 + investmentUpkeep) * mod.expenditureMultiplier);
}

export function getIndicatorDirection(state: CampaignState, key: keyof Indicators): 'up' | 'down' | 'stable' {
  const history = state.indicatorHistory;
  if (history.length < 2) return 'stable';
  const current = state.indicators[key];
  const prev = history[history.length - 2].indicators[key];
  const diff = current - prev;
  if (Math.abs(diff) < 1) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

export function getIndicatorContributors(state: CampaignState, key: keyof Indicators): string[] {
  const contributors: string[] = [];
  const ind = state.indicators;
  const domains = state.domains;

  if (key === 'productivity') {
    const avgAutomation = calcAutomationAuthority(domains);
    if (avgAutomation > 60) contributors.push(`High automation authority (${avgAutomation}%) boosting output`);
    if (ind.infrastructureHealth > 70) contributors.push('Strong infrastructure supporting production');
    if (ind.workforceStability < 40) contributors.push('Workforce instability reducing capacity');
    if (state.investments.workforceTransition.level > 0) contributors.push('Workforce transition programs supporting adaptation');
  }
  if (key === 'publicTrust') {
    const avgTransparency = Math.round(Object.values(domains).reduce((s, d) => s + d.transparency, 0) / 5);
    if (avgTransparency > 60) contributors.push(`Transparency initiatives building confidence (${avgTransparency}%)`);
    if (ind.socialEquity < 40) contributors.push('Perceived inequality eroding trust');
    if (state.investments.transparency.level > 0) contributors.push('Public accountability reporting improving perception');
    if (state.overrideHistory.length > 3) contributors.push('Frequent overrides creating uncertainty about system reliability');
  }
  if (key === 'socialEquity') {
    const remoteAccess = state.populationGroups.remoteCommunities.serviceAccess;
    if (remoteAccess < 40) contributors.push('Remote communities receiving inadequate service access');
    if (state.investments.fairnessAudits.level > 0) contributors.push('Fairness audits identifying and correcting disparities');
    if (domains.resourceAllocation.automation > 70 && domains.resourceAllocation.oversight < 30) {
      contributors.push('Resource allocation optimizing for efficiency over fairness');
    }
  }
  if (key === 'civilLiberties') {
    if (domains.publicSafety.automation > 70) contributors.push('Automated public safety enforcement reducing due process');
    if (domains.publicSafety.oversight > 50) contributors.push('Human oversight in public safety protecting rights');
    if (state.investments.transparency.level > 2) contributors.push('Transparency investments strengthening accountability');
  }
  if (key === 'systemResilience') {
    const avgDependence = Object.values(state.regions).reduce((s, r) => s + r.infrastructureDependence, 0) / 5;
    if (avgDependence > 75) contributors.push('High infrastructure interdependence increasing vulnerability');
    if (state.investments.redundancy.level > 0) contributors.push('Redundancy investments improving failure tolerance');
    const avgOversight = Math.round(Object.values(domains).reduce((s, d) => s + d.oversight, 0) / 5);
    if (avgOversight < 30) contributors.push('Low oversight reducing manual recovery capacity');
  }
  if (key === 'humanAgency') {
    const avgAppeal = Math.round(Object.values(domains).reduce((s, d) => s + d.appealAccess, 0) / 5);
    const avgAutomation = calcAutomationAuthority(domains);
    if (avgAppeal < 40) contributors.push(`Limited appeal access (${avgAppeal}%) constraining participation`);
    if (avgAutomation > 70) contributors.push(`High automation authority (${avgAutomation}%) reducing human decision points`);
    if (state.investments.fairnessAudits.level > 1) contributors.push('Appeal system investments expanding access');
  }
  if (key === 'workforceStability') {
    if (domains.economic.automation > 70 && state.investments.workforceTransition.level === 0) {
      contributors.push('High economic automation without retraining displacing workers');
    }
    if (state.investments.workforceTransition.level > 0) contributors.push('Retraining programs improving transition capacity');
    if (ind.productivity > 75) contributors.push('Strong productivity supporting employment demand');
  }
  if (key === 'infrastructureHealth') {
    const avgReliability = Math.round(Object.values(domains).reduce((s, d) => s + d.reliability, 0) / 5);
    if (avgReliability > 75) contributors.push(`Good system reliability (${avgReliability}%)`);
    if (state.investments.redundancy.level > 0) contributors.push('Redundancy investments maintaining backup systems');
    const avgDependence = Object.values(state.regions).reduce((s, r) => s + r.infrastructureDependence, 0) / 5;
    if (avgDependence > 80) contributors.push('Deep interconnection amplifying wear and failure propagation');
  }
  if (key === 'informationIntegrity') {
    if (state.investments.research.level > 0) contributors.push('Research investments improving data validation');
    if (domains.resourceAllocation.automation > 75) contributors.push('Heavy algorithmic dependence increasing data sensitivity');
    if (state.investments.transparency.level > 1) contributors.push('Transparency initiatives improving traceability');
  }

  if (contributors.length === 0) contributors.push('No significant contributing factors at this time');
  return contributors;
}

export function getIndicatorDescriptor(value: number): { label: string; color: string } {
  if (value >= 75) return { label: 'Strong', color: 'success' };
  if (value >= 55) return { label: 'Moderate', color: 'primary' };
  if (value >= 35) return { label: 'Strained', color: 'warning' };
  if (value >= 15) return { label: 'Critical', color: 'error' };
  return { label: 'Failing', color: 'error' };
}

// Apply partial indicator effects
export function applyIndicatorEffects(
  indicators: Indicators,
  effects: Partial<Indicators>
): Indicators {
  const result = { ...indicators };
  for (const key of Object.keys(effects) as (keyof Indicators)[]) {
    result[key] = clamp(result[key] + (effects[key] ?? 0));
  }
  return result;
}

export function applyDomainEffects(
  domains: DomainPolicyMap,
  effects: Partial<Record<PolicyDomainKey, Partial<DomainPolicy>>>
): DomainPolicyMap {
  const result = { ...domains };
  for (const key of Object.keys(effects) as PolicyDomainKey[]) {
    result[key] = clampDomainPolicy({ ...result[key], ...effects[key]! });
  }
  return result;
}

export function applyGroupEffects(
  groups: PopulationGroupMap,
  effects: Partial<Record<PopulationGroupKey, Partial<PopulationGroupMap[PopulationGroupKey]>>>
): PopulationGroupMap {
  const result = { ...groups };
  for (const key of Object.keys(effects) as PopulationGroupKey[]) {
    const g = result[key];
    const e = effects[key]!;
    result[key] = clampGroups({
      ...groups,
      [key]: {
        trust: g.trust + (e.trust ?? 0),
        serviceAccess: g.serviceAccess + (e.serviceAccess ?? 0),
        perceivedFairness: g.perceivedFairness + (e.perceivedFairness ?? 0),
        employmentStability: g.employmentStability + (e.employmentStability ?? 0),
        automationTolerance: g.automationTolerance + (e.automationTolerance ?? 0),
        appealAbility: g.appealAbility + (e.appealAbility ?? 0),
      },
    })[key];
  }
  return result;
}

export function getInvestmentCost(state: CampaignState, key: InvestmentKey): number {
  const config = INVESTMENT_COSTS[key];
  const currentLevel = state.investments[key].level;
  if (currentLevel >= config.maxLevel) return 0;
  return config.baseCost + currentLevel * config.perLevelCost;
}

export function canAffordInvestment(state: CampaignState, key: InvestmentKey): boolean {
  const cost = getInvestmentCost(state, key);
  return state.fiscalReserves >= cost && state.investments[key].level < state.investments[key].maxLevel;
}

export function getInvestmentEffects(state: CampaignState, key: InvestmentKey): {
  indicators: Partial<Indicators>;
  description: string;
} {
  const level = state.investments[key].level;
  const nextLevel = level + 1;
  const dimReturns = Math.max(0.5, 1 - nextLevel * 0.1);

  switch (key) {
    case 'oversight':
      return {
        indicators: {
          systemResilience: Math.round(3 * dimReturns),
          humanAgency: Math.round(2 * dimReturns),
          productivity: Math.round(-1 * dimReturns),
        },
        description: `Increases human oversight capacity by training experts. Improves resilience and agency at a small productivity cost.`,
      };
    case 'redundancy':
      return {
        indicators: {
          systemResilience: Math.round(4 * dimReturns),
          infrastructureHealth: Math.round(2 * dimReturns),
          productivity: Math.round(-1 * dimReturns),
        },
        description: `Builds backup systems and manual alternatives. Significantly improves resilience and infrastructure health.`,
      };
    case 'transparency':
      return {
        indicators: {
          publicTrust: Math.round(3 * dimReturns),
          civilLiberties: Math.round(2 * dimReturns),
          informationIntegrity: Math.round(2 * dimReturns),
        },
        description: `Publishes decision criteria and performance metrics. Improves trust, liberties, and information quality.`,
      };
    case 'workforceTransition':
      return {
        indicators: {
          workforceStability: Math.round(4 * dimReturns),
          socialEquity: Math.round(2 * dimReturns),
          productivity: Math.round(-1 * dimReturns),
        },
        description: `Retrains displaced workers and supports occupational mobility. Improves workforce stability and equity.`,
      };
    case 'fairnessAudits':
      return {
        indicators: {
          socialEquity: Math.round(3 * dimReturns),
          humanAgency: Math.round(2 * dimReturns),
          publicTrust: Math.round(1 * dimReturns),
        },
        description: `Audits algorithmic decisions for bias and strengthens appeals. Improves equity, agency, and trust.`,
      };
    case 'research':
      return {
        indicators: {
          informationIntegrity: Math.round(3 * dimReturns),
          systemResilience: Math.round(2 * dimReturns),
          infrastructureHealth: Math.round(1 * dimReturns),
        },
        description: `Improves system reliability through testing and validation. Improves information quality and resilience.`,
      };
  }
}

export function makeInvestment(state: CampaignState, key: InvestmentKey): CampaignState | { error: string } {
  if (state.investments[key].level >= state.investments[key].maxLevel) {
    return { error: `${INVESTMENT_LABELS[key]} is already at maximum level.` };
  }
  const cost = getInvestmentCost(state, key);
  if (state.fiscalReserves < cost) {
    return { error: `Insufficient funds. ${INVESTMENT_LABELS[key]} costs ${cost} credits. Available: ${state.fiscalReserves}.` };
  }

  const investments: InvestmentMap = {
    ...state.investments,
    [key]: { ...state.investments[key], level: state.investments[key].level + 1 },
  };

  const effects = getInvestmentEffects(state, key);
  const newIndicators = applyIndicatorEffects(state.indicators, effects.indicators);

  const record: DecisionRecord = {
    id: `inv-${state.quarter}-${key}-${Date.now()}`,
    quarter: state.quarter,
    year: state.year,
    title: `Investment: ${INVESTMENT_LABELS[key]}`,
    situation: `Allocating funds to ${INVESTMENT_LABELS[key]} (Level ${state.investments[key].level + 1}).`,
    options: [{ label: 'Confirm Investment', description: effects.description }],
    chosenAction: `Invested ${cost} credits in ${INVESTMENT_LABELS[key]}`,
    stateBefore: { ...state.indicators },
    immediateEffects: [
      `Fiscal reserves reduced by ${cost} credits`,
      effects.description,
    ],
    delayedEffects: [],
    domains: [],
    groups: [],
    explanation: `Investment costs scale with current level. Effects have diminishing returns at higher levels.`,
  };

  return {
    ...state,
    fiscalReserves: state.fiscalReserves - cost,
    indicators: newIndicators,
    investments,
    decisionLedger: [...state.decisionLedger, record],
  };
}

export function adjustPolicy(
  state: CampaignState,
  domain: PolicyDomainKey,
  changes: Partial<DomainPolicy>
): CampaignState | { error: string } {
  const current = state.domains[domain];
  if (state.quarter < current.cooldownUntilQuarter) {
    return { error: `This domain is in a policy adjustment cooldown until quarter ${current.cooldownUntilQuarter}.` };
  }

  const newDomain = clampDomainPolicy({ ...current, ...changes });
  const automationDelta = newDomain.automation - current.automation;
  const oversightDelta = newDomain.oversight - current.oversight;

  // Calculate implementation cost
  const totalDelta = Math.abs(automationDelta) + Math.abs(oversightDelta) +
    Math.abs(newDomain.transparency - current.transparency) +
    Math.abs(newDomain.appealAccess - current.appealAccess);
  const cost = Math.round(totalDelta * 2);

  if (cost > 0 && state.fiscalReserves < cost) {
    return { error: `Insufficient funds for this policy change. Required: ${cost} credits. Available: ${state.fiscalReserves}.` };
  }

  const domains = { ...state.domains, [domain]: newDomain };
  const automationAuthority = calcAutomationAuthority(domains);

  // Immediate indicator effects from policy change
  const indicatorEffects: Partial<Indicators> = {};
  if (automationDelta > 0) {
    indicatorEffects.productivity = Math.round(automationDelta * 0.15);
    indicatorEffects.humanAgency = -Math.round(automationDelta * 0.2);
    indicatorEffects.systemResilience = -Math.round(automationDelta * 0.1);
  } else if (automationDelta < 0) {
    indicatorEffects.productivity = Math.round(automationDelta * 0.15);
    indicatorEffects.humanAgency = -Math.round(automationDelta * 0.2);
    indicatorEffects.systemResilience = -Math.round(automationDelta * 0.1);
  }
  if (oversightDelta > 0) {
    indicatorEffects.publicTrust = Math.round(oversightDelta * 0.1);
    indicatorEffects.humanAgency = (indicatorEffects.humanAgency ?? 0) + Math.round(oversightDelta * 0.1);
    indicatorEffects.productivity = (indicatorEffects.productivity ?? 0) - Math.round(oversightDelta * 0.05);
  }

  const newIndicators = applyIndicatorEffects(state.indicators, indicatorEffects);

  return {
    ...state,
    domains,
    automationAuthority,
    indicators: newIndicators,
    fiscalReserves: state.fiscalReserves - cost,
  };
}

export function previewPolicyChange(
  state: CampaignState,
  domain: PolicyDomainKey,
  changes: Partial<DomainPolicy>
): { cost: number; indicatorEffects: Partial<Indicators>; automationAuthority: number } {
  const current = state.domains[domain];
  const newDomain = clampDomainPolicy({ ...current, ...changes });
  const automationDelta = newDomain.automation - current.automation;
  const oversightDelta = newDomain.oversight - current.oversight;
  const totalDelta = Math.abs(automationDelta) + Math.abs(oversightDelta) +
    Math.abs(newDomain.transparency - current.transparency) +
    Math.abs(newDomain.appealAccess - current.appealAccess);
  const cost = Math.round(totalDelta * 2);

  const indicatorEffects: Partial<Indicators> = {};
  if (automationDelta > 0) {
    indicatorEffects.productivity = Math.round(automationDelta * 0.15);
    indicatorEffects.humanAgency = -Math.round(automationDelta * 0.2);
    indicatorEffects.systemResilience = -Math.round(automationDelta * 0.1);
  } else if (automationDelta < 0) {
    indicatorEffects.productivity = Math.round(automationDelta * 0.15);
    indicatorEffects.humanAgency = -Math.round(automationDelta * 0.2);
    indicatorEffects.systemResilience = -Math.round(automationDelta * 0.1);
  }
  if (oversightDelta > 0) {
    indicatorEffects.publicTrust = Math.round(oversightDelta * 0.1);
    indicatorEffects.humanAgency = (indicatorEffects.humanAgency ?? 0) + Math.round(oversightDelta * 0.1);
    indicatorEffects.productivity = (indicatorEffects.productivity ?? 0) - Math.round(oversightDelta * 0.05);
  }

  const domains = { ...state.domains, [domain]: newDomain };
  return {
    cost,
    indicatorEffects,
    automationAuthority: calcAutomationAuthority(domains),
  };
}

export function scheduleDelayedEffect(
  state: CampaignState,
  effect: Omit<DelayedEffect, 'id'>
): CampaignState {
  const delayedEffect: DelayedEffect = {
    ...effect,
    id: `delayed-${state.quarter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  return {
    ...state,
    delayedEffects: [...state.delayedEffects, delayedEffect],
  };
}

export function resolveDelayedEffects(state: CampaignState): {
  state: CampaignState;
  resolved: DelayedEffect[];
} {
  const stillPending: DelayedEffect[] = [];
  const resolved: DelayedEffect[] = [];
  let indicators = { ...state.indicators };
  let fiscalReserves = state.fiscalReserves;
  let domains = { ...state.domains };

  for (const effect of state.delayedEffects) {
    const remaining = effect.remainingTurns - 1;
    if (remaining <= 0) {
      resolved.push(effect);
      indicators = applyIndicatorEffects(indicators, effect.effects);
      if (effect.effects.fiscalDelta) {
        fiscalReserves += effect.effects.fiscalDelta;
      }
      if (effect.domainEffects) {
        domains = applyDomainEffects(domains, effect.domainEffects);
      }
    } else {
      stillPending.push({ ...effect, remainingTurns: remaining });
    }
  }

  return {
    state: { ...state, indicators, fiscalReserves, domains, delayedEffects: stillPending },
    resolved,
  };
}

export function advanceQuarter(state: CampaignState): CampaignState {
  const newQuarter = state.quarter + 1;
  const newYear = Math.floor(newQuarter / 4) + 1;

  // Resolve delayed effects
  const { state: afterDelayed } = resolveDelayedEffects(state);

  // Apply quarterly income/expenditure
  const income = calcQuarterlyIncome(afterDelayed);
  const expenditure = calcQuarterlyExpenditure(afterDelayed);
  const fiscalDelta = income - expenditure;
  const newFiscalReserves = Math.max(0, afterDelayed.fiscalReserves + fiscalDelta);

  // Apply passive simulation effects from domain configurations
  let indicators = { ...afterDelayed.indicators };
  const mod = DIFFICULTY_MODIFIERS[state.difficulty];

  // Automation effects on productivity (diminishing returns)
  const avgAutomation = calcAutomationAuthority(afterDelayed.domains);
  if (avgAutomation > 50) {
    indicators.productivity = clamp(indicators.productivity + Math.round((avgAutomation - 50) * 0.02));
  }

  // Low oversight erodes human agency gradually
  const avgOversight = Math.round(Object.values(afterDelayed.domains).reduce((s, d) => s + d.oversight, 0) / 5);
  if (avgOversight < 35) {
    indicators.humanAgency = clamp(indicators.humanAgency - Math.round((35 - avgOversight) * 0.05 * mod.eventSeverity));
  }

  // Low appeal access erodes human agency
  const avgAppeal = Math.round(Object.values(afterDelayed.domains).reduce((s, d) => s + d.appealAccess, 0) / 5);
  if (avgAppeal < 40) {
    indicators.humanAgency = clamp(indicators.humanAgency - Math.round((40 - avgAppeal) * 0.04 * mod.eventSeverity));
  }

  // High automation with low resilience degrades infrastructure
  if (avgAutomation > 70 && indicators.systemResilience < 40) {
    indicators.infrastructureHealth = clamp(indicators.infrastructureHealth - Math.round(2 * mod.eventSeverity));
  }

  // Investment passive effects
  for (const invKey of INVESTMENT_KEYS) {
    const level = afterDelayed.investments[invKey].level;
    if (level === 0) continue;
    const dimReturns = Math.max(0.3, 1 - level * 0.08);
    switch (invKey) {
      case 'oversight':
        indicators.systemResilience = clamp(indicators.systemResilience + Math.round(0.5 * dimReturns));
        break;
      case 'redundancy':
        indicators.infrastructureHealth = clamp(indicators.infrastructureHealth + Math.round(0.5 * dimReturns));
        indicators.systemResilience = clamp(indicators.systemResilience + Math.round(0.3 * dimReturns));
        break;
      case 'transparency':
        indicators.publicTrust = clamp(indicators.publicTrust + Math.round(0.4 * dimReturns));
        break;
      case 'workforceTransition':
        indicators.workforceStability = clamp(indicators.workforceStability + Math.round(0.5 * dimReturns));
        break;
      case 'fairnessAudits':
        indicators.socialEquity = clamp(indicators.socialEquity + Math.round(0.4 * dimReturns));
        break;
      case 'research':
        indicators.informationIntegrity = clamp(indicators.informationIntegrity + Math.round(0.4 * dimReturns));
        break;
    }
  }

  // Social equity influenced by group disparities
  const groupAccess = Object.values(afterDelayed.populationGroups).map(g => g.serviceAccess);
  const accessRange = Math.max(...groupAccess) - Math.min(...groupAccess);
  if (accessRange > 40) {
    indicators.socialEquity = clamp(indicators.socialEquity - 1);
  }

  // Public trust influenced by average group trust
  const avgGroupTrust = Math.round(Object.values(afterDelayed.populationGroups).reduce((s, g) => s + g.trust, 0) / 4);
  indicators.publicTrust = clamp(indicators.publicTrust + Math.round((avgGroupTrust - indicators.publicTrust) * 0.1));

  // Information integrity degrades if automation is very high without research
  if (avgAutomation > 80 && afterDelayed.investments.research.level === 0) {
    indicators.informationIntegrity = clamp(indicators.informationIntegrity - Math.round(1 * mod.eventSeverity));
  }

  // Civil liberties eroded by high public safety automation
  if (afterDelayed.domains.publicSafety.automation > 75) {
    indicators.civilLiberties = clamp(indicators.civilLiberties - Math.round(1 * mod.eventSeverity));
  }

  // Cooldowns decrement
  const domains = { ...afterDelayed.domains };
  for (const key of DOMAIN_KEYS) {
    if (domains[key].cooldownUntilQuarter > newQuarter) {
      // keep it
    } else {
      domains[key] = { ...domains[key], cooldownUntilQuarter: 0 };
    }
  }

  // Record indicator history
  const automationAuthority = calcAutomationAuthority(domains);
  const indicatorHistory = [...afterDelayed.indicatorHistory, {
    quarter: newQuarter,
    indicators: { ...indicators },
    fiscalReserves: newFiscalReserves,
    automationAuthority,
  }];

  // Check for campaign end
  const isLastQuarter = newQuarter >= TOTAL_QUARTERS;

  return {
    ...afterDelayed,
    quarter: newQuarter,
    year: newYear,
    indicators: clampIndicators(indicators),
    domains: clampDomains(domains),
    automationAuthority,
    fiscalReserves: newFiscalReserves,
    quarterlyIncome: income,
    quarterlyExpenditure: expenditure,
    indicatorHistory,
    turnPhase: 'situation',
    status: isLastQuarter ? 'ended' : 'active',
  };
}

export function recordDecision(
  state: CampaignState,
  record: Omit<DecisionRecord, 'id' | 'quarter' | 'year'>
): CampaignState {
  const fullRecord: DecisionRecord = {
    ...record,
    id: `dec-${state.quarter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    quarter: state.quarter,
    year: state.year,
  };
  return {
    ...state,
    decisionLedger: [...state.decisionLedger, fullRecord],
  };
}

export function checkCriticalFailure(state: CampaignState): { failed: boolean; reason?: string } {
  if (state.indicators.publicTrust < 10) {
    return { failed: true, reason: 'Public trust has collapsed. Institutions have lost legitimacy.' };
  }
  if (state.indicators.civilLiberties < 8) {
    return { failed: true, reason: 'Civil liberties have been eroded beyond recovery. The society has become authoritarian.' };
  }
  if (state.indicators.infrastructureHealth < 8 && state.indicators.systemResilience < 10) {
    return { failed: true, reason: 'Infrastructure has suffered catastrophic failure with no recovery capacity.' };
  }
  if (state.indicators.socialEquity < 8 && state.indicators.publicTrust < 20) {
    return { failed: true, reason: 'Social inequality and distrust have triggered societal breakdown.' };
  }
  return { failed: false };
}

export { GROUP_KEYS };
