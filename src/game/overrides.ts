import type {
  CampaignState,
  OverrideSituation,
  OverrideOption,
  PolicyDomainKey,
} from './types';
import { SeededRNG } from './rng';
import { DIFFICULTY_MODIFIERS } from './constants';

function sev(state: CampaignState, base: number): number {
  return Math.round(base * DIFFICULTY_MODIFIERS[state.difficulty].eventSeverity);
}

interface OverrideTemplate {
  id: string;
  domain: PolicyDomainKey;
  title: string;
  description: string;
  systemObjective: string;
  recommendation: string;
  buildOptions: (state: CampaignState) => OverrideOption[];
  condition: (state: CampaignState) => boolean;
  supportingData: (state: CampaignState) => Array<{ label: string; value: string }>;
  affectedPopulations: string[];
  uncertainty: number;
  potentialBenefits: string[];
  risks: string[];
  explanationSteps: string[];
}

const OVERRIDE_TEMPLATES: OverrideTemplate[] = [
  {
    id: 'override-resource-reallocation',
    domain: 'resourceAllocation',
    title: 'Automated Resource Reallocation Recommendation',
    description: 'The resource allocation system has identified the Northern Communities region as a candidate for reduced service investment. The algorithm calculates that the cost per beneficiary is 42% higher than the societal average and recommends redirecting those funds to higher-density regions where impact per credit is greater.',
    systemObjective: 'Maximize aggregate service impact per credit spent.',
    recommendation: 'Reduce baseline service allocation to Northern Communities by 30% and redirect 180 credits/quarter to the Central District and Coastal Corridor.',
    condition: (s) => s.domains.resourceAllocation.automation >= 55 && s.regions.northernCommunities.serviceAccess < 55,
    supportingData: (s) => [
      { label: 'Cost per beneficiary (Northern)', value: `${Math.round(180 + s.regions.northernCommunities.vulnerability * 0.5)} credits` },
      { label: 'Cost per beneficiary (Average)', value: `${Math.round(120 + s.indicators.productivity * 0.3)} credits` },
      { label: 'Projected savings (quarterly)', value: '180 credits' },
      { label: 'Population affected', value: `${s.regions.northernCommunities.populationShare}% of total` },
      { label: 'Current service access', value: `${s.regions.northernCommunities.serviceAccess}%` },
    ],
    affectedPopulations: ['Remote Communities (15% of population)', 'Northern Communities region'],
    uncertainty: 35,
    potentialBenefits: [
      '180 credits/quarter redirected to higher-impact services',
      'Aggregate service metrics would improve by approximately 8%',
      'Frees resources for investment in resilience or workforce programs',
    ],
    risks: [
      'Northern Communities service access would drop below critical thresholds',
      'Remote population trust would likely decline significantly',
      'Long-term economic activity in the region may deteriorate further',
      'Equity gap between regions would widen',
    ],
    explanationSteps: [
      '1. The system calculates cost-per-beneficiary for each region using service delivery costs and population density.',
      '2. Regions where cost-per-beneficiary exceeds the societal average by more than 30% are flagged for reduction.',
      '3. The algorithm recommends redirecting the saved allocation to regions with the highest impact-per-credit ratio.',
      '4. The optimization is purely quantitative — it does not account for equity, regional development, or social cohesion.',
    ],
    buildOptions: (s) => [
      {
        id: 'accept',
        label: 'Accept the Recommendation',
        description: 'Implement the reallocation as recommended by the system.',
        effects: { fiscalDelta: sev(s, 180), socialEquity: -sev(s, 7), publicTrust: -sev(s, 3), productivity: sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: -sev(s, 8), serviceAccess: -sev(s, 10), perceivedFairness: -sev(s, 6) } },
        explanation: 'Accepting improves fiscal position and aggregate metrics but significantly harms the remote community.',
      },
      {
        id: 'evidence',
        label: 'Request Additional Evidence',
        description: 'Commission a detailed analysis of the long-term effects before acting.',
        effects: { fiscalDelta: -sev(s, 40), informationIntegrity: sev(s, 3) },
        delayedEffects: [{
          description: 'Additional analysis reveals secondary economic effects that the algorithm did not consider.',
          delayTurns: 2,
          effects: { socialEquity: sev(s, 2), informationIntegrity: sev(s, 2) },
        }],
        explanation: 'Requesting evidence delays the decision but may reveal factors the algorithm missed.',
      },
      {
        id: 'human-review',
        label: 'Escalate to Human Review',
        description: 'Assign a human review board to evaluate the recommendation with broader criteria.',
        effects: { fiscalDelta: -sev(s, 30), humanAgency: sev(s, 4), publicTrust: sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: sev(s, 3) } },
        explanation: 'Human review adds judgment beyond the algorithm\'s scope. It costs time and money but improves the decision quality.',
      },
      {
        id: 'override',
        label: 'Override: Establish Minimum Service Guarantee',
        description: 'Reject the reduction and instead mandate a minimum service level for all regions.',
        effects: { fiscalDelta: -sev(s, 60), socialEquity: sev(s, 5), publicTrust: sev(s, 3), humanAgency: sev(s, 3) },
        groupEffects: { remoteCommunities: { trust: sev(s, 6), serviceAccess: sev(s, 5), perceivedFairness: sev(s, 4) } },
        domainEffects: { resourceAllocation: { automation: -3, oversight: 5 } },
        explanation: 'Overriding protects the community but costs more than the recommended savings. The minimum guarantee is a policy precedent.',
      },
      {
        id: 'suspend',
        label: 'Suspend the Allocation Algorithm',
        description: 'Disable the optimization-based allocation pending a review of its criteria.',
        effects: { productivity: -sev(s, 5), fiscalDelta: -sev(s, 20), humanAgency: sev(s, 3), systemResilience: -sev(s, 2) },
        domainEffects: { resourceAllocation: { automation: -10, reliability: -5 } },
        explanation: 'Suspending the algorithm halts the harmful recommendation but also halts its beneficial optimizations. Manual allocation is less efficient.',
      },
    ],
  },
  {
    id: 'override-emergency-triage',
    domain: 'healthcare',
    title: 'Automated Triage Recommendation',
    description: 'During a healthcare emergency, the automated triage system has recommended deprioritizing patients above age 75 for intensive care, citing statistically lower survival rates and higher resource consumption per case. The recommendation would free up 14 ICU beds for younger patients.',
    systemObjective: 'Maximize total lives saved per unit of medical resource.',
    recommendation: 'Deprioritize 23 patients aged 75+ from ICU to standard ward care, redirecting 14 ICU beds to higher-survival-probability patients.',
    condition: (s) => s.domains.healthcare.automation >= 50 && s.quarter >= 3,
    supportingData: (s) => [
      { label: 'ICU beds available', value: '14' },
      { label: 'Patients waiting', value: '37' },
      { label: 'Avg. survival probability (75+)', value: '42%' },
      { label: 'Avg. survival probability (<75)', value: '78%' },
      { label: 'Resource per case (75+)', value: `${Math.round(180 + (100 - s.indicators.infrastructureHealth) * 0.4)} credits` },
      { label: 'Resource per case (<75)', value: '120 credits' },
    ],
    affectedPopulations: ['23 elderly patients in the Coastal Corridor', '37 patients awaiting ICU admission'],
    uncertainty: 25,
    potentialBenefits: [
      'Approximately 11 additional lives saved based on statistical models',
      'ICU utilization optimized for maximum survival outcomes',
      'Frees medical staff for other critical cases',
    ],
    risks: [
      'Age-based discrimination raises profound ethical concerns',
      'Individual patient circumstances may differ from population statistics',
      'Public trust in healthcare institutions may be damaged',
      'Precedent could normalize age-based resource allocation',
    ],
    explanationSteps: [
      '1. The triage system ranks patients by expected survival probability using age, comorbidities, and vital signs.',
      '2. It calculates resource cost per expected life-year saved for each patient.',
      '3. Patients below a threshold efficiency are deprioritized when beds are scarce.',
      '4. The system does not consider individual circumstances, patient preferences, or social factors beyond the medical data.',
    ],
    buildOptions: (s) => [
      {
        id: 'accept',
        label: 'Accept the Recommendation',
        description: 'Implement the triage recommendation as calculated.',
        effects: { productivity: sev(s, 2), publicTrust: -sev(s, 4), socialEquity: -sev(s, 4), civilLiberties: -sev(s, 3) },
        explanation: 'Accepting maximizes statistical survival but raises serious ethical concerns and damages trust.',
      },
      {
        id: 'evidence',
        label: 'Request Individual Case Review',
        description: 'Ask for individual patient data to be reviewed before any deprioritization.',
        effects: { fiscalDelta: -sev(s, 20), humanAgency: sev(s, 2), publicTrust: sev(s, 1) },
        delayedEffects: [{
          description: 'Individual review finds that 4 of the 23 patients have better prospects than the model predicted.',
          delayTurns: 1,
          effects: { socialEquity: sev(s, 2), informationIntegrity: sev(s, 2) },
        }],
        explanation: 'Individual review adds time and cost but corrects some of the algorithm\'s generalizations.',
      },
      {
        id: 'human-review',
        label: 'Escalate to Medical Ethics Board',
        description: 'Refer the decision to a human medical ethics board.',
        effects: { fiscalDelta: -sev(s, 15), humanAgency: sev(s, 3), publicTrust: sev(s, 3), civilLiberties: sev(s, 2) },
        explanation: 'An ethics board considers factors beyond survival statistics. The decision may take longer but will be more defensible.',
      },
      {
        id: 'override',
        label: 'Override: First-Come, First-Served with Exceptions',
        description: 'Reject age-based deprioritization. Use arrival order with medical urgency overrides.',
        effects: { fiscalDelta: -sev(s, 40), socialEquity: sev(s, 4), publicTrust: sev(s, 4), civilLiberties: sev(s, 4), productivity: -sev(s, 2) },
        domainEffects: { healthcare: { automation: -5, oversight: 5 } },
        explanation: 'Overriding on ethical grounds protects civil liberties and equity but may result in fewer total lives saved.',
      },
      {
        id: 'suspend',
        label: 'Suspend Automated Triage',
        description: 'Disable the automated triage system for this incident and manage patients manually.',
        effects: { fiscalDelta: -sev(s, 30), humanAgency: sev(s, 4), productivity: -sev(s, 4), systemResilience: -sev(s, 1) },
        domainEffects: { healthcare: { automation: -8, reliability: -3 } },
        explanation: 'Manual triage is slower and may be less consistent but removes the algorithmic bias. Medical staff bear the full decision burden.',
      },
    ],
  },
  {
    id: 'override-predictive-policing',
    domain: 'publicSafety',
    title: 'Predictive Deployment Recommendation',
    description: 'The public safety system has generated a predictive deployment map that concentrates 70% of patrols in the Industrial Belt and Northern Communities, citing historical crime data. Community leaders argue this creates a feedback loop — more patrols generate more arrests, which justifies more patrols.',
    systemObjective: 'Maximize crime prevention per patrol-hour based on historical data.',
    recommendation: 'Deploy 70% of patrol resources to Industrial Belt and Northern Communities, reducing coverage in the Research Quarter and Central District.',
    condition: (s) => s.domains.publicSafety.automation >= 60 && s.quarter >= 4,
    supportingData: (s) => [
      { label: 'Historical incidents (Industrial Belt)', value: `${Math.round(300 + s.regions.industrialBelt.vulnerability * 2)}/quarter` },
      { label: 'Historical incidents (Research Quarter)', value: `${Math.round(40 + s.regions.researchQuarter.vulnerability * 0.5)}/quarter` },
      { label: 'Patrol-hours available', value: '12,000' },
      { label: 'Predicted crime reduction', value: '18%' },
      { label: 'Communities receiving increased patrols', value: '2 of 5 regions' },
    ],
    affectedPopulations: ['Industrial Workers (25% of population)', 'Remote Communities (15% of population)'],
    uncertainty: 40,
    potentialBenefits: [
      'Predicted 18% reduction in reported crime',
      'Efficient use of limited patrol resources',
      'Faster response times in high-incident areas',
    ],
    risks: [
      'Feedback loop: increased patrols in certain areas generate more arrests, reinforcing the bias',
      'Historical crime data reflects policing patterns, not actual crime distribution',
      'Over-policed communities experience reduced civil liberties',
      'Trust between affected communities and public safety institutions deteriorates',
    ],
    explanationSteps: [
      '1. The system analyzes historical crime reports and arrest data to identify high-incident zones.',
      '2. It calculates expected crimes prevented per additional patrol-hour for each zone.',
      '3. Patrol resources are allocated to maximize total expected crimes prevented.',
      '4. The system does not account for the possibility that historical data reflects past deployment decisions rather than underlying crime rates.',
    ],
    buildOptions: (s) => [
      {
        id: 'accept',
        label: 'Accept the Deployment Plan',
        description: 'Implement the predictive deployment as recommended.',
        effects: { productivity: sev(s, 1), civilLiberties: -sev(s, 4), socialEquity: -sev(s, 3), publicTrust: -sev(s, 2) },
        groupEffects: { industrialWorkers: { trust: -sev(s, 4), perceivedFairness: -sev(s, 5) }, remoteCommunities: { trust: -sev(s, 5), perceivedFairness: -sev(s, 4) } },
        explanation: 'Accepting may reduce reported crime but creates a feedback loop and damages trust in over-policed communities.',
      },
      {
        id: 'evidence',
        label: 'Request Arrest Data Analysis',
        description: 'Analyze whether arrest rates reflect actual crime or deployment patterns.',
        effects: { fiscalDelta: -sev(s, 30), informationIntegrity: sev(s, 3) },
        delayedEffects: [{
          description: 'Analysis confirms that arrest rates correlate more with patrol density than with underlying crime.',
          delayTurns: 2,
          effects: { socialEquity: sev(s, 3), civilLiberties: sev(s, 2), informationIntegrity: sev(s, 2) },
        }],
        explanation: 'The analysis reveals the feedback loop and provides evidence for reforming the deployment algorithm.',
      },
      {
        id: 'human-review',
        label: 'Escalate to Community Oversight Board',
        description: 'Have a community oversight board review the deployment plan.',
        effects: { fiscalDelta: -sev(s, 20), humanAgency: sev(s, 3), publicTrust: sev(s, 2) },
        groupEffects: { industrialWorkers: { trust: sev(s, 2) }, remoteCommunities: { trust: sev(s, 3) } },
        explanation: 'Community oversight brings local knowledge and builds trust but may delay deployment.',
      },
      {
        id: 'override',
        label: 'Override: Equitable Distribution with Crime Response',
        description: 'Distribute patrols evenly with rapid response teams for incidents.',
        effects: { fiscalDelta: -sev(s, 50), socialEquity: sev(s, 4), civilLiberties: sev(s, 3), publicTrust: sev(s, 3), productivity: -sev(s, 2) },
        domainEffects: { publicSafety: { automation: -5, oversight: 5 } },
        groupEffects: { industrialWorkers: { trust: sev(s, 4), perceivedFairness: sev(s, 4) }, remoteCommunities: { trust: sev(s, 5), perceivedFairness: sev(s, 4) } },
        explanation: 'Equitable distribution avoids the feedback loop but may be less efficient at preventing crime in high-incident areas.',
      },
      {
        id: 'suspend',
        label: 'Suspend Predictive Deployment',
        description: 'Disable the predictive system and return to community-based policing.',
        effects: { fiscalDelta: -sev(s, 40), civilLiberties: sev(s, 3), socialEquity: sev(s, 2), humanAgency: sev(s, 2), productivity: -sev(s, 3) },
        domainEffects: { publicSafety: { automation: -12, reliability: -3 } },
        explanation: 'Suspending predictive deployment eliminates the feedback loop but loses the efficiency of data-driven allocation.',
      },
    ],
  },
  {
    id: 'override-employment-optimization',
    domain: 'economic',
    title: 'Workforce Optimization Recommendation',
    description: 'The economic optimization system recommends restructuring the workforce by automating 8,000 positions in the Industrial Belt and reassigning those workers to lower-skill logistics roles. The system calculates a net productivity gain of 12% but acknowledges a 6-month transition period with significant displacement.',
    systemObjective: 'Maximize aggregate economic productivity.',
    recommendation: 'Automate 8,000 industrial positions and reassign workers to logistics, generating 12% productivity gain over 6 months.',
    condition: (s) => s.domains.economic.automation >= 60 && s.indicators.workforceStability < 60,
    supportingData: (s) => [
      { label: 'Positions to automate', value: '8,000' },
      { label: 'Projected productivity gain', value: '+12%' },
      { label: 'Transition period', value: '6 months (2 quarters)' },
      { label: 'Workers reassigned', value: '6,200 (78%)' },
      { label: 'Workers displaced', value: '1,800 (22%)' },
      { label: 'Current workforce stability', value: `${s.indicators.workforceStability}%` },
    ],
    affectedPopulations: ['Industrial Workers (25% of population)', 'Industrial Belt region'],
    uncertainty: 30,
    potentialBenefits: [
      '12% productivity gain worth approximately 300 credits/quarter',
      'Modernization of industrial production',
      'Reduced operational costs long-term',
    ],
    risks: [
      '1,800 workers face permanent displacement',
      'Reassigned workers may experience skill mismatch and reduced wages',
      '6-month transition creates economic hardship for affected families',
      'Industrial Belt economy may contract during transition',
    ],
    explanationSteps: [
      '1. The system identifies positions where automation output exceeds human output by more than 20%.',
      '2. It calculates reassignment possibilities based on skill transferability scores.',
      '3. Workers below a transferability threshold are classified as displaced.',
      '4. The system optimizes for aggregate productivity and does not account for individual hardship or community stability.',
    ],
    buildOptions: (s) => [
      {
        id: 'accept',
        label: 'Accept the Optimization',
        description: 'Implement the workforce restructuring as recommended.',
        effects: { productivity: sev(s, 6), workforceStability: -sev(s, 5), socialEquity: -sev(s, 3), fiscalDelta: sev(s, 100) },
        groupEffects: { industrialWorkers: { trust: -sev(s, 5), employmentStability: -sev(s, 6), perceivedFairness: -sev(s, 4) } },
        explanation: 'Accepting the optimization boosts productivity and fiscal gains but causes significant workforce disruption and trust loss.',
      },
      {
        id: 'evidence',
        label: 'Request Transition Impact Analysis',
        description: 'Commission a study of the social and economic impact of the transition on affected workers.',
        effects: { fiscalDelta: -sev(s, 40), informationIntegrity: sev(s, 3) },
        delayedEffects: [{
          description: 'Impact analysis reveals that 40% of reassigned workers will face wage reductions.',
          delayTurns: 2,
          effects: { socialEquity: sev(s, 2), workforceStability: sev(s, 1) },
        }],
        explanation: 'The analysis provides information about hidden costs of the optimization, enabling better-informed decisions.',
      },
      {
        id: 'human-review',
        label: 'Escalate to Labor Council',
        description: 'Refer the decision to a labor council with worker representation.',
        effects: { fiscalDelta: -sev(s, 15), humanAgency: sev(s, 3), publicTrust: sev(s, 2), productivity: -sev(s, 1) },
        groupEffects: { industrialWorkers: { trust: sev(s, 3) } },
        explanation: 'The labor council gives workers a voice in the decision. Productivity gains may be reduced through negotiation.',
      },
      {
        id: 'override',
        label: 'Override: Phased Transition with Retraining',
        description: 'Implement a 12-month phased transition with mandatory retraining and wage protection.',
        effects: { fiscalDelta: -sev(s, 80), productivity: sev(s, 3), workforceStability: sev(s, 2), socialEquity: sev(s, 3), humanAgency: sev(s, 2) },
        delayedEffects: [{
          description: 'Phased transition with retraining completes. Most workers successfully transition.',
          delayTurns: 3,
          effects: { workforceStability: sev(s, 4), socialEquity: sev(s, 2), productivity: sev(s, 2) },
        }],
        groupEffects: { industrialWorkers: { trust: sev(s, 4), employmentStability: sev(s, 3), perceivedFairness: sev(s, 3) } },
        domainEffects: { economic: { automation: 3, oversight: 5 } },
        explanation: 'A phased transition with retraining captures most of the productivity gain while protecting workers. It is more expensive and slower.',
      },
      {
        id: 'reject',
        label: 'Reject and Maintain Current Workforce',
        description: 'Reject the optimization. Current workforce structure is maintained.',
        effects: { productivity: -sev(s, 2), workforceStability: sev(s, 2), publicTrust: sev(s, 1) },
        groupEffects: { industrialWorkers: { trust: sev(s, 3), employmentStability: sev(s, 3) }, urbanProfessionals: { trust: -sev(s, 1) } },
        domainEffects: { economic: { automation: -3 } },
        explanation: 'Rejecting the optimization preserves workforce stability but forgoes significant productivity gains.',
      },
    ],
  },
];

export function selectOverride(state: CampaignState): OverrideSituation | null {
  // Only trigger overrides on some quarters, not every turn
  const rng = new SeededRNG(state.seed + state.quarter * 4111 + 999);
  if (!rng.chance(0.35)) return null;

  const eligible = OVERRIDE_TEMPLATES.filter(t => t.condition(state));
  if (eligible.length === 0) return null;

  const selected = rng.pick(eligible);
  const options = selected.buildOptions(state);

  return {
    id: selected.id,
    domain: selected.domain,
    title: selected.title,
    description: selected.description,
    systemObjective: selected.systemObjective,
    recommendation: selected.recommendation,
    supportingData: selected.supportingData(state),
    affectedPopulations: selected.affectedPopulations,
    uncertainty: selected.uncertainty,
    potentialBenefits: selected.potentialBenefits,
    risks: selected.risks,
    options,
    explanationSteps: selected.explanationSteps,
  };
}
