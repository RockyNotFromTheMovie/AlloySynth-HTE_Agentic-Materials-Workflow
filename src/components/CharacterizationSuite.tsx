import React, { useState } from 'react';
import { ExperimentRun } from '../types/materials';
import { ElectrochemViewer } from './ElectrochemViewer';
import { XRDViewer } from './XRDViewer';
import { TEMMicroscope } from './TEMMicroscope';
import { SpectroscopyViewer } from './SpectroscopyViewer';
import { DLSViewer } from './DLSViewer';
import { Zap, Activity, Microscope, Sun, CircleDot } from 'lucide-react';

interface CharacterizationSuiteProps {
  currentRun: ExperimentRun | null;
  history: ExperimentRun[];
  onSelectRun: (run: ExperimentRun) => void;
}

export const CharacterizationSuite: React.FC<CharacterizationSuiteProps> = ({
  currentRun,
  history,
  onSelectRun
}) => {
  const [activeTab, setActiveTab] = useState<'electrochem' | 'xrd' | 'tem' | 'uvvis' | 'dls'>('electrochem');

  const tabs = [
    { id: 'electrochem', label: 'Voltammetry & Tafel', icon: Zap, color: 'text-amber-400' },
    { id: 'xrd', label: 'PXRD Diffractogram', icon: Activity, color: 'text-emerald-400' },
    { id: 'tem', label: 'HR-TEM Micrograph', icon: Microscope, color: 'text-sky-400' },
    { id: 'uvvis', label: 'UV-Vis-NIR Spectrum', icon: Sun, color: 'text-yellow-400' },
    { id: 'dls', label: 'DLS & Zeta Potential', icon: CircleDot, color: 'text-purple-400' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#0b1120] rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
      {/* Instrumentation Tab Bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-[#090e1a] border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sample Selection Quick Selector */}
        {currentRun && (
          <div className="flex items-center gap-2 text-xs font-mono ml-2 shrink-0">
            <span className="text-slate-400 hidden sm:inline">Active Sample:</span>
            <select
              value={currentRun.id}
              onChange={(e) => {
                const found = history.find(h => h.id === e.target.value);
                if (found) onSelectRun(found);
              }}
              className="bg-slate-900 text-sky-300 font-bold border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-sky-500 cursor-pointer"
            >
              {history.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.id} ({run.morphology.shape}, {run.primaryMetricValue})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Screen Body */}
      <div className="flex-1 p-3 overflow-hidden">
        {activeTab === 'electrochem' && <ElectrochemViewer currentRun={currentRun} />}
        {activeTab === 'xrd' && <XRDViewer currentRun={currentRun} />}
        {activeTab === 'tem' && <TEMMicroscope currentRun={currentRun} />}
        {activeTab === 'uvvis' && <SpectroscopyViewer currentRun={currentRun} />}
        {activeTab === 'dls' && <DLSViewer currentRun={currentRun} />}
      </div>
    </div>
  );
};
