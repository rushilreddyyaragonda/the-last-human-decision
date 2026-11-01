export type IndicatorKey =
  | 'productivity'
  | 'publicTrust'
  | 'socialEquity'
  | 'civilLiberties'
  | 'systemResilience'
  | 'humanAgency'
  | 'workforceStability'
  | 'infrastructureHealth'
  | 'informationIntegrity';

export type PolicyDomainKey =
  | 'economic'
  | 'resourceAllocation'
  | 'transportation'
  | 'publicSafety'
  | 'healthcare';

export type PopulationGroupKey =
  | 'urbanProfessionals'
  | 'industrialWorkers'
  | 'remoteCommunities'
  | 'publicServiceInstitutions';

export type RegionKey =
  | 'centralDistrict'
  | 'industrialBelt'
  | 'coastalCorridor'
  | 'northernCommunities'
  | 'researchQuarter';

export type InvestmentKey =
  | 'oversight'
  | 'redundancy'
  | 'transparency'
  | 'workforceTransition'
  | 'fairnessAudits'
  | 'research';

export type ResearchKey =
  | 'algorithmicBias'
  | 'infrastructureDependencies'
  | 'publicTrust'
  | 'workforceDisruption'
  | 'dataQuality'
  | 'institutionalAccountability';

export type Difficulty = 'guided' | 'standard' | 'expert';

export type EndingType =
  | 'accountableRepublic'
  | 'efficientMachine'
  | 'fracturedSociety'
  | 'resilientCommonwealth'
  | 'permanentEmergency'
  | 'lastHumanDecision'
  | 'unfinishedTransition';

export interface Indicators {
  productivity: number;
  publicTrust: number;
  socialEquity: number;
  civilLiberties: number;
  systemResilience: number;
  humanAgency: number;
  workforceStability: number;
  infrastructureHealth: number;
  informationIntegrity: number;
}

export interface DomainPolicy {
  automation: number;       // 0-100
  oversight: number;        // 0-100
  transparency: number;     // 0-100
  appealAccess: number;     // 0-100
  reliability: number;      // 0-100 (derived-ish, current)
  implementationCost: number;
  cooldownUntilQuarter: number;
}

export type DomainPolicyMap = Record<PolicyDomainKey, DomainPolicy>;

export interface PopulationGroupState {
  trust: number;
  serviceAccess: number;
  perceivedFairness: number;
  employmentStability: number;
  automationTolerance: number;
  appealAbility: number;
}

export type PopulationGroupMap = Record<PopulationGroupKey, PopulationGroupState>;

export interface RegionState {
  populationShare: number;
  infrastructureDependence: number;
  economicActivity: number;
  serviceAccess: number;
  vulnerability: number;
}

export type RegionMap = Record<RegionKey, RegionState>;

export interface InvestmentLevel {
  level: number;
  maxLevel: number;
}

export type InvestmentMap = Record<InvestmentKey, InvestmentLevel>;

export interface DelayedEffect {
  id: string;
  sourceDecision: string;
  description: string;
  resolveQuarter: number;
  remainingTurns: number;
  effects: Partial<Indicators> & { fiscalDelta?: number };
  domainEffects?: Partial<Record<PolicyDomainKey, Partial<DomainPolicy>>>;
  regionKey?: RegionKey;
}

export interface DecisionRecord {
  id: string;
  quarter: number;
  year: number;
  title: string;
  situation: string;
  options: Array<{ label: string; description: string }>;
  chosenAction: string;
  stateBefore: Partial<Indicators>;
  immediateEffects: string[];
  delayedEffects: string[];
  domains: PolicyDomainKey[];
  groups: PopulationGroupKey[];
  explanation: string;
}

export interface CompletedResearch {
  key: ResearchKey;
  quarterCompleted: number;
  findings: string;
  data: Record<string, number | string>;
}

export interface PendingResearch {
  key: ResearchKey;
  startQuarter: number;
  completeQuarter: number;
  cost: number;
}

export interface OverrideRecord {
  id: string;
  quarter: number;
  domain: PolicyDomainKey;
  recommendation: string;
  systemObjective: string;
  action: string;
  effects: string[];
}

export interface EventLogEntry {
  eventId: string;
  eventTitle: string;
  quarter: number;
  outcome: string;
}

export interface CampaignState {
  version: number;
  campaignId: string;
  campaignName: string;
  seed: number;
  difficulty: Difficulty;
  quarter: number;             // 0-23
  year: number;                // 1-6 (derived but stored)
  fiscalReserves: number;
  quarterlyIncome: number;
  quarterlyExpenditure: number;
  indicators: Indicators;
  automationAuthority: number; // 0-100 overall
  domains: DomainPolicyMap;
  regions: RegionMap;
  populationGroups: PopulationGroupMap;
  investments: InvestmentMap;
  delayedEffects: DelayedEffect[];
  decisionLedger: DecisionRecord[];
  overrideHistory: OverrideRecord[];
  completedResearch: CompletedResearch[];
  pendingResearch: PendingResearch[];
  eventHistory: EventLogEntry[];
  triggeredEventIds: string[];
  pendingEvent: GameStateEvent | null;
  pendingOverride: OverrideSituation | null;
  indicatorHistory: Array<{ quarter: number; indicators: Indicators; fiscalReserves: number; automationAuthority: number }>;
  turnPhase: TurnPhase;
  status: 'active' | 'ended';
  ending: EndingType | null;
  endingNarrative: string | null;
}

export type TurnPhase =
  | 'situation'
  | 'systemPerformance'
  | 'decision'
  | 'allocation'
  | 'resolution'
  | 'publicResponse'
  | 'review'
  | 'complete';

export interface GameStateEvent {
  id: string;
  title: string;
  category: 'crisis' | 'opportunity' | 'social' | 'infrastructure' | 'governance';
  description: string;
  affectedDomains: PolicyDomainKey[];
  affectedGroups: PopulationGroupKey[];
  options: EventOption[];
  triggerDescription: string;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  effects: Partial<Indicators> & { fiscalDelta?: number };
  delayedEffects?: Array<{
    description: string;
    delayTurns: number;
    effects: Partial<Indicators> & { fiscalDelta?: number };
  }>;
  domainEffects?: Partial<Record<PolicyDomainKey, Partial<DomainPolicy>>>;
  groupEffects?: Partial<Record<PopulationGroupKey, Partial<PopulationGroupState>>>;
  explanation: string;
  outcomeText: string;
}

export interface OverrideSituation {
  id: string;
  domain: PolicyDomainKey;
  title: string;
  description: string;
  systemObjective: string;
  recommendation: string;
  supportingData: Array<{ label: string; value: string }>;
  affectedPopulations: string[];
  uncertainty: number;
  potentialBenefits: string[];
  risks: string[];
  options: OverrideOption[];
  explanationSteps: string[];
}

export interface OverrideOption {
  id: string;
  label: string;
  description: string;
  effects: Partial<Indicators> & { fiscalDelta?: number };
  domainEffects?: Partial<Record<PolicyDomainKey, Partial<DomainPolicy>>>;
  groupEffects?: Partial<Record<PopulationGroupKey, Partial<PopulationGroupState>>>;
  delayedEffects?: Array<{
    description: string;
    delayTurns: number;
    effects: Partial<Indicators> & { fiscalDelta?: number };
  }>;
  explanation: string;
}

export interface EndingResult {
  type: EndingType;
  title: string;
  narrative: string;
  summary: string;
  strongestAreas: string[];
  weakestAreas: string[];
  keyDecisions: DecisionRecord[];
  tradeoffs: string[];
}

export interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  seed: number;
  difficulty: Difficulty;
  endingType: EndingType;
  endingTitle: string;
  finalIndicators: Indicators;
  finalFiscalReserves: number;
  totalOverrides: number;
  completedQuarters: number;
  dateCompleted: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationIntensity: 'off' | 'subtle' | 'full';
  textSize: 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
}

export interface SaveData {
  version: number;
  campaigns: Record<string, CampaignState>;
  campaignHistory: CampaignSummary[];
  settings: GameSettings;
  tutorialCompleted: boolean;
}
