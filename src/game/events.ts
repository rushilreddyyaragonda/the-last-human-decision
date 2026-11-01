import type {
  CampaignState,
  GameStateEvent,
  EventOption,
  PolicyDomainKey,
  PopulationGroupKey,
  OverrideSituation,
} from './types';
import { SeededRNG } from './rng';
import { DIFFICULTY_MODIFIERS } from './constants';

export interface EventDefinition {
  id: string;
  title: string;
  category: 'crisis' | 'opportunity' | 'social' | 'infrastructure' | 'governance';
  description: string;
  trigger: (state: CampaignState) => number; // returns weight 0+ (0 = cannot trigger)
  oneTime: boolean;
  affectedDomains: PolicyDomainKey[];
  affectedGroups: PopulationGroupKey[];
  buildOptions: (state: CampaignState) => EventOption[];
  triggerDescription: (state: CampaignState) => string;
}

function sev(state: CampaignState, base: number): number {
  return Math.round(base * DIFFICULTY_MODIFIERS[state.difficulty].eventSeverity);
}

export const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    id: 'silent-exclusion',
    title: 'The Silent Exclusion',
    category: 'social',
    description: 'An automated employment-matching system consistently overlooks applicants from the Northern Communities region. Initial analysis suggests the algorithm penalizes gaps in employment history — a pattern more common in remote areas due to seasonal work.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('silent-exclusion')) return 0;
      const remoteAccess = s.populationGroups.remoteCommunities.serviceAccess;
      const econAutomation = s.domains.economic.automation;
      if (econAutomation < 50) return 0;
      return Math.max(0, (econAutomation - 40) * 0.3 + (60 - remoteAccess) * 0.4);
    },
    oneTime: true,
    affectedDomains: ['economic'],
    affectedGroups: ['remoteCommunities', 'industrialWorkers'],
    triggerDescription: (s) => `Triggered by high economic automation (${s.domains.economic.automation}%) and low remote community access (${s.populationGroups.remoteCommunities.serviceAccess}%).`,
    buildOptions: (s) => {
      const mod = sev(s, 1);
      return [
        {
          id: 'accept',
          label: 'Accept the Algorithm',
          description: 'The system is working as designed. Employment matching optimizes for productivity.',
          effects: { socialEquity: -sev(s, 8), publicTrust: -sev(s, 4), productivity: sev(s, 3) },
          groupEffects: { remoteCommunities: { trust: -sev(s, 10), perceivedFairness: -sev(s, 12), employmentStability: -sev(s, 8) } },
          explanation: 'Accepting the algorithm preserves efficiency but deepens existing inequalities. Remote communities lose trust.',
          outcomeText: 'The employment-matching system continues unchanged. Northern Communities applicants face persistent disadvantage.',
        },
        {
          id: 'investigate',
          label: 'Commission a Bias Investigation',
          description: 'Fund an independent audit to determine whether the system produces discriminatory outcomes.',
          effects: { fiscalDelta: -80, publicTrust: sev(s, 3), informationIntegrity: sev(s, 4) },
          delayedEffects: [{
            description: 'Bias investigation results inform corrective policy adjustments.',
            delayTurns: 2,
            effects: { socialEquity: sev(s, 6), humanAgency: sev(s, 3) },
          }],
          groupEffects: { remoteCommunities: { trust: sev(s, 5), perceivedFairness: sev(s, 4) } },
          explanation: 'The investigation costs funds but reveals the bias mechanism and builds trust. Corrective effects arrive after the audit completes.',
          outcomeText: 'A bias investigation is launched. Results will inform corrective measures in two quarters.',
        },
        {
          id: 'mandate-review',
          label: 'Mandatory Human Review for Remote Applicants',
          description: 'Require human review of all employment decisions affecting remote community applicants.',
          effects: { socialEquity: sev(s, 5), productivity: -sev(s, 4), humanAgency: sev(s, 4) },
          groupEffects: { remoteCommunities: { trust: sev(s, 8), perceivedFairness: sev(s, 8), employmentStability: sev(s, 5) } },
          domainEffects: { economic: { oversight: 10, automation: -5 } },
          explanation: 'Human review improves fairness and trust but reduces matching speed and increases operational costs.',
          outcomeText: 'Human review is now required for remote community employment decisions. Fairness improves at a productivity cost.',
        },
        {
          id: 'suspend',
          label: 'Suspend the Automated Matching System',
          description: 'Disable the algorithmic matching system pending a full review.',
          effects: { productivity: -sev(s, 10), socialEquity: sev(s, 3), humanAgency: sev(s, 5), workforceStability: -sev(s, 3) },
          groupEffects: { remoteCommunities: { trust: sev(s, 6) }, urbanProfessionals: { trust: -sev(s, 4), employmentStability: -sev(s, 5) } },
          domainEffects: { economic: { automation: -15, reliability: -5 } },
          explanation: 'Suspending the system is the most aggressive intervention. It eliminates algorithmic bias but significantly reduces productivity for everyone.',
          outcomeText: 'The automated employment system is suspended. Manual matching is slower but eliminates the bias.',
        },
      ];
    },
  },
  {
    id: 'perfect-quarter',
    title: 'The Perfect Quarter',
    category: 'opportunity',
    description: 'A high-performing automated resource allocation system has delivered exceptional results this quarter — reducing waste by 18% and cutting distribution times by nearly a third. Officials are now pressuring you to expand its authority to other domains.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('perfect-quarter')) return 0;
      if (s.indicators.productivity < 65) return 0;
      if (s.domains.resourceAllocation.automation < 60) return 0;
      return Math.max(0, (s.indicators.productivity - 60) * 0.3);
    },
    oneTime: true,
    affectedDomains: ['resourceAllocation', 'transportation', 'healthcare'],
    affectedGroups: ['urbanProfessionals', 'publicServiceInstitutions'],
    triggerDescription: (s) => `Triggered by high productivity (${s.indicators.productivity}%) and strong resource allocation automation (${s.domains.resourceAllocation.automation}%).`,
    buildOptions: (s) => [
      {
        id: 'expand',
        label: 'Expand Authority to All Domains',
        description: 'Grant the allocation system authority over transportation, healthcare, and public safety resource decisions.',
        effects: { productivity: sev(s, 8), publicTrust: sev(s, 3), systemResilience: -sev(s, 6), humanAgency: -sev(s, 5) },
        domainEffects: {
          transportation: { automation: 15 },
          healthcare: { automation: 10 },
          publicSafety: { automation: 10 },
        },
        explanation: 'Expanding authority boosts efficiency but increases dependency and reduces human decision points across multiple domains.',
        outcomeText: 'The allocation system now controls resources across transportation, healthcare, and public safety.',
      },
      {
        id: 'limited-expand',
        label: 'Expand to Transportation Only',
        description: 'Cautiously extend the system to transportation resource decisions while keeping healthcare and safety under human authority.',
        effects: { productivity: sev(s, 4), systemResilience: -sev(s, 2) },
        domainEffects: { transportation: { automation: 10 } },
        explanation: 'A measured expansion captures some efficiency gains while limiting exposure to systemic dependency.',
        outcomeText: 'The allocation system extends to transportation. Healthcare and public safety remain under human authority.',
      },
      {
        id: 'maintain',
        label: 'Maintain Current Scope',
        description: 'Keep the system within its current domain. The results are impressive, but concentration of authority creates risk.',
        effects: { publicTrust: sev(s, 2), systemResilience: sev(s, 2), humanAgency: sev(s, 2) },
        explanation: 'Maintaining scope preserves the gains without increasing systemic risk. Some officials will be disappointed.',
        outcomeText: 'The system remains in its current domain. Scope is maintained despite pressure to expand.',
      },
      {
        id: 'study',
        label: 'Commission a Reliability Study',
        description: 'Investigate whether the system\'s success is sustainable or dependent on conditions that may change.',
        effects: { fiscalDelta: -60, informationIntegrity: sev(s, 4), systemResilience: sev(s, 2) },
        delayedEffects: [{
          description: 'Reliability study reveals whether the system\'s performance is sustainable.',
          delayTurns: 2,
          effects: { systemResilience: sev(s, 4), informationIntegrity: sev(s, 2) },
        }],
        explanation: 'The study costs funds but provides valuable information about long-term sustainability before committing to expansion.',
        outcomeText: 'A reliability study is commissioned. Results will arrive in two quarters.',
      },
    ],
  },
  {
    id: 'unexplained-denial',
    title: 'The Unexplained Denial',
    category: 'crisis',
    description: 'The public benefits system has rejected a large batch of eligible applications — over 2,000 in the past week. The denial letters cite "ineligibility" but provide no specific reason. The system\'s decision logic is opaque even to the administrators who operate it.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('unexplained-denial')) return 0;
      if (s.domains.resourceAllocation.automation < 55) return 0;
      const lowTransparency = s.domains.resourceAllocation.transparency < 50 ? 15 : 0;
      return Math.max(0, (s.domains.resourceAllocation.automation - 50) * 0.3 + lowTransparency);
    },
    oneTime: true,
    affectedDomains: ['resourceAllocation'],
    affectedGroups: ['remoteCommunities', 'industrialWorkers', 'publicServiceInstitutions'],
    triggerDescription: (s) => `Triggered by high resource allocation automation (${s.domains.resourceAllocation.automation}%)${s.domains.resourceAllocation.transparency < 50 ? ' and low transparency' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'investigate',
        label: 'Investigate the Root Cause',
        description: 'Deploy a technical team to identify why eligible applications are being rejected.',
        effects: { fiscalDelta: -70, informationIntegrity: sev(s, 5), publicTrust: sev(s, 2) },
        delayedEffects: [{
          description: 'Root cause analysis reveals a data integration error affecting eligibility checks.',
          delayTurns: 1,
          effects: { socialEquity: sev(s, 5), systemResilience: sev(s, 3) },
        }],
        groupEffects: { remoteCommunities: { trust: sev(s, 3) }, publicServiceInstitutions: { trust: sev(s, 4) } },
        explanation: 'Investigation costs funds but identifies the root cause and builds confidence that errors are taken seriously.',
        outcomeText: 'A technical investigation is launched. The root cause will be identified next quarter.',
      },
      {
        id: 'override-mass',
        label: 'Mass Override All Denials',
        description: 'Reverse all denials from the past week and restore benefits pending review.',
        effects: { fiscalDelta: -120, socialEquity: sev(s, 6), publicTrust: sev(s, 4), humanAgency: sev(s, 3) },
        groupEffects: { remoteCommunities: { trust: sev(s, 6), serviceAccess: sev(s, 5) }, industrialWorkers: { trust: sev(s, 4) } },
        explanation: 'Mass override restores benefits immediately but is expensive and bypasses the normal review process.',
        outcomeText: 'All denials are reversed. Benefits are restored to affected applicants pending further review.',
      },
      {
        id: 'increase-transparency',
        label: 'Mandate Explanation Letters',
        description: 'Require the system to provide specific reasons for every denial, enabling appeals.',
        effects: { fiscalDelta: -40, publicTrust: sev(s, 3), humanAgency: sev(s, 4), civilLiberties: sev(s, 3) },
        domainEffects: { resourceAllocation: { transparency: 15, appealAccess: 10 } },
        groupEffects: { remoteCommunities: { appealAbility: sev(s, 8) }, industrialWorkers: { appealAbility: sev(s, 5) } },
        explanation: 'Requiring explanations improves accountability and enables appeals but adds operational cost.',
        outcomeText: 'The benefits system must now provide specific denial reasons. Appeal mechanisms are strengthened.',
      },
      {
        id: 'wait',
        label: 'Process Through Normal Appeals',
        description: 'Let affected applicants use the existing appeal process. The system will correct itself.',
        effects: { publicTrust: -sev(s, 6), socialEquity: -sev(s, 4) },
        groupEffects: { remoteCommunities: { trust: -sev(s, 8), perceivedFairness: -sev(s, 6) }, industrialWorkers: { trust: -sev(s, 4) } },
        explanation: 'Relying on existing appeals saves money but many eligible applicants will give up or face delays. Trust erodes.',
        outcomeText: 'Applicants are directed to the standard appeal process. Many are unable to navigate it effectively.',
      },
    ],
  },
  {
    id: 'network-blackout',
    title: 'The Network Blackout',
    category: 'infrastructure',
    description: 'A critical shared infrastructure component has failed, interrupting services across multiple domains. Transportation is partially disabled in the Central District, healthcare scheduling is down, and resource allocation is operating in degraded mode.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('network-blackout')) return 0;
      const avgDependence = Object.values(s.regions).reduce((sum, r) => sum + r.infrastructureDependence, 0) / 5;
      if (avgDependence < 65) return 0;
      if (s.indicators.systemResilience < 50) return Math.max(0, (50 - s.indicators.systemResilience) * 0.5 + (avgDependence - 60) * 0.3);
      return Math.max(0, (avgDependence - 65) * 0.2);
    },
    oneTime: true,
    affectedDomains: ['transportation', 'healthcare', 'resourceAllocation'],
    affectedGroups: ['urbanProfessionals', 'publicServiceInstitutions'],
    triggerDescription: (s) => {
      const avgDep = Math.round(Object.values(s.regions).reduce((sum, r) => sum + r.infrastructureDependence, 0) / 5);
      return `Triggered by high infrastructure interdependence (${avgDep}%)${s.indicators.systemResilience < 50 ? ' and low system resilience' : ''}.`;
    },
    buildOptions: (s) => {
      const redundancyLevel = s.investments.redundancy.level;
      const hasBackup = redundancyLevel > 0;
      return [
        {
          id: 'emergency-repair',
          label: 'Emergency Repair Effort',
          description: 'Deploy all available resources to repair the failed component and restore services.',
          effects: { fiscalDelta: -sev(s, 150), infrastructureHealth: sev(s, 5), productivity: -sev(s, 8) },
          delayedEffects: [{
            description: 'Emergency repairs complete. Services partially restored.',
            delayTurns: 1,
            effects: { infrastructureHealth: sev(s, 3), productivity: sev(s, 4) },
          }],
          explanation: 'Emergency repair is expensive but restores services fastest. Productivity suffers during the outage.',
          outcomeText: 'Emergency repair teams are deployed. Services will be partially restored next quarter.',
        },
        ...(hasBackup ? [{
          id: 'activate-backup',
          label: 'Activate Backup Systems',
          description: 'Switch to the redundant backup infrastructure built through previous investments.',
          effects: { fiscalDelta: -sev(s, 50), infrastructureHealth: sev(s, 2), productivity: -sev(s, 3), systemResilience: sev(s, 4) },
          explanation: 'Backup systems significantly reduce the impact of the failure. Previous redundancy investments pay off.',
          outcomeText: 'Backup systems are activated. Most services continue with minimal disruption.',
        }] : []),
        {
          id: 'degrade',
          label: 'Operate in Degraded Mode',
          description: 'Accept reduced service levels while the component is repaired through normal maintenance.',
          effects: { productivity: -sev(s, 12), publicTrust: -sev(s, 5), infrastructureHealth: -sev(s, 3) },
          groupEffects: { urbanProfessionals: { trust: -sev(s, 4), serviceAccess: -sev(s, 8) }, publicServiceInstitutions: { trust: -sev(s, 3) } },
          explanation: 'Degraded operation saves money but prolongs the outage and erodes public confidence.',
          outcomeText: 'Services operate in degraded mode. Citizens and businesses experience significant disruption.',
        },
        {
          id: 'redesign',
          label: 'Redesign the Architecture',
          description: 'Use this failure as an opportunity to redesign the interconnection architecture to prevent cascading failures.',
          effects: { fiscalDelta: -sev(s, 200), productivity: -sev(s, 6) },
          delayedEffects: [{
            description: 'Architecture redesign reduces interdependence and prevents future cascading failures.',
            delayTurns: 3,
            effects: { systemResilience: sev(s, 12), infrastructureHealth: sev(s, 6) },
          }],
          domainEffects: { transportation: { reliability: 8 } },
          explanation: 'Redesigning is the most expensive option but produces lasting resilience improvements. Benefits arrive over several quarters.',
          outcomeText: 'A major architecture redesign is initiated. Long-term resilience will improve significantly.',
        },
      ];
    },
  },
  {
    id: 'emergency-exception',
    title: 'The Emergency Exception',
    category: 'crisis',
    description: 'A fast-moving public health emergency requires immediate resource reallocation. Normal human review procedures would add a 48-hour delay, but the automated emergency response system can act within minutes. The system recommends redirecting medical supplies from three regions to the outbreak zone.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('emergency-exception')) return 0;
      if (s.quarter < 4) return 0;
      return Math.max(0, 10 + (100 - s.indicators.systemResilience) * 0.1);
    },
    oneTime: true,
    affectedDomains: ['healthcare', 'resourceAllocation'],
    affectedGroups: ['remoteCommunities', 'publicServiceInstitutions'],
    triggerDescription: () => 'Triggered after quarter 4. More likely when system resilience is low.',
    buildOptions: (s) => [
      {
        id: 'auto-response',
        label: 'Authorize Automated Emergency Response',
        description: 'Let the system execute the reallocation immediately. Speed is critical.',
        effects: { productivity: sev(s, 2), publicTrust: sev(s, 3), civilLiberties: -sev(s, 3), socialEquity: -sev(s, 4) },
        groupEffects: { remoteCommunities: { serviceAccess: -sev(s, 8), trust: -sev(s, 4) } },
        explanation: 'Automated response is fast but redirects resources from remote communities without their consent. Speed saves lives but creates equity concerns.',
        outcomeText: 'The automated emergency response redirects medical supplies. The outbreak zone receives supplies within minutes, but remote regions face shortages.',
      },
      {
        id: 'expedited-review',
        label: 'Expedited Human Review (4 Hours)',
        description: 'Conduct a rapid but human-supervised review of the reallocation plan.',
        effects: { fiscalDelta: -30, publicTrust: sev(s, 4), socialEquity: sev(s, 2), civilLiberties: sev(s, 2) },
        groupEffects: { remoteCommunities: { serviceAccess: -sev(s, 4), trust: sev(s, 3) } },
        explanation: 'Expedited review adds a short delay but ensures human judgment. Remote regions still lose some supplies but with oversight.',
        outcomeText: 'A rapid human review approves a modified reallocation plan. The outbreak zone receives supplies within four hours.',
      },
      {
        id: 'manual-reallocation',
        label: 'Manual Reallocation with Safeguards',
        description: 'Handle the reallocation manually with minimum-service guarantees for all regions.',
        effects: { fiscalDelta: -80, productivity: -sev(s, 5), socialEquity: sev(s, 5), humanAgency: sev(s, 4), publicTrust: sev(s, 2) },
        groupEffects: { remoteCommunities: { serviceAccess: -sev(s, 2), trust: sev(s, 5), perceivedFairness: sev(s, 4) } },
        explanation: 'Manual reallocation with safeguards is slower and more expensive but protects all communities. The outbreak zone receives less than the automated plan.',
        outcomeText: 'A manual reallocation preserves minimum service levels for all regions. The response is slower but no community is left without essential supplies.',
      },
      {
        id: 'hybrid',
        label: 'Automated Response with Human Monitoring',
        description: 'Authorize the automated response but assign a human monitor to pause it if concerns arise.',
        effects: { productivity: sev(s, 1), publicTrust: sev(s, 2), civilLiberties: sev(s, 1), socialEquity: -sev(s, 2) },
        groupEffects: { remoteCommunities: { serviceAccess: -sev(s, 6), trust: -sev(s, 2) } },
        explanation: 'A compromise: automated speed with human oversight. Slightly slower than pure automation but with a safety valve.',
        outcomeText: 'The automated response executes under human monitoring. Supplies are redirected quickly with a human monitor ready to intervene.',
      },
    ],
  },
  {
    id: 'accountability-hearing',
    title: 'The Accountability Hearing',
    category: 'governance',
    description: 'Public representatives have summoned you to explain a consequential automated decision that affected thousands of citizens. The hearing will be public and will set a precedent for how automated decisions are scrutinized going forward.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('accountability-hearing')) return 0;
      if (s.quarter < 6) return 0;
      const lowTrust = s.indicators.publicTrust < 50 ? 15 : 0;
      const overrides = s.overrideHistory.length > 2 ? 10 : 0;
      return Math.max(0, 8 + lowTrust + overrides);
    },
    oneTime: true,
    affectedDomains: ['resourceAllocation', 'publicSafety'],
    affectedGroups: ['publicServiceInstitutions', 'urbanProfessionals'],
    triggerDescription: (s) => `Triggered after quarter 6${s.indicators.publicTrust < 50 ? ' with low public trust' : ''}${s.overrideHistory.length > 2 ? ' and multiple overrides' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'full-disclosure',
        label: 'Full Public Disclosure',
        description: 'Publish the complete decision criteria, data inputs, and performance metrics for the affected system.',
        effects: { fiscalDelta: -40, publicTrust: sev(s, 6), civilLiberties: sev(s, 4), humanAgency: sev(s, 3), informationIntegrity: sev(s, 3) },
        domainEffects: { resourceAllocation: { transparency: 10 }, publicSafety: { transparency: 10 } },
        explanation: 'Full disclosure is expensive but sets a strong transparency precedent. Trust and liberties improve significantly.',
        outcomeText: 'You disclose all decision criteria and data. The hearing establishes a transparency precedent for automated governance.',
      },
      {
        id: 'partial-disclosure',
        label: 'Partial Disclosure',
        description: 'Share high-level criteria and performance summaries while protecting sensitive operational details.',
        effects: { publicTrust: sev(s, 3), civilLiberties: sev(s, 1) },
        domainEffects: { resourceAllocation: { transparency: 5 } },
        explanation: 'Partial disclosure balances transparency with operational security. Some representatives will want more.',
        outcomeText: 'You provide a summary of the decision criteria. Representatives request more detail but acknowledge the effort.',
      },
      {
        id: 'defend',
        label: 'Defend the System',
        description: 'Argue that the automated decision was correct and that public scrutiny of algorithmic processes is unnecessary.',
        effects: { publicTrust: -sev(s, 5), civilLiberties: -sev(s, 3), humanAgency: -sev(s, 4) },
        groupEffects: { publicServiceInstitutions: { trust: -sev(s, 6) }, urbanProfessionals: { trust: -sev(s, 3) } },
        explanation: 'Defending the system without transparency erodes trust and sets a precedent of opacity. Productivity is unaffected.',
        outcomeText: 'You defend the system. Representatives express concern about the lack of accountability.',
      },
      {
        id: 'promise-reform',
        label: 'Promise Reforms',
        description: 'Acknowledge concerns and commit to specific reforms without immediate disclosure.',
        effects: { publicTrust: sev(s, 1) },
        delayedEffects: [{
          description: 'Promised reforms must be implemented or trust will deteriorate further.',
          delayTurns: 2,
          effects: { publicTrust: sev(s, 3), humanAgency: sev(s, 2) },
        }],
        explanation: 'Promising reforms buys time and modestly improves trust. The delayed effect depends on follow-through.',
        outcomeText: 'You acknowledge concerns and promise reforms. The public will expect concrete action within two quarters.',
      },
    ],
  },
  {
    id: 'expertise-gap',
    title: 'The Expertise Gap',
    category: 'crisis',
    description: 'Years of automation have reduced the number of people capable of operating critical infrastructure manually. A recent audit found that only 12 certified operators remain for the power grid — down from 80 a decade ago. Three of them are approaching retirement.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('expertise-gap')) return 0;
      const avgAutomation = Object.values(s.domains).reduce((sum, d) => sum + d.automation, 0) / 5;
      if (avgAutomation < 65) return 0;
      const lowOversight = Object.values(s.domains).reduce((sum, d) => sum + d.oversight, 0) / 5 < 35 ? 15 : 0;
      return Math.max(0, (avgAutomation - 60) * 0.4 + lowOversight);
    },
    oneTime: true,
    affectedDomains: ['transportation', 'healthcare'],
    affectedGroups: ['industrialWorkers', 'publicServiceInstitutions'],
    triggerDescription: (s) => {
      const avgAuto = Math.round(Object.values(s.domains).reduce((sum, d) => sum + d.automation, 0) / 5);
      return `Triggered by high average automation (${avgAuto}%)${Object.values(s.domains).reduce((sum, d) => sum + d.oversight, 0) / 5 < 35 ? ' and low oversight' : ''}.`;
    },
    buildOptions: (s) => [
      {
        id: 'train',
        label: 'Launch Training Program',
        description: 'Fund an intensive program to train new operators and retain existing expertise.',
        effects: { fiscalDelta: -sev(s, 100), workforceStability: sev(s, 4) },
        delayedEffects: [{
          description: 'Training program produces certified operators. Manual operation capacity is restored.',
          delayTurns: 3,
          effects: { systemResilience: sev(s, 8), workforceStability: sev(s, 5), humanAgency: sev(s, 3) },
        }],
        groupEffects: { industrialWorkers: { employmentStability: sev(s, 5) }, publicServiceInstitutions: { trust: sev(s, 3) } },
        explanation: 'Training is expensive and takes time but addresses the root cause. Resilience improves significantly once operators are certified.',
        outcomeText: 'A training program is launched. New operators will be certified in three quarters.',
      },
      {
        id: 'automate-more',
        label: 'Increase Automation Further',
        description: 'If manual operation is becoming obsolete, invest in making the automated systems more robust instead.',
        effects: { fiscalDelta: -sev(s, 80), productivity: sev(s, 3), systemResilience: -sev(s, 4), humanAgency: -sev(s, 3) },
        domainEffects: { transportation: { automation: 10, reliability: 5 } },
        explanation: 'Double down on automation. This improves short-term reliability but deepens dependency and further reduces human capacity.',
        outcomeText: 'Automated systems are upgraded. The expertise gap widens, but systems become more self-sufficient.',
      },
      {
        id: 'retain-experts',
        label: 'Retention Bonuses for Key Personnel',
        description: 'Offer incentives to keep experienced operators from retiring.',
        effects: { fiscalDelta: -sev(s, 60), systemResilience: sev(s, 3), workforceStability: sev(s, 2) },
        delayedEffects: [{
          description: 'Retained experts train the next generation informally.',
          delayTurns: 2,
          effects: { systemResilience: sev(s, 3), workforceStability: sev(s, 2) },
        }],
        explanation: 'Retention bonuses are cheaper than training programs but are a temporary fix. They buy time for longer-term solutions.',
        outcomeText: 'Key operators receive retention bonuses. The immediate crisis is averted, but the underlying gap remains.',
      },
      {
        id: 'accept-risk',
        label: 'Accept the Risk',
        description: 'The systems are reliable enough. The expertise gap is a theoretical concern.',
        effects: { systemResilience: -sev(s, 5) },
        explanation: 'Ignoring the gap saves money but significantly increases vulnerability to a future failure.',
        outcomeText: 'No action is taken. The expertise gap continues to widen as more operators retire.',
      },
    ],
  },
  {
    id: 'efficiency-dividend',
    title: 'The Efficiency Dividend',
    category: 'opportunity',
    description: 'Automation savings have generated a budget surplus this quarter. An extra 150 credits are available. You must decide how to allocate this unexpected windfall.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('efficiency-dividend')) return 0;
      if (s.indicators.productivity < 60) return 0;
      return Math.max(0, (s.indicators.productivity - 55) * 0.2);
    },
    oneTime: true,
    affectedDomains: [],
    affectedGroups: [],
    triggerDescription: (s) => `Triggered by high productivity (${s.indicators.productivity}%).`,
    buildOptions: (s) => [
      {
        id: 'resilience',
        label: 'Invest in Resilience',
        description: 'Direct the surplus into infrastructure redundancy and emergency reserves.',
        effects: { fiscalDelta: sev(s, 150), systemResilience: sev(s, 4), infrastructureHealth: sev(s, 3) },
        explanation: 'The surplus is added to reserves and partially invested in redundancy. Long-term resilience improves.',
        outcomeText: 'The efficiency dividend is invested in resilience. The society is better prepared for future disruptions.',
      },
      {
        id: 'workforce',
        label: 'Invest in Workforce Transition',
        description: 'Fund retraining programs for workers displaced by the same automation that generated the surplus.',
        effects: { fiscalDelta: sev(s, 150), workforceStability: sev(s, 5), socialEquity: sev(s, 3) },
        groupEffects: { industrialWorkers: { trust: sev(s, 4), employmentStability: sev(s, 4) } },
        explanation: 'Reinvesting automation savings into displaced workers addresses the human cost of efficiency gains.',
        outcomeText: 'The dividend funds workforce transition programs. Displaced workers gain new skills.',
      },
      {
        id: 'expand-automation',
        label: 'Reinvest in Further Automation',
        description: 'Use the surplus to expand automation into additional services.',
        effects: { fiscalDelta: sev(s, 150), productivity: sev(s, 4), humanAgency: -sev(s, 2) },
        domainEffects: { economic: { automation: 5 }, resourceAllocation: { automation: 5 } },
        explanation: 'Reinvesting in automation compounds efficiency gains but increases dependency and reduces human agency.',
        outcomeText: 'The dividend accelerates automation expansion. Productivity rises, but so does dependency.',
      },
      {
        id: 'public-services',
        label: 'Expand Public Services',
        description: 'Use the surplus to improve service access for underserved communities.',
        effects: { fiscalDelta: sev(s, 150), socialEquity: sev(s, 5), publicTrust: sev(s, 3) },
        groupEffects: { remoteCommunities: { serviceAccess: sev(s, 6), trust: sev(s, 4) }, industrialWorkers: { serviceAccess: sev(s, 3) } },
        explanation: 'Directing the surplus to underserved communities improves equity and trust. No direct productivity gain.',
        outcomeText: 'The dividend expands public services. Underserved communities see immediate improvements.',
      },
    ],
  },
  {
    id: 'data-integrity-incident',
    title: 'The Data Integrity Incident',
    category: 'crisis',
    description: 'Conflicting data records have caused two automated systems to reach opposite conclusions about the same situation. The resource allocation system flagged a region as high-priority for investment while the healthcare system flagged it as low-need. Both cannot be right.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('data-integrity-incident')) return 0;
      if (s.indicators.informationIntegrity < 55) return Math.max(0, (55 - s.indicators.informationIntegrity) * 0.5);
      if (s.quarter < 5) return 0;
      return Math.max(0, 8 - s.indicators.informationIntegrity * 0.1);
    },
    oneTime: true,
    affectedDomains: ['resourceAllocation', 'healthcare'],
    affectedGroups: ['remoteCommunities', 'publicServiceInstitutions'],
    triggerDescription: (s) => `Triggered by low information integrity (${s.indicators.informationIntegrity}%)${s.quarter < 5 ? ' or after quarter 5' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'audit-data',
        label: 'Launch a Data Quality Audit',
        description: 'Investigate the source of the conflicting records and establish a single source of truth.',
        effects: { fiscalDelta: -60, informationIntegrity: sev(s, 6), systemResilience: sev(s, 2) },
        delayedEffects: [{
          description: 'Data quality audit identifies and fixes the conflicting records.',
          delayTurns: 2,
          effects: { informationIntegrity: sev(s, 4), socialEquity: sev(s, 3) },
        }],
        explanation: 'The audit costs funds but addresses the root cause. Information quality improves once the conflict is resolved.',
        outcomeText: 'A data quality audit is launched. The conflicting records will be resolved in two quarters.',
      },
      {
        id: 'human-arbitrate',
        label: 'Human Arbitration',
        description: 'Have a human expert review both conclusions and make the final determination.',
        effects: { fiscalDelta: -30, socialEquity: sev(s, 3), humanAgency: sev(s, 3), productivity: -sev(s, 2) },
        explanation: 'Human arbitration resolves the immediate conflict but does not fix the underlying data issue.',
        outcomeText: 'A human expert reviews both conclusions and determines the correct assessment. The underlying data conflict remains.',
      },
      {
        id: 'trust-healthcare',
        label: 'Trust the Healthcare System',
        description: 'Prioritize the healthcare system\'s assessment as it has more direct contact with the population.',
        effects: { informationIntegrity: -sev(s, 2), socialEquity: sev(s, 2) },
        groupEffects: { remoteCommunities: { serviceAccess: sev(s, 3) } },
        explanation: 'Choosing one system over the other resolves the immediate conflict but does not address the root cause. The losing system\'s data quality concerns remain.',
        outcomeText: 'The healthcare assessment is adopted. Resource allocation is adjusted accordingly.',
      },
      {
        id: 'trust-allocation',
        label: 'Trust the Resource Allocation System',
        description: 'Prioritize the resource allocation system\'s assessment as it uses broader economic data.',
        effects: { informationIntegrity: -sev(s, 2), productivity: sev(s, 2) },
        explanation: 'Choosing the allocation system may improve productivity but could misdirect healthcare resources if the data is wrong.',
        outcomeText: 'The resource allocation assessment is adopted. Healthcare resources are redirected.',
      },
    ],
  },
  {
    id: 'public-demonstration',
    title: 'The Public Demonstration',
    category: 'social',
    description: 'Citizens are gathering in the Central District to protest a policy they believe unfairly restricts their ability to appeal automated decisions. The demonstration is peaceful but growing, and media coverage is increasing.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('public-demonstration')) return 0;
      if (s.quarter < 5) return 0;
      const avgAppeal = Object.values(s.domains).reduce((sum, d) => sum + d.appealAccess, 0) / 5;
      const lowAppeal = avgAppeal < 40 ? 20 : 0;
      const lowAgency = s.indicators.humanAgency < 40 ? 15 : 0;
      return Math.max(0, 10 + lowAppeal + lowAgency);
    },
    oneTime: true,
    affectedDomains: ['publicSafety', 'resourceAllocation'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities'],
    triggerDescription: (s) => {
      const avgAppeal = Math.round(Object.values(s.domains).reduce((sum, d) => sum + d.appealAccess, 0) / 5);
      return `Triggered after quarter 5${avgAppeal < 40 ? ` with low appeal access (${avgAppeal}%)` : ''}${s.indicators.humanAgency < 40 ? ' and low human agency' : ''}.`;
    },
    buildOptions: (s) => [
      {
        id: 'expand-appeals',
        label: 'Expand Appeal Rights',
        description: 'Announce new appeal rights for citizens affected by automated decisions.',
        effects: { fiscalDelta: -50, publicTrust: sev(s, 5), humanAgency: sev(s, 5), civilLiberties: sev(s, 3) },
        domainEffects: { resourceAllocation: { appealAccess: 15 }, publicSafety: { appealAccess: 10 } },
        groupEffects: { urbanProfessionals: { trust: sev(s, 4), appealAbility: sev(s, 5) }, industrialWorkers: { trust: sev(s, 4), appealAbility: sev(s, 5) }, remoteCommunities: { trust: sev(s, 5), appealAbility: sev(s, 6) } },
        explanation: 'Expanding appeal rights directly addresses the protesters\' concerns. Trust, agency, and liberties all improve.',
        outcomeText: 'You announce expanded appeal rights. The demonstration disperses peacefully with broad public support.',
      },
      {
        id: 'dialogue',
        label: 'Open Dialogue with Protesters',
        description: 'Meet with protest leaders to understand their concerns and explore solutions.',
        effects: { publicTrust: sev(s, 3), humanAgency: sev(s, 2) },
        delayedEffects: [{
          description: 'Dialogue leads to a compromise reform package.',
          delayTurns: 2,
          effects: { publicTrust: sev(s, 3), humanAgency: sev(s, 2), socialEquity: sev(s, 2) },
        }],
        explanation: 'Dialogue builds trust and leads to a compromise. The immediate protest is resolved but the reforms take time.',
        outcomeText: 'You meet with protest leaders. A working group is established to develop reform proposals.',
      },
      {
        id: 'maintain',
        label: 'Maintain Current Policy',
        description: 'The appeal process is adequate. The protest will fade on its own.',
        effects: { publicTrust: -sev(s, 5), humanAgency: -sev(s, 3) },
        groupEffects: { urbanProfessionals: { trust: -sev(s, 3) }, industrialWorkers: { trust: -sev(s, 4) }, remoteCommunities: { trust: -sev(s, 5) } },
        explanation: 'Ignoring the protest erodes trust across all groups. The demonstration may grow.',
        outcomeText: 'No changes are made. The protest grows and media coverage intensifies.',
      },
      {
        id: 'restrict',
        label: 'Restrict the Protest',
        description: 'Cite public safety concerns to limit the demonstration and restrict gathering in public spaces.',
        effects: { publicTrust: -sev(s, 8), civilLiberties: -sev(s, 6), humanAgency: -sev(s, 5) },
        domainEffects: { publicSafety: { automation: 5, oversight: -5 } },
        explanation: 'Restricting the protest is the most damaging option for trust, liberties, and agency. It may silence dissent temporarily but at a severe cost.',
        outcomeText: 'Public gatherings are restricted. The demonstration is dispersed, but public anger intensifies.',
      },
    ],
  },
  {
    id: 'efficiency-pressure',
    title: 'Efficiency Pressure',
    category: 'governance',
    description: 'A coalition of business leaders and technology firms is lobbying to increase automation across all domains, citing competitive pressure from neighboring societies. They argue that maintaining human oversight is economically unsustainable.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('efficiency-pressure')) return 0;
      if (s.quarter < 3) return 0;
      if (s.indicators.productivity < 50) return 0;
      return Math.max(0, (s.indicators.productivity - 45) * 0.2);
    },
    oneTime: true,
    affectedDomains: ['economic', 'resourceAllocation'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers'],
    triggerDescription: (s) => `Triggered after quarter 3 with productivity above 50 (${s.indicators.productivity}%).`,
    buildOptions: (s) => [
      {
        id: 'increase-auto',
        label: 'Increase Automation Across Domains',
        description: 'Respond to competitive pressure by expanding automation in economic and resource domains.',
        effects: { productivity: sev(s, 5), humanAgency: -sev(s, 3), systemResilience: -sev(s, 2) },
        domainEffects: { economic: { automation: 10 }, resourceAllocation: { automation: 8 } },
        groupEffects: { urbanProfessionals: { trust: sev(s, 2) }, industrialWorkers: { trust: -sev(s, 3), employmentStability: -sev(s, 4) } },
        explanation: 'Increasing automation boosts productivity but reduces agency and resilience. Industrial workers are most affected.',
        outcomeText: 'Automation is expanded. Business leaders applaud the decision, but workforce concerns grow.',
      },
      {
        id: 'balanced',
        label: 'Balanced Approach with Safeguards',
        description: 'Increase automation selectively while strengthening oversight and transition support.',
        effects: { fiscalDelta: -40, productivity: sev(s, 2), humanAgency: sev(s, 1), workforceStability: sev(s, 2) },
        domainEffects: { economic: { automation: 5, oversight: 5 } },
        groupEffects: { industrialWorkers: { trust: sev(s, 2), employmentStability: sev(s, 3) } },
        explanation: 'A balanced approach captures some efficiency gains while protecting workers and maintaining oversight.',
        outcomeText: 'A measured automation expansion is paired with oversight and transition support.',
      },
      {
        id: 'reject',
        label: 'Reject the Pressure',
        description: 'Maintain current automation levels. Human oversight is not negotiable.',
        effects: { productivity: -sev(s, 2), publicTrust: sev(s, 2), humanAgency: sev(s, 2) },
        groupEffects: { industrialWorkers: { trust: sev(s, 3) }, urbanProfessionals: { trust: -sev(s, 2) } },
        explanation: 'Rejecting the pressure preserves oversight and agency but may reduce economic competitiveness. Workers approve; business leaders do not.',
        outcomeText: 'You reject the lobbying effort. Current automation levels are maintained.',
      },
      {
        id: 'public-debate',
        label: 'Call for Public Debate',
        description: 'Delay the decision and initiate a public consultation process.',
        effects: { publicTrust: sev(s, 2), humanAgency: sev(s, 2) },
        delayedEffects: [{
          description: 'Public consultation produces a set of recommendations.',
          delayTurns: 2,
          effects: { publicTrust: sev(s, 2), humanAgency: sev(s, 2) },
        }],
        explanation: 'Public debate builds trust and agency but delays action. The recommendations may not satisfy either side.',
        outcomeText: 'A public consultation is initiated. Recommendations will be produced in two quarters.',
      },
    ],
  },
  {
    id: 'surveillance-expansion',
    title: 'The Surveillance Proposal',
    category: 'governance',
    description: 'The public safety system has proposed expanding automated surveillance to include predictive behavior analysis. The system estimates this would reduce crime rates by 22% but would require extensive data collection on all citizens.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('surveillance-expansion')) return 0;
      if (s.quarter < 4) return 0;
      if (s.domains.publicSafety.automation < 50) return 0;
      return Math.max(0, (s.domains.publicSafety.automation - 45) * 0.3);
    },
    oneTime: true,
    affectedDomains: ['publicSafety'],
    affectedGroups: ['urbanProfessionals', 'remoteCommunities'],
    triggerDescription: (s) => `Triggered after quarter 4 with public safety automation above 50 (${s.domains.publicSafety.automation}%).`,
    buildOptions: (s) => [
      {
        id: 'approve',
        label: 'Approve Full Expansion',
        description: 'Authorize the complete surveillance expansion with predictive behavior analysis.',
        effects: { productivity: sev(s, 2), civilLiberties: -sev(s, 8), publicTrust: -sev(s, 4), socialEquity: -sev(s, 3) },
        domainEffects: { publicSafety: { automation: 10, oversight: -5, transparency: -10 } },
        groupEffects: { urbanProfessionals: { trust: -sev(s, 3) }, remoteCommunities: { trust: -sev(s, 5), perceivedFairness: -sev(s, 4) } },
        explanation: 'Full expansion may reduce crime but severely damages civil liberties, trust, and equity. Remote communities are most affected.',
        outcomeText: 'Predictive surveillance is deployed. Crime rates begin to drop, but civil liberty concerns escalate.',
      },
      {
        id: 'limited',
        label: 'Approve Limited Expansion',
        description: 'Authorize surveillance expansion with strict data retention limits and oversight requirements.',
        effects: { fiscalDelta: -30, civilLiberties: -sev(s, 3), publicTrust: sev(s, 1) },
        domainEffects: { publicSafety: { automation: 5, transparency: 5, oversight: 5 } },
        explanation: 'Limited expansion with safeguards reduces the civil liberties impact while capturing some public safety benefits.',
        outcomeText: 'Surveillance is expanded with strict safeguards. Data retention is limited and oversight is strengthened.',
      },
      {
        id: 'reject',
        label: 'Reject the Proposal',
        description: 'Reject the surveillance expansion. Current public safety measures are sufficient.',
        effects: { civilLiberties: sev(s, 3), publicTrust: sev(s, 2), humanAgency: sev(s, 2) },
        groupEffects: { urbanProfessionals: { trust: sev(s, 2) }, remoteCommunities: { trust: sev(s, 4) } },
        explanation: 'Rejecting the expansion protects liberties and builds trust but forgoes potential crime reduction.',
        outcomeText: 'The surveillance proposal is rejected. Civil liberty advocates praise the decision.',
      },
      {
        id: 'community-policing',
        label: 'Invest in Community-Based Approaches',
        description: 'Redirect the proposed surveillance budget toward community policing and social programs.',
        effects: { fiscalDelta: -sev(s, 60), publicTrust: sev(s, 3), socialEquity: sev(s, 4), civilLiberties: sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: sev(s, 4), perceivedFairness: sev(s, 3) }, urbanProfessionals: { trust: sev(s, 2) } },
        explanation: 'Community-based approaches are more expensive but improve trust, equity, and liberties simultaneously.',
        outcomeText: 'Surveillance funds are redirected to community policing. Public trust improves across all groups.',
      },
    ],
  },
  {
    id: 'infrastructure-degradation',
    title: 'Infrastructure Degradation',
    category: 'infrastructure',
    description: 'Routine inspections reveal accelerated wear across the transportation network. The automated maintenance system has been optimizing for cost over longevity, and the cumulative effect is becoming visible. Several critical components are approaching failure thresholds.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('infrastructure-degradation')) return 0;
      if (s.indicators.infrastructureHealth < 60) return Math.max(0, (60 - s.indicators.infrastructureHealth) * 0.5);
      if (s.quarter < 6) return 0;
      return Math.max(0, 8);
    },
    oneTime: true,
    affectedDomains: ['transportation'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers'],
    triggerDescription: (s) => `Triggered by infrastructure health below 60 (${s.indicators.infrastructureHealth}%) or after quarter 6.`,
    buildOptions: (s) => [
      {
        id: 'emergency-maintenance',
        label: 'Emergency Maintenance Program',
        description: 'Launch an immediate, comprehensive maintenance program across all critical components.',
        effects: { fiscalDelta: -sev(s, 120), infrastructureHealth: sev(s, 6) },
        delayedEffects: [{
          description: 'Emergency maintenance restores critical components to safe operating conditions.',
          delayTurns: 1,
          effects: { infrastructureHealth: sev(s, 4), productivity: sev(s, 2) },
        }],
        explanation: 'Emergency maintenance is expensive but addresses the problem quickly. Health improves significantly within one quarter.',
        outcomeText: 'A comprehensive maintenance program is launched. Critical components will be restored next quarter.',
      },
      {
        id: 'reprogram',
        label: 'Reprogram the Maintenance System',
        description: 'Adjust the automated maintenance system to prioritize longevity over cost.',
        effects: { fiscalDelta: -40, infrastructureHealth: sev(s, 2), productivity: -sev(s, 2) },
        delayedEffects: [{
          description: 'Reprogrammed maintenance system gradually restores infrastructure health.',
          delayTurns: 3,
          effects: { infrastructureHealth: sev(s, 6), systemResilience: sev(s, 3) },
        }],
        domainEffects: { transportation: { reliability: 5 } },
        explanation: 'Reprogramming is cheaper upfront and fixes the root cause but takes longer to show results.',
        outcomeText: 'The maintenance system is reprogrammed to prioritize longevity. Improvements will accumulate over several quarters.',
      },
      {
        id: 'manual-inspection',
        label: 'Switch to Manual Inspection',
        description: 'Replace the automated maintenance system with human-led inspections and repairs.',
        effects: { fiscalDelta: -sev(s, 80), infrastructureHealth: sev(s, 3), humanAgency: sev(s, 3), workforceStability: sev(s, 2) },
        domainEffects: { transportation: { automation: -10, oversight: 10 } },
        explanation: 'Manual inspection is more expensive and slower but improves human oversight and creates skilled jobs.',
        outcomeText: 'Human inspection teams replace the automated system. Maintenance is slower but more thorough.',
      },
      {
        id: 'ignore',
        label: 'Defer Maintenance',
        description: 'Continue current operations. The components have not failed yet.',
        effects: { infrastructureHealth: -sev(s, 4), systemResilience: -sev(s, 2), fiscalDelta: sev(s, 40) },
        explanation: 'Deferring maintenance saves money now but accelerates degradation. The risk of a major failure increases.',
        outcomeText: 'Maintenance is deferred. The transportation network continues operating but with increasing risk.',
      },
    ],
  },
  {
    id: 'workforce-displacement',
    title: 'Workforce Displacement Crisis',
    category: 'social',
    description: 'A new round of automation in the Industrial Belt has displaced 15,000 workers in a single quarter. Local services are overwhelmed, and the displaced workers lack the skills needed for available positions in other sectors.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('workforce-displacement')) return 0;
      if (s.domains.economic.automation < 65) return 0;
      const lowStability = s.indicators.workforceStability < 50 ? 15 : 0;
      return Math.max(0, (s.domains.economic.automation - 60) * 0.3 + lowStability);
    },
    oneTime: true,
    affectedDomains: ['economic'],
    affectedGroups: ['industrialWorkers', 'remoteCommunities'],
    triggerDescription: (s) => `Triggered by high economic automation (${s.domains.economic.automation}%)${s.indicators.workforceStability < 50 ? ' and low workforce stability' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'retrain',
        label: 'Emergency Retraining Program',
        description: 'Fund an intensive retraining program to transition displaced workers into available positions.',
        effects: { fiscalDelta: -sev(s, 110), workforceStability: sev(s, 3), socialEquity: sev(s, 3) },
        delayedEffects: [{
          description: 'Retrained workers transition to new sectors. Employment stability improves.',
          delayTurns: 2,
          effects: { workforceStability: sev(s, 5), socialEquity: sev(s, 2), productivity: sev(s, 2) },
        }],
        groupEffects: { industrialWorkers: { trust: sev(s, 5), employmentStability: sev(s, 4) } },
        explanation: 'Retraining is expensive but addresses both the immediate crisis and long-term stability. Benefits arrive after the program completes.',
        outcomeText: 'An emergency retraining program is launched. Workers will transition to new sectors within two quarters.',
      },
      {
        id: 'slow-automation',
        label: 'Slow Automation Rollout',
        description: 'Delay further automation in the Industrial Belt to give the workforce time to adapt.',
        effects: { productivity: -sev(s, 4), workforceStability: sev(s, 3), socialEquity: sev(s, 2) },
        domainEffects: { economic: { automation: -8 } },
        groupEffects: { industrialWorkers: { trust: sev(s, 4), employmentStability: sev(s, 5) }, urbanProfessionals: { trust: -sev(s, 2) } },
        explanation: 'Slowing automation protects workers but reduces productivity. Business leaders will object.',
        outcomeText: 'Automation rollout is slowed. Displaced workers gain time to adapt, but economic output declines.',
      },
      {
        id: 'universal-benefit',
        label: 'Universal Transition Benefit',
        description: 'Provide a basic income to all displaced workers during the transition period.',
        effects: { fiscalDelta: -sev(s, 90), workforceStability: sev(s, 2), socialEquity: sev(s, 4), publicTrust: sev(s, 2) },
        groupEffects: { industrialWorkers: { trust: sev(s, 5), serviceAccess: sev(s, 3) }, remoteCommunities: { trust: sev(s, 3) } },
        explanation: 'Transition benefits provide immediate relief but do not address the skills gap. They are expensive and ongoing.',
        outcomeText: 'Transition benefits are distributed to displaced workers. Immediate hardship is reduced.',
      },
      {
        id: 'market-forces',
        label: 'Let Market Forces Adjust',
        description: 'The economy will create new jobs naturally. Government intervention is unnecessary.',
        effects: { workforceStability: -sev(s, 4), socialEquity: -sev(s, 3), publicTrust: -sev(s, 3) },
        groupEffects: { industrialWorkers: { trust: -sev(s, 6), employmentStability: -sev(s, 5) } },
        explanation: 'Inaction saves money but allows the crisis to deepen. Displaced workers and their communities lose faith in institutions.',
        outcomeText: 'No intervention is provided. Unemployment rises and social tension grows.',
      },
    ],
  },
  {
    id: 'transparency-scandal',
    title: 'The Transparency Scandal',
    category: 'governance',
    description: 'An investigation by independent journalists has revealed that the resource allocation system has been using a secret secondary optimization criterion that prioritizes politically connected districts. The algorithm\'s published criteria made no mention of this.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('transparency-scandal')) return 0;
      if (s.quarter < 7) return 0;
      const lowTransparency = s.domains.resourceAllocation.transparency < 45 ? 20 : 0;
      return Math.max(0, 12 + lowTransparency);
    },
    oneTime: true,
    affectedDomains: ['resourceAllocation'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities', 'publicServiceInstitutions'],
    triggerDescription: (s) => `Triggered after quarter 7${s.domains.resourceAllocation.transparency < 45 ? ' with low resource allocation transparency' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'full-reform',
        label: 'Full Transparency Reform',
        description: 'Publish all decision criteria, eliminate the secondary optimization, and open the system to independent audit.',
        effects: { fiscalDelta: -50, publicTrust: sev(s, 5), civilLiberties: sev(s, 3), socialEquity: sev(s, 4), informationIntegrity: sev(s, 3) },
        domainEffects: { resourceAllocation: { transparency: 20, oversight: 10 } },
        groupEffects: { urbanProfessionals: { trust: sev(s, 4) }, industrialWorkers: { trust: sev(s, 4) }, remoteCommunities: { trust: sev(s, 5), perceivedFairness: sev(s, 4) } },
        explanation: 'Full reform is expensive but rebuilds trust comprehensively. It sets a strong precedent for algorithmic transparency.',
        outcomeText: 'All decision criteria are published and the secondary optimization is eliminated. An independent audit is established.',
      },
      {
        id: 'remove-criterion',
        label: 'Remove the Hidden Criterion',
        description: 'Eliminate the secondary optimization but do not publish the full criteria.',
        effects: { publicTrust: sev(s, 1), socialEquity: sev(s, 2) },
        domainEffects: { resourceAllocation: { oversight: 5 } },
        explanation: 'Removing the criterion fixes the immediate problem but does not address the transparency deficit. Trust recovers slowly.',
        outcomeText: 'The hidden criterion is removed. The system\'s criteria remain partially opaque.',
      },
      {
        id: 'deny',
        label: 'Dispute the Finding',
        description: 'Challenge the journalists\' methodology and deny that the secondary criterion exists.',
        effects: { publicTrust: -sev(s, 6), civilLiberties: -sev(s, 2), informationIntegrity: -sev(s, 3) },
        groupEffects: { urbanProfessionals: { trust: -sev(s, 5) }, publicServiceInstitutions: { trust: -sev(s, 4) } },
        explanation: 'Denial preserves the status quo but severely damages trust and credibility when the evidence is strong.',
        outcomeText: 'You dispute the finding. Public skepticism grows and media coverage intensifies.',
      },
      {
        id: 'independent-investigation',
        label: 'Order an Independent Investigation',
        description: 'Commission a fully independent investigation with public reporting.',
        effects: { fiscalDelta: -70, publicTrust: sev(s, 3), informationIntegrity: sev(s, 4) },
        delayedEffects: [{
          description: 'Investigation confirms the hidden criterion and recommends reforms.',
          delayTurns: 2,
          effects: { publicTrust: sev(s, 3), socialEquity: sev(s, 3) },
        }],
        explanation: 'An independent investigation is expensive but provides credible verification. Reforms follow once findings are confirmed.',
        outcomeText: 'An independent investigation is commissioned. Findings will be published in two quarters.',
      },
    ],
  },
  {
    id: 'regional-isolation',
    title: 'Regional Isolation',
    category: 'infrastructure',
    description: 'The Northern Communities region has become increasingly isolated as automated transportation systems optimize routes for high-density corridors. Service frequency to remote areas has dropped by 40% over the past year, and the region\'s economic activity is declining.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('regional-isolation')) return 0;
      if (s.domains.transportation.automation < 60) return 0;
      const northernAccess = s.regions.northernCommunities.serviceAccess;
      if (northernAccess > 50) return 0;
      return Math.max(0, (60 - northernAccess) * 0.4 + (s.domains.transportation.automation - 55) * 0.3);
    },
    oneTime: true,
    affectedDomains: ['transportation'],
    affectedGroups: ['remoteCommunities'],
    triggerDescription: (s) => `Triggered by high transportation automation (${s.domains.transportation.automation}%) and low Northern Communities service access (${s.regions.northernCommunities.serviceAccess}%).`,
    buildOptions: (s) => [
      {
        id: 'minimum-service',
        label: 'Establish Minimum Service Guarantee',
        description: 'Mandate a minimum service frequency for all regions regardless of route optimization.',
        effects: { fiscalDelta: -sev(s, 80), socialEquity: sev(s, 5), publicTrust: sev(s, 3) },
        groupEffects: { remoteCommunities: { trust: sev(s, 6), serviceAccess: sev(s, 8) } },
        domainEffects: { transportation: { automation: -3, oversight: 5 } },
        explanation: 'Minimum service guarantees improve equity but override optimization, increasing costs.',
        outcomeText: 'A minimum service guarantee is established. Northern Communities receive regular service regardless of optimization.',
      },
      {
        id: 'subsidize',
        label: 'Subsidize Remote Routes',
        description: 'Provide financial subsidies for routes serving remote communities.',
        effects: { fiscalDelta: -sev(s, 60), socialEquity: sev(s, 3) },
        delayedEffects: [{
          description: 'Subsidized routes restore economic activity in the Northern Communities.',
          delayTurns: 2,
          effects: { socialEquity: sev(s, 2), productivity: sev(s, 2) },
        }],
        groupEffects: { remoteCommunities: { trust: sev(s, 4), serviceAccess: sev(s, 5) } },
        explanation: 'Subsidies maintain the optimization while funding remote service separately. More expensive but preserves efficiency.',
        outcomeText: 'Remote routes receive subsidies. Service frequency begins to recover.',
      },
      {
        id: 'community-transport',
        label: 'Community-Managed Transport',
        description: 'Transfer transportation management for remote routes to local community organizations.',
        effects: { fiscalDelta: -sev(s, 40), socialEquity: sev(s, 4), humanAgency: sev(s, 4), productivity: -sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: sev(s, 5), serviceAccess: sev(s, 4), perceivedFairness: sev(s, 3) } },
        explanation: 'Community management gives remote populations control over their transportation but reduces overall efficiency.',
        outcomeText: 'Remote transportation is transferred to community organizations. Local control increases.',
      },
      {
        id: 'accept',
        label: 'Accept the Optimization',
        description: 'The system is optimizing correctly. Remote areas are naturally less efficient to serve.',
        effects: { socialEquity: -sev(s, 4), publicTrust: -sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: -sev(s, 5), serviceAccess: -sev(s, 3) } },
        explanation: 'Accepting the optimization saves money but deepens regional inequality. Northern Communities lose further trust.',
        outcomeText: 'No action is taken. Service to Northern Communities continues to decline.',
      },
    ],
  },
  {
    id: 'ai-alignment-debate',
    title: 'The Alignment Debate',
    category: 'governance',
    description: 'A philosophical and technical debate has emerged about whether the automated systems\' optimization objectives align with what citizens actually value. The systems optimize for measurable outcomes, but many citizens report feeling that important qualitative aspects of life are being ignored.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('ai-alignment-debate')) return 0;
      if (s.quarter < 8) return 0;
      const avgAutomation = Object.values(s.domains).reduce((sum, d) => sum + d.automation, 0) / 5;
      if (avgAutomation < 60) return 0;
      return Math.max(0, (avgAutomation - 55) * 0.2);
    },
    oneTime: true,
    affectedDomains: ['economic', 'resourceAllocation', 'healthcare'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities'],
    triggerDescription: (s) => {
      const avgAuto = Math.round(Object.values(s.domains).reduce((sum, d) => sum + d.automation, 0) / 5);
      return `Triggered after quarter 8 with average automation above 60 (${avgAuto}%).`;
    },
    buildOptions: (s) => [
      {
        id: 'redesign-objectives',
        label: 'Redesign Optimization Objectives',
        description: 'Convene a citizen assembly to redefine what the systems should optimize for.',
        effects: { fiscalDelta: -50, humanAgency: sev(s, 5), publicTrust: sev(s, 4), socialEquity: sev(s, 3), productivity: -sev(s, 3) },
        delayedEffects: [{
          description: 'Redesigned objectives produce more holistic outcomes.',
          delayTurns: 3,
          effects: { publicTrust: sev(s, 3), humanAgency: sev(s, 3), socialEquity: sev(s, 2) },
        }],
        explanation: 'Redesigning objectives is the most thorough response but is expensive and temporarily reduces productivity. Long-term benefits are significant.',
        outcomeText: 'A citizen assembly is convened to redefine optimization objectives. New objectives will be implemented over three quarters.',
      },
      {
        id: 'add-constraints',
        label: 'Add Qualitative Constraints',
        description: 'Add minimum thresholds for qualitative outcomes that the systems cannot override.',
        effects: { fiscalDelta: -40, humanAgency: sev(s, 3), publicTrust: sev(s, 2), productivity: -sev(s, 1) },
        explanation: 'Adding constraints preserves efficiency while protecting qualitative outcomes. A middle-ground approach.',
        outcomeText: 'Qualitative constraints are added to the optimization systems. Important outcomes are now protected.',
      },
      {
        id: 'dismiss',
        label: 'Dismiss the Concern',
        description: 'The systems are performing well on measurable outcomes. Qualitative concerns are subjective.',
        effects: { publicTrust: -sev(s, 3), humanAgency: -sev(s, 2) },
        groupEffects: { urbanProfessionals: { trust: -sev(s, 2) }, industrialWorkers: { trust: -sev(s, 3) }, remoteCommunities: { trust: -sev(s, 3) } },
        explanation: 'Dismissing qualitative concerns preserves efficiency but erodes trust and agency across all groups.',
        outcomeText: 'The concerns are dismissed. Public frustration grows as qualitative aspects of life continue to decline.',
      },
      {
        id: 'research',
        label: 'Fund Alignment Research',
        description: 'Commission research into methods for aligning automated systems with human values.',
        effects: { fiscalDelta: -60, informationIntegrity: sev(s, 3), humanAgency: sev(s, 2) },
        delayedEffects: [{
          description: 'Alignment research produces a framework for incorporating qualitative outcomes.',
          delayTurns: 3,
          effects: { informationIntegrity: sev(s, 3), humanAgency: sev(s, 2), publicTrust: sev(s, 2) },
        }],
        explanation: 'Research is expensive and takes time but produces a rigorous framework for addressing alignment long-term.',
        outcomeText: 'Alignment research is commissioned. A framework will be developed over three quarters.',
      },
    ],
  },
  {
    id: 'healthcare-rationing',
    title: 'Automated Healthcare Rationing',
    category: 'crisis',
    description: 'The automated healthcare triage system has begun prioritizing treatments based on a cost-effectiveness metric. Elderly patients in the Coastal Corridor report being deprioritized for elective procedures. The system is technically efficient, but the outcome feels dehumanizing to affected families.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('healthcare-rationing')) return 0;
      if (s.domains.healthcare.automation < 55) return 0;
      const lowEquity = s.indicators.socialEquity < 50 ? 15 : 0;
      return Math.max(0, (s.domains.healthcare.automation - 50) * 0.3 + lowEquity);
    },
    oneTime: true,
    affectedDomains: ['healthcare'],
    affectedGroups: ['remoteCommunities', 'publicServiceInstitutions'],
    triggerDescription: (s) => `Triggered by healthcare automation above 55 (${s.domains.healthcare.automation}%)${s.indicators.socialEquity < 50 ? ' and low social equity' : ''}.`,
    buildOptions: (s) => [
      {
        id: 'human-triage',
        label: 'Return to Human Triage',
        description: 'Require human medical professionals to make all triage decisions.',
        effects: { fiscalDelta: -sev(s, 70), socialEquity: sev(s, 4), publicTrust: sev(s, 3), humanAgency: sev(s, 4), productivity: -sev(s, 3) },
        domainEffects: { healthcare: { automation: -10, oversight: 10 } },
        groupEffects: { remoteCommunities: { trust: sev(s, 4), serviceAccess: sev(s, 3) } },
        explanation: 'Human triage is more expensive and slower but restores dignity and judgment to medical decisions.',
        outcomeText: 'Human medical professionals now handle all triage decisions. The automated system is reassigned to support roles.',
      },
      {
        id: 'modify-criteria',
        label: 'Modify the Triage Criteria',
        description: 'Adjust the automated system to include quality-of-life and patient preference factors.',
        effects: { fiscalDelta: -40, socialEquity: sev(s, 3), publicTrust: sev(s, 2), civilLiberties: sev(s, 2) },
        domainEffects: { healthcare: { transparency: 5, oversight: 5 } },
        explanation: 'Modifying criteria keeps the automated system but makes it more humane. A balanced approach.',
        outcomeText: 'Triage criteria are expanded to include quality-of-life and patient preference factors.',
      },
      {
        id: 'accept',
        label: 'Accept the System',
        description: 'The cost-effectiveness metric is the most efficient use of limited medical resources.',
        effects: { publicTrust: -sev(s, 4), socialEquity: -sev(s, 3) },
        groupEffects: { remoteCommunities: { trust: -sev(s, 4) }, publicServiceInstitutions: { trust: -sev(s, 3) } },
        explanation: 'Accepting the system preserves efficiency but erodes trust and equity. Affected families feel dehumanized.',
        outcomeText: 'The triage system continues unchanged. Public concern about the dehumanization of healthcare grows.',
      },
      {
        id: 'appeal-mechanism',
        label: 'Add an Appeal Mechanism',
        description: 'Allow patients to appeal automated triage decisions to a human review board.',
        effects: { fiscalDelta: -30, humanAgency: sev(s, 3), publicTrust: sev(s, 2), civilLiberties: sev(s, 2) },
        domainEffects: { healthcare: { appealAccess: 15 } },
        groupEffects: { remoteCommunities: { appealAbility: sev(s, 5) } },
        explanation: 'An appeal mechanism keeps the automated system while providing a safety valve for problematic decisions.',
        outcomeText: 'An appeal board is established. Patients can now request human review of triage decisions.',
      },
    ],
  },
  {
    id: 'cascade-failure-risk',
    title: 'Cascade Failure Risk Detected',
    category: 'infrastructure',
    description: 'A routine resilience assessment has identified a critical single point of failure in the infrastructure network. The Central District power hub serves as the primary node for 4 of the 5 regions. If it fails, services across the entire society could be disrupted simultaneously.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('cascade-failure-risk')) return 0;
      if (s.quarter < 5) return 0;
      const avgDep = Object.values(s.regions).reduce((sum, r) => sum + r.infrastructureDependence, 0) / 5;
      if (avgDep < 70) return 0;
      return Math.max(0, (avgDep - 65) * 0.3 + (50 - s.indicators.systemResilience) * 0.2);
    },
    oneTime: true,
    affectedDomains: ['transportation', 'healthcare', 'resourceAllocation'],
    affectedGroups: ['urbanProfessionals', 'publicServiceInstitutions'],
    triggerDescription: (s) => {
      const avgDep = Math.round(Object.values(s.regions).reduce((sum, r) => sum + r.infrastructureDependence, 0) / 5);
      return `Triggered after quarter 5 with high infrastructure interdependence (${avgDep}%).`;
    },
    buildOptions: (s) => [
      {
        id: 'decentralize',
        label: 'Decentralize Critical Infrastructure',
        description: 'Build redundant power and data hubs so no single node serves multiple regions.',
        effects: { fiscalDelta: -sev(s, 180), infrastructureHealth: -sev(s, 2), productivity: -sev(s, 3) },
        delayedEffects: [{
          description: 'Decentralization completes. The society is now resilient to single-point failures.',
          delayTurns: 3,
          effects: { systemResilience: sev(s, 10), infrastructureHealth: sev(s, 5) },
        }],
        explanation: 'Decentralization is very expensive and temporarily disruptive but eliminates the cascade risk permanently.',
        outcomeText: 'A decentralization program is launched. Redundant hubs will be operational in three quarters.',
      },
      {
        id: 'backup-hub',
        label: 'Build a Backup Hub',
        description: 'Construct a single backup hub that can take over if the primary fails.',
        effects: { fiscalDelta: -sev(s, 100), systemResilience: sev(s, 4), infrastructureHealth: sev(s, 2) },
        delayedEffects: [{
          description: 'Backup hub becomes operational, providing failover capability.',
          delayTurns: 2,
          effects: { systemResilience: sev(s, 3) },
        }],
        explanation: 'A backup hub is cheaper than full decentralization and provides a safety net. It does not eliminate all single points of failure.',
        outcomeText: 'A backup hub is under construction. It will provide failover capability in two quarters.',
      },
      {
        id: 'monitor',
        label: 'Enhanced Monitoring Only',
        description: 'Install advanced monitoring on the primary hub to detect failure early.',
        effects: { fiscalDelta: -sev(s, 30), systemResilience: sev(s, 1), informationIntegrity: sev(s, 2) },
        explanation: 'Enhanced monitoring is cheap but does not eliminate the risk. It only provides earlier warning of a failure.',
        outcomeText: 'Advanced monitoring is installed on the primary hub. Early warning capability is improved but the single point of failure remains.',
      },
      {
        id: 'accept-risk',
        label: 'Accept the Risk',
        description: 'The hub has been reliable. The probability of failure is low.',
        effects: { systemResilience: -sev(s, 2) },
        explanation: 'Accepting the risk saves money but leaves the society vulnerable to a catastrophic cascade failure.',
        outcomeText: 'No action is taken. The single point of failure remains.',
      },
    ],
  },
  {
    id: 'public-trust-recovery',
    title: 'Trust Recovery Opportunity',
    category: 'opportunity',
    description: 'After several quarters of stability, public trust is beginning to recover naturally. Citizens report feeling more confident in institutions. This is an opportunity to consolidate the recovery with a visible public commitment.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('public-trust-recovery')) return 0;
      if (s.quarter < 8) return 0;
      if (s.indicators.publicTrust < 45 || s.indicators.publicTrust > 65) return 0;
      const recentTrend = s.indicatorHistory.length >= 3;
      if (!recentTrend) return 0;
      const trend = s.indicators.publicTrust - s.indicatorHistory[s.indicatorHistory.length - 3].indicators.publicTrust;
      if (trend < 5) return 0;
      return 15;
    },
    oneTime: true,
    affectedDomains: [],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities', 'publicServiceInstitutions'],
    triggerDescription: () => 'Triggered after quarter 8 when public trust is recovering (rising trend, between 45-65).',
    buildOptions: (s) => [
      {
        id: 'public-charter',
        label: 'Publish a Public Governance Charter',
        description: 'Issue a formal charter committing to transparency, accountability, and human oversight principles.',
        effects: { fiscalDelta: -30, publicTrust: sev(s, 5), humanAgency: sev(s, 3), civilLiberties: sev(s, 3) },
        groupEffects: { urbanProfessionals: { trust: sev(s, 4) }, industrialWorkers: { trust: sev(s, 4) }, remoteCommunities: { trust: sev(s, 5) }, publicServiceInstitutions: { trust: sev(s, 4) } },
        explanation: 'A public charter consolidates the trust recovery and sets a durable precedent. It is relatively inexpensive for a significant trust boost.',
        outcomeText: 'A governance charter is published. Public confidence strengthens across all population groups.',
      },
      {
        id: 'community-engagement',
        label: 'Launch Community Engagement Program',
        description: 'Establish regular community forums for citizens to provide input on automated decision systems.',
        effects: { fiscalDelta: -40, publicTrust: sev(s, 3), humanAgency: sev(s, 4), socialEquity: sev(s, 2) },
        groupEffects: { remoteCommunities: { trust: sev(s, 4), appealAbility: sev(s, 3) }, industrialWorkers: { trust: sev(s, 3) } },
        explanation: 'Community engagement institutionalizes citizen participation. It boosts agency and trust, especially among marginalized groups.',
        outcomeText: 'Community forums are established. Citizens gain a regular channel for input on automated systems.',
      },
      {
        id: 'efficiency-report',
        label: 'Publish an Efficiency Report',
        description: 'Highlight the productivity gains from automation to reinforce public confidence.',
        effects: { publicTrust: sev(s, 2), productivity: sev(s, 1) },
        explanation: 'An efficiency report leverages the trust recovery to reinforce support for current policies. Modest gains.',
        outcomeText: 'An efficiency report is published. Public awareness of productivity gains increases.',
      },
      {
        id: 'no-action',
        label: 'Let Trust Recover Naturally',
        description: 'No intervention is needed. The natural recovery will continue.',
        effects: {},
        explanation: 'Taking no action preserves resources. The trust recovery may continue or may plateau without consolidation.',
        outcomeText: 'No action is taken. Trust continues its natural trajectory.',
      },
    ],
  },
  {
    id: 'research-breakthrough',
    title: 'Research Breakthrough',
    category: 'opportunity',
    description: 'Engineers at the Research Quarter have developed a new verification framework that can detect algorithmic bias in real-time without slowing down automated decisions. This could significantly improve fairness without sacrificing efficiency.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('research-breakthrough')) return 0;
      if (s.quarter < 10) return 0;
      if (s.investments.research.level < 2) return 0;
      return Math.max(0, 15 + s.investments.research.level * 3);
    },
    oneTime: true,
    affectedDomains: ['economic', 'resourceAllocation', 'healthcare'],
    affectedGroups: [],
    triggerDescription: (s) => `Triggered after quarter 10 with research investment level ${s.investments.research.level} (requires level 2+).`,
    buildOptions: (s) => [
      {
        id: 'deploy',
        label: 'Deploy Across All Domains',
        description: 'Implement the real-time bias detection framework across all automated systems.',
        effects: { fiscalDelta: -sev(s, 100), socialEquity: sev(s, 6), publicTrust: sev(s, 4), humanAgency: sev(s, 3), informationIntegrity: sev(s, 4) },
        domainEffects: { economic: { transparency: 5 }, resourceAllocation: { transparency: 5 }, healthcare: { transparency: 5 } },
        explanation: 'Full deployment is expensive but provides comprehensive bias detection. Equity, trust, and information quality all improve.',
        outcomeText: 'The bias detection framework is deployed across all automated systems. Real-time fairness monitoring is now active.',
      },
      {
        id: 'pilot',
        label: 'Pilot in Resource Allocation',
        description: 'Deploy the framework in the resource allocation domain first, then evaluate.',
        effects: { fiscalDelta: -sev(s, 40), socialEquity: sev(s, 3), informationIntegrity: sev(s, 2) },
        domainEffects: { resourceAllocation: { transparency: 8 } },
        explanation: 'A pilot is cheaper and less risky. Benefits are limited to one domain initially but can be expanded later.',
        outcomeText: 'The framework is piloted in resource allocation. Results will inform broader deployment.',
      },
      {
        id: 'share',
        label: 'Share the Framework Publicly',
        description: 'Release the framework as an open standard for other societies to adopt.',
        effects: { fiscalDelta: -20, publicTrust: sev(s, 5), humanAgency: sev(s, 2), informationIntegrity: sev(s, 3) },
        explanation: 'Sharing the framework builds diplomatic goodwill and public trust but forgoes competitive advantage.',
        outcomeText: 'The framework is released as an open standard. International recognition boosts public confidence.',
      },
      {
        id: 'shelve',
        label: 'Shelve for Later',
        description: 'The framework is promising but not ready for deployment. Continue research.',
        effects: { fiscalDelta: -10, informationIntegrity: sev(s, 1) },
        explanation: 'Shelving preserves resources but wastes the breakthrough opportunity. The framework may become outdated.',
        outcomeText: 'The framework is shelved for further development. Its potential remains unrealized.',
      },
    ],
  },
  {
    id: 'election-pressure',
    title: 'Election Year Pressure',
    category: 'governance',
    description: 'An election is approaching, and political candidates are taking positions on automated governance. Some candidates promise to dramatically expand automation, others promise to restrict it. Your decisions this quarter will be heavily scrutinized.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('election-pressure')) return 0;
      // Around quarter 16 (year 4, election year)
      if (s.quarter !== 16 && s.quarter !== 17) return 0;
      return 20;
    },
    oneTime: true,
    affectedDomains: ['economic', 'publicSafety', 'healthcare'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities'],
    triggerDescription: () => 'Triggered during election period (quarters 16-17).',
    buildOptions: (s) => [
      {
        id: 'pro-automation',
        label: 'Side with Pro-Automation Candidates',
        description: 'Announce an expansion of automated governance to demonstrate efficiency gains.',
        effects: { productivity: sev(s, 4), publicTrust: sev(s, 1), humanAgency: -sev(s, 3), systemResilience: -sev(s, 2) },
        domainEffects: { economic: { automation: 5 }, healthcare: { automation: 5 } },
        groupEffects: { urbanProfessionals: { trust: sev(s, 2) }, industrialWorkers: { trust: -sev(s, 3) } },
        explanation: 'Siding with pro-automation candidates boosts productivity and urban professional support but alienates workers and reduces agency.',
        outcomeText: 'You announce automation expansion. Pro-automation candidates gain momentum, but workforce concerns intensify.',
      },
      {
        id: 'pro-oversight',
        label: 'Side with Pro-Oversight Candidates',
        description: 'Announce strengthened oversight and accountability measures.',
        effects: { publicTrust: sev(s, 3), humanAgency: sev(s, 3), civilLiberties: sev(s, 2), productivity: -sev(s, 2) },
        domainEffects: { economic: { oversight: 5 }, publicSafety: { oversight: 5 } },
        groupEffects: { industrialWorkers: { trust: sev(s, 3) }, remoteCommunities: { trust: sev(s, 4) }, urbanProfessionals: { trust: -sev(s, 1) } },
        explanation: 'Siding with pro-oversight candidates boosts trust, agency, and liberties but reduces productivity. Workers and remote communities approve.',
        outcomeText: 'You announce oversight reforms. Pro-oversight candidates gain support from workers and remote communities.',
      },
      {
        id: 'neutral',
        label: 'Remain Neutral',
        description: 'Maintain current policies and avoid political positioning.',
        effects: { publicTrust: sev(s, 1) },
        explanation: 'Neutrality avoids alienating either side but misses the opportunity to strengthen trust through a clear commitment.',
        outcomeText: 'You remain neutral. Both sides moderate their positions, but neither is fully satisfied.',
      },
      {
        id: 'technocratic',
        label: 'Argue for Technocratic Independence',
        description: 'Argue that automated governance should be insulated from electoral politics.',
        effects: { publicTrust: sev(s, 2), humanAgency: -sev(s, 2), civilLiberties: -sev(s, 1) },
        explanation: 'Insulating governance from politics improves stability but reduces democratic accountability.',
        outcomeText: 'You argue for technocratic independence. Some praise the principle; others worry about accountability.',
      },
    ],
  },
  {
    id: 'climate-disruption',
    title: 'Climate Disruption',
    category: 'crisis',
    description: 'An unusual weather pattern has disrupted logistics networks across the Coastal Corridor and Industrial Belt. The automated transportation system was not designed for these conditions and is operating well below capacity. Emergency resource distribution is needed.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('climate-disruption')) return 0;
      if (s.quarter < 10) return 0;
      return Math.max(0, 12);
    },
    oneTime: true,
    affectedDomains: ['transportation', 'resourceAllocation'],
    affectedGroups: ['industrialWorkers', 'remoteCommunities'],
    triggerDescription: () => 'Triggered after quarter 10.',
    buildOptions: (s) => [
      {
        id: 'emergency-distribution',
        label: 'Emergency Manual Distribution',
        description: 'Bypass the automated system and distribute resources manually through emergency channels.',
        effects: { fiscalDelta: -sev(s, 90), productivity: -sev(s, 5), socialEquity: sev(s, 3), humanAgency: sev(s, 2) },
        groupEffects: { industrialWorkers: { trust: sev(s, 3), serviceAccess: sev(s, 3) }, remoteCommunities: { trust: sev(s, 4), serviceAccess: sev(s, 4) } },
        explanation: 'Manual distribution is expensive and less efficient but ensures resources reach all communities during the disruption.',
        outcomeText: 'Emergency manual distribution is activated. Resources reach affected communities despite the system disruption.',
      },
      {
        id: 'adapt-system',
        label: 'Adapt the Automated System',
        description: 'Rapidly reconfigure the transportation system for the new conditions.',
        effects: { fiscalDelta: -sev(s, 60), productivity: -sev(s, 3), infrastructureHealth: -sev(s, 2) },
        delayedEffects: [{
          description: 'System adaptation completes. Transportation recovers under the new conditions.',
          delayTurns: 1,
          effects: { productivity: sev(s, 3), infrastructureHealth: sev(s, 2) },
        }],
        explanation: 'Adapting the system is cheaper than manual distribution but takes time. Disruption continues during adaptation.',
        outcomeText: 'Engineers begin reconfiguring the transportation system. Recovery is expected next quarter.',
      },
      {
        id: 'rely-on-redundancy',
        label: 'Activate Redundant Systems',
        description: 'Use backup transportation infrastructure built through previous investments.',
        effects: s.investments.redundancy.level > 1 ? { fiscalDelta: -sev(s, 30), productivity: -sev(s, 2), systemResilience: sev(s, 3) } : { fiscalDelta: -sev(s, 30), productivity: -sev(s, 8), systemResilience: -sev(s, 2) },
        explanation: s.investments.redundancy.level > 1 ? 'Redundant systems absorb most of the disruption. Previous investments pay off.' : 'Limited redundancy infrastructure exists. The backup is insufficient for the scale of the disruption.',
        outcomeText: s.investments.redundancy.level > 1 ? 'Redundant transportation systems are activated. Disruption is minimal.' : 'Backup systems are activated but are insufficient. Disruption continues.',
      },
      {
        id: 'wait',
        label: 'Wait for Conditions to Normalize',
        description: 'Accept reduced service until the weather pattern passes.',
        effects: { productivity: -sev(s, 8), publicTrust: -sev(s, 3) },
        groupEffects: { industrialWorkers: { trust: -sev(s, 3), serviceAccess: -sev(s, 5) }, remoteCommunities: { trust: -sev(s, 4), serviceAccess: -sev(s, 6) } },
        explanation: 'Waiting saves money but prolongs the disruption. Remote and industrial communities bear the brunt.',
        outcomeText: 'No special measures are taken. Service remains degraded until conditions normalize.',
      },
    ],
  },
  {
    id: 'whistleblower',
    title: 'The Whistleblower',
    category: 'governance',
    description: 'A senior engineer from the automated decision systems team has leaked documents showing that the public safety system has been collecting data far beyond its authorized scope. The system was supposed to analyze only public safety incidents, but it has been ingesting health, financial, and communication records.',
    trigger: (s) => {
      if (s.triggeredEventIds.includes('whistleblower')) return 0;
      if (s.quarter < 9) return 0;
      if (s.domains.publicSafety.automation < 55) return 0;
      return Math.max(0, (s.domains.publicSafety.automation - 50) * 0.3 + 10);
    },
    oneTime: true,
    affectedDomains: ['publicSafety'],
    affectedGroups: ['urbanProfessionals', 'industrialWorkers', 'remoteCommunities'],
    triggerDescription: (s) => `Triggered after quarter 9 with public safety automation above 55 (${s.domains.publicSafety.automation}%).`,
    buildOptions: (s) => [
      {
        id: 'investigate',
        label: 'Launch a Full Investigation',
        description: 'Investigate the scope of unauthorized data collection and hold those responsible accountable.',
        effects: { fiscalDelta: -50, civilLiberties: sev(s, 4), publicTrust: sev(s, 3), informationIntegrity: sev(s, 3) },
        delayedEffects: [{
          description: 'Investigation confirms unauthorized data collection. The system is reformed.',
          delayTurns: 2,
          effects: { civilLiberties: sev(s, 3), publicTrust: sev(s, 2) },
        }],
        domainEffects: { publicSafety: { transparency: 10, oversight: 10, automation: -5 } },
        explanation: 'A full investigation is expensive but addresses the root cause, restores liberties, and rebuilds trust through accountability.',
        outcomeText: 'A full investigation is launched. The scope of unauthorized data collection will be documented within two quarters.',
      },
      {
        id: 'shutdown-program',
        label: 'Shut Down the Expanded Surveillance',
        description: 'Immediately terminate the unauthorized data collection and purge the records.',
        effects: { fiscalDelta: -30, civilLiberties: sev(s, 5), publicTrust: sev(s, 4), systemResilience: -sev(s, 2) },
        domainEffects: { publicSafety: { automation: -10, transparency: 5 } },
        groupEffects: { urbanProfessionals: { trust: sev(s, 3) }, industrialWorkers: { trust: sev(s, 3) }, remoteCommunities: { trust: sev(s, 4) } },
        explanation: 'Shutting down the program is decisive and immediately restores liberties. Public safety operations may be affected during the transition.',
        outcomeText: 'The unauthorized data collection is terminated. Collected records are purged. Civil liberties are restored.',
      },
      {
        id: 'reform-quietly',
        label: 'Reform Quietly',
        description: 'End the unauthorized collection without public announcement to avoid a scandal.',
        effects: { civilLiberties: sev(s, 2) },
        explanation: 'Quiet reform avoids a scandal but does not rebuild trust. If the leak gains traction, the lack of transparency will worsen the damage.',
        outcomeText: 'The data collection is quietly terminated. No public announcement is made.',
      },
      {
        id: 'defend-program',
        label: 'Defend the Program',
        description: 'Argue that the expanded data collection was necessary for public safety.',
        effects: { civilLiberties: -sev(s, 5), publicTrust: -sev(s, 6) },
        groupEffects: { urbanProfessionals: { trust: -sev(s, 4) }, industrialWorkers: { trust: -sev(s, 4) }, remoteCommunities: { trust: -sev(s, 5) } },
        explanation: 'Defending unauthorized surveillance severely damages liberties and trust. All population groups lose confidence in institutions.',
        outcomeText: 'You defend the program. Public outrage intensifies across all communities.',
      },
    ],
  },
];

export function selectEvent(state: CampaignState): GameStateEvent | null {
  const rng = new SeededRNG(state.seed + state.quarter * 7919);

  const available = EVENT_DEFINITIONS.filter(def => {
    if (def.oneTime && state.triggeredEventIds.includes(def.id)) return false;
    const weight = def.trigger(state);
    return weight > 0;
  });

  if (available.length === 0) return null;

  const weighted = available.map(def => ({
    item: def,
    weight: Math.max(0, def.trigger(state)),
  }));

  const selected = rng.weighted(weighted);

  const options = selected.buildOptions(state);
  const affectedGroups = selected.affectedGroups;

  return {
    id: selected.id,
    title: selected.title,
    category: selected.category,
    description: selected.description,
    affectedDomains: selected.affectedDomains,
    affectedGroups,
    options,
    triggerDescription: selected.triggerDescription(state),
  };
}

export function eventDefinitionById(id: string): EventDefinition | undefined {
  return EVENT_DEFINITIONS.find(e => e.id === id);
}
