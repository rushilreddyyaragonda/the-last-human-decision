import type {
  IndicatorKey,
  PolicyDomainKey,
  PopulationGroupKey,
  RegionKey,
  InvestmentKey,
  ResearchKey,
  Difficulty,
} from './types';

export const SAVE_DATA_VERSION = 1;
export const TOTAL_QUARTERS = 24;
export const QUARTERS_PER_YEAR = 4;
export const FISCAL_UNIT = 'credits';

export const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  productivity: 'Economic Productivity',
  publicTrust: 'Public Trust',
  socialEquity: 'Social Equity',
  civilLiberties: 'Civil Liberties',
  systemResilience: 'System Resilience',
  humanAgency: 'Human Agency',
  workforceStability: 'Workforce Stability',
  infrastructureHealth: 'Infrastructure Health',
  informationIntegrity: 'Information Integrity',
};

export const INDICATOR_DESCRIPTIONS: Record<IndicatorKey, string> = {
  productivity: 'The society\'s capacity to produce goods and deliver services.',
  publicTrust: 'Confidence in public institutions and decision-making systems.',
  socialEquity: 'How evenly opportunities and essential services are distributed.',
  civilLiberties: 'Protection of privacy, individual rights, and freedom from coercive decisions.',
  systemResilience: 'Ability to withstand failures and recover from disruptions.',
  humanAgency: 'People\'s practical ability to influence important decisions affecting their lives.',
  workforceStability: 'Employment continuity and the society\'s capacity to transition between occupations.',
  infrastructureHealth: 'Operational reliability of interconnected public infrastructure.',
  informationIntegrity: 'Quality, traceability, and reliability of information used by public institutions.',
};

export const DOMAIN_LABELS: Record<PolicyDomainKey, string> = {
  economic: 'Economic & Employment',
  resourceAllocation: 'Resource Allocation',
  transportation: 'Transportation & Infrastructure',
  publicSafety: 'Public Safety & Security',
  healthcare: 'Healthcare & Essential Services',
};

export const DOMAIN_DESCRIPTIONS: Record<PolicyDomainKey, string> = {
  economic: 'Employment matching, economic planning, and workforce allocation decisions.',
  resourceAllocation: 'Distribution of public resources, benefits, and opportunity matching.',
  transportation: 'Transit systems, logistics, and infrastructure management.',
  publicSafety: 'Law enforcement, surveillance, and public security decisions.',
  healthcare: 'Medical resource allocation, triage, and essential service delivery.',
};

export const GROUP_LABELS: Record<PopulationGroupKey, string> = {
  urbanProfessionals: 'Urban Professionals',
  industrialWorkers: 'Industrial Workers',
  remoteCommunities: 'Remote Communities',
  publicServiceInstitutions: 'Public Service Institutions',
};

export const GROUP_DESCRIPTIONS: Record<PopulationGroupKey, string> = {
  urbanProfessionals: 'City-dwelling knowledge workers with high technology fluency.',
  industrialWorkers: 'Manufacturing and logistics workers affected by automation transitions.',
  remoteCommunities: 'Geographically distant populations with limited service access.',
  publicServiceInstitutions: 'Public sector organizations delivering essential services.',
};

export const REGION_LABELS: Record<RegionKey, string> = {
  centralDistrict: 'Central District',
  industrialBelt: 'Industrial Belt',
  coastalCorridor: 'Coastal Corridor',
  northernCommunities: 'Northern Communities',
  researchQuarter: 'Research Quarter',
};

export const REGION_DESCRIPTIONS: Record<RegionKey, string> = {
  centralDistrict: 'Dense urban core with high economic activity and service demand.',
  industrialBelt: 'Manufacturing heartland transitioning to automated production.',
  coastalCorridor: 'Trade and logistics hub with critical port infrastructure.',
  northernCommunities: 'Remote settlements with limited connectivity and higher service costs.',
  researchQuarter: 'Technology and education cluster with high innovation capacity.',
};

export const INVESTMENT_LABELS: Record<InvestmentKey, string> = {
  oversight: 'Human Oversight & Expertise',
  redundancy: 'Infrastructure Redundancy',
  transparency: 'Public Transparency & Accountability',
  workforceTransition: 'Workforce Transition & Retraining',
  fairnessAudits: 'Fairness Audits & Appeal Systems',
  research: 'Research & System Reliability',
};

export const INVESTMENT_DESCRIPTIONS: Record<InvestmentKey, string> = {
  oversight: 'Train and retain human experts capable of reviewing and overriding automated decisions.',
  redundancy: 'Build backup systems and manual alternatives for critical infrastructure.',
  transparency: 'Publish decision criteria, performance metrics, and accountability reports.',
  workforceTransition: 'Retrain displaced workers and support occupational mobility.',
  fairnessAudits: 'Audit algorithmic decisions for bias and strengthen appeal mechanisms.',
  research: 'Improve system reliability through testing, validation, and failure analysis.',
};

export const INVESTMENT_COSTS: Record<InvestmentKey, { baseCost: number; maxLevel: number; perLevelCost: number }> = {
  oversight: { baseCost: 80, maxLevel: 5, perLevelCost: 80 },
  redundancy: { baseCost: 100, maxLevel: 5, perLevelCost: 100 },
  transparency: { baseCost: 60, maxLevel: 5, perLevelCost: 60 },
  workforceTransition: { baseCost: 70, maxLevel: 5, perLevelCost: 70 },
  fairnessAudits: { baseCost: 50, maxLevel: 5, perLevelCost: 50 },
  research: { baseCost: 90, maxLevel: 5, perLevelCost: 90 },
};

export const RESEARCH_LABELS: Record<ResearchKey, string> = {
  algorithmicBias: 'Algorithmic Bias Investigation',
  infrastructureDependencies: 'Infrastructure Dependency Audit',
  publicTrust: 'Public Trust Survey',
  workforceDisruption: 'Workforce Disruption Analysis',
  dataQuality: 'Data Quality Assessment',
  institutionalAccountability: 'Institutional Accountability Review',
};

export const RESEARCH_DESCRIPTIONS: Record<ResearchKey, string> = {
  algorithmicBias: 'Investigate whether automated systems produce disparate outcomes across population groups.',
  infrastructureDependencies: 'Map critical infrastructure dependencies and identify cascading failure risks.',
  publicTrust: 'Survey population groups to measure trust, perceived fairness, and confidence in institutions.',
  workforceDisruption: 'Analyze employment transitions, displacement patterns, and retraining effectiveness.',
  dataQuality: 'Assess the accuracy, completeness, and consistency of data used by automated systems.',
  institutionalAccountability: 'Review oversight mechanisms, appeal processes, and decision transparency.',
};

export const RESEARCH_COSTS: Record<ResearchKey, { cost: number; duration: number }> = {
  algorithmicBias: { cost: 120, duration: 2 },
  infrastructureDependencies: { cost: 100, duration: 2 },
  publicTrust: { cost: 80, duration: 1 },
  workforceDisruption: { cost: 90, duration: 2 },
  dataQuality: { cost: 70, duration: 1 },
  institutionalAccountability: { cost: 110, duration: 2 },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  guided: 'Guided',
  standard: 'Standard',
  expert: 'Expert',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  guided: 'More frequent explanations, less severe resource pressure, clearer previews.',
  standard: 'Balanced resource pressure, partial information, meaningful trade-offs.',
  expert: 'Tighter budgets, greater uncertainty, stronger dependency effects, demanding recovery.',
};

export const DIFFICULTY_MODIFIERS: Record<Difficulty, {
  incomeMultiplier: number;
  expenditureMultiplier: number;
  eventSeverity: number;
  uncertaintyFactor: number;
  recoveryCost: number;
}> = {
  guided: { incomeMultiplier: 1.25, expenditureMultiplier: 0.8, eventSeverity: 0.7, uncertaintyFactor: 0.5, recoveryCost: 0.7 },
  standard: { incomeMultiplier: 1.0, expenditureMultiplier: 1.0, eventSeverity: 1.0, uncertaintyFactor: 1.0, recoveryCost: 1.0 },
  expert: { incomeMultiplier: 0.8, expenditureMultiplier: 1.25, eventSeverity: 1.3, uncertaintyFactor: 1.5, recoveryCost: 1.4 },
};

export const INDICATOR_KEYS: IndicatorKey[] = [
  'productivity', 'publicTrust', 'socialEquity', 'civilLiberties',
  'systemResilience', 'humanAgency', 'workforceStability',
  'infrastructureHealth', 'informationIntegrity',
];

export const DOMAIN_KEYS: PolicyDomainKey[] = [
  'economic', 'resourceAllocation', 'transportation', 'publicSafety', 'healthcare',
];

export const GROUP_KEYS: PopulationGroupKey[] = [
  'urbanProfessionals', 'industrialWorkers', 'remoteCommunities', 'publicServiceInstitutions',
];

export const REGION_KEYS: RegionKey[] = [
  'centralDistrict', 'industrialBelt', 'coastalCorridor', 'northernCommunities', 'researchQuarter',
];

export const INVESTMENT_KEYS: InvestmentKey[] = [
  'oversight', 'redundancy', 'transparency', 'workforceTransition', 'fairnessAudits', 'research',
];

export const RESEARCH_KEYS: ResearchKey[] = [
  'algorithmicBias', 'infrastructureDependencies', 'publicTrust',
  'workforceDisruption', 'dataQuality', 'institutionalAccountability',
];
