import React from 'react';
import { ExperimentRun, ApplicationDomain } from '../types/materials';
import { DOMAIN_PRESETS } from '../services/physicsSimulation';
import { X, Download, FileSpreadsheet, CheckCircle2, Award, Copy, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: ApplicationDomain;
  history: ExperimentRun[];
  bestRun: ExperimentRun | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  domain,
  history,
  bestRun
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;

  const preset = DOMAIN_PRESETS[domain];

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sample_ID',
      'Domain',
      'Ratio_A',
      'Ratio_B',
      'Ratio_C',
      'Temperature_C',
      'ResidenceTime_s',
      'Surfactant_Ratio',
      'Shape',
      'Size_nm',
      'PDI',
      'Lattice_Constant_A',
      'Dominant_Facet',
      'Primary_Metric',
      'Secondary_Metric',
      'Tafel_Slope_mV_dec',
      'Estimated_Cost_USD_g',
      'Is_Pareto'
    ];

    const rows = history.map(r => [
      r.id,
      r.domain,
      r.parameters.ratioA,
      r.parameters.ratioB,
      r.parameters.ratioC,
      r.parameters.temperature,
      r.parameters.residenceTime,
      r.parameters.surfactantRatio,
      r.morphology.shape,
      r.morphology.averageSizeNm,
      r.morphology.polydispersityIndex,
      r.morphology.latticeConstantAngstrom,
      r.morphology.dominantFacet,
      r.primaryMetricValue,
      r.secondaryMetricValue,
      r.tafelSlopeMvDec,
      r.estimatedCostPerGram,
      r.isParetoOptimal ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autonomous_materials_discovery_${domain}_campaign.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `autonomous_materials_discovery_${domain}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const paretoRuns = history.filter(h => h.isParetoOptimal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 text-slate-200 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Autonomous Discovery Campaign Report
              <span className="text-xs font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                Peer-Review Grade
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Protocol: {preset.name} • {history.length} Robotic Cycles Completed
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs font-mono">
          {/* Executive Discovery Highlight */}
          {bestRun && (
            <div className="bg-gradient-to-r from-emerald-950/40 to-sky-950/40 border border-emerald-500/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <Award className="w-5 h-5" />
                Optimal Discovered Candidate: {bestRun.id}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">{preset.primaryMetric}</span>
                  <span className="text-emerald-300 font-bold text-base">
                    {bestRun.primaryMetricValue} {preset.metricUnit}
                  </span>
                  <span className="text-[10px] text-slate-400 block">(Bench: {preset.benchmarkValue})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Morphology & Facet</span>
                  <span className="text-sky-300 font-bold text-base">
                    {bestRun.morphology.shape} {bestRun.morphology.dominantFacet}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{bestRun.morphology.averageSizeNm} nm</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Lattice Constant / Strain</span>
                  <span className="text-amber-300 font-bold text-base">
                    {bestRun.morphology.latticeConstantAngstrom} Å
                  </span>
                  <span className="text-[10px] text-slate-400 block">Compressive strain</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Precursor Cost</span>
                  <span className="text-purple-300 font-bold text-base">
                    ${bestRun.estimatedCostPerGram}/g
                  </span>
                  <span className="text-[10px] text-slate-400 block">PGM Reduced</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {bestRun.notes}
              </p>
            </div>
          )}

          {/* Pareto Optimal Candidates Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Pareto Optimal Frontier Solutions ({paretoRuns.length})
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">Sample</th>
                    <th className="p-2">Stoichiometry</th>
                    <th className="p-2">Temp / Time</th>
                    <th className="p-2">{preset.primaryMetric}</th>
                    <th className="p-2">Tafel Slope</th>
                    <th className="p-2">Cost ($/g)</th>
                    <th className="p-2">PDI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paretoRuns.map(run => (
                    <tr key={run.id} className="hover:bg-slate-900/50">
                      <td className="p-2 font-bold text-sky-400">{run.id}</td>
                      <td className="p-2 text-slate-300">
                        {(run.parameters.ratioA * 100).toFixed(0)}:{(run.parameters.ratioB * 100).toFixed(0)}:{(run.parameters.ratioC * 100).toFixed(0)}
                      </td>
                      <td className="p-2 text-slate-300">{run.parameters.temperature}°C / {run.parameters.residenceTime}s</td>
                      <td className="p-2 font-bold text-emerald-400">{run.primaryMetricValue} {preset.metricUnit}</td>
                      <td className="p-2 text-slate-300">{run.tafelSlopeMvDec} mV/dec</td>
                      <td className="p-2 text-amber-300 font-bold">${run.estimatedCostPerGram}</td>
                      <td className="p-2 text-slate-300">{run.morphology.polydispersityIndex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodology & Equations */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <h4 className="font-semibold text-slate-200">Experimental Methods & Physical Models</h4>
            <p>
              • <strong>LaMer Burst Nucleation:</strong> Precursor reduction rate governed by Arrhenius kinetics k(T) = A exp(-Ea / RT). Rapid reduction above supersaturation threshold enforces discrete nucleation.
            </p>
            <p>
              • <strong>Scherrer Crystallite Analysis:</strong> D = (K · λ) / (β · cos θ), with shape factor K = 0.94 and Cu Kα wavelength λ = 1.5406 Å.
            </p>
            <p>
              • <strong>Tafel Extrapolation:</strong> Overpotential η = a + b log|j|, where Tafel slope b = (2.303 R T) / (α F).
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Autonomous Materials Acceleration Platform • USIM / AI Studio
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
