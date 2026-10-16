import React, { useState } from 'react';
import { ExperimentRun } from '../types/materials';
import { Eye, Sun, Sparkles } from 'lucide-react';

interface SpectroscopyViewerProps {
  currentRun: ExperimentRun | null;
}

export const SpectroscopyViewer: React.FC<SpectroscopyViewerProps> = ({ currentRun }) => {
  const [viewMode, setViewMode] = useState<'absorbance' | 'tauc'>('absorbance');

  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No spectroscopic data available.
      </div>
    );
  }

  const { uvVisData, sprPeakWavelength, bandgapEV, domain } = currentRun;

  const svgWidth = 650;
  const svgHeight = 320;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const minWl = 320;
  const maxWl = 820;
  const maxAbs = Math.max(...uvVisData.map(p => p.absorbance), 1.8);

  const getX = (wl: number) => padding.left + ((wl - minWl) / (maxWl - minWl)) * graphWidth;
  const getY = (abs: number) => padding.top + graphHeight - (abs / maxAbs) * graphHeight;

  const pathD = uvVisData.reduce((acc, pt, i) => {
    const x = getX(pt.wavelength);
    const y = getY(pt.absorbance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              In-Line UV-Vis-NIR Extinction Spectroscopy
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Ocean Optics 2048-Pixel CCD
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Surface Plasmon Resonance (SPR) λ_max: <strong className="text-sky-300">{sprPeakWavelength ?? 450} nm</strong>
              {bandgapEV && <span> • Bandgap Eg: <strong className="text-emerald-400">{bandgapEV} eV</strong></span>}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('absorbance')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition ${
              viewMode === 'absorbance' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Absorbance A(λ)
          </button>
          <button
            onClick={() => setViewMode('tauc')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition ${
              viewMode === 'tauc' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tauc Bandgap (αhν)²
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[260px] w-full bg-[#050811] rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full select-none">
          {/* Rainbow wavelength backdrop banner across visible spectrum (380 - 750 nm) */}
          <defs>
            <linearGradient id="spectrum-band" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
              <stop offset="20%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="40%" stopColor="#059669" stopOpacity="0.15" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.15" />
              <stop offset="80%" stopColor="#ea580c" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="abs-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background spectrum gradient */}
          <rect
            x={getX(380)}
            y={padding.top}
            width={getX(750) - getX(380)}
            height={graphHeight}
            fill="url(#spectrum-band)"
          />

          {/* Grid lines */}
          {[0.5, 1.0, 1.5].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {[350, 450, 550, 650, 750].map((wl) => {
            const x = getX(wl);
            return (
              <g key={wl}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={x} y={padding.top + graphHeight + 16} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  {wl} nm
                </text>
              </g>
            );
          })}

          {/* Absorbance Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Shaded Area */}
          <path
            d={`${pathD} L ${padding.left + graphWidth} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`}
            fill="url(#abs-fill)"
          />

          {/* SPR Peak Indicator */}
          {sprPeakWavelength && (
            <g>
              <line
                x1={getX(sprPeakWavelength)}
                y1={padding.top}
                x2={getX(sprPeakWavelength)}
                y2={padding.top + graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <rect
                x={getX(sprPeakWavelength) - 35}
                y={padding.top + 10}
                width="70"
                height="18"
                rx="3"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="0.8"
              />
              <text
                x={getX(sprPeakWavelength)}
                y={padding.top + 22}
                fill="#38bdf8"
                fontSize="9"
                fontWeight="600"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                SPR {sprPeakWavelength}nm
              </text>
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padding.left + graphWidth / 2}
            y={svgHeight - 10}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Wavelength λ (nm)
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + graphHeight / 2}, 16)`}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Optical Density / Absorbance
          </text>
        </svg>
      </div>

      {/* Optical Metrics Bar */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Plasmon Dipole Resonance</span>
          <span className="text-amber-300 font-bold text-sm">
            {sprPeakWavelength ?? 450} nm
          </span>
          <span className="text-slate-500 block text-[9px]">Mie Dipolar Mode</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Optical Bandgap (Eg)</span>
          <span className="text-emerald-400 font-bold text-sm">
            {bandgapEV ? `${bandgapEV} eV` : 'N/A (Metallic Alloy)'}
          </span>
          <span className="text-slate-500 block text-[9px]">Direct Interband Transition</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Extinction Ratio (A400/A800)</span>
          <span className="text-sky-300 font-bold text-sm">
            {(uvVisData[16]?.absorbance / Math.max(0.01, uvVisData[uvVisData.length - 2]?.absorbance)).toFixed(2)}
          </span>
          <span className="text-slate-500 block text-[9px]">Nanoparticle Yield Metric</span>
        </div>
      </div>
    </div>
  );
};
