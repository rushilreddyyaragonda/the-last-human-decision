import type { SaveData, CampaignState, GameSettings, CampaignSummary } from './types';
import { SAVE_DATA_VERSION } from './constants';

const STORAGE_KEY = 'last-human-decision-save';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  animationIntensity: 'subtle',
  textSize: 'normal',
  reducedMotion: false,
};

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    campaigns: {},
    campaignHistory: [],
    settings: DEFAULT_SETTINGS,
    tutorialCompleted: false,
  };
}

export function loadSaveData(): { data: SaveData | null; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: null, error: null };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { data: null, error: 'Save data is corrupted and could not be loaded.' };
    }

    if (parsed.version !== SAVE_DATA_VERSION) {
      // Attempt migration or return error
      return { data: null, error: `Save data version ${parsed.version} is outdated. Current version is ${SAVE_DATA_VERSION}. Starting fresh.` };
    }

    // Validate structure
    if (!Array.isArray(parsed.campaignHistory)) parsed.campaignHistory = [];
    if (!parsed.campaigns || typeof parsed.campaigns !== 'object') parsed.campaigns = {};
    if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
    if (typeof parsed.tutorialCompleted !== 'boolean') parsed.tutorialCompleted = false;

    return { data: parsed as SaveData, error: null };
  } catch {
    return { data: null, error: 'Save data could not be parsed. It may be corrupted.' };
  }
}

export function saveSaveData(data: SaveData): { success: boolean; error: string | null } {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    return { success: true, error: null };
  } catch {
    return { success: false, error: 'Could not save data. Browser storage may be full or disabled.' };
  }
}

export function saveCampaign(state: CampaignState): { success: boolean; error: string | null } {
  const { data, error } = loadSaveData();
  if (error && !data) {
    // Create fresh save data
    const fresh = createDefaultSaveData();
    fresh.campaigns[state.campaignId] = state;
    return saveSaveData(fresh);
  }
  if (!data) {
    const fresh = createDefaultSaveData();
    fresh.campaigns[state.campaignId] = state;
    return saveSaveData(fresh);
  }

  data.campaigns[state.campaignId] = state;
  return saveSaveData(data);
}

export function loadCampaign(campaignId: string): CampaignState | null {
  const { data } = loadSaveData();
  if (!data) return null;
  return data.campaigns[campaignId] ?? null;
}

export function hasSavedCampaign(campaignId: string): boolean {
  const { data } = loadSaveData();
  if (!data) return false;
  return !!data.campaigns[campaignId];
}

export function deleteCampaign(campaignId: string): void {
  const { data } = loadSaveData();
  if (!data) return;
  delete data.campaigns[campaignId];
  saveSaveData(data);
}

export function addCampaignSummary(summary: CampaignSummary): void {
  const { data } = loadSaveData();
  if (!data) {
    const fresh = createDefaultSaveData();
    fresh.campaignHistory.push(summary);
    saveSaveData(fresh);
    return;
  }
  data.campaignHistory.push(summary);
  // Keep last 20 campaign summaries
  if (data.campaignHistory.length > 20) {
    data.campaignHistory = data.campaignHistory.slice(-20);
  }
  saveSaveData(data);
}

export function getCampaignHistory(): CampaignSummary[] {
  const { data } = loadSaveData();
  if (!data) return [];
  return data.campaignHistory;
}

export function saveSettings(settings: GameSettings): void {
  const { data } = loadSaveData();
  if (!data) {
    const fresh = createDefaultSaveData();
    fresh.settings = settings;
    saveSaveData(fresh);
    return;
  }
  data.settings = settings;
  saveSaveData(data);
}

export function loadSettings(): GameSettings {
  const { data } = loadSaveData();
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...data.settings };
}

export function setTutorialCompleted(completed: boolean): void {
  const { data } = loadSaveData();
  if (!data) {
    const fresh = createDefaultSaveData();
    fresh.tutorialCompleted = completed;
    saveSaveData(fresh);
    return;
  }
  data.tutorialCompleted = completed;
  saveSaveData(data);
}

export function hasCompletedTutorial(): boolean {
  const { data } = loadSaveData();
  if (!data) return false;
  return data.tutorialCompleted;
}

export function getAllSavedCampaigns(): Array<{ campaignId: string; state: CampaignState }> {
  const { data } = loadSaveData();
  if (!data) return [];
  return Object.entries(data.campaigns).map(([campaignId, state]) => ({ campaignId, state }));
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
