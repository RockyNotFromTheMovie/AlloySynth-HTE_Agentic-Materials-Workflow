import { 
  ApplicationDomain, 
  SynthesisParameters, 
  MorphologyData, 
  XRDPoint, 
  XRDFacetPeak, 
  UVVisPoint, 
  LSVPoint, 
  DLSBin, 
  ExperimentRun,
  TargetPreset
} from '../types/materials';

export const DOMAIN_PRESETS: Record<ApplicationDomain, TargetPreset> = {
  her: {
    id: 'her',
    name: 'Acidic Hydrogen Evolution (HER)',
    tagline: 'Discovery of low-PGM, high-turnover nanocage catalysts for PEM water electrolyzers',
    primaryMetric: 'Overpotential η₁₀',
    metricUnit: 'mV',
    goal: 'minimize',
    benchmarkValue: 38, // Commercial 20% Pt/C is ~38 mV at 10 mA/cm²
    primaryPrecursors: ['H₂PtCl₆ (Chloroplatinic Acid)', 'Co(NO₃)₂ (Cobalt Nitrate)'],
    secondaryPrecursors: ['Ni(NO₃)₂', 'MoCl₅ (Molybdenum Molybdate)'],
    solvents: ['Ethylene Glycol', 'Oleylamine', 'Water / Isopropanol'],
    defaultTemp: 175,
    defaultResidenceTime: 45
  },
  oer: {
    id: 'oer',
    name: 'Alkaline Oxygen Evolution (OER)',
    tagline: 'Noble-metal-free Ni-Fe-Co layered oxyhydroxide nanoparticles with ultra-low overpotential',
    primaryMetric: 'Overpotential η₁₀',
    metricUnit: 'mV',
    goal: 'minimize',
    benchmarkValue: 275, // Commercial IrO₂ is ~275 mV
    primaryPrecursors: ['Ni(NO₃)₂', 'Fe(acac)₃ (Iron Acetylacetonate)'],
    secondaryPrecursors: ['CoCl₂', 'V(acac)₃'],
    solvents: ['Triethylene Glycol', 'Benzyl Alcohol', 'Ethanol'],
    defaultTemp: 210,
    defaultResidenceTime: 60
  },
  orr: {
    id: 'orr',
    name: 'PEMFC Oxygen Reduction (ORR)',
    tagline: 'Octahedral Pt₃Ni alloy nanoframes with compressed (111) surface facets',
    primaryMetric: 'Mass Activity',
    metricUnit: 'A/mg_Pt',
    goal: 'maximize',
    benchmarkValue: 0.35, // Commercial Pt/C is ~0.35 A/mg_Pt at 0.9 V vs RHE
    primaryPrecursors: ['H₂PtCl₆', 'Ni(acetate)₂'],
    secondaryPrecursors: ['Mo(CO)₆ (Carbonyl Promoter)', 'Cu(NO₃)₂'],
    solvents: ['Oleic Acid & Oleylamine', 'Diphenyl Ether'],
    defaultTemp: 190,
    defaultResidenceTime: 75
  },
  perovskite: {
    id: 'perovskite',
    name: 'Halide Perovskite Quantum Dots',
    tagline: 'Autonomous bandgap optimization for tandem solar cells & stable emissions',
    primaryMetric: 'Target Bandgap Error',
    metricUnit: 'meV',
    goal: 'minimize',
    benchmarkValue: 80, // meV from 1.34 eV optimum
    primaryPrecursors: ['Cs-Oleate', 'PbI₂ (Lead Iodide)'],
    secondaryPrecursors: ['PbBr₂', 'Formamidinium Acetate'],
    solvents: ['1-Octadecene', 'Toluene', 'Hexane'],
    defaultTemp: 150,
    defaultResidenceTime: 30
  },
  solid_electrolyte: {
    id: 'solid_electrolyte',
    name: 'Solid-State Battery Electrolyte',
    tagline: 'Argyrodite Li₆PS₅Cl nanocrystals with high room-temperature lithium-ion conductivity',
    primaryMetric: 'Ionic Conductivity',
    metricUnit: 'mS/cm',
    goal: 'maximize',
    benchmarkValue: 2.1, // Benchmark argyrodite is ~2.1 mS/cm
    primaryPrecursors: ['Li₂S', 'P₂S₅'],
    secondaryPrecursors: ['LiCl', 'LiBr'],
    solvents: ['Anhydrous Tetrahydrofuran', 'Acetonitrile'],
    defaultTemp: 230,
    defaultResidenceTime: 90
  }
};

/**
 * Simulates the physical synthesis and characterization of nanoparticles
 * using validated solid-state, crystallographic, and electrocatalytic models.
 */
export function simulateExperiment(
  params: SynthesisParameters,
  domain: ApplicationDomain,
  runIndex: number
): ExperimentRun {
  const preset = DOMAIN_PRESETS[domain];
  
  // Normalize ratios so sum is 1.0
  const rawSum = params.ratioA + params.ratioB + params.ratioC;
  const normA = rawSum > 0 ? params.ratioA / rawSum : 0.6;
  const normB = rawSum > 0 ? params.ratioB / rawSum : 0.3;
  const normC = rawSum > 0 ? params.ratioC / rawSum : 0.1;

  // 1. Nanoparticle Size calculation via LaMer nucleation kinetics
  // Higher temp -> faster nucleation -> smaller initial nuclei, but high residence time -> Ostwald ripening
  const tempNorm = (params.temperature - 60) / 240; // 0 to 1
  const timeNorm = (params.residenceTime - 5) / 175; // 0 to 1
  const surfactantEffect = Math.min(2.0, params.surfactantRatio);
  
  // Base nucleation size (2nm - 25nm)
  let baseSize = 4.5 + (1 - tempNorm) * 6 + timeNorm * 11 - (surfactantEffect - 1) * 2.5;
  baseSize = Math.max(2.8, Math.min(32.0, baseSize));
  
  // Polydispersity Index: microfluidic flow rate and surfactant control narrow PDI
  const flowStability = Math.min(1.0, params.totalFlowRate / 2.5);
  let pdi = 0.08 + (1 - flowStability) * 0.12 + Math.abs(params.reducingAgentStrength - 1.0) * 0.09;
  pdi = Math.max(0.06, Math.min(0.42, pdi));

  // Determine Morphology based on surfactant ratio and temperature
  let shape: MorphologyData['shape'] = 'Spherical';
  let dominantFacet: MorphologyData['dominantFacet'] = '(111)';
  
  if (params.surfactantRatio > 1.8 && params.temperature >= 160 && params.temperature <= 230) {
    shape = 'Octahedral';
    dominantFacet = '(111)';
  } else if (params.surfactantRatio > 1.2 && normB > 0.35 && params.residenceTime > 50) {
    shape = 'Core-Shell';
    dominantFacet = '(111)';
  } else if (normC > 0.15 && params.temperature > 190) {
    shape = 'Nanoframes';
    dominantFacet = '(110)';
  } else if (params.residenceTime < 20) {
    shape = 'Polyhedral';
    dominantFacet = '(100)';
  }

  // 2. Vegard's Law for Solid Solution Lattice Constant
  // Pt pure = 3.924 Å, Co pure = 3.548 Å, Ni pure = 3.524 Å
  // Alloy compressive strain shifts lattice
  const purePt_a = 3.9242;
  const pureCo_a = 3.5480;
  const pureNi_a = 3.5240;
  const latticeConstant = normA * purePt_a + normB * (domain === 'oer' ? pureNi_a : pureCo_a) + normC * 3.65;
  // d-spacing for (111) = a / sqrt(1^2 + 1^2 + 1^2) = a / sqrt(3)
  const dSpacingNm = (latticeConstant / Math.sqrt(3)) / 10; // convert Å to nm

  // 3. Performance Metrics calculation based on Volcano Plot / Bandgap Physics
  let primaryMetricValue = 0;
  let secondaryMetricValue = 0;
  let tafelSlope = 42;
  let ecsa = 55; // m²/g
  let durability = 85;

  if (domain === 'her') {
    // HER overpotential at 10 mA/cm² (Target: minimize mV)
    // Volcano peak is achieved with Pt:Co ratio ~ 70:30 or 75:25, Octahedral (111) facets, size 6-9 nm
    const optimalRatioPenalty = Math.pow(normA - 0.72, 2) * 220 + Math.pow(normB - 0.22, 2) * 160;
    const optimalSizePenalty = Math.pow(baseSize - 7.5, 2) * 1.8;
    const shapeBonus = shape === 'Octahedral' ? -12 : (shape === 'Nanoframes' ? -16 : 0);
    const pdiPenalty = pdi * 35;
    
    // Theoretical minimum overpotential ~ 14 mV (record literature)
    primaryMetricValue = Math.round(18 + optimalRatioPenalty + optimalSizePenalty + shapeBonus + pdiPenalty);
    primaryMetricValue = Math.max(14, Math.min(145, primaryMetricValue));
    
    // Tafel slope (mV/dec) - Volmer-Tafel vs Volmer-Heyrovsky mechanism
    tafelSlope = Math.round(26 + (primaryMetricValue / 120) * 45);
    // Mass Activity (A/mg_Pt at 50 mV)
    secondaryMetricValue = parseFloat(((120 - primaryMetricValue) * 0.045 / Math.max(0.1, normA)).toFixed(2));
    ecsa = Math.round(75 - baseSize * 2.1 + (shape === 'Nanoframes' ? 30 : 0));
    durability = Math.min(99, Math.round(96 - (1 - normA) * 25));
  } 
  else if (domain === 'oer') {
    // OER overpotential at 10 mA/cm² (Target: minimize mV)
    // Volcano peak for NiFe oxyhydroxides: Ni:Fe ~ 80:20 with Co or V promoter
    const niFeRatioPenalty = Math.pow(normA - 0.78, 2) * 320 + Math.pow(normB - 0.18, 2) * 280;
    const sizeBonus = Math.max(0, (15 - baseSize) * 2.5);
    primaryMetricValue = Math.round(210 + niFeRatioPenalty - sizeBonus + (pdi * 45));
    primaryMetricValue = Math.max(195, Math.min(420, primaryMetricValue));
    
    tafelSlope = Math.round(34 + (primaryMetricValue - 200) * 0.15);
    secondaryMetricValue = parseFloat(((450 - primaryMetricValue) * 0.12).toFixed(1)); // current density at 1.55V
    ecsa = Math.round(110 - baseSize * 3);
    durability = Math.min(98, Math.round(92 - pdi * 20));
  }
  else if (domain === 'orr') {
    // ORR Mass activity (Target: maximize A/mg)
    // Pt3Ni(111) nanoframe is world record (~2.8 A/mg)
    const ptNiRatioFit = 1 - Math.min(1, Math.abs(normA - 0.75) * 3.5);
    const nanoframeBonus = shape === 'Nanoframes' ? 1.4 : (shape === 'Octahedral' ? 0.9 : 0.2);
    const sizeFactor = Math.max(0.2, 1 - Math.abs(baseSize - 8.5) / 10);
    
    secondaryMetricValue = parseFloat((0.25 + ptNiRatioFit * 1.1 + nanoframeBonus * sizeFactor).toFixed(2));
    primaryMetricValue = secondaryMetricValue; // Primary is Mass Activity
    tafelSlope = Math.round(58 - secondaryMetricValue * 6);
    ecsa = Math.round(65 + nanoframeBonus * 25);
    durability = Math.round(88 + ptNiRatioFit * 10);
  }
  else if (domain === 'perovskite') {
    // Halide perovskite bandgap tuning towards ideal single-junction / tandem 1.34 - 1.55 eV
    // Vegard shift: CsPbI3 (1.73 eV) to FAPbI3 (1.48 eV) to Br-doped
    const targetEV = 1.34;
    const simulatedBandgap = parseFloat((1.32 + normB * 0.45 + (1 - tempNorm) * 0.12).toFixed(3));
    const errorMev = Math.round(Math.abs(simulatedBandgap - targetEV) * 1000);
    primaryMetricValue = errorMev; // Minimize error in meV
    secondaryMetricValue = simulatedBandgap; // Bandgap eV
    tafelSlope = 0;
    ecsa = 0;
    durability = Math.round(94 - normB * 15);
  }
  else {
    // Solid-State Electrolyte Ionic Conductivity (Target: maximize mS/cm)
    const liClRatio = normC;
    const cond = parseFloat((0.8 + normA * 2.2 + liClRatio * 3.5 - Math.abs(tempNorm - 0.7) * 2.0).toFixed(2));
    primaryMetricValue = Math.max(0.3, cond);
    secondaryMetricValue = primaryMetricValue;
    tafelSlope = 0;
    ecsa = 0;
    durability = 96;
  }

  // Cost calculation per gram based on precursor market prices
  // Pt = ~$32/g, Co = ~$0.04/g, Ni = ~$0.02/g, Fe = ~$0.005/g
  let costPerGram = 0;
  if (domain === 'her' || domain === 'orr') {
    costPerGram = normA * 32.5 + normB * 0.85 + normC * 1.2 + 0.95; // + reagents & synthesis
  } else if (domain === 'oer') {
    costPerGram = normA * 0.45 + normB * 0.35 + normC * 0.65 + 0.80; // highly economical!
  } else {
    costPerGram = normA * 4.2 + normB * 2.8 + 1.5;
  }
  costPerGram = parseFloat(costPerGram.toFixed(2));

  // 4. Generate Synthetic XRD Pattern
  const { xrdData, xrdPeaks } = generateXRD(latticeConstant, baseSize, domain);

  // 5. Generate Synthetic UV-Vis Extinction Spectrum
  const { uvVisData, sprPeak } = generateUVVis(domain, baseSize, normA, normB);

  // 6. Generate Synthetic LSV Curve
  const lsvData = generateLSV(primaryMetricValue, tafelSlope, domain);

  // 7. Generate DLS Size Distribution
  const dlsData = generateDLS(baseSize, pdi);

  // Morphology object
  const morphology: MorphologyData = {
    shape,
    averageSizeNm: parseFloat(baseSize.toFixed(1)),
    sizeDistributionStd: parseFloat((baseSize * pdi).toFixed(1)),
    polydispersityIndex: parseFloat(pdi.toFixed(2)),
    latticeConstantAngstrom: parseFloat(latticeConstant.toFixed(4)),
    dominantFacet,
    dSpacingNm: parseFloat(dSpacingNm.toFixed(3)),
    crystallinity: Math.min(98, Math.round(84 + tempNorm * 12))
  };

  // Generate automated scientific note
  let notes = `${shape} nanoparticles (d = ${morphology.averageSizeNm} nm, PDI = ${morphology.polydispersityIndex}). `;
  if (domain === 'her') {
    notes += `Compressive lattice strain (a = ${latticeConstant.toFixed(3)} Å) weakens OH* binding on ${dominantFacet} facets, achieving η₁₀ = ${primaryMetricValue} mV.`;
  } else if (domain === 'oer') {
    notes += `Ni-Fe active site synergy with ${dominantFacet} exposure delivers η₁₀ = ${primaryMetricValue} mV with Tafel slope of ${tafelSlope} mV/dec.`;
  } else if (domain === 'orr') {
    notes += `${shape} morphology exposes high-index active sites yielding ${secondaryMetricValue} A/mg_Pt mass activity.`;
  } else {
    notes += `Bandgap tuned to ${secondaryMetricValue} eV with high phase purity.`;
  }

  return {
    id: `EXP-${String(runIndex).padStart(4, '0')}`,
    runIndex,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    domain,
    parameters: params,
    morphology,
    primaryMetricValue,
    secondaryMetricValue,
    estimatedCostPerGram: costPerGram,
    acquisitionScore: 0, // Assigned by optimizer
    isParetoOptimal: false, // Calculated by optimizer
    notes,
    xrdData,
    xrdPeaks,
    uvVisData,
    lsvData,
    dlsData,
    sprPeakWavelength: sprPeak,
    bandgapEV: domain === 'perovskite' ? secondaryMetricValue : undefined,
    tafelSlopeMvDec: tafelSlope,
    zetaPotentialMv: parseFloat((-28.5 + (params.surfactantRatio - 1) * 8.2).toFixed(1)),
    ecsaCm2: ecsa,
    durabilityRetentionPercent: durability
  };
}

/**
 * Generates an accurate powder X-ray diffractogram (Cu Kα radiation, λ = 1.5406 Å)
 * with Scherrer peak broadening based on crystallite diameter.
 */
function generateXRD(latticeA: number, crystalSizeNm: number, domain: ApplicationDomain): { xrdData: XRDPoint[]; xrdPeaks: XRDFacetPeak[] } {
  const lambda = 1.5406; // Angstrom
  
  // FCC Bragg peaks: (111), (200), (220), (311), (222)
  const hklList = [
    { hkl: '(111)', s: 3 },
    { hkl: '(200)', s: 4 },
    { hkl: '(220)', s: 8 },
    { hkl: '(311)', s: 11 },
    { hkl: '(222)', s: 12 },
  ];

  const xrdPeaks: XRDFacetPeak[] = [];

  for (const item of hklList) {
    const dSpacing = latticeA / Math.sqrt(item.s); // Angstrom
    const sinTheta = lambda / (2 * dSpacing);
    if (sinTheta <= 1) {
      const thetaRad = Math.asin(sinTheta);
      const twoThetaDeg = (thetaRad * 2 * 180) / Math.PI;
      
      // Scherrer broadening: β = 0.94 * λ / (D_angstrom * cos(θ))
      const dAngstrom = crystalSizeNm * 10;
      const betaRad = (0.94 * lambda) / (dAngstrom * Math.cos(thetaRad));
      const fwhmDeg = (betaRad * 180) / Math.PI;

      xrdPeaks.push({
        hkl: item.hkl,
        expectedTwoTheta: parseFloat(twoThetaDeg.toFixed(2)),
        observedTwoTheta: parseFloat(twoThetaDeg.toFixed(2)),
        fwhm: parseFloat(Math.max(0.35, fwhmDeg).toFixed(2)),
        dSpacing: parseFloat((dSpacing / 10).toFixed(4)) // nm
      });
    }
  }

  // Generate 2θ profile from 20° to 85° in steps of 0.25°
  const xrdData: XRDPoint[] = [];
  for (let twoTheta = 20; twoTheta <= 85; twoTheta += 0.25) {
    // Amorphous background curve + instrument noise
    const background = 80 + 35 * Math.exp(-(twoTheta - 24) * (twoTheta - 24) / 180) + (Math.sin(twoTheta * 5) * 4);
    
    // Sum Lorentzian/Gaussian pseudo-Voigt peaks
    let peakSum = 0;
    const baseIntensities = [1000, 480, 310, 290, 110];

    xrdPeaks.forEach((p, idx) => {
      const delta = twoTheta - p.observedTwoTheta;
      const gamma = p.fwhm / 2;
      // Cauchy-Lorentz shape for particle size broadening
      const lorentz = (gamma * gamma) / (delta * delta + gamma * gamma);
      const intensity = baseIntensities[idx] || 150;
      peakSum += intensity * lorentz;
    });

    const noise = (Math.random() - 0.5) * 12;
    xrdData.push({
      twoTheta: parseFloat(twoTheta.toFixed(2)),
      intensity: Math.max(0, Math.round(background + peakSum + noise)),
      background: Math.round(background)
    });
  }

  return { xrdData, xrdPeaks };
}

/**
 * Generates UV-Vis absorption spectrum.
 */
function generateUVVis(domain: ApplicationDomain, sizeNm: number, normA: number, normB: number): { uvVisData: UVVisPoint[]; sprPeak?: number } {
  const uvVisData: UVVisPoint[] = [];
  let sprPeak = 410 + (1 - normA) * 110 + sizeNm * 4.5;
  sprPeak = Math.round(Math.min(680, Math.max(380, sprPeak)));

  for (let wl = 320; wl <= 820; wl += 5) {
    let absorbance = 0;
    if (domain === 'perovskite') {
      // Excitonic absorption edge
      const edge = 540 + normB * 140;
      if (wl < edge) {
        absorbance = 1.2 + (edge - wl) * 0.0035 + 0.3 * Math.exp(-Math.pow(wl - edge + 15, 2) / 250);
      } else {
        absorbance = 0.08 * Math.exp(-(wl - edge) / 45);
      }
    } else {
      // Plasmon resonance peak + interband transition
      const interband = 1.4 * Math.exp(-(wl - 320) / 120);
      const plasmon = 0.85 * Math.exp(-Math.pow(wl - sprPeak, 2) / 4200);
      absorbance = interband + plasmon + 0.05;
    }
    const noise = (Math.random() - 0.5) * 0.015;
    uvVisData.push({
      wavelength: wl,
      absorbance: parseFloat(Math.max(0.01, absorbance + noise).toFixed(3))
    });
  }

  return { uvVisData, sprPeak };
}

/**
 * Generates Linear Sweep Voltammetry (LSV) polarization curve.
 */
function generateLSV(metricVal: number, tafelSlope: number, domain: ApplicationDomain): LSVPoint[] {
  const lsvData: LSVPoint[] = [];

  if (domain === 'her') {
    // Potential from 0.05 V down to -0.25 V vs RHE
    for (let pot = 0.05; pot >= -0.22; pot -= 0.005) {
      const overpotentialMv = -pot * 1000;
      let j = 0;
      if (overpotentialMv > 0) {
        // j = 10 * 10^((eta - eta10) / b)
        const exponent = (overpotentialMv - metricVal) / Math.max(25, tafelSlope);
        j = 10 * Math.pow(10, exponent);
      }
      // Negative cathodic current
      const current = -Math.min(180, j);
      lsvData.push({
        potentialV: parseFloat(pot.toFixed(3)),
        currentDensity: parseFloat(current.toFixed(2)),
        currentDensityLog: j > 0.01 ? parseFloat(Math.log10(j).toFixed(2)) : -2
      });
    }
  } else {
    // OER / ORR Anodic or Cathodic sweep
    for (let pot = 1.15; pot <= 1.75; pot += 0.01) {
      const overpot = (pot - 1.23) * 1000; // OER overpotential
      let j = 0.02;
      if (overpot > 0) {
        const exponent = (overpot - metricVal) / Math.max(30, tafelSlope);
        j = 10 * Math.pow(10, exponent);
      }
      lsvData.push({
        potentialV: parseFloat(pot.toFixed(3)),
        currentDensity: parseFloat(Math.min(220, j).toFixed(2)),
        currentDensityLog: j > 0.01 ? parseFloat(Math.log10(j).toFixed(2)) : -2
      });
    }
  }

  return lsvData;
}

/**
 * Generates Dynamic Light Scattering (DLS) hydrodynamic diameter distribution.
 */
function generateDLS(meanSize: number, pdi: number): DLSBin[] {
  const bins: DLSBin[] = [];
  const hydroDiameter = meanSize * 1.35; // Hydration shell adds ~35%
  const sigma = hydroDiameter * pdi * 1.5;

  for (let d = 1; d <= 70; d += 1.5) {
    // Log-normal distribution
    const diff = Math.log(d) - Math.log(hydroDiameter);
    const intensity = (100 / (d * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-(diff * diff) / (2 * 0.08));
    bins.push({
      diameterNm: d,
      intensityPercent: parseFloat(Math.max(0, Math.min(100, intensity * 25)).toFixed(1))
    });
  }

  return bins;
}
