import React from 'react';
import { ApplicationDomain, TargetPreset } from '../types/materials';
import { DOMAIN_PRESETS } from '../services/physicsSimulation';
import { 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Flame, 
  RefreshCw, 
  FileText,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentDomain: ApplicationDomain;
  onSelectDomain: (domain: ApplicationDomain) => void;
  isAutoPilotRunning: boolean;
  onToggleAutoPilot: () => void;
  autoPilotSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onRunSingle: () => void;
  onSuggestNext: () => void;
  onOpenReport: () => void;
  onResetCampaign: () => void;
  totalCycles: number;
  bestMetric: number;
  paretoCount: number;
  pgmReductionPercent: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDomain,
  onSelectDomain,
  isAutoPilotRunning,
  onToggleAutoPilot,
  autoPilotSpeed,
  onChangeSpeed,
  onRunSingle,
  onSuggestNext,
  onOpenReport,
  onResetCampaign,
  totalCycles,
  bestMetric,
  paretoCount,
  pgmReductionPercent
}) => {
  const currentPreset = DOMAIN_PRESETS[currentDomain];

  return (
    <header className="bg-[#090e1a]/95 backdrop-blur border-b border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
      {/* Brand & Target Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/40">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white font-sans">
                Autonomous Energy Materials Lab
              </h1>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                MAP v4.8 ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              High-Throughput Robotic Nanoparticle Synthesis & Characterization
            </p>
          </div>
        </div>

        {/* Domain Selector Dropdown */}
        <div className="relative ml-2">
          <select
            value={currentDomain}
            onChange={(e) => onSelectDomain(e.target.value as ApplicationDomain)}
            className="bg-slate-900/90 text-sky-300 font-mono text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-sky-500/60 transition outline-none cursor-pointer pr-8"
          >
            {Object.values(DOMAIN_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Key Lab Metrics Badges */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
        {/* Total Runs */}
        <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">CYCLES:</span>
          <span className="text-sky-400 font-bold">{totalCycles}</span>
        </div>

        {/* Best Performance */}
        <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">BEST {currentPreset.primaryMetric.split(' ')[0]}:</span>
          <span className="text-emerald-400 font-bold">
            {bestMetric} {currentPreset.metricUnit}
          </span>
          <span className="text-[9px] text-slate-500">
            (bench: {currentPreset.benchmarkValue})
          </span>
        </div>

        {/* PGM Noble Metal Reduction */}
        <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">PGM REDUCTION:</span>
          <span className="text-amber-400 font-bold">-{pgmReductionPercent}%</span>
        </div>

        {/* Pareto Count */}
        <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">PARETO:</span>
          <span className="text-purple-400 font-bold">{paretoCount}</span>
        </div>
      </div>

      {/* Campaign Controls */}
      <div className="flex items-center gap-2">
        {/* Auto-Pilot Closed Loop Button */}
        <button
          onClick={onToggleAutoPilot}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-sm cursor-pointer ${
            isAutoPilotRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
          }`}
        >
          {isAutoPilotRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Auto-Pilot</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Auto-Pilot Loop</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        {isAutoPilotRunning && (
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px] font-mono">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-1.5 py-0.5 rounded transition ${
                  autoPilotSpeed === speed ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}

        {/* Suggest Next Experiment */}
        <button
          onClick={onSuggestNext}
          disabled={isAutoPilotRunning}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-xs font-mono transition cursor-pointer"
          title="Compute Bayesian Expected Improvement"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Suggest</span>
        </button>

        {/* Export Report */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
          title="Generate Publication Discovery Report"
        >
          <FileText className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Report</span>
        </button>

        {/* Reset Campaign */}
        <button
          onClick={onResetCampaign}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg bg-slate-900 border border-slate-800 transition"
          title="Reset Campaign Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
