import { useGame } from '@/game/GameContext';
import { useState, useRef, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Type, Eye, RotateCw, Trash2, X } from 'lucide-react';
import type { GameSettings } from '@/game/types';

export function SettingsBar() {
  const { settings, setSettings, campaignState, restartCampaign, deleteSavedCampaign, clearAllData } = useGame();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (patch: Partial<GameSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div ref={ref} className="relative">
      <button
        className="text-muted hover:text-ivory transition p-1"
        onClick={() => setOpen(!open)}
        aria-label="Settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 panel p-4 w-72 z-50 slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-ivory font-medium">Settings</span>
            <button onClick={() => setOpen(false)}><X size={14} className="text-muted" /></button>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between py-2 border-b border-app">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 size={14} className="text-muted" /> : <VolumeX size={14} className="text-muted" />}
              <span className="text-xs text-ivory">Sound Effects</span>
            </div>
            <button
              className="w-10 h-5 rounded-full transition"
              style={{ backgroundColor: settings.soundEnabled ? 'var(--color-amber)' : 'var(--color-surface-2)' }}
              onClick={() => update({ soundEnabled: !settings.soundEnabled })}
            >
              <div
                className="w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: settings.soundEnabled ? 'translateX(20px)' : 'translateX(2px)', marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Animation */}
          <div className="py-2 border-b border-app">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className="text-muted" />
              <span className="text-xs text-ivory">Animation Intensity</span>
            </div>
            <div className="flex gap-1">
              {(['off', 'subtle', 'full'] as const).map(level => (
                <button
                  key={level}
                  className="flex-1 text-xs py-1 rounded transition"
                  style={{
                    backgroundColor: settings.animationIntensity === level ? 'var(--color-amber)' : 'var(--color-surface-2)',
                    color: settings.animationIntensity === level ? '#1a1505' : 'var(--color-text-muted)',
                  }}
                  onClick={() => update({ animationIntensity: level })}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Text size */}
          <div className="py-2 border-b border-app">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-muted" />
              <span className="text-xs text-ivory">Text Size</span>
            </div>
            <div className="flex gap-1">
              {(['normal', 'large', 'extra-large'] as const).map(size => (
                <button
                  key={size}
                  className="flex-1 text-xs py-1 rounded transition"
                  style={{
                    backgroundColor: settings.textSize === size ? 'var(--color-amber)' : 'var(--color-surface-2)',
                    color: settings.textSize === size ? '#1a1505' : 'var(--color-text-muted)',
                  }}
                  onClick={() => update({ textSize: size })}
                >
                  {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced motion */}
          <div className="flex items-center justify-between py-2 border-b border-app">
            <span className="text-xs text-ivory">Reduced Motion</span>
            <button
              className="w-10 h-5 rounded-full transition"
              style={{ backgroundColor: settings.reducedMotion ? 'var(--color-amber)' : 'var(--color-surface-2)' }}
              onClick={() => update({ reducedMotion: !settings.reducedMotion })}
            >
              <div
                className="w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: settings.reducedMotion ? 'translateX(20px)' : 'translateX(2px)', marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Game actions */}
          <div className="pt-3 space-y-2">
            {campaignState && (
              <button
                className="btn btn-secondary text-xs w-full"
                style={{ padding: '6px 12px' }}
                onClick={() => { if (confirm('Restart this campaign? All progress will be lost.')) { restartCampaign(); setOpen(false); } }}
              >
                <RotateCw size={12} /> Restart Campaign
              </button>
            )}
            {campaignState && (
              <button
                className="btn btn-danger text-xs w-full"
                style={{ padding: '6px 12px' }}
                onClick={() => { if (confirm('Delete this saved campaign? This cannot be undone.')) { deleteSavedCampaign(campaignState.campaignId); setOpen(false); } }}
              >
                <Trash2 size={12} /> Delete Save
              </button>
            )}
            <button
              className="btn btn-danger text-xs w-full"
              style={{ padding: '6px 12px' }}
              onClick={() => { if (confirm('Clear ALL data including all saves and history? This cannot be undone.')) { clearAllData(); setOpen(false); } }}
            >
              <Trash2 size={12} /> Clear All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
