import React, { useState } from 'react';
import { ExperimentRun } from '../types/materials';
import { Zap, TrendingDown, ShieldCheck, Sparkles } from 'lucide-react';
import { DOMAIN_PRESETS } from '../services/physicsSimulation';

interface ElectrochemViewerProps {
  currentRun: ExperimentRun | null;
}

export const ElectrochemViewer: React.FC<ElectrochemViewerProps> = ({ currentRun }) => {
  const [viewMode, setViewMode] = useState<'lsv' | 'tafel'>('lsv');
  const [showCommercialBenchmark, setShowCommercialBenchmark] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ potential: number; current: number } | null>(null);

  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No electrochemical voltammetry data recorded.
      </div>
    );
  }

  const { lsvData, domain, primaryMetricValue, tafelSlopeMvDec, ecsaCm2, durabilityRetentionPercent, secondaryMetricValue } = currentRun;
  const preset = DOMAIN_PRESETS[domain];

  const svgWidth = 650;
  const svgHeight = 320;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Extents for LSV
  const isHer = domain === 'her';
  const minV = isHer ? -0.22 : 1.15;
  const maxV = isHer ? 0.05 : 1.75;
  const minJ = isHer ? -120 : 0;
  const maxJ = isHer ? 5 : 160;

  const getLsvX = (v: number) => padding.left + ((v - minV) / (maxV - minV)) * graphWidth;
  const getLsvY = (j: number) => padding.top + graphHeight - ((j - minJ) / (maxJ - minJ)) * graphHeight;

  // Commercial Benchmark reference curve
  const benchmarkLsvPoints: Array<{ potentialV: number; currentDensity: number }> = [];
  const benchmarkEta = preset.benchmarkValue;
  const benchmarkSlope = isHer ? 38 : 65;

  if (isHer) {
    for (let pot = 0.05; pot >= -0.22; pot -= 0.01) {
      const overpot = -pot * 1000;
      let j = 0;
      if (overpot > 0) {
        j = -10 * Math.pow(10, (overpot - benchmarkEta) / benchmarkSlope);
      }
      benchmarkLsvPoints.push({ potentialV: pot, currentDensity: Math.max(-120, j) });
    }
  } else {
    for (let pot = 1.15; pot <= 1.75; pot += 0.01) {
      const overpot = (pot - 1.23) * 1000;
      let j = 0;
      if (overpot > 0) {
        j = 10 * Math.pow(10, (overpot - benchmarkEta) / benchmarkSlope);
      }
      benchmarkLsvPoints.push({ potentialV: pot, currentDensity: Math.min(160, j) });
    }
  }

  // Paths
  const samplePathD = lsvData.reduce((acc, pt, i) => {
    const x = getLsvX(pt.potentialV);
    const y = getLsvY(pt.currentDensity);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const benchPathD = benchmarkLsvPoints.reduce((acc, pt, i) => {
    const x = getLsvX(pt.potentialV);
    const y = getLsvY(pt.currentDensity);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-xl border border-slate-800 p-4">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Linear Sweep Voltammetry & Electrocatalysis
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                0.5 M H₂SO₄ / 1.0 M KOH
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Overpotential at 10 mA/cm²: <strong className="text-emerald-400">{primaryMetricValue} mV</strong> (Tafel: {tafelSlopeMvDec} mV/dec)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommercialBenchmark(!showCommercialBenchmark)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-mono transition ${
              showCommercialBenchmark
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Bench Pt/C
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('lsv')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition ${
                viewMode === 'lsv' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LSV Polarization
            </button>
            <button
              onClick={() => setViewMode('tafel')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition ${
                viewMode === 'tafel' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tafel Slope
            </button>
          </div>
        </div>
      </div>

      {/* Voltammetry SVG Canvas */}
      <div className="relative flex-1 min-h-[260px] w-full bg-[#050811] rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (mouseX >= padding.left && mouseX <= padding.left + graphWidth) {
              const pot = minV + ((mouseX - padding.left) / graphWidth) * (maxV - minV);
              const nearest = lsvData.reduce((prev, curr) =>
                Math.abs(curr.potentialV - pot) < Math.abs(prev.potentialV - pot) ? curr : prev
              );
              setHoveredPoint({ potential: nearest.potentialV, current: nearest.currentDensity });
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* 10 mA/cm² Benchmark threshold line */}
          <line
            x1={padding.left}
            y1={getLsvY(isHer ? -10 : 10)}
            x2={padding.left + graphWidth}
            y2={getLsvY(isHer ? -10 : 10)}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth="1.2"
          />
          <text
            x={padding.left + graphWidth - 8}
            y={getLsvY(isHer ? -10 : 10) - 6}
            fill="#f59e0b"
            fontSize="9"
            fontFamily="JetBrains Mono"
            textAnchor="end"
          >
            j = 10 mA/cm² (η₁₀ target)
          </text>

          {/* Zero current line */}
          <line
            x1={padding.left}
            y1={getLsvY(0)}
            x2={padding.left + graphWidth}
            y2={getLsvY(0)}
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Grid lines */}
          {(isHer ? [-100, -50, 0] : [0, 50, 100, 150]).map((jVal) => {
            const y = getLsvY(jVal);
            return (
              <g key={jVal}>
                <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                  {jVal}
                </text>
              </g>
            );
          })}

          {/* Potential ticks */}
          {(isHer ? [0.05, 0.0, -0.05, -0.10, -0.15, -0.20] : [1.2, 1.3, 1.4, 1.5, 1.6, 1.7]).map((potVal) => {
            const x = getLsvX(potVal);
            return (
              <g key={potVal}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={x} y={padding.top + graphHeight + 16} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  {potVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Commercial Benchmark Path */}
          {showCommercialBenchmark && (
            <path
              d={benchPathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* Sample Curve */}
          <path
            d={samplePathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Marker at η₁₀ */}
          {(() => {
            const etaPt = lsvData.reduce((prev, curr) => 
              Math.abs(Math.abs(curr.currentDensity) - 10) < Math.abs(Math.abs(prev.currentDensity) - 10) ? curr : prev
            );
            const x = getLsvX(etaPt.potentialV);
            const y = getLsvY(etaPt.currentDensity);
            return (
              <g>
                <circle cx={x} cy={y} r="5" fill="#10b981" stroke="#050811" strokeWidth="2" />
                <rect x={x - 30} y={y - (isHer ? 28 : -10)} width="60" height="18" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="0.8" />
                <text x={x} y={y - (isHer ? 16 : -22)} fill="#34d399" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono" textAnchor="middle">
                  η₁₀={primaryMetricValue}mV
                </text>
              </g>
            );
          })()}

          {/* Hover indicator */}
          {hoveredPoint && (
            <circle
              cx={getLsvX(hoveredPoint.potential)}
              cy={getLsvY(hoveredPoint.current)}
              r="4"
              fill="#f59e0b"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          )}

          {/* Labels */}
          <text
            x={padding.left + graphWidth / 2}
            y={svgHeight - 10}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Applied Potential E (V vs RHE)
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + graphHeight / 2}, 16)`}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Current Density j (mA/cm²)
          </text>
        </svg>

        {/* Hover info box */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-mono shadow-md">
            <span>E: <strong>{hoveredPoint.potential.toFixed(3)} V</strong></span>
            <span className="text-slate-500 mx-2">|</span>
            <span>j: <strong>{hoveredPoint.current.toFixed(2)} mA/cm²</strong></span>
          </div>
        )}
      </div>

      {/* Electrochemical Metrics Grid */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Overpotential η₁₀</span>
          <span className="text-emerald-400 font-bold text-sm">
            {primaryMetricValue} mV
          </span>
          <span className="text-slate-500 block text-[9px]">
            {primaryMetricValue < preset.benchmarkValue ? `+${preset.benchmarkValue - primaryMetricValue} mV vs benchmark` : 'Exceeds target'}
          </span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Tafel Slope (b)</span>
          <span className="text-sky-300 font-bold text-sm">
            {tafelSlopeMvDec} mV/dec
          </span>
          <span className="text-slate-500 block text-[9px]">Volmer-Tafel kinetics</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Mass Activity</span>
          <span className="text-amber-300 font-bold text-sm">
            {secondaryMetricValue} A/mg
          </span>
          <span className="text-slate-500 block text-[9px]">Normalized to PGM wt</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">ADT Durability</span>
          <span className="text-purple-300 font-bold text-sm">
            {durabilityRetentionPercent}%
          </span>
          <span className="text-slate-500 block text-[9px]">Retention @ 5,000 cycles</span>
        </div>
      </div>
    </div>
  );
};
