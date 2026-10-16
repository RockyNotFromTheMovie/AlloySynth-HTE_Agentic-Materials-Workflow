import React, { useRef, useEffect, useState } from 'react';
import { ExperimentRun } from '../types/materials';
import { Microscope, ZoomIn, ZoomOut, Compass, Sparkles, Ruler } from 'lucide-react';

interface TEMMicroscopeProps {
  currentRun: ExperimentRun | null;
}

export const TEMMicroscope: React.FC<TEMMicroscopeProps> = ({ currentRun }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showFFT, setShowFFT] = useState<boolean>(false);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [measuredDistanceNm, setMeasuredDistanceNm] = useState<number | null>(null);

  const morphology = currentRun?.morphology;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !morphology) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Pixel scale: 1 nm = 18 * zoom pixels
    const pxPerNm = 18 * zoom;

    if (showFFT) {
      // Render Fast Fourier Transform (Selected Area Electron Diffraction - SAED pattern)
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      // Central transmission spot
      const cx = width / 2;
      const cy = height / 2;

      const radialGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
      radialGrad.addColorStop(0, '#ffffff');
      radialGrad.addColorStop(0.3, '#38bdf8');
      radialGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      // Diffraction rings for FCC (111), (200), (220)
      const d111 = morphology.dSpacingNm;
      const rings = [
        { label: '(111)', r: (1 / d111) * 22 * zoom },
        { label: '(200)', r: (1 / (d111 * 0.866)) * 22 * zoom },
        { label: '(220)', r: (1 / (d111 * 0.612)) * 22 * zoom },
      ];

      rings.forEach(ring => {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sharp diffraction spots around the ring
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const sx = cx + Math.cos(angle) * ring.r;
          const sy = cy + Math.sin(angle) * ring.r;
          const spotGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5);
          spotGrad.addColorStop(0, '#ffffff');
          spotGrad.addColorStop(0.5, '#7dd3fc');
          spotGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = spotGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(ring.label, cx + ring.r + 6, cy - 4);
      });

      // Scale bar in reciprocal space
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText('FFT Power Spectrum (SAED Electron Diffraction)', 16, 26);
      return;
    }

    // High-Resolution TEM Bright-Field Mode
    // Carbon grid support film background with slight amorphous contrast noise
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    // Amorphous carbon speckle
    const imgData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      imgData.data[i] = Math.max(0, Math.min(255, 12 + noise));
      imgData.data[i+1] = Math.max(0, Math.min(255, 18 + noise));
      imgData.data[i+2] = Math.max(0, Math.min(255, 28 + noise));
      imgData.data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    const cx = width / 2;
    const cy = height / 2;
    const radiusPx = (morphology.averageSizeNm / 2) * pxPerNm;

    ctx.save();
    ctx.beginPath();

    // Particle Shape Path
    if (morphology.shape === 'Octahedral') {
      // Hexagonal projected profile of octahedron viewed along [111] or [110]
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const x = cx + radiusPx * Math.cos(a);
        const y = cy + radiusPx * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (morphology.shape === 'Nanoframes') {
      // Hollow edge frame
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      ctx.arc(cx, cy, radiusPx * 0.65, 0, Math.PI * 2, true);
    } else if (morphology.shape === 'Core-Shell') {
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    }

    // Clip to particle interior to draw high-resolution atomic lattice fringes
    ctx.clip();

    // High electron density contrast background inside nanoparticle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - radiusPx * 1.5, cy - radiusPx * 1.5, radiusPx * 3, radiusPx * 3);

    if (morphology.shape === 'Core-Shell') {
      // Inner core darker contrast
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw atomic lattice fringes oriented at 30 degrees
    const fringeSpacingPx = morphology.dSpacingNm * pxPerNm;
    const angle = Math.PI / 6;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
    ctx.lineWidth = Math.max(1, fringeSpacingPx * 0.45);

    const extent = radiusPx * 2;
    for (let offset = -extent; offset <= extent; offset += fringeSpacingPx) {
      const x1 = cx + offset * cosA - extent * sinA;
      const y1 = cy + offset * sinA + extent * cosA;
      const x2 = cx + offset * cosA + extent * sinA;
      const y2 = cy + offset * sinA - extent * cosA;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Secondary orthogonal lattice row for high crystallinity
    if (morphology.crystallinity > 88) {
      const angle2 = angle + Math.PI / 3;
      const cosA2 = Math.cos(angle2);
      const sinA2 = Math.sin(angle2);
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
      ctx.lineWidth = Math.max(1, fringeSpacingPx * 0.35);

      for (let offset = -extent; offset <= extent; offset += fringeSpacingPx) {
        const x1 = cx + offset * cosA2 - extent * sinA2;
        const y1 = cy + offset * sinA2 + extent * cosA2;
        const x2 = cx + offset * cosA2 + extent * sinA2;
        const y2 = cy + offset * sinA2 - extent * cosA2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Particle boundary outline
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Measurement ruler line if user dragged
    if (measureStart && measureEnd) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(measureStart.x, measureStart.y);
      ctx.lineTo(measureEnd.x, measureEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // End tick marks
      [measureStart, measureEnd].forEach(pt => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Scientific Scale Bar at bottom right
    const scaleBarNm = zoom >= 2 ? 2 : 5;
    const scaleBarPx = scaleBarNm * pxPerNm;
    const barX = width - scaleBarPx - 24;
    const barY = height - 26;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(barX, barY, scaleBarPx, 3);
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${scaleBarNm} nm`, barX + scaleBarPx / 2, barY - 6);

  }, [currentRun, zoom, showFFT, measureStart, measureEnd]);

  // Handle interactive measurement
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMeasureStart({ x, y });
    setMeasureEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring || !measureStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMeasureEnd({ x, y });

    const dx = x - measureStart.x;
    const dy = y - measureStart.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const pxPerNm = 18 * zoom;
    const distNm = distPx / pxPerNm;
    setMeasuredDistanceNm(parseFloat(distNm.toFixed(3)));
  };

  const handleMouseUp = () => {
    // Keep measurement displayed
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-xl border border-slate-800 p-4 relative overflow-hidden">
      {/* Top Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Microscope className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              HR-TEM / STEM Electron Micrograph
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                200 kV FEG
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Magnification: {(zoom * 450000).toLocaleString()}x • {morphology?.shape ?? 'Nanoparticle'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Measure Caliper Button */}
          <button
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) {
                setMeasureStart(null);
                setMeasureEnd(null);
                setMeasuredDistanceNm(null);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-mono transition ${
              isMeasuring
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title="Interactive d-spacing caliper"
          >
            <Ruler className="w-3.5 h-3.5" />
            {isMeasuring ? 'Measuring...' : 'Measure d-spacing'}
          </button>

          {/* FFT / SAED Toggle */}
          <button
            onClick={() => setShowFFT(!showFFT)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-mono transition ${
              showFFT
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {showFFT ? 'Exit FFT' : 'FFT / SAED'}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-md p-0.5">
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.25))}
              className="p-1 text-slate-400 hover:text-slate-100 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1.5 min-w-[36px] text-center">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(3.5, prev + 0.25))}
              className="p-1 text-slate-400 hover:text-slate-100 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[300px] w-full bg-[#050811] rounded-lg overflow-hidden border border-slate-800/90 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`w-full h-full object-contain ${isMeasuring ? 'cursor-crosshair' : 'cursor-default'}`}
        />

        {/* Live Measurement Overlay */}
        {measuredDistanceNm !== null && (
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-amber-500/60 text-amber-300 px-3 py-1.5 rounded text-xs font-mono shadow-lg flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Measured Distance: <strong>{measuredDistanceNm} nm</strong> ({(measuredDistanceNm * 10).toFixed(2)} Å)</span>
            <span className="text-slate-400 text-[10px]">
              ≈ {Math.round(measuredDistanceNm / (morphology?.dSpacingNm || 0.22))} {morphology?.dominantFacet} atomic planes
            </span>
          </div>
        )}

        {/* Target Info Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-3">
          <span>Facet: <strong className="text-sky-300">{morphology?.dominantFacet}</strong></span>
          <span className="text-slate-500">•</span>
          <span>d-spacing: <strong className="text-sky-300">{morphology?.dSpacingNm} nm</strong></span>
          <span className="text-slate-500">•</span>
          <span>Lattice: <strong className="text-emerald-300">{morphology?.latticeConstantAngstrom} Å</strong></span>
        </div>
      </div>
    </div>
  );
};
