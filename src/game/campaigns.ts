import type { CampaignState, Difficulty, DomainPolicyMap, DomainPolicy, PopulationGroupMap, PopulationGroupState, RegionMap, RegionState, InvestmentMap } from './types';
import { SeededRNG, hashStringToSeed } from './rng';
import { DIFFICULTY_MODIFIERS, SAVE_DATA_VERSION } from './constants';

export interface CampaignDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  strategicQuestion: string;
  briefing: string;
  difficultyRecommendation?: Difficulty;
}

export const CAMPAIGN_DEFINITIONS: CampaignDefinition[] = [
  {
    id: 'efficient-republic',
    name: 'The Efficient Republic',
    tagline: 'Prosperity at the cost of understanding',
    description: 'A prosperous society wants to automate more public services. Infrastructure is strong, but institutional dependence on automated decisions is growing.',
    strategicQuestion: 'Can efficiency grow without making society dependent on systems it no longer understands?',
    briefing: 'The Efficient Republic has thrived under algorithmic governance. Productivity is high, trust is strong, and services run smoothly. But beneath the surface, fewer and fewer people understand how the systems actually work. The question is not whether automation works — it does. The question is what happens when it doesn\'t.',
  },
  {
    id: 'unequal-city',
    name: 'The Unequal City',
    tagline: 'Averages hide inequalities',
    description: 'A technologically advanced society has distributed its benefits unevenly. Automated systems perform well on average, but some communities consistently receive worse outcomes.',
    strategicQuestion: 'Can the player improve fairness without making essential systems unaffordable or unreliable?',
    briefing: 'The Unequal City runs efficiently on paper. Aggregate metrics look strong, but the benefits of automation have not reached everyone. Remote communities and industrial workers report worse outcomes, lower access, and diminishing trust. The systems are not broken — they are optimized for the wrong things.',
  },
  {
    id: 'fragile-network',
    name: 'The Fragile Network',
    tagline: 'Efficiency through interconnection',
    description: 'A society relies on tightly interconnected automated infrastructure. It performs well under normal conditions but is vulnerable to cascading failures.',
    strategicQuestion: 'How much efficiency should society sacrifice to survive a major disruption?',
    briefing: 'The Fragile Network has achieved remarkable efficiency through deep interconnection. Every system talks to every other system. When everything works, it works beautifully. But the same connections that enable efficiency also transmit failure. A single point of failure could cascade across the entire society.',
  },
];

function makeDomains(base: Record<string, Partial<DomainPolicy>>): DomainPolicyMap {
  const defaults: DomainPolicyMap = {
    economic: { automation: 60, oversight: 40, transparency: 50, appealAccess: 50, reliability: 75, implementationCost: 0, cooldownUntilQuarter: 0 },
    resourceAllocation: { automation: 55, oversight: 45, transparency: 45, appealAccess: 40, reliability: 70, implementationCost: 0, cooldownUntilQuarter: 0 },
    transportation: { automation: 70, oversight: 35, transparency: 55, appealAccess: 30, reliability: 80, implementationCost: 0, cooldownUntilQuarter: 0 },
    publicSafety: { automation: 50, oversight: 55, transparency: 40, appealAccess: 45, reliability: 72, implementationCost: 0, cooldownUntilQuarter: 0 },
    healthcare: { automation: 45, oversight: 60, transparency: 50, appealAccess: 55, reliability: 78, implementationCost: 0, cooldownUntilQuarter: 0 },
  };
  for (const key of Object.keys(base) as (keyof DomainPolicyMap)[]) {
    defaults[key] = { ...defaults[key], ...base[key]! };
  }
  return defaults;
}

function makeGroups(base: Record<string, Partial<PopulationGroupState>>): PopulationGroupMap {
  const defaults: PopulationGroupMap = {
    urbanProfessionals: { trust: 65, serviceAccess: 80, perceivedFairness: 65, employmentStability: 70, automationTolerance: 75, appealAbility: 65 },
    industrialWorkers: { trust: 50, serviceAccess: 60, perceivedFairness: 50, employmentStability: 55, automationTolerance: 45, appealAbility: 40 },
    remoteCommunities: { trust: 45, serviceAccess: 40, perceivedFairness: 40, employmentStability: 50, automationTolerance: 35, appealAbility: 30 },
    publicServiceInstitutions: { trust: 55, serviceAccess: 70, perceivedFairness: 55, employmentStability: 65, automationTolerance: 55, appealAbility: 50 },
  };
  for (const key of Object.keys(base) as (keyof PopulationGroupMap)[]) {
    defaults[key] = { ...defaults[key], ...base[key]! };
  }
  return defaults;
}

function makeRegions(base: Record<string, Partial<RegionState>>): RegionMap {
  const defaults: RegionMap = {
    centralDistrict: { populationShare: 30, infrastructureDependence: 75, economicActivity: 85, serviceAccess: 85, vulnerability: 30 },
    industrialBelt: { populationShare: 25, infrastructureDependence: 70, economicActivity: 70, serviceAccess: 65, vulnerability: 45 },
    coastalCorridor: { populationShare: 20, infrastructureDependence: 80, economicActivity: 75, serviceAccess: 70, vulnerability: 40 },
    northernCommunities: { populationShare: 15, infrastructureDependence: 50, economicActivity: 45, serviceAccess: 40, vulnerability: 70 },
    researchQuarter: { populationShare: 10, infrastructureDependence: 65, economicActivity: 80, serviceAccess: 80, vulnerability: 35 },
  };
  for (const key of Object.keys(base) as (keyof RegionMap)[]) {
    defaults[key] = { ...defaults[key], ...base[key]! };
  }
  return defaults;
}

function makeInvestments(): InvestmentMap {
  return {
    oversight: { level: 0, maxLevel: 5 },
    redundancy: { level: 0, maxLevel: 5 },
    transparency: { level: 0, maxLevel: 5 },
    workforceTransition: { level: 0, maxLevel: 5 },
    fairnessAudits: { level: 0, maxLevel: 5 },
    research: { level: 0, maxLevel: 5 },
  };
}

function calcAutomationAuthority(domains: DomainPolicyMap): number {
  const vals = Object.values(domains).map(d => d.automation);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function calcQuarterlyIncome(productivity: number, difficulty: Difficulty): number {
  const mod = DIFFICULTY_MODIFIERS[difficulty];
  return Math.round((200 + productivity * 3) * mod.incomeMultiplier);
}

function calcQuarterlyExpenditure(domains: DomainPolicyMap, difficulty: Difficulty): number {
  const mod = DIFFICULTY_MODIFIERS[difficulty];
  const totalAutomation = Object.values(domains).reduce((s, d) => s + d.automation, 0);
  const totalOversight = Object.values(domains).reduce((s, d) => s + d.oversight, 0);
  return Math.round((50 + totalAutomation * 0.4 + totalOversight * 0.6) * mod.expenditureMultiplier);
}

export function createCampaign(
  campaignDefId: string,
  difficulty: Difficulty,
  customSeed?: number
): CampaignState {
  const def = CAMPAIGN_DEFINITIONS.find(d => d.id === campaignDefId)!;
  const seed = customSeed ?? hashStringToSeed(`${def.id}-${difficulty}-${Date.now()}`);
  const rng = new SeededRNG(seed);

  let domains: DomainPolicyMap;
  let regions: RegionMap;
  let groups: PopulationGroupMap;
  let indicators: CampaignState['indicators'];
  let fiscalReserves: number;

  switch (def.id) {
    case 'efficient-republic':
      domains = makeDomains({
        economic: { automation: 75, oversight: 30, transparency: 45, appealAccess: 40, reliability: 85 },
        resourceAllocation: { automation: 70, oversight: 35, transparency: 40, appealAccess: 35, reliability: 80 },
        transportation: { automation: 85, oversight: 25, transparency: 50, appealAccess: 25, reliability: 88 },
        publicSafety: { automation: 60, oversight: 45, transparency: 35, appealAccess: 40, reliability: 80 },
        healthcare: { automation: 55, oversight: 50, transparency: 45, appealAccess: 50, reliability: 82 },
      });
      regions = makeRegions({});
      groups = makeGroups({
        urbanProfessionals: { trust: 75, serviceAccess: 90, perceivedFairness: 70, automationTolerance: 85 },
        industrialWorkers: { trust: 55, serviceAccess: 65, perceivedFairness: 50, employmentStability: 45, automationTolerance: 40 },
        remoteCommunities: { trust: 50, serviceAccess: 50, perceivedFairness: 45, automationTolerance: 40 },
      });
      indicators = {
        productivity: 78, publicTrust: 68, socialEquity: 58, civilLiberties: 60,
        systemResilience: 55, humanAgency: 45, workforceStability: 50,
        infrastructureHealth: 82, informationIntegrity: 70,
      };
      fiscalReserves = 600;
      break;

    case 'unequal-city':
      domains = makeDomains({
        economic: { automation: 65, oversight: 40, transparency: 40, appealAccess: 35, reliability: 72 },
        resourceAllocation: { automation: 70, oversight: 30, transparency: 35, appealAccess: 30, reliability: 68 },
        transportation: { automation: 60, oversight: 40, transparency: 45, appealAccess: 35, reliability: 75 },
        publicSafety: { automation: 55, oversight: 45, transparency: 35, appealAccess: 35, reliability: 70 },
        healthcare: { automation: 50, oversight: 50, transparency: 40, appealAccess: 40, reliability: 73 },
      });
      regions = makeRegions({
        northernCommunities: { serviceAccess: 25, vulnerability: 85, economicActivity: 30 },
        industrialBelt: { serviceAccess: 50, vulnerability: 55 },
      });
      groups = makeGroups({
        urbanProfessionals: { trust: 70, serviceAccess: 85, perceivedFairness: 65, automationTolerance: 80 },
        industrialWorkers: { trust: 35, serviceAccess: 45, perceivedFairness: 30, employmentStability: 35, automationTolerance: 30 },
        remoteCommunities: { trust: 25, serviceAccess: 20, perceivedFairness: 25, employmentStability: 35, automationTolerance: 20, appealAbility: 15 },
        publicServiceInstitutions: { trust: 45, serviceAccess: 60, perceivedFairness: 40 },
      });
      indicators = {
        productivity: 65, publicTrust: 45, socialEquity: 35, civilLiberties: 55,
        systemResilience: 60, humanAgency: 40, workforceStability: 45,
        infrastructureHealth: 70, informationIntegrity: 55,
      };
      fiscalReserves = 450;
      break;

    case 'fragile-network':
      domains = makeDomains({
        economic: { automation: 70, oversight: 35, transparency: 50, appealAccess: 45, reliability: 78 },
        resourceAllocation: { automation: 65, oversight: 40, transparency: 45, appealAccess: 40, reliability: 75 },
        transportation: { automation: 80, oversight: 25, transparency: 55, appealAccess: 30, reliability: 72 },
        publicSafety: { automation: 60, oversight: 45, transparency: 40, appealAccess: 40, reliability: 74 },
        healthcare: { automation: 55, oversight: 50, transparency: 45, appealAccess: 45, reliability: 76 },
      });
      regions = makeRegions({
        coastalCorridor: { infrastructureDependence: 90, vulnerability: 60 },
        centralDistrict: { infrastructureDependence: 85, vulnerability: 50 },
        industrialBelt: { infrastructureDependence: 82, vulnerability: 55 },
      });
      groups = makeGroups({
        urbanProfessionals: { trust: 60, serviceAccess: 80, automationTolerance: 70 },
        industrialWorkers: { trust: 50, serviceAccess: 60, employmentStability: 48 },
        remoteCommunities: { trust: 45, serviceAccess: 45 },
      });
      indicators = {
        productivity: 75, publicTrust: 55, socialEquity: 55, civilLiberties: 58,
        systemResilience: 35, humanAgency: 42, workforceStability: 55,
        infrastructureHealth: 68, informationIntegrity: 60,
      };
      fiscalReserves = 400;
      break;

    default:
      // Fallback (should never hit)
      domains = makeDomains({});
      regions = makeRegions({});
      groups = makeGroups({});
      indicators = {
        productivity: 65, publicTrust: 55, socialEquity: 55, civilLiberties: 55,
        systemResilience: 55, humanAgency: 50, workforceStability: 55,
        infrastructureHealth: 70, informationIntegrity: 60,
      };
      fiscalReserves = 500;
  }

  const automationAuthority = calcAutomationAuthority(domains);
  const quarterlyIncome = calcQuarterlyIncome(indicators.productivity, difficulty);
  const quarterlyExpenditure = calcQuarterlyExpenditure(domains, difficulty);

  void rng; // used by event engine later via stored seed

  return {
    version: SAVE_DATA_VERSION,
    campaignId: def.id,
    campaignName: def.name,
    seed,
    difficulty,
    quarter: 0,
    year: 1,
    fiscalReserves,
    quarterlyIncome,
    quarterlyExpenditure,
    indicators,
    automationAuthority,
    domains,
    regions,
    populationGroups: groups,
    investments: makeInvestments(),
    delayedEffects: [],
    decisionLedger: [],
    overrideHistory: [],
    completedResearch: [],
    pendingResearch: [],
    eventHistory: [],
    triggeredEventIds: [],
    pendingEvent: null,
    pendingOverride: null,
    indicatorHistory: [{
      quarter: 0,
      indicators: { ...indicators },
      fiscalReserves,
      automationAuthority,
    }],
    turnPhase: 'situation',
    status: 'active',
    ending: null,
    endingNarrative: null,
  };
}
