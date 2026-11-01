import { useGame } from '@/game/GameContext';
import { IndicatorGrid, YearLabel } from '@/components/IndicatorDisplay';
import { StatBar } from '@/components/IndicatorDisplay';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS, FISCAL_UNIT, TOTAL_QUARTERS } from '@/game/constants';
import { calcAutomationAuthority, calcQuarterlyIncome, calcQuarterlyExpenditure } from '@/game/engine';
import type { CampaignState, PolicyDomainKey } from '@/game/types';
import { useState } from 'react';
import { PolicyPanel } from '@/components/PolicyPanel';
import { EventModal } from '@/components/EventModal';
import { OverrideModal } from '@/components/OverrideModal';
import { SocietyMap } from '@/components/SocietyMap';
import { InvestmentPanel } from '@/components/InvestmentPanel';
import { ResearchPanel } from '@/components/ResearchPanel';
import { DecisionLedger } from '@/components/DecisionLedger';
import { PublicSentimentPanel } from '@/components/PublicSentimentPanel';
import { SettingsBar } from '@/components/SettingsBar';
import { ChevronRight, AlertTriangle, Clock, DollarSign } from 'lucide-react';

type Tab = 'dashboard' | 'policy' | 'map' | 'invest' | 'research' | 'sentiment' | 'ledger';

export function GameScreen() {
  const { campaignState, nextTurn, setScreen, saveStatus, endCampaign } = useGame();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!campaignState) {
    setScreen('title');
    return null;
  }

  const cs = campaignState;
  const income = calcQuarterlyIncome(cs);
  const expenditure = calcQuarterlyExpenditure(cs);
  const netFlow = income - expenditure;
  const pendingEvent = cs.pendingEvent;
  const pendingOverride = cs.pendingOverride;

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'policy', label: 'Policy' },
    { key: 'map', label: 'Society Map' },
    { key: 'invest', label: 'Investment' },
    { key: 'research', label: 'Research' },
    { key: 'sentiment', label: 'Public Sentiment' },
    { key: 'ledger', label: 'Decision Ledger' },
  ];

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <header className="border-b border-app bg-surface px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-amber text-sm font-medium" onClick={() => setScreen('title')}>
            The Last Human Decision
          </button>
          <span className="text-dim">|</span>
          <span className="text-xs text-muted">{cs.campaignName}</span>
        </div>

        <div className="flex items-center gap-4">
          <YearLabel quarter={cs.quarter} year={cs.year} />
          <span className="text-dim">|</span>
          <div className="flex items-center gap-1 text-sm">
            <DollarSign size={14} className="text-amber" />
            <span className="tabular text-ivory">{cs.fiscalReserves}</span>
            <span className="text-dim text-xs">{FISCAL_UNIT}</span>
          </div>
          <span className="text-dim">|</span>
          <div className="text-xs text-muted">
            Q {cs.quarter + 1}/{TOTAL_QUARTERS}
          </div>
          <SettingsBar />
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-app bg-surface px-4 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {tabs.map(t => (
          <div
            key={t.key}
            className={`nav-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Pending event/override notification bar */}
      {(pendingEvent || pendingOverride) && (
        <div className="px-4 py-2 bg-surface-2 border-b border-app">
          <div className="flex items-center gap-2 text-amber text-sm">
            <AlertTriangle size={16} className="blink" />
            <span>{pendingEvent ? `Event: ${pendingEvent.title}` : `Override Required: ${pendingOverride?.title}`}</span>
            <button className="btn btn-cyan ml-auto" style={{ padding: '4px 12px', fontSize: '12px' }}>
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
        {tab === 'dashboard' && <DashboardView cs={cs} income={income} expenditure={expenditure} netFlow={netFlow} />}
        {tab === 'policy' && <PolicyPanel />}
        {tab === 'map' && <SocietyMap />}
        {tab === 'invest' && <InvestmentPanel />}
        {tab === 'research' && <ResearchPanel />}
        {tab === 'sentiment' && <PublicSentimentPanel />}
        {tab === 'ledger' && <DecisionLedger />}
      </main>

      {/* Bottom action bar */}
      <footer className="border-t border-app bg-surface px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-dim">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
          {saveStatus === 'idle' && `${cs.delayedEffects.length} pending delayed effect${cs.delayedEffects.length !== 1 ? 's' : ''}`}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary text-xs" onClick={endCampaign} style={{ padding: '6px 12px' }}>
            End Campaign
          </button>
          <button
            className="btn btn-primary"
            onClick={nextTurn}
            disabled={!!pendingEvent || !!pendingOverride}
          >
            Advance Quarter
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* Modals */}
      {pendingEvent && <EventModal />}
      {pendingOverride && <OverrideModal />}
    </div>
  );
}

function DashboardView({ cs, income, expenditure, netFlow }: {
  cs: CampaignState;
  income: number;
  expenditure: number;
  netFlow: number;
}) {
  const avgAutomation = calcAutomationAuthority(cs.domains);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Situation Report */}
      <div className="panel p-4 mb-4">
        <div className="text-xs text-cyan tracking-wider uppercase mb-2">Situation Report</div>
        <p className="text-sm text-muted leading-relaxed">
          Year {cs.year}, Quarter {(cs.quarter % 4) + 1}. {cs.campaignName}.
          {cs.delayedEffects.length > 0 && ` ${cs.delayedEffects.length} delayed effect(s) pending resolution.`}
          {cs.pendingResearch.length > 0 && ` ${cs.pendingResearch.length} research project(s) in progress.`}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Indicators */}
        <div className="panel p-4 md:col-span-1">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Societal Indicators</div>
          <IndicatorGrid state={cs} />
        </div>

        {/* Center: Automation Authority + Domains */}
        <div className="panel p-4 md:col-span-1">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Automation Authority</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Overall</span>
            <span className="tabular text-2xl text-ivory font-bold">{avgAutomation}%</span>
          </div>
          <StatBar value={avgAutomation} color="var(--color-cyan)" />
          <p className="text-xs text-dim mt-2 mb-4">
            Average authority delegated to automated systems across all domains.
          </p>

          <div className="space-y-3">
            {(Object.keys(cs.domains) as PolicyDomainKey[]).map(dk => {
              const d = cs.domains[dk];
              return (
                <div key={dk}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ivory">{DOMAIN_LABELS[dk]}</span>
                    <span className="tabular text-xs text-muted">{d.automation}%</span>
                  </div>
                  <StatBar value={d.automation} color="var(--color-cyan-dim)" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Fiscal + Pending */}
        <div className="panel p-4 md:col-span-1">
          <div className="text-xs text-cyan tracking-wider uppercase mb-3">Fiscal Overview</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Reserves</div>
              <div className="tabular text-lg text-ivory font-bold">{cs.fiscalReserves}</div>
              <div className="text-xs text-dim">{FISCAL_UNIT}</div>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Net Flow</div>
              <div className={`tabular text-lg font-bold ${netFlow >= 0 ? 'text-green-fg' : 'text-red-fg'}`}>
                {netFlow >= 0 ? '+' : ''}{netFlow}
              </div>
              <div className="text-xs text-dim">per quarter</div>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Income</div>
              <div className="tabular text-sm text-green-fg">+{income}</div>
            </div>
            <div className="panel-2 p-3">
              <div className="text-xs text-muted mb-1">Expenditure</div>
              <div className="tabular text-sm text-red-fg">-{expenditure}</div>
            </div>
          </div>

          {cs.delayedEffects.length > 0 && (
            <>
              <div className="text-xs text-amber tracking-wider uppercase mb-2">Pending Effects</div>
              <div className="space-y-2 mb-3">
                {cs.delayedEffects.slice(0, 4).map(de => (
                  <div key={de.id} className="panel-2 p-2">
                    <div className="flex items-center gap-1 text-xs text-amber mb-1">
                      <Clock size={10} />
                      <span>{de.remainingTurns} quarter{de.remainingTurns !== 1 ? 's' : ''} remaining</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{de.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
