import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode, useRef } from 'react';
import type {
  CampaignState,
  GameSettings,
  Difficulty,
  EndingResult,
  CampaignSummary,
  PolicyDomainKey,
  DomainPolicy,
  InvestmentKey,
  ResearchKey,
  GameStateEvent,
  EventOption,
  OverrideSituation,
  OverrideOption,
  DecisionRecord,
  PopulationGroupKey,
  PopulationGroupMap,
  DelayedEffect,
} from './types';
import {
  createCampaign,
  CAMPAIGN_DEFINITIONS,
  CampaignDefinition,
} from './campaigns';
import {
  adjustPolicy,
  makeInvestment,
  advanceQuarter,
  recordDecision,
  applyIndicatorEffects,
  applyDomainEffects,
  applyGroupEffects,
  scheduleDelayedEffect,
  clampIndicators,
  clampDomains,
  clampGroups,
  checkCriticalFailure,
  calcAutomationAuthority,
} from './engine';
import { selectEvent, eventDefinitionById } from './events';
import { selectOverride } from './overrides';
import { resolveCompletedResearch, startResearch, canStartResearch, getResearchCost } from './research';
import { evaluateEnding, createCampaignSummary } from './endings';
import {
  loadSaveData,
  saveCampaign,
  loadSettings,
  saveSettings,
  setTutorialCompleted,
  addCampaignSummary,
  deleteCampaign,
  getAllSavedCampaigns,
  clearAllData,
} from './persistence';
import { TOTAL_QUARTERS } from './constants';

type Screen = 'title' | 'campaignSelect' | 'briefing' | 'game' | 'ending' | 'analytics' | 'developer' | 'about' | 'tutorial' | 'history';

interface GameContextValue {
  screen: Screen;
  settings: GameSettings;
  campaignState: CampaignState | null;
  endingResult: EndingResult | null;
  selectedCampaignDef: CampaignDefinition | null;
  selectedDifficulty: Difficulty;
  savedCampaigns: Array<{ campaignId: string; state: CampaignState }>;
  campaignHistory: CampaignSummary[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
  notification: string | null;

  setScreen: (screen: Screen) => void;
  setSettings: (settings: GameSettings) => void;
  selectCampaign: (def: CampaignDefinition, difficulty: Difficulty) => void;
  startNewCampaign: () => void;
  continueCampaign: (campaignId: string) => void;
  restartCampaign: () => void;
  deleteSavedCampaign: (campaignId: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setTutorialDone: () => void;
  clearError: () => void;
  clearNotification: () => void;
  clearAllData: () => void;

  // Game actions
  changePolicy: (domain: PolicyDomainKey, changes: Partial<DomainPolicy>) => void;
  invest: (key: InvestmentKey) => void;
  startResearchProject: (key: ResearchKey) => void;
  resolveEvent: (option: EventOption) => void;
  resolveOverride: (option: OverrideOption) => void;
  nextTurn: () => void;
  proceedToNextPhase: () => void;
  endCampaign: () => void;
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_SETTINGS'; settings: GameSettings }
  | { type: 'SET_CAMPAIGN_STATE'; state: CampaignState }
  | { type: 'SET_ENDING'; ending: EndingResult | null }
  | { type: 'SELECT_CAMPAIGN'; def: CampaignDefinition; difficulty: Difficulty }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SET_SAVED_CAMPAIGNS'; campaigns: Array<{ campaignId: string; state: CampaignState }> }
  | { type: 'SET_CAMPAIGN_HISTORY'; history: CampaignSummary[] }
  | { type: 'SET_SAVE_STATUS'; status: 'idle' | 'saving' | 'saved' | 'error' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_NOTIFICATION'; notification: string | null };

interface GameState {
  screen: Screen;
  settings: GameSettings;
  campaignState: CampaignState | null;
  endingResult: EndingResult | null;
  selectedCampaignDef: CampaignDefinition | null;
  selectedDifficulty: Difficulty;
  savedCampaigns: Array<{ campaignId: string; state: CampaignState }>;
  campaignHistory: CampaignSummary[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
  notification: string | null;
}

function createInitialState(): GameState {
  const { data } = loadSaveData();
  const settings = loadSettings();

  return {
    screen: 'title',
    settings,
    campaignState: null,
    endingResult: null,
    selectedCampaignDef: null,
    selectedDifficulty: 'standard',
    savedCampaigns: data ? getAllSavedCampaigns() : [],
    campaignHistory: data?.campaignHistory ?? [],
    saveStatus: 'idle',
    error: null,
    notification: null,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'SET_CAMPAIGN_STATE':
      return { ...state, campaignState: action.state };
    case 'SET_ENDING':
      return { ...state, endingResult: action.ending };
    case 'SELECT_CAMPAIGN':
      return { ...state, selectedCampaignDef: action.def, selectedDifficulty: action.difficulty };
    case 'SET_DIFFICULTY':
      return { ...state, selectedDifficulty: action.difficulty };
    case 'SET_SAVED_CAMPAIGNS':
      return { ...state, savedCampaigns: action.campaigns };
    case 'SET_CAMPAIGN_HISTORY':
      return { ...state, campaignHistory: action.history };
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.status };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.notification };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback((campaignState: CampaignState) => {
    dispatch({ type: 'SET_SAVE_STATUS', status: 'saving' });
    const result = saveCampaign(campaignState);
    if (result.success) {
      dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' });
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_SAVE_STATUS', status: 'idle' });
      }, 2000);
    } else {
      dispatch({ type: 'SET_SAVE_STATUS', status: 'error' });
      dispatch({ type: 'SET_ERROR', error: result.error });
    }
  }, []);

  const updateCampaignState = useCallback((newState: CampaignState, doAutosave = true) => {
    dispatch({ type: 'SET_CAMPAIGN_STATE', state: newState });
    if (doAutosave) doSave(newState);
  }, [doSave]);

  const setScreen = useCallback((screen: Screen) => {
    dispatch({ type: 'SET_SCREEN', screen });
  }, []);

  const setSettings = useCallback((settings: GameSettings) => {
    saveSettings(settings);
    dispatch({ type: 'SET_SETTINGS', settings });
  }, []);

  const selectCampaign = useCallback((def: CampaignDefinition, difficulty: Difficulty) => {
    dispatch({ type: 'SELECT_CAMPAIGN', def, difficulty });
    dispatch({ type: 'SET_SCREEN', screen: 'briefing' });
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', difficulty });
  }, []);

  const startNewCampaign = useCallback(() => {
    if (!state.selectedCampaignDef) return;
    const newCampaign = createCampaign(state.selectedCampaignDef.id, state.selectedDifficulty);
    updateCampaignState(newCampaign);
    dispatch({ type: 'SET_ENDING', ending: null });
    dispatch({ type: 'SET_SCREEN', screen: 'game' });
  }, [state.selectedCampaignDef, state.selectedDifficulty, updateCampaignState]);

  const continueCampaign = useCallback((campaignId: string) => {
    const saved = state.savedCampaigns.find(c => c.campaignId === campaignId);
    if (!saved) {
      dispatch({ type: 'SET_ERROR', error: 'Could not find the saved campaign.' });
      return;
    }
    const def = CAMPAIGN_DEFINITIONS.find(d => d.id === campaignId);
    if (def) {
      dispatch({ type: 'SELECT_CAMPAIGN', def, difficulty: saved.state.difficulty });
    }
    dispatch({ type: 'SET_CAMPAIGN_STATE', state: saved.state });
    if (saved.state.status === 'ended') {
      const ending = evaluateEnding(saved.state);
      dispatch({ type: 'SET_ENDING', ending });
      dispatch({ type: 'SET_SCREEN', screen: 'ending' });
    } else {
      dispatch({ type: 'SET_ENDING', ending: null });
      dispatch({ type: 'SET_SCREEN', screen: 'game' });
    }
  }, [state.savedCampaigns]);

  const restartCampaign = useCallback(() => {
    if (!state.selectedCampaignDef) return;
    const newCampaign = createCampaign(state.selectedCampaignDef.id, state.selectedDifficulty);
    updateCampaignState(newCampaign);
    dispatch({ type: 'SET_ENDING', ending: null });
    dispatch({ type: 'SET_SCREEN', screen: 'game' });
  }, [state.selectedCampaignDef, state.selectedDifficulty, updateCampaignState]);

  const deleteSavedCampaign = useCallback((campaignId: string) => {
    deleteCampaign(campaignId);
    dispatch({ type: 'SET_SAVED_CAMPAIGNS', campaigns: getAllSavedCampaigns() });
    dispatch({ type: 'SET_NOTIFICATION', notification: 'Saved campaign deleted.' });
  }, []);

  const setTutorialDone = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', error: null }), []);
  const clearNotification = useCallback(() => dispatch({ type: 'SET_NOTIFICATION', notification: null }), []);

  const clearAllGameData = useCallback(() => {
    clearAllData();
    dispatch({ type: 'SET_SAVED_CAMPAIGNS', campaigns: [] });
    dispatch({ type: 'SET_CAMPAIGN_HISTORY', history: [] });
    dispatch({ type: 'SET_NOTIFICATION', notification: 'All data has been cleared.' });
  }, []);

  // Game actions
  const changePolicy = useCallback((domain: PolicyDomainKey, changes: Partial<DomainPolicy>) => {
    if (!state.campaignState) return;
    const result = adjustPolicy(state.campaignState, domain, changes);
    if ('error' in result) {
      dispatch({ type: 'SET_ERROR', error: result.error });
      return;
    }
    updateCampaignState(result);
    dispatch({ type: 'SET_NOTIFICATION', notification: 'Policy updated.' });
  }, [state.campaignState, updateCampaignState]);

  const invest = useCallback((key: InvestmentKey) => {
    if (!state.campaignState) return;
    const result = makeInvestment(state.campaignState, key);
    if ('error' in result) {
      dispatch({ type: 'SET_ERROR', error: result.error });
      return;
    }
    updateCampaignState(result);
    dispatch({ type: 'SET_NOTIFICATION', notification: 'Investment confirmed.' });
  }, [state.campaignState, updateCampaignState]);

  const startResearchProject = useCallback((key: ResearchKey) => {
    if (!state.campaignState) return;
    const result = startResearch(state.campaignState, key);
    if ('error' in result) {
      dispatch({ type: 'SET_ERROR', error: result.error });
      return;
    }
    updateCampaignState(result);
    dispatch({ type: 'SET_NOTIFICATION', notification: 'Research project started.' });
  }, [state.campaignState, updateCampaignState]);

  const resolveEvent = useCallback((option: EventOption) => {
    if (!state.campaignState || !state.campaignState.pendingEvent) return;
    const cs = state.campaignState;
    const event = cs.pendingEvent!;

    let newState = { ...cs };

    // Apply immediate effects
    newState.indicators = applyIndicatorEffects(newState.indicators, option.effects);
    if (option.effects.fiscalDelta) {
      newState.fiscalReserves = Math.max(0, newState.fiscalReserves + option.effects.fiscalDelta);
    }
    if (option.domainEffects) {
      newState.domains = applyDomainEffects(newState.domains, option.domainEffects);
    }
    if (option.groupEffects) {
      newState.populationGroups = applyGroupEffects(newState.populationGroups, option.groupEffects);
    }

    // Schedule delayed effects
    if (option.delayedEffects) {
      for (const de of option.delayedEffects) {
        const delayedEffect: DelayedEffect = {
          id: `de-${cs.quarter}-${option.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceDecision: `${event.title}: ${option.label}`,
          description: de.description,
          resolveQuarter: cs.quarter + de.delayTurns,
          remainingTurns: de.delayTurns,
          effects: de.effects,
        };
        newState.delayedEffects = [...newState.delayedEffects, delayedEffect];
      }
    }

    // Recalculate automation authority
    newState.automationAuthority = calcAutomationAuthority(newState.domains);

    // Clamp values
    newState.indicators = clampIndicators(newState.indicators);
    newState.domains = clampDomains(newState.domains);

    // Record in decision ledger
    const record: DecisionRecord = {
      id: `dec-${cs.quarter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quarter: cs.quarter,
      year: cs.year,
      title: event.title,
      situation: event.description,
      options: event.options.map(o => ({ label: o.label, description: o.description })),
      chosenAction: option.label,
      stateBefore: { ...cs.indicators },
      immediateEffects: option.explanation ? [option.explanation] : [],
      delayedEffects: option.delayedEffects?.map(de => de.description) ?? [],
      domains: event.affectedDomains,
      groups: event.affectedGroups,
      explanation: option.outcomeText,
    };
    newState.decisionLedger = [...newState.decisionLedger, record];

    // Log event
    newState.eventHistory = [...newState.eventHistory, {
      eventId: event.id,
      eventTitle: event.title,
      quarter: cs.quarter,
      outcome: option.outcomeText,
    }];

    // Mark event as triggered
    if (!newState.triggeredEventIds.includes(event.id)) {
      newState.triggeredEventIds = [...newState.triggeredEventIds, event.id];
    }

    // Clear pending event
    newState.pendingEvent = null;

    updateCampaignState(newState);
    dispatch({ type: 'SET_NOTIFICATION', notification: option.outcomeText });
  }, [state.campaignState, updateCampaignState]);

  const resolveOverride = useCallback((option: OverrideOption) => {
    if (!state.campaignState || !state.campaignState.pendingOverride) return;
    const cs = state.campaignState;
    const override = cs.pendingOverride!;

    let newState = { ...cs };

    // Apply effects
    newState.indicators = applyIndicatorEffects(newState.indicators, option.effects);
    if (option.effects.fiscalDelta) {
      newState.fiscalReserves = Math.max(0, newState.fiscalReserves + option.effects.fiscalDelta);
    }
    if (option.domainEffects) {
      newState.domains = applyDomainEffects(newState.domains, option.domainEffects);
    }
    if (option.groupEffects) {
      newState.populationGroups = applyGroupEffects(newState.populationGroups, option.groupEffects);
    }

    // Schedule delayed effects
    if (option.delayedEffects) {
      for (const de of option.delayedEffects) {
        const delayedEffect: DelayedEffect = {
          id: `do-${cs.quarter}-${option.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceDecision: `${override.title}: ${option.label}`,
          description: de.description,
          resolveQuarter: cs.quarter + de.delayTurns,
          remainingTurns: de.delayTurns,
          effects: de.effects,
        };
        newState.delayedEffects = [...newState.delayedEffects, delayedEffect];
      }
    }

    newState.automationAuthority = calcAutomationAuthority(newState.domains);
    newState.indicators = clampIndicators(newState.indicators);
    newState.domains = clampDomains(newState.domains);

    // Record override
    newState.overrideHistory = [...newState.overrideHistory, {
      id: `ov-${cs.quarter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quarter: cs.quarter,
      domain: override.domain,
      recommendation: override.recommendation,
      systemObjective: override.systemObjective,
      action: option.label,
      effects: option.effects ? Object.entries(option.effects).map(([k, v]) => `${k}: ${v}`) : [],
    }];

    // Record in decision ledger
    const record: DecisionRecord = {
      id: `dec-ov-${cs.quarter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quarter: cs.quarter,
      year: cs.year,
      title: `Human Override: ${override.title}`,
      situation: override.description,
      options: override.options.map(o => ({ label: o.label, description: o.description })),
      chosenAction: option.label,
      stateBefore: { ...cs.indicators },
      immediateEffects: [option.explanation],
      delayedEffects: option.delayedEffects?.map(de => de.description) ?? [],
      domains: [override.domain],
      groups: [],
      explanation: `System objective: ${override.systemObjective}. Player chose: ${option.label}. ${option.explanation}`,
    };
    newState.decisionLedger = [...newState.decisionLedger, record];

    // Clear pending override
    newState.pendingOverride = null;

    updateCampaignState(newState);
    dispatch({ type: 'SET_NOTIFICATION', notification: option.explanation });
  }, [state.campaignState, updateCampaignState]);

  const proceedToNextPhase = useCallback(() => {
    if (!state.campaignState) return;
    const cs = state.campaignState;
    const phaseOrder: Array<typeof cs.turnPhase> = ['situation', 'systemPerformance', 'decision', 'allocation', 'resolution', 'publicResponse', 'review'];
    const currentIdx = phaseOrder.indexOf(cs.turnPhase);
    if (currentIdx < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIdx + 1];
      updateCampaignState({ ...cs, turnPhase: nextPhase });
    }
  }, [state.campaignState, updateCampaignState]);

  const nextTurn = useCallback(() => {
    if (!state.campaignState) return;
    let cs = state.campaignState;

    // Resolve completed research
    const { state: afterResearch, newlyCompleted } = resolveCompletedResearch(cs);
    cs = afterResearch;
    if (newlyCompleted.length > 0) {
      const findings = newlyCompleted.map(r => r.findings).join(' ');
      dispatch({ type: 'SET_NOTIFICATION', notification: `Research completed: ${findings.slice(0, 100)}...` });
    }

    // Advance quarter
    let newState = advanceQuarter(cs);

    // Check for critical failure
    const failure = checkCriticalFailure(newState);
    if (failure.failed) {
      newState = { ...newState, status: 'ended' };
      const ending = evaluateEnding({
        ...newState,
        ending: 'fracturedSociety',
        endingNarrative: failure.reason ?? null,
      });
      dispatch({ type: 'SET_ENDING', ending });
      updateCampaignState(newState);
      dispatch({ type: 'SET_SCREEN', screen: 'ending' });

      // Save campaign summary
      const summary = createCampaignSummary(newState, ending);
      addCampaignSummary(summary as CampaignSummary);
      dispatch({ type: 'SET_CAMPAIGN_HISTORY', history: [...state.campaignHistory, summary as CampaignSummary] });
      return;
    }

    // Check if campaign ended naturally
    if (newState.status === 'ended' || newState.quarter >= TOTAL_QUARTERS) {
      const ending = evaluateEnding(newState);
      newState = { ...newState, status: 'ended', ending: ending.type, endingNarrative: ending.narrative };
      dispatch({ type: 'SET_ENDING', ending });
      updateCampaignState(newState);
      dispatch({ type: 'SET_SCREEN', screen: 'ending' });

      const summary = createCampaignSummary(newState, ending);
      addCampaignSummary(summary as CampaignSummary);
      dispatch({ type: 'SET_CAMPAIGN_HISTORY', history: [...state.campaignHistory, summary as CampaignSummary] });
      return;
    }

    // Check for events
    const event = selectEvent(newState);
    if (event) {
      newState = { ...newState, pendingEvent: event };
    }

    // Check for override situations
    if (!newState.pendingEvent) {
      const override = selectOverride(newState);
      if (override) {
        newState = { ...newState, pendingOverride: override };
      }
    }

    updateCampaignState(newState);
  }, [state.campaignState, updateCampaignState, state.campaignHistory]);

  const endCampaign = useCallback(() => {
    if (!state.campaignState) return;
    const ending = evaluateEnding(state.campaignState);
    const newState = { ...state.campaignState, status: 'ended' as const, ending: ending.type, endingNarrative: ending.narrative };
    dispatch({ type: 'SET_ENDING', ending });
    updateCampaignState(newState);
    dispatch({ type: 'SET_SCREEN', screen: 'ending' });

    const summary = createCampaignSummary(newState, ending);
    addCampaignSummary(summary as CampaignSummary);
    dispatch({ type: 'SET_CAMPAIGN_HISTORY', history: [...state.campaignHistory, summary as CampaignSummary] });
  }, [state.campaignState, updateCampaignState, state.campaignHistory]);

  // Apply reduced motion preference
  useEffect(() => {
    if (state.settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [state.settings.reducedMotion]);

  // Apply text size
  useEffect(() => {
    document.documentElement.classList.remove('text-normal', 'text-large', 'text-extra-large');
    document.documentElement.classList.add(`text-${state.settings.textSize}`);
  }, [state.settings.textSize]);

  const value: GameContextValue = {
    screen: state.screen,
    settings: state.settings,
    campaignState: state.campaignState,
    endingResult: state.endingResult,
    selectedCampaignDef: state.selectedCampaignDef,
    selectedDifficulty: state.selectedDifficulty,
    savedCampaigns: state.savedCampaigns,
    campaignHistory: state.campaignHistory,
    saveStatus: state.saveStatus,
    error: state.error,
    notification: state.notification,
    setScreen,
    setSettings,
    selectCampaign,
    startNewCampaign,
    continueCampaign,
    restartCampaign,
    deleteSavedCampaign,
    setDifficulty,
    setTutorialDone,
    clearError,
    clearNotification,
    clearAllData: clearAllGameData,
    changePolicy,
    invest,
    startResearchProject,
    resolveEvent,
    resolveOverride,
    nextTurn,
    proceedToNextPhase,
    endCampaign,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
