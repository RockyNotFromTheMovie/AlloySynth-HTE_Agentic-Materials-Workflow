import React, { useState, useEffect } from 'react';
import { ApplicationDomain, SynthesisParameters, TargetPreset } from '../types/materials';
import { DOMAIN_PRESETS } from '../services/physicsSimulation';
import { 
  Play, 
  Flame, 
  Clock, 
  Droplets, 
  Sliders, 
  RotateCcw, 
  Sparkles,
  Layers,
  Thermometer,
  Gauge
} from 'lucide-react';

interface SynthesisReactorProps {
  domain: ApplicationDomain;
  params: SynthesisParameters;
  onChangeParams: (params: SynthesisParameters) => void;
  onExecuteSynthesis: () => void;
  isSynthesizing: boolean;
  synthesisStage: string;
}

export const SynthesisReactor: React.FC<SynthesisReactorProps> = ({
  domain,
  params,
  onChangeParams,
  onExecuteSynthesis,
  isSynthesizing,
  synthesisStage,
}) => {
  const preset = DOMAIN_PRESETS[domain];

  // Helper to update specific parameter
  const updateParam = <K extends keyof SynthesisParameters>(key: K, value: SynthesisParameters[K]) => {
    onChangeParams({
      ...params,
      [key]: value
    });
  };

  // Stoichiometry sum
  const sumRatios = params.ratioA + params.ratioB + params.ratioC;
  const pctA = Math.round((params.ratioA / sumRatios) * 100);
  const pctB = Math.round((params.ratioB / sumRatios) * 100);
  const pctC = Math.round((params.ratioC / sumRatios) * 100);

  // Dynamic heat zone color
  const tempRatio = (params.temperature - 60) / 240; // 0 to 1
  const heatColor = tempRatio > 0.6 
    ? 'rgba(239, 68, 68, 0.45)' 
    : (tempRatio > 0.3 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.45)');

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Microfluidic Synthesis Reactor
              <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                Continuous Flow
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              In-situ LaMer Nucleation & Capping Control
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onChangeParams({
              ratioA: 0.70,
              ratioB: 0.25,
              ratioC: 0.05,
              temperature: preset.defaultTemp,
              residenceTime: preset.defaultResidenceTime,
              reducingAgentStrength: 1.0,
              surfactantRatio: 1.5,
              totalFlowRate: 1.8
            });
          }}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded bg-slate-900/60 border border-slate-800 transition"
          title="Reset to default protocol"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Animated Reactor Flow Visualization */}
      <div className="relative h-44 w-full bg-[#050811] rounded-xl border border-slate-800/90 overflow-hidden mb-4 p-3 flex flex-col justify-between">
        {/* Top Channel Flow Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span>Syringe Pumps (Q = {params.totalFlowRate} mL/min)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>Thermal Zone: {params.temperature} °C</span>
          </div>
        </div>

        {/* Microfluidic Channels Graphic */}
        <div className="relative flex-1 flex items-center justify-between px-2">
          {/* 3 Syringe Inlets */}
          <div className="flex flex-col gap-2.5 w-24">
            <div className="bg-slate-900 border border-sky-500/40 rounded px-1.5 py-1 text-[9px] font-mono text-sky-300 flex items-center justify-between">
              <span>{preset.primaryPrecursors[0]?.split(' ')[0] ?? 'Metal A'}</span>
              <strong>{pctA}%</strong>
            </div>
            <div className="bg-slate-900 border border-emerald-500/40 rounded px-1.5 py-1 text-[9px] font-mono text-emerald-300 flex items-center justify-between">
              <span>{preset.primaryPrecursors[1]?.split(' ')[0] ?? 'Metal B'}</span>
              <strong>{pctB}%</strong>
            </div>
            <div className="bg-slate-900 border border-purple-500/40 rounded px-1.5 py-1 text-[9px] font-mono text-purple-300 flex items-center justify-between">
              <span>Surfactant</span>
              <strong>{params.surfactantRatio}x</strong>
            </div>
          </div>

          {/* Mixing Microchannel with flowing liquid animation */}
          <div className="relative flex-1 mx-3 h-10 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center overflow-hidden">
            {/* Heating Zone Backdrop */}
            <div 
              className="absolute inset-0 transition-colors duration-500"
              style={{ backgroundColor: heatColor }}
            />

            {/* Liquid Flow Stream */}
            <div className={`w-full h-3 rounded-full mx-2 flex items-center justify-around overflow-hidden ${
              isSynthesizing ? 'animate-flow-liquid bg-sky-400' : 'bg-sky-500/30'
            }`}>
              {/* Floating Nanoparticles inside droplet */}
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    isSynthesizing ? 'scale-125 animate-pulse' : 'scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Thermal zone text */}
            <div className="absolute right-3 top-1 text-[9px] font-mono text-amber-200/80">
              {params.temperature > 180 ? 'BURST NUCLEATION' : 'DIFFUSION GROWTH'}
            </div>
          </div>

          {/* Flow Cell Outlet */}
          <div className="w-20 bg-slate-900/90 border border-slate-800 rounded p-1.5 text-center">
            <span className="text-[9px] font-mono text-slate-400 block">Residence</span>
            <span className="text-xs font-mono font-bold text-sky-400">{params.residenceTime}s</span>
          </div>
        </div>

        {/* Live Synthesis Pipeline Stage Banner */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
          <span className="text-slate-400">Pipeline Status:</span>
          <span className={`font-semibold ${isSynthesizing ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
            {isSynthesizing ? synthesisStage : 'Idle • Ready for Injection'}
          </span>
        </div>
      </div>

      {/* Reactor Parameter Controls */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {/* Metal Stoichiometry */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Precursor Stoichiometry
            </label>
            <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              {pctA}:{pctB}:{pctC}
            </span>
          </div>

          {/* Slider A */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">{preset.primaryPrecursors[0]}</span>
              <span className="text-sky-300">{pctA}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={params.ratioA}
              onChange={(e) => updateParam('ratioA', parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Slider B */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">{preset.primaryPrecursors[1]}</span>
              <span className="text-emerald-300">{pctB}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.02"
              value={params.ratioB}
              onChange={(e) => updateParam('ratioB', parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Slider C */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Promoter / Secondary ({preset.secondaryPrecursors[0]?.split(' ')[0]})</span>
              <span className="text-purple-300">{pctC}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.3"
              step="0.01"
              value={params.ratioC}
              onChange={(e) => updateParam('ratioC', parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>

        {/* Temperature & Residence Time */}
        <div className="grid grid-cols-2 gap-3">
          {/* Reaction Temperature */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Temperature
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">{params.temperature} °C</span>
            </div>
            <input
              type="range"
              min="60"
              max="280"
              step="5"
              value={params.temperature}
              onChange={(e) => updateParam('temperature', parseInt(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 my-2"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>60°C (Slow)</span>
              <span>280°C (Flash)</span>
            </div>
          </div>

          {/* Residence Time */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Residence Time
              </span>
              <span className="text-xs font-mono font-bold text-sky-300">{params.residenceTime} s</span>
            </div>
            <input
              type="range"
              min="5"
              max="160"
              step="5"
              value={params.residenceTime}
              onChange={(e) => updateParam('residenceTime', parseInt(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 my-2"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>5s (Nuclei)</span>
              <span>160s (Ripening)</span>
            </div>
          </div>
        </div>

        {/* Surfactant & Reducing Agent */}
        <div className="grid grid-cols-2 gap-3">
          {/* Surfactant Capping Ligand */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-purple-400" />
                Surfactant Ligand
              </span>
              <span className="text-xs font-mono font-bold text-purple-300">{params.surfactantRatio}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.8"
              step="0.1"
              value={params.surfactantRatio}
              onChange={(e) => updateParam('surfactantRatio', parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 my-2"
            />
            <span className="text-[9px] font-mono text-slate-500 block">
              {params.surfactantRatio > 1.8 ? 'Directs (111) Octahedra' : 'Spherical growth'}
            </span>
          </div>

          {/* Reducing Agent Strength */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                Reducing Power
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">{params.reducingAgentStrength}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.05"
              value={params.reducingAgentStrength}
              onChange={(e) => updateParam('reducingAgentStrength', parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 my-2"
            />
            <span className="text-[9px] font-mono text-slate-500 block">
              NaBH₄ / Ascorbic Acid
            </span>
          </div>
        </div>
      </div>

      {/* Execute Synthesis Action Button */}
      <div className="pt-3 border-t border-slate-800/80 mt-3">
        <button
          onClick={onExecuteSynthesis}
          disabled={isSynthesizing}
          className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
            isSynthesizing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 border border-sky-400/30'
          }`}
        >
          {isSynthesizing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>{synthesisStage}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Robotic Synthesis & Characterization</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
