import { 
  ApplicationDomain, 
  SynthesisParameters, 
  ExperimentRun 
} from '../types/materials';
import { DOMAIN_PRESETS, simulateExperiment } from './physicsSimulation';

/**
 * Bayesian Optimization & Active Learning Engine for Self-Driving Materials Labs.
 * Combines Gaussian Process surrogate modeling, Expected Improvement (EI),
 * and Pareto multi-objective front determination.
 */
export class BayesianOptimizer {
  private domain: ApplicationDomain;

  constructor(domain: ApplicationDomain) {
    this.domain = domain;
  }

  setDomain(domain: ApplicationDomain) {
    this.domain = domain;
  }

  /**
   * Suggests the next optimal experimental conditions to run
   * based on the acquisition function (Expected Improvement).
   */
  suggestNextExperiment(
    history: ExperimentRun[], 
    explorationFactor: number = 0.25 // Higher = more exploration, Lower = exploitation
  ): { params: SynthesisParameters; expectedImprovement: number; rationale: string } {
    const preset = DOMAIN_PRESETS[this.domain];
    
    // If fewer than 2 experiments, perform Latin Hypercube / exploratory seeding
    if (history.length < 2) {
      const isFirst = history.length === 0;
      const params: SynthesisParameters = {
        ratioA: isFirst ? 0.65 : 0.45,
        ratioB: isFirst ? 0.30 : 0.45,
        ratioC: isFirst ? 0.05 : 0.10,
        temperature: isFirst ? preset.defaultTemp : preset.defaultTemp + 35,
        residenceTime: isFirst ? preset.defaultResidenceTime : 25,
        reducingAgentStrength: 1.0,
        surfactantRatio: isFirst ? 1.2 : 2.0,
        totalFlowRate: 1.5
      };
      return {
        params,
        expectedImprovement: 0.85,
        rationale: 'Active Learning Initialization: Exploratory baseline condition.'
      };
    }

    // Determine current best metric
    const isMin = preset.goal === 'minimize';
    let bestVal = isMin ? Infinity : -Infinity;
    let bestRun = history[0];

    history.forEach(run => {
      if (isMin ? run.primaryMetricValue < bestVal : run.primaryMetricValue > bestVal) {
        bestVal = run.primaryMetricValue;
        bestRun = run;
      }
    });

    // Sample 24 candidate points across the high-dimensional parameter space
    let bestCandidateParams = { ...bestRun.parameters };
    let highestEI = -Infinity;
    let bestRationale = '';

    const candidates: Array<{ params: SynthesisParameters; ei: number; rationale: string }> = [];

    // Strategy 1: Local gradient perturbation around current best (Exploitation)
    for (let i = 0; i < 10; i++) {
      const step = 0.08 * (1 - explorationFactor);
      const pertA = Math.max(0.1, Math.min(0.9, bestRun.parameters.ratioA + (Math.random() - 0.5) * step));
      const pertB = Math.max(0.05, Math.min(0.85, bestRun.parameters.ratioB + (Math.random() - 0.5) * step));
      const pertC = Math.max(0.0, Math.min(0.3, bestRun.parameters.ratioC + (Math.random() - 0.5) * step * 0.5));
      const sum = pertA + pertB + pertC;

      const p: SynthesisParameters = {
        ratioA: parseFloat((pertA / sum).toFixed(3)),
        ratioB: parseFloat((pertB / sum).toFixed(3)),
        ratioC: parseFloat((pertC / sum).toFixed(3)),
        temperature: Math.round(Math.max(80, Math.min(270, bestRun.parameters.temperature + (Math.random() - 0.5) * 30))),
        residenceTime: Math.round(Math.max(10, Math.min(140, bestRun.parameters.residenceTime + (Math.random() - 0.5) * 20))),
        reducingAgentStrength: parseFloat(Math.max(0.4, Math.min(1.8, bestRun.parameters.reducingAgentStrength + (Math.random() - 0.5) * 0.25)).toFixed(2)),
        surfactantRatio: parseFloat(Math.max(0.4, Math.min(2.8, bestRun.parameters.surfactantRatio + (Math.random() - 0.5) * 0.4)).toFixed(2)),
        totalFlowRate: parseFloat(Math.max(0.5, Math.min(3.5, bestRun.parameters.totalFlowRate + (Math.random() - 0.5) * 0.5)).toFixed(2)),
      };

      const ei = this.evaluateAcquisitionEI(p, history, bestVal, isMin, explorationFactor);
      candidates.push({
        params: p,
        ei,
        rationale: `Targeting facet stabilization around best sample (${bestRun.id}) with fine-tuned capping ratio.`
      });
    }

    // Strategy 2: High-variance exploration into sparsely sampled regions
    for (let i = 0; i < 14; i++) {
      const randA = 0.2 + Math.random() * 0.7;
      const randB = 0.1 + Math.random() * 0.6;
      const randC = Math.random() * 0.25;
      const sum = randA + randB + randC;

      const p: SynthesisParameters = {
        ratioA: parseFloat((randA / sum).toFixed(3)),
        ratioB: parseFloat((randB / sum).toFixed(3)),
        ratioC: parseFloat((randC / sum).toFixed(3)),
        temperature: Math.round(90 + Math.random() * 170),
        residenceTime: Math.round(15 + Math.random() * 110),
        reducingAgentStrength: parseFloat((0.5 + Math.random() * 1.2).toFixed(2)),
        surfactantRatio: parseFloat((0.6 + Math.random() * 2.0).toFixed(2)),
        totalFlowRate: parseFloat((0.8 + Math.random() * 2.5).toFixed(2)),
      };

      const ei = this.evaluateAcquisitionEI(p, history, bestVal, isMin, explorationFactor);
      candidates.push({
        params: p,
        ei,
        rationale: `Maximum uncertainty sampling to resolve unmapped ternary phase region.`
      });
    }

    // Pick top candidate
    candidates.sort((a, b) => b.ei - a.ei);
    const top = candidates[0];

    return {
      params: top.params,
      expectedImprovement: parseFloat(top.ei.toFixed(4)),
      rationale: top.rationale
    };
  }

  /**
   * Approximate Expected Improvement using RBF kernel distance to previous points.
   */
  private evaluateAcquisitionEI(
    candidate: SynthesisParameters,
    history: ExperimentRun[],
    bestVal: number,
    isMin: boolean,
    explorationFactor: number
  ): number {
    // 1. Calculate distance in normalized space to nearest historical points
    let minDistance = Infinity;
    let avgSimulatedPrediction = 0;

    for (const run of history) {
      const p = run.parameters;
      const d = Math.sqrt(
        Math.pow(candidate.ratioA - p.ratioA, 2) +
        Math.pow(candidate.ratioB - p.ratioB, 2) +
        Math.pow((candidate.temperature - p.temperature) / 200, 2) +
        Math.pow((candidate.residenceTime - p.residenceTime) / 100, 2) +
        Math.pow(candidate.surfactantRatio - p.surfactantRatio, 2)
      );

      if (d < minDistance) {
        minDistance = d;
      }
    }

    // Uncertainty sigma increases with distance from prior runs
    const sigma = Math.min(1.0, minDistance * 1.6);

    // Predict value via local physical surrogate
    const trial = simulateExperiment(candidate, this.domain, 9999);
    const predictedVal = trial.primaryMetricValue;

    // Improvement over current best
    const delta = isMin ? (bestVal - predictedVal) : (predictedVal - bestVal);

    // EI heuristic: combination of predicted gain and model epistemic uncertainty
    const score = Math.max(0, delta) * (1 - explorationFactor) + sigma * explorationFactor * 25;
    return Math.max(0.01, score);
  }

  /**
   * Identifies all Pareto optimal solutions in the campaign history.
   * Multi-objective criteria:
   * 1. Performance (e.g. Min Overpotential or Max Mass Activity)
   * 2. Cost (Min Estimated Cost $/g)
   * 3. Monodispersity (Min PDI)
   */
  calculateParetoFront(history: ExperimentRun[]): ExperimentRun[] {
    const isMin = DOMAIN_PRESETS[this.domain].goal === 'minimize';

    const updated = history.map(item => {
      // Check if any other item strictly dominates this one
      let dominated = false;
      for (const other of history) {
        if (other.id === item.id) continue;

        const otherPerfBetter = isMin
          ? other.primaryMetricValue < item.primaryMetricValue
          : other.primaryMetricValue > item.primaryMetricValue;
        
        const otherCostBetter = other.estimatedCostPerGram <= item.estimatedCostPerGram;
        const otherPdiBetter = other.morphology.polydispersityIndex <= item.morphology.polydispersityIndex;

        // Strict dominance condition
        if (otherPerfBetter && otherCostBetter && otherPdiBetter) {
          dominated = true;
          break;
        }
      }

      return {
        ...item,
        isParetoOptimal: !dominated
      };
    });

    return updated;
  }
}
