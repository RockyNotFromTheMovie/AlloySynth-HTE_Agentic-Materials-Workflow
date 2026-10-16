import React, { useState } from 'react';
import { ExperimentRun } from '../types/materials';
import { Activity, Layers, Tag, Eye } from 'lucide-react';

interface XRDViewerProps {
  currentRun: ExperimentRun | null;
}

export const XRDViewer: React.FC<XRDViewerProps> = ({ currentRun }) => {
  const [showStandardRef, setShowStandardRef] = useState<boolean>(true);
  const [showScherrerFit, setShowScherrerFit] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ twoTheta: number; intensity: number } | null>(null);

  if (!currentRun) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No XRD scan data available. Execute a synthesis run.
      </div>
    );
  }

  const { xrdData, xrdPeaks, morphology } = currentRun;

  // SVG dimensions
  const svgWidth = 650;
  const svgHeight = 320;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Domain extents
  const min2Theta = 20;
  const max2Theta = 85;
  const maxIntensity = Math.max(...xrdData.map(p => p.intensity), 1200);

  const getX = (twoTheta: number) => padding.left + ((twoTheta - min2Theta) / (max2Theta - min2Theta)) * graphWidth;
  const getY = (intensity: number) => padding.top + graphHeight - (intensity / maxIntensity) * graphHeight;

  // Generate SVG path for sample XRD pattern
  const pathD = xrdData.reduce((acc, pt, i) => {
    const x = getX(pt.twoTheta);
    const y = getY(pt.intensity);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Standard Pure Pt FCC (ICDD PDF #04-0802) reference peak positions:
  // (111) @ 39.76°, (200) @ 46.24°, (220) @ 67.45°, (311) @ 81.28°
  const referencePeaksPt = [
    { twoTheta: 39.76, hkl: 'Pt(111)', relInt: 100 },
    { twoTheta: 46.24, hkl: 'Pt(200)', relInt: 53 },
    { twoTheta: 67.45, hkl: 'Pt(220)', relInt: 31 },
    { twoTheta: 81.28, hkl: 'Pt(311)', relInt: 33 }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-xl border border-slate-800 p-4">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Powder X-Ray Diffractogram (PXRD)
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Cu Kα (λ = 1.5406 Å)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Bragg Peak Deconvolution & Scherrer Crystallite Sizing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStandardRef(!showStandardRef)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-mono transition ${
              showStandardRef
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            PDF Ref Overlay
          </button>

          <button
            onClick={() => setShowScherrerFit(!showScherrerFit)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-mono transition ${
              showScherrerFit
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Peak Indices
          </button>
        </div>
      </div>

      {/* Main Diffractogram SVG */}
      <div className="relative flex-1 min-h-[260px] w-full bg-[#050811] rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (mouseX >= padding.left && mouseX <= padding.left + graphWidth) {
              const twoTheta = min2Theta + ((mouseX - padding.left) / graphWidth) * (max2Theta - min2Theta);
              // Find nearest point
              const nearest = xrdData.reduce((prev, curr) => 
                Math.abs(curr.twoTheta - twoTheta) < Math.abs(prev.twoTheta - twoTheta) ? curr : prev
              );
              setHoveredPoint({ twoTheta: nearest.twoTheta, intensity: nearest.intensity });
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + graphHeight * (1 - pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  {Math.round(maxIntensity * pct)}
                </text>
              </g>
            );
          })}

          {/* Vertical 2θ Grid lines */}
          {[20, 30, 40, 50, 60, 70, 80].map((deg) => {
            const x = getX(deg);
            return (
              <g key={deg}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + graphHeight}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {deg}°
                </text>
              </g>
            );
          })}

          {/* ICDD Reference Standard lines (pure Pt FCC) */}
          {showStandardRef && referencePeaksPt.map((ref, idx) => {
            const xRef = getX(ref.twoTheta);
            const lineH = (ref.relInt / 100) * (graphHeight * 0.45);
            const yStart = padding.top + graphHeight;
            const yEnd = yStart - lineH;
            return (
              <g key={`ref-${idx}`}>
                <line
                  x1={xRef}
                  y1={yStart}
                  x2={xRef}
                  y2={yEnd}
                  stroke="#f43f5e"
                  strokeWidth="1.8"
                  opacity="0.75"
                />
                <circle cx={xRef} cy={yEnd} r="2" fill="#f43f5e" />
                <text
                  x={xRef}
                  y={yEnd - 6}
                  fill="#fb7185"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  Std
                </text>
              </g>
            );
          })}

          {/* Sample XRD Intensity Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Shaded Area under Curve */}
          <path
            d={`${pathD} L ${padding.left + graphWidth} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`}
            fill="url(#xrd-grad)"
            opacity="0.25"
          />

          <defs>
            <linearGradient id="xrd-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Peak Labels and Scherrer FWHM Tags */}
          {showScherrerFit && xrdPeaks.map((peak, idx) => {
            const x = getX(peak.observedTwoTheta);
            const matchingPt = xrdData.reduce((prev, curr) => 
              Math.abs(curr.twoTheta - peak.observedTwoTheta) < Math.abs(prev.twoTheta - peak.observedTwoTheta) ? curr : prev
            );
            const y = getY(matchingPt.intensity) - 12;

            return (
              <g key={`peak-${idx}`}>
                <circle cx={x} cy={y + 12} r="3" fill="#38bdf8" stroke="#050811" strokeWidth="1.5" />
                <line x1={x} y1={y + 10} x2={x} y2={y + 2} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                <rect
                  x={x - 22}
                  y={y - 18}
                  width="44"
                  height="16"
                  rx="3"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
                <text
                  x={x}
                  y={y - 6}
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {peak.hkl}
                </text>
              </g>
            );
          })}

          {/* Crosshair on hover */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.twoTheta)}
                y1={padding.top}
                x2={getX(hoveredPoint.twoTheta)}
                y2={padding.top + graphHeight}
                stroke="#94a3b8"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredPoint.twoTheta)}
                cy={getY(hoveredPoint.intensity)}
                r="4"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
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
            Diffraction Angle 2θ (degrees)
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + graphHeight / 2}, 16)`}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            Intensity (arbitrary units)
          </text>
        </svg>

        {/* Floating Hover Info */}
        {hoveredPoint && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-mono shadow-md">
            <span>2θ: <strong>{hoveredPoint.twoTheta}°</strong></span>
            <span className="text-slate-500 mx-2">|</span>
            <span>Intensity: <strong>{hoveredPoint.intensity} cts</strong></span>
          </div>
        )}
      </div>

      {/* Crystallographic Analytics Panel */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Crystallite Size (D)</span>
          <span className="text-sky-300 font-bold text-sm">
            {morphology.averageSizeNm} nm
          </span>
          <span className="text-slate-500 block text-[9px]">Scherrer (111) FWHM</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Lattice Constant (a)</span>
          <span className="text-emerald-300 font-bold text-sm">
            {morphology.latticeConstantAngstrom} Å
          </span>
          <span className="text-slate-500 block text-[9px]">Vegard Solid Solution</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Lattice Strain (ε)</span>
          <span className="text-amber-300 font-bold text-sm">
            -{(((3.9242 - morphology.latticeConstantAngstrom) / 3.9242) * 100).toFixed(2)}%
          </span>
          <span className="text-slate-500 block text-[9px]">Compressive vs Pt host</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Crystallinity</span>
          <span className="text-purple-300 font-bold text-sm">
            {morphology.crystallinity}%
          </span>
          <span className="text-slate-500 block text-[9px]">Peak-to-halo ratio</span>
        </div>
      </div>
    </div>
  );
};
