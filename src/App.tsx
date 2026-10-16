/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ApplicationDomain, 
  SynthesisParameters, 
  ExperimentRun, 
  TargetPreset 
} from './types/materials';
import { DOMAIN_PRESETS, simulateExperiment } from './services/physicsSimulation';
import { BayesianOptimizer } from './services/bayesianOptimizer';
import { geminiChemist } from './services/geminiChemist';
import { Header } from './components/Header';
import { SynthesisReactor } from './components/SynthesisReactor';
import { CharacterizationSuite } from './components/CharacterizationSuite';
import { ActiveLearningBrain } from './components/ActiveLearningBrain';
import { ReportModal } from './components/ReportModal';

export default function App() {
  const [domain, setDomain] = useState<ApplicationDomain>('her');
  const [history, setHistory] = useState<ExperimentRun[]>([]);
  const [currentRun, setCurrentRun] = useState<ExperimentRun | null>(null);
  
  // Optimizer
  const optimizerRef = useRef<BayesianOptimizer>(new BayesianOptimizer('her'));

  // Synthesis Parameters State
  const [params, setParams] = useState<SynthesisParameters>({
    ratioA: 0.70,
    ratioB: 0.25,
    ratioC: 0.05,
    temperature: DOMAIN_PRESETS['her'].defaultTemp,
    residenceTime: DOMAIN_PRESETS['her'].defaultResidenceTime,
    reducingAgentStrength: 1.0,
    surfactantRatio: 1.5,
    totalFlowRate: 1.8
  });

  // Robotic Pipeline Status
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisStage, setSynthesisStage] = useState<string>('Idle');

  // Auto-Pilot State
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState<boolean>(false);
  const [autoPilotSpeed, setAutoPilotSpeed] = useState<number>(1);
  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Suggested next experiment from Bayesian Acquisition
  const [suggestedParams, setSuggestedParams] = useState<SynthesisParameters | null>(null);
  const [suggestedRationale, setSuggestedRationale] = useState<string>('');

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Current Preset
  const preset = DOMAIN_PRESETS[domain];

  // Seed baseline experiments for the domain
  const initializeDomainData = useCallback((targetDomain: ApplicationDomain) => {
    optimizerRef.current.setDomain(targetDomain);
    const targetPreset = DOMAIN_PRESETS[targetDomain];

    // Seed 4 initial exploratory experiments
    const seedParams: SynthesisParameters[] = [
      {
        ratioA: 0.50,
        ratioB: 0.40,
        ratioC: 0.10,
        temperature: targetPreset.defaultTemp - 30,
        residenceTime: 20,
        reducingAgentStrength: 0.8,
        surfactantRatio: 0.8,
        totalFlowRate: 2.5
      },
      {
        ratioA: 0.65,
        ratioB: 0.30,
        ratioC: 0.05,
        temperature: targetPreset.defaultTemp,
        residenceTime: targetPreset.defaultResidenceTime,
        reducingAgentStrength: 1.0,
        surfactantRatio: 1.4,
        totalFlowRate: 1.8
      },
      {
        ratioA: 0.75,
        ratioB: 0.20,
        ratioC: 0.05,
        temperature: targetPreset.defaultTemp + 20,
        residenceTime: targetPreset.defaultResidenceTime + 25,
        reducingAgentStrength: 1.2,
        surfactantRatio: 2.1,
        totalFlowRate: 1.5
      },
      {
        ratioA: 0.80,
        ratioB: 0.15,
        ratioC: 0.05,
        temperature: targetPreset.defaultTemp + 45,
        residenceTime: 90,
        reducingAgentStrength: 1.4,
        surfactantRatio: 1.0,
        totalFlowRate: 1.0
      }
    ];

    let runs: ExperimentRun[] = seedParams.map((p, i) => simulateExperiment(p, targetDomain, i + 1));
    runs = optimizerRef.current.calculateParetoFront(runs);

    setHistory(runs);
    const initialRun = runs[runs.length - 2]; // default to optimal seed
    setCurrentRun(initialRun);

    // Initial suggestion
    const nextSuggestion = optimizerRef.current.suggestNextExperiment(runs);
    setSuggestedParams(nextSuggestion.params);
    setSuggestedRationale(nextSuggestion.rationale);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeDomainData('her');
  }, [initializeDomainData]);

  // Handle Domain Change
  const handleDomainChange = (newDomain: ApplicationDomain) => {
    if (isAutoPilotRunning) {
      setIsAutoPilotRunning(false);
    }
    setDomain(newDomain);
    const targetPreset = DOMAIN_PRESETS[newDomain];
    setParams({
      ratioA: 0.70,
      ratioB: 0.25,
      ratioC: 0.05,
      temperature: targetPreset.defaultTemp,
      residenceTime: targetPreset.defaultResidenceTime,
      reducingAgentStrength: 1.0,
      surfactantRatio: 1.5,
      totalFlowRate: 1.8
    });
    initializeDomainData(newDomain);
  };

  // Run a single robotic synthesis cycle
  const executeSynthesis = useCallback(async (customParameters?: SynthesisParameters) => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);

    const activeParams = customParameters || params;
    const stages = [
      'Pumping Reagent Precursors...',
      `Thermal Zone: Heating to ${activeParams.temperature}°C...`,
      'LaMer Burst Nucleation in Microchannels...',
      'In-line Optical Quenching & Flow-Cell Transfer...',
      'Multi-Modal In-situ Characterization...'
    ];

    // Speed scaling
    const stepDuration = Math.max(120, 600 / autoPilotSpeed);

    for (let i = 0; i < stages.length; i++) {
      setSynthesisStage(stages[i]);
      await new Promise(r => setTimeout(r, stepDuration));
    }

    // Run physical simulation
    const newRunIndex = history.length + 1;
    const newRun = simulateExperiment(activeParams, domain, newRunIndex);

    // Check if new record was achieved
    const isMin = preset.goal === 'minimize';
    const priorBest = history.length > 0
      ? (isMin 
          ? Math.min(...history.map(h => h.primaryMetricValue))
          : Math.max(...history.map(h => h.primaryMetricValue)))
      : preset.benchmarkValue;

    const isRecordBreak = isMin 
      ? newRun.primaryMetricValue < priorBest && newRun.primaryMetricValue < preset.benchmarkValue
      : newRun.primaryMetricValue > priorBest && newRun.primaryMetricValue > preset.benchmarkValue;

    if (isRecordBreak) {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#10b981', '#f59e0b']
      });
    }

    // Recompute Pareto frontier across history + newRun
    const updatedHistory = optimizerRef.current.calculateParetoFront([...history, newRun]);
    const updatedNewRun = updatedHistory[updatedHistory.length - 1];

    setHistory(updatedHistory);
    setCurrentRun(updatedNewRun);
    setIsSynthesizing(false);
    setSynthesisStage('Idle');

    // Update Bayesian suggestion for subsequent step
    const nextSuggestion = optimizerRef.current.suggestNextExperiment(updatedHistory);
    setSuggestedParams(nextSuggestion.params);
    setSuggestedRationale(nextSuggestion.rationale);

    return updatedNewRun;
  }, [isSynthesizing, params, autoPilotSpeed, history, domain, preset]);

  // Apply suggested recipe to controls
  const applySuggestedParams = () => {
    if (suggestedParams) {
      setParams(suggestedParams);
    }
  };

  // Trigger manual suggest
  const handleSuggestNext = () => {
    const nextSuggestion = optimizerRef.current.suggestNextExperiment(history);
    setSuggestedParams(nextSuggestion.params);
    setSuggestedRationale(nextSuggestion.rationale);
    setParams(nextSuggestion.params);
  };

  // Auto-Pilot Loop Controller
  useEffect(() => {
    if (!isAutoPilotRunning) {
      if (autoPilotTimerRef.current) clearTimeout(autoPilotTimerRef.current);
      return;
    }

    const intervalMs = Math.max(800, 3200 / autoPilotSpeed);

    const stepAutoPilot = async () => {
      // Pick next Bayesian condition
      const nextSuggestion = optimizerRef.current.suggestNextExperiment(history);
      await executeSynthesis(nextSuggestion.params);
    };

    autoPilotTimerRef.current = setTimeout(stepAutoPilot, intervalMs);

    return () => {
      if (autoPilotTimerRef.current) clearTimeout(autoPilotTimerRef.current);
    };
  }, [isAutoPilotRunning, autoPilotSpeed, history, executeSynthesis]);

  // Best performance metric
  const isMin = preset.goal === 'minimize';
  const bestMetric = history.length > 0
    ? (isMin 
        ? Math.min(...history.map(h => h.primaryMetricValue))
        : Math.max(...history.map(h => h.primaryMetricValue)))
    : preset.benchmarkValue;

  const bestRun = history.find(h => h.primaryMetricValue === bestMetric) || history[0];
  const paretoCount = history.filter(h => h.isParetoOptimal).length;

  // Calculate average PGM noble metal reduction
  const avgRatioA = history.reduce((acc, h) => acc + h.parameters.ratioA, 0) / Math.max(1, history.length);
  const pgmReductionPercent = Math.max(0, Math.round((1 - avgRatioA) * 100));

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b1120] text-[#f8fafc] overflow-hidden select-none">
      {/* Top Header */}
      <Header
        currentDomain={domain}
        onSelectDomain={handleDomainChange}
        isAutoPilotRunning={isAutoPilotRunning}
        onToggleAutoPilot={() => setIsAutoPilotRunning(!isAutoPilotRunning)}
        autoPilotSpeed={autoPilotSpeed}
        onChangeSpeed={setAutoPilotSpeed}
        onRunSingle={() => executeSynthesis()}
        onSuggestNext={handleSuggestNext}
        onOpenReport={() => setIsReportOpen(true)}
        onResetCampaign={() => initializeDomainData(domain)}
        totalCycles={history.length}
        bestMetric={bestMetric}
        paretoCount={paretoCount}
        pgmReductionPercent={pgmReductionPercent}
      />

      {/* Main Multi-Pane Workbench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Pane: Microfluidic Synthesis Reactor (3 cols on lg) */}
        <div className="lg:col-span-4 xl:col-span-3 h-full overflow-hidden">
          <SynthesisReactor
            domain={domain}
            params={params}
            onChangeParams={setParams}
            onExecuteSynthesis={() => executeSynthesis()}
            isSynthesizing={isSynthesizing}
            synthesisStage={synthesisStage}
          />
        </div>

        {/* Center Pane: Multi-Modal Characterization Suite (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-6 h-full overflow-hidden">
          <CharacterizationSuite
            currentRun={currentRun}
            history={history}
            onSelectRun={setCurrentRun}
          />
        </div>

        {/* Right Pane: Autonomous MAP Brain & Bayesian Active Learning (3 cols on lg) */}
        <div className="lg:col-span-3 xl:col-span-3 h-full overflow-hidden">
          <ActiveLearningBrain
            domain={domain}
            history={history}
            currentRun={currentRun}
            onSelectRun={setCurrentRun}
            onApplySuggestedParams={applySuggestedParams}
            suggestedRationale={suggestedRationale}
            isAutoPilotRunning={isAutoPilotRunning}
          />
        </div>
      </div>

      {/* Publication Discovery Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        domain={domain}
        history={history}
        bestRun={bestRun}
      />
    </div>
  );
}
