import React from 'react';
import { ExperimentRun } from '../types/materials';
import { CircleDot, ShieldAlert, Award } from 'lucide-react';

interface DLSViewerProps {
  currentRun: ExperimentRun | null;
}

export const DLSViewer: React.FC<DLSViewerProps> = ({ currentRun }) => {
  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No DLS particle size data available.
      </div>
    );
  }

  const { dlsData, morphology, zetaPotentialMv } = currentRun;

  const svgWidth = 650;
  const svgHeight = 320;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxIntensity = Math.max(...dlsData.map(d => d.intensityPercent), 50);
  const minD = 1;
  const maxD = 70;

  const getX = (d: number) => padding.left + ((d - minD) / (maxD - minD)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / maxIntensity) * graphHeight;

  // DLS Curve Path
  const pathD = dlsData.reduce((acc, pt, i) => {
    const x = getX(pt.diameterNm);
    const y = getY(pt.intensityPercent);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const pdi = morphology.polydispersityIndex;
  const isMonodisperse = pdi <= 0.12;

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <CircleDot className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Dynamic Light Scattering (DLS) & Zeta Potential
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isMonodisperse 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isMonodisperse ? 'Monodisperse Grade' : 'Moderate Polydispersity'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Hydrodynamic Diameter (dH): <strong className="text-purple-300">{(morphology.averageSizeNm * 1.35).toFixed(1)} nm</strong> • PDI: <strong className="text-sky-300">{pdi}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Zeta Potential:</span>
          <span className={`px-2 py-0.5 rounded font-bold ${
            Math.abs(zetaPotentialMv) > 25 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {zetaPotentialMv} mV
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[260px] w-full bg-[#050811] rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full select-none">
          {/* Vertical and Horizontal Grids */}
          {[10, 20, 30, 40, 50, 60].map((dVal) => {
            const x = getX(dVal);
            return (
              <g key={dVal}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={x} y={padding.top + graphHeight + 16} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                  {dVal}
                </text>
              </g>
            );
          })}

          {[10, 25, 40].map((pct) => {
            const y = getY(pct);
            return (
              <g key={pct}>
                <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Histogram bar representations */}
          {dlsData.map((bin, i) => {
            const x = getX(bin.diameterNm);
            const y = getY(bin.intensityPercent);
            const h = padding.top + graphHeight - y;
            return (
              <rect
                key={i}
                x={x - 2}
                y={y}
                width={4}
                height={h}
                fill="#a855f7"
                opacity="0.35"
                rx="1"
              />
            );
          })}

          {/* Smoothed Intensity Profile */}
          <path
            d={pathD}
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Peak Hydrodynamic Diameter Marker */}
          {(() => {
            const peakBin = dlsData.reduce((prev, curr) => curr.intensityPercent > prev.intensityPercent ? curr : prev);
            const x = getX(peakBin.diameterNm);
            const y = getY(peakBin.intensityPercent);
            return (
              <g>
                <circle cx={x} cy={y} r="4" fill="#c084fc" stroke="#050811" strokeWidth="1.5" />
                <rect x={x - 30} y={y - 24} width="60" height="18" rx="3" fill="#0f172a" stroke="#c084fc" strokeWidth="0.8" />
                <text x={x} y={y - 12} fill="#e9d5ff" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono" textAnchor="middle">
                  dH={peakBin.diameterNm}nm
                </text>
              </g>
            );
          })()}

          {/* Axis Labels */}
          <text
            x={padding.left + graphWidth / 2}
            y={svgHeight - 10}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Hydrodynamic Diameter dH (nm)
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + graphHeight / 2}, 16)`}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Scattering Intensity (%)
          </text>
        </svg>
      </div>

      {/* DLS Analytics */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Polydispersity Index</span>
          <span className={`font-bold text-sm ${isMonodisperse ? 'text-emerald-400' : 'text-amber-400'}`}>
            {pdi}
          </span>
          <span className="text-slate-500 block text-[9px]">Cumulants Fit</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Zeta Potential (ζ)</span>
          <span className="text-sky-300 font-bold text-sm">
            {zetaPotentialMv} mV
          </span>
          <span className="text-slate-500 block text-[9px]">Electrophoretic mobility</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Colloidal Stability</span>
          <span className="text-emerald-400 font-bold text-sm">
            {Math.abs(zetaPotentialMv) > 25 ? 'High Stability' : 'Moderate Flocculation'}
          </span>
          <span className="text-slate-500 block text-[9px]">DLVO Repulsion</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Hydration Shell</span>
          <span className="text-purple-300 font-bold text-sm">
            +{(morphology.averageSizeNm * 0.35).toFixed(1)} nm
          </span>
          <span className="text-slate-500 block text-[9px]">Surfactant layer</span>
        </div>
      </div>
    </div>
  );
};
