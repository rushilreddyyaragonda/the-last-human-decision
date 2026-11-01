import { useState } from 'react';
import { useGame } from '@/game/GameContext';
import { REGION_LABELS, REGION_DESCRIPTIONS } from '@/game/constants';
import type { RegionKey, CampaignState } from '@/game/types';
import { StatBar } from '@/components/IndicatorDisplay';

const REGION_POSITIONS: Record<RegionKey, { x: number; y: number }> = {
  centralDistrict: { x: 50, y: 50 },
  industrialBelt: { x: 30, y: 65 },
  coastalCorridor: { x: 75, y: 55 },
  northernCommunities: { x: 35, y: 25 },
  researchQuarter: { x: 70, y: 25 },
};

const REGION_COLORS: Record<RegionKey, string> = {
  centralDistrict: '#4a8fd9',
  industrialBelt: '#d4a843',
  coastalCorridor: '#4dccc7',
  northernCommunities: '#c94e4e',
  researchQuarter: '#5cb374',
};

export function SocietyMap() {
  const { campaignState } = useGame();
  const [selected, setSelected] = useState<RegionKey | null>(null);
  const [showNetwork, setShowNetwork] = useState(false);

  if (!campaignState) return null;
  const cs = campaignState;
  const regionKeys = Object.keys(cs.regions) as RegionKey[];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg text-ivory font-medium mb-1">Society Map</h3>
          <p className="text-sm text-muted">Five regions with distinct profiles. Click a region to inspect its state.</p>
        </div>
        <button
          className="btn btn-cyan text-xs"
          style={{ padding: '6px 12px' }}
          onClick={() => setShowNetwork(!showNetwork)}
        >
          {showNetwork ? 'Map View' : 'Network View'}
        </button>
      </div>

      <div className="panel p-4">
        <svg viewBox="0 0 100 80" className="w-full" style={{ maxHeight: '400px' }}>
          {/* Grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(30,42,66,0.3)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="80" fill="url(#grid)" />

          {/* Network connections */}
          {showNetwork && regionKeys.map((k1, i) =>
            regionKeys.slice(i + 1).map(k2 => {
              const p1 = REGION_POSITIONS[k1];
              const p2 = REGION_POSITIONS[k2];
              const dep = (cs.regions[k1].infrastructureDependence + cs.regions[k2].infrastructureDependence) / 2;
              return (
                <line
                  key={`${k1}-${k2}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={dep > 75 ? 'rgba(201,78,78,0.3)' : dep > 60 ? 'rgba(212,168,67,0.25)' : 'rgba(77,204,199,0.2)'}
                  strokeWidth={dep > 75 ? 0.6 : 0.4}
                  strokeDasharray={dep > 75 ? '2,1' : 'none'}
                />
              );
            })
          )}

          {/* Regions */}
          {regionKeys.map(key => {
            const pos = REGION_POSITIONS[key];
            const region = cs.regions[key];
            const color = REGION_COLORS[key];
            const isSelected = selected === key;
            const r = 4 + (region.populationShare / 30) * 3;

            return (
              <g key={key} onClick={() => setSelected(key)} style={{ cursor: 'pointer' }}>
                {/* Glow ring */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
                )}
                {/* Vulnerability ring */}
                <circle
                  cx={pos.x} cy={pos.y}
                  r={r + 2}
                  fill="none"
                  stroke={region.vulnerability > 60 ? 'var(--color-red)' : region.vulnerability > 40 ? 'var(--color-amber)' : 'transparent'}
                  strokeWidth="0.4"
                  strokeDasharray="1,1"
                  opacity="0.5"
                />
                {/* Main node */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={color}
                  opacity={isSelected ? 0.9 : 0.6}
                  stroke={color}
                  strokeWidth="0.5"
                />
                <text
                  x={pos.x} y={pos.y + r + 3}
                  textAnchor="middle"
                  fill="var(--color-text)"
                  fontSize="2.5"
                  fontWeight="500"
                >
                  {REGION_LABELS[key]}
                </text>
                <text
                  x={pos.x} y={pos.y + r + 6}
                  textAnchor="middle"
                  fill="var(--color-text-dim)"
                  fontSize="2"
                >
                  {region.populationShare}% pop · {region.serviceAccess}% access
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Region inspector */}
      {selected ? (
        <div className="panel p-5 mt-4 slide-up">
          <h4 className="text-sm text-cyan font-medium mb-1">{REGION_LABELS[selected]}</h4>
          <p className="text-xs text-muted leading-relaxed mb-4">{REGION_DESCRIPTIONS[selected]}</p>

          <div className="grid grid-cols-2 gap-3">
            {([
              { k: 'populationShare', label: 'Population Share', suffix: '%' },
              { k: 'infrastructureDependence', label: 'Infrastructure Dependence', suffix: '%' },
              { k: 'economicActivity', label: 'Economic Activity', suffix: '%' },
              { k: 'serviceAccess', label: 'Service Access', suffix: '%' },
              { k: 'vulnerability', label: 'Vulnerability', suffix: '%' },
            ] as const).map(attr => {
              const val = cs.regions[selected][attr.k] as number;
              const color = attr.k === 'vulnerability'
                ? (val > 60 ? 'var(--color-red)' : val > 40 ? 'var(--color-amber)' : 'var(--color-green)')
                : (val > 60 ? 'var(--color-green)' : val > 35 ? 'var(--color-amber)' : 'var(--color-red)');
              return (
                <div key={attr.k} className="panel-2 p-3">
                  <div className="text-xs text-muted mb-1">{attr.label}</div>
                  <div className="tabular text-sm text-ivory mb-2">{val}{attr.suffix}</div>
                  <StatBar value={val} color={color} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="panel p-4 mt-4 text-center">
          <p className="text-sm text-muted">Select a region on the map to inspect its state.</p>
        </div>
      )}
    </div>
  );
}
