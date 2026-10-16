## Key Modules & Features

### 1. Agentic Candidate Scout & Phase Space Explorer
- Generates continuous composition gradients across the $\text{Pt}\text{-}\text{Pd}\text{-}\text{Ni}\text{-}\text{Co}$ quaternary phase space.
- Calculates theoretical mixing enthalpy, estimated raw metal costs (\$/g), and predicted electrocatalytic overpotentials (mV @ 10 mA/cm²).
- Features server-side Gemini AI integration (`gemini-3.8-flash`) for multi-objective candidate proposal under user-specified constraints (e.g., precious metal loading $<35\%$).

### 2. Nanoparticle Jet Printer Digital Twin & G-Code Compiler
- **Digital Twin Simulator**: Real-time interactive XYZ motion visualization of a multi-nozzle piezoelectric drop-on-demand (DoD) printhead over a 70×70 mm glassy carbon wafer substrate.
- **Dispenser Telemetry**: 4-channel nanoparticle ink reservoir monitoring (Channel A: Pt, Channel B: Pd, Channel C: Ni, Channel D: Co) tracking viscosity, surface tension, and ultrasonic degassing status.
- **Physical Deposition Control**: Fine-tune substrate platen temperature ($25\text{--}110\,^{\circ}\text{C}$) to control the Péclet number and suppress outward Marangoni capillary flow (preventing the coffee-ring defect), piezoelectric pulse voltage ($18\text{--}42\text{ V}$), and post-print reduction/sintering profiles ($200\text{--}520\,^{\circ}\text{C}$).
- **Production-Ready G-Code**: Automatically generates CNC toolpaths (`.gcode`) including homing, degassing, purge routines, coordinated moves, and temperature holds.

### 3. High-Throughput Micro-XRF & SEM Metrology
- **Micro-XRF Elemental Mapping**:
  - Spatial raster distribution across the 8×8 (64-spot) library with false-color channel filters: $\text{Pt L}\alpha$ (9.44 keV), $\text{Pd L}\alpha$ (2.84 keV), $\text{Ni K}\alpha$ (7.48 keV), and $\text{Co K}\alpha$ (6.93 keV).
  - Synchronized point-probe 2048-channel EDS spectrum visualizer with interactive crosshair telemetry, net peak areas, and $k$-ratio sensitivity quantification.
  - Automated detection of stoichiometric deviation against AI targets (±5% tolerance threshold).
- **SEM Morphology & Homogeneity Inspector**:
  - High-resolution secondary electron micrograph viewer with false-color grain boundary and pore segmentation.
  - Radial line-scan mass profile measuring the **Coffee-Ring Segregation Index** $S$:
    $$S = \frac{\int |I(r) - \bar{I}| \, r \, dr}{\bar{I} \int r \, dr}$$
  - Morphological metrics: mean crystallite size (nm), porosity (%), surface roughness $R_a$ (nm), and automated micro-cracking / dewetting alerts.

### 4. Reproducible Python Pipelines (Pyodide & WASM)
- Embeds verifiable, executable Python 3.11 pipelines running directly in the browser via WebAssembly (Pyodide) or deterministic server-side execution:
  - `xrf_quant.py`: Converts fluorescence peak areas to atomic fractions and evaluates stoichiometric RMSE.
  - `homogeneity_sem.py`: Evaluates radial solute profiles and assigns realizability classifications.
  - `fair_curate_pipeline.py`: Assembles library outcomes into machine-learning training matrices.
- Built-in in-browser code editor with live stdout/stderr console feedback and `.py` file downloads.

### 5. Structured FAIR-Aligned Realizability Dataset
- **First-Class Negative Outcomes**: Machine learning discovery loops suffer from survival bias when trained solely on successful samples. The platform explicitly catalogues:
  - `synthesizable_optimal`: Uniform single-phase alloy adhering to target stoichiometry within ±3%.
  - `partial_segregated_ring`: Marangoni drying instability causing peripheral element accumulation.
  - `partial_microcracked`: High-temperature sintering thermal stress mismatch fissures.
  - `negative_dewetted`: Substrate surface energy mismatch causing droplet balling and bead discontinuity.
  - `negative_nozzle_clogged`: Channel micro-cavitation or particulate aggregation causing composition drop-out.
- **Standards-Compliant Exports**:
  - Schema.org `Dataset` (Materials Data Facility standard JSON-LD) with variables, creators, and download distributions.
  - Full CSV dataset containing coordinate metadata, printer parameters, analytical metrics, and realizability labels.
  - End-to-end cryptographic provenance lineage (SHA-256 toolpath hashes).

### 6. Human-in-the-Loop Quality Control Gates
- Stage-gate approvals between composition proposal, print compilation, metrology inspection, and dataset commitment.
- Multi-agent diagnostic review panel powered by the **Candidate Scout**, **Print Planner**, **Metrology QC**, and **FAIR Curator** agents.
- Scientist sign-off interface with manual verdict overrides and audit logging.

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & Theme** | Tailwind CSS v4, Lucide React, Google Fonts (`Plus Jakarta Sans`, `JetBrains Mono`) |
| **Scientific Runtime** | Pyodide (Python 3.11 WebAssembly runtime for NumPy & SciPy) |
| **Server & APIs** | Node.js, Express, tsx |
| **AI Orchestration** | `@google/genai` TypeScript SDK (`gemini-3.8-flash`) |
| **Data Formats** | G-code (`.gcode`), Schema.org JSON-LD (`.jsonld`), CSV (`.csv`) |

---

## Getting Started

### Prerequisites
- Node.js (v20 or newer recommended)
- npm or bun

### Installation

1. Clone or download the repository to your environment:
   ```bash
   cd alloy-synth-hte
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for live Gemini API calls):
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY in .env if using live model generation
   ```

4. Start the full-stack development server:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

### Building for Production

Compile the client bundle and prepare the full-stack server:
```bash
npm run build
npm start
```

---

## File Structure

```
├── .env.example                  # Environment configuration template
├── index.html                    # Entry point with Google Fonts and Pyodide CDN
├── metadata.json                 # Applet metadata and Gemini server capabilities
├── package.json                  # Scripts and dependencies
├── server.ts                     # Full-stack Express server with Gemini agent routes
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build and Tailwind configuration
└── src/
    ├── App.tsx                   # Main state orchestrator and toast notifications
    ├── index.css                 # Tailwind CSS v4 theme tokens
    ├── main.tsx                  # React DOM mount
    ├── assets/
    │   └── images/               # High-fidelity lab instrument micrographs and photos
    ├── components/
    │   ├── AgentControlPanel.tsx # Multi-agent cockpit & human-in-the-loop gates
    │   ├── FairDatasetView.tsx   # FAIR catalogue, outcome filters & JSON-LD viewer
    │   ├── LibraryMatrixView.tsx # 8x8 wafer stage, multi-mode heatmaps & telemetry
    │   ├── MicroXRFStudio.tsx    # Micro-XRF raster mapping & 2048-channel EDS spectrum
    │   ├── Navigation.tsx        # 3-zone top navigation bar
    │   ├── PrinterStudio.tsx     # Nanoparticle printer digital twin & G-code viewer
    │   ├── PythonPipelineStudio.tsx # In-browser Python editor & terminal console
    │   ├── SEMStudio.tsx         # SEM secondary electron viewer & radial profiler
    │   └── SpotDetailDrawer.tsx  # Deep inspection slide-over drawer
    ├── data/
    │   └── defaultLibrary.ts     # 64-spot combinatorial Pt-Pd-Ni-Co dataset generator
    ├── services/
    │   ├── fairExporter.ts       # Schema.org JSON-LD, CSV and file downloads
    │   ├── gcodeCompiler.ts      # Multi-axis CNC G-code toolpath compiler
    │   ├── geminiAgents.ts       # Client-server agent bridge
    │   └── pythonRunner.ts       # Pyodide and deterministic scientific math engine
    └── types/
        └── materials.ts          # TypeScript domain contracts
```

---

## License

Distributed under the Apache 2.0 License.
