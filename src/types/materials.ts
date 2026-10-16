export type ApplicationDomain = 
  | 'her' // Hydrogen Evolution Reaction (Green Hydrogen)
  | 'oer' // Oxygen Evolution Reaction (Water Splitting Anode)
  | 'orr' // Oxygen Reduction Reaction (Fuel Cells)
  | 'perovskite' // Halide Perovskite Solar Absorber
  | 'solid_electrolyte'; // Solid-State Battery Electrolyte

export interface TargetPreset {
  id: ApplicationDomain;
  name: string;
  tagline: string;
  primaryMetric: string; // e.g. "Overpotential η₁₀"
  metricUnit: string; // e.g. "mV"
  goal: 'minimize' | 'maximize';
  benchmarkValue: number; // e.g. 55 mV for commercial Pt/C
  primaryPrecursors: string[];
  secondaryPrecursors: string[];
  solvents: string[];
  defaultTemp: number; // Celsius
  defaultResidenceTime: number; // seconds
}

export interface SynthesisParameters {
  ratioA: number; // Fraction of metal A (e.g. Pt, 0 to 1)
  ratioB: number; // Fraction of metal B (e.g. Co or Ni, 0 to 1)
  ratioC: number; // Fraction of metal C / promoter (e.g. Mo or Fe, 0 to 1)
  temperature: number; // 60 - 300 °C
  residenceTime: number; // 5 - 180 seconds
  reducingAgentStrength: number; // 0.1 - 2.0 (e.g. NaBH4 / Ascorbic acid ratio)
  surfactantRatio: number; // 0.1 - 3.0 (Capping ligand / metal ratio)
  totalFlowRate: number; // 0.2 - 5.0 mL/min
}

export interface MorphologyData {
  shape: 'Octahedral' | 'Nanoframes' | 'Core-Shell' | 'Spherical' | 'Nanowire' | 'Polyhedral';
  averageSizeNm: number;
  sizeDistributionStd: number;
  polydispersityIndex: number; // 0.05 to 0.45
  latticeConstantAngstrom: number; // e.g. 3.82 - 3.92 Å for Pt-alloys
  dominantFacet: '(111)' | '(100)' | '(110)' | '(211)';
  dSpacingNm: number; // e.g. 0.222 nm
  crystallinity: number; // percentage, e.g. 92%
}

export interface XRDPoint {
  twoTheta: number; // 20° - 85°
  intensity: number;
  background: number;
}

export interface XRDFacetPeak {
  hkl: string;
  expectedTwoTheta: number;
  observedTwoTheta: number;
  fwhm: number;
  dSpacing: number;
}

export interface UVVisPoint {
  wavelength: number; // 350 - 850 nm
  absorbance: number;
}

export interface LSVPoint {
  potentialV: number; // V vs RHE
  currentDensity: number; // mA/cm²
  currentDensityLog: number; // log|j| for Tafel
}

export interface DLSBin {
  diameterNm: number;
  intensityPercent: number;
}

export interface ExperimentRun {
  id: string;
  runIndex: number;
  timestamp: string;
  domain: ApplicationDomain;
  parameters: SynthesisParameters;
  morphology: MorphologyData;
  primaryMetricValue: number; // e.g. Overpotential in mV or Bandgap in eV
  secondaryMetricValue: number; // e.g. Mass Activity A/mg or Efficiency %
  estimatedCostPerGram: number; // USD / g
  acquisitionScore: number; // Expected Improvement / UCB score
  isParetoOptimal: boolean;
  notes: string;
  aiInsight?: string;
  
  // Spectral and Characterization datasets
  xrdData: XRDPoint[];
  xrdPeaks: XRDFacetPeak[];
  uvVisData: UVVisPoint[];
  lsvData: LSVPoint[];
  dlsData: DLSBin[];
  sprPeakWavelength?: number;
  bandgapEV?: number;
  tafelSlopeMvDec: number;
  zetaPotentialMv: number;
  ecsaCm2: number; // Electrochemical surface area
  durabilityRetentionPercent: number; // after 5000 cycles
}

export interface CampaignSummary {
  totalExperiments: number;
  bestMetric: number;
  baselineMetric: number;
  nobleMetalReductionPercent: number;
  paretoCount: number;
  activeLearningGeneration: number;
}
