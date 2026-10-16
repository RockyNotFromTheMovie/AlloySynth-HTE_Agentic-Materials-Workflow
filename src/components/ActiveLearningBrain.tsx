import React, { useState } from 'react';
import { ExperimentRun, ApplicationDomain } from '../types/materials';
import { DOMAIN_PRESETS } from '../services/physicsSimulation';
import { geminiChemist } from '../services/geminiChemist';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingDown, 
  Send, 
  DollarSign, 
  Layers, 
  Award,
  Zap,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface ActiveLearningBrainProps {
  domain: ApplicationDomain;
  history: ExperimentRun[];
  currentRun: ExperimentRun | null;
  onSelectRun: (run: ExperimentRun) => void;
  onApplySuggestedParams: () => void;
  suggestedRationale?: string;
  isAutoPilotRunning: boolean;
}

export const ActiveLearningBrain: React.FC<ActiveLearningBrainProps> = ({
  domain,
  history,
  currentRun,
  onSelectRun,
  onApplySuggestedParams,
  suggestedRationale,
  isAutoPilotRunning
}) => {
  const preset = DOMAIN_PRESETS[domain];
  const [activeTab, setActiveTab] = useState<'pareto' | 'progression' | 'aiChat'>('pareto');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Autonomous Materials AI online. Monitoring closed-loop active learning for ${preset.name}. Ask me about crystal strain, d-band center shifts, or recipe tuning.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Send message to Gemini Chemist
  const handleSendMessage = async (customPrompt?: string) => {
    const q = customPrompt || chatInput;
    if (!q.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsAiThinking(true);

    try {
      const response = await geminiChemist.askChemist(q, history, domain);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Encountered unexpected communication error. Check network connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Pareto Frontier Plot Dimensions
  const svgWidth = 420;
  const svgHeight = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Extents
  const minCost = 0;
  const maxCost = Math.max(...history.map(h => h.estimatedCostPerGram), 35) * 1.15;
  const isMin = preset.goal === 'minimize';
  const minMetric = Math.min(...history.map(h => h.primaryMetricValue), preset.benchmarkValue * 0.4);
  const maxMetric = Math.max(...history.map(h => h.primaryMetricValue), preset.benchmarkValue * 1.4);

  const getParetoX = (cost: number) => padding.left + ((cost - minCost) / (maxCost - minCost)) * graphWidth;
  const getParetoY = (metric: number) => padding.top + graphHeight - ((metric - minMetric) / (maxMetric - minMetric)) * graphHeight;

  // Progression Line Path
  const getProgX = (index: number) => padding.left + (index / Math.max(1, history.length - 1)) * graphWidth;
  const progPathD = history.reduce((acc, run, idx) => {
    const x = getProgX(idx);
    const y = getParetoY(run.primaryMetricValue);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="flex flex-col h-full bg-[#0d1527] rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Autonomous MAP Brain
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Gaussian Process BO
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Bayesian Acquisition & Pareto Trade-Offs
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-md p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('pareto')}
            className={`px-2 py-1 rounded transition ${activeTab === 'pareto' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}
          >
            Pareto
          </button>
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-2 py-1 rounded transition ${activeTab === 'progression' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('aiChat')}
            className={`px-2 py-1 rounded transition ${activeTab === 'aiChat' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}
          >
            Chemist AI
          </button>
        </div>
      </div>

      {/* Suggested Experiment Callout Banner */}
      {suggestedRationale && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 mb-3 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-200 truncate">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Next Target: {suggestedRationale}</span>
          </div>
          <button
            onClick={onApplySuggestedParams}
            className="shrink-0 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-1 rounded text-[11px] transition"
          >
            Load Recipe
          </button>
        </div>
      )}

      {/* Main Visual Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'pareto' && (
          <div className="flex flex-col h-full">
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex justify-between">
              <span>Multi-Objective: Cost vs {preset.primaryMetric}</span>
              <span className="text-amber-400 font-semibold">★ Golden Stars = Pareto Optimal</span>
            </div>

            <div className="relative flex-1 bg-[#050811] rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full select-none">
                {/* Horizontal & Vertical grid */}
                {[0.25, 0.5, 0.75].map(pct => {
                  const y = padding.top + graphHeight * pct;
                  const x = padding.left + graphWidth * pct;
                  return (
                    <g key={pct}>
                      <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#1e293b" strokeDasharray="3 3" />
                    </g>
                  );
                })}

                {/* Benchmark threshold line */}
                <line
                  x1={padding.left}
                  y1={getParetoY(preset.benchmarkValue)}
                  x2={padding.left + graphWidth}
                  y2={getParetoY(preset.benchmarkValue)}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x={padding.left + graphWidth - 6}
                  y={getParetoY(preset.benchmarkValue) - 4}
                  fill="#f87171"
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  Commercial Benchmark ({preset.benchmarkValue}{preset.metricUnit})
                </text>

                {/* Experiment Points */}
                {history.map((run) => {
                  const x = getParetoX(run.estimatedCostPerGram);
                  const y = getParetoY(run.primaryMetricValue);
                  const isSelected = currentRun?.id === run.id;
                  const isPareto = run.isParetoOptimal;

                  return (
                    <g
                      key={run.id}
                      onClick={() => onSelectRun(run)}
                      className="cursor-pointer transition-transform hover:scale-125"
                    >
                      {isPareto && (
                        <circle
                          cx={x}
                          cy={y}
                          r="9"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={isPareto ? '#f59e0b' : (isSelected ? '#38bdf8' : '#64748b')}
                        stroke="#050811"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* Axis Labels */}
                <text
                  x={padding.left + graphWidth / 2}
                  y={svgHeight - 8}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  Precursor Cost ($/g)
                </text>

                <text
                  transform={`rotate(-90) translate(-${padding.top + graphHeight / 2}, 14)`}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {preset.primaryMetric} ({preset.metricUnit})
                </text>
              </svg>
            </div>
          </div>
        )}

        {activeTab === 'progression' && (
          <div className="flex flex-col h-full">
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex justify-between">
              <span>Optimization Convergence ({history.length} cycles)</span>
              <span className="text-emerald-400 font-semibold">Active Learning Trajectory</span>
            </div>

            <div className="relative flex-1 bg-[#050811] rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full select-none">
                {/* Benchmark line */}
                <line
                  x1={padding.left}
                  y1={getParetoY(preset.benchmarkValue)}
                  x2={padding.left + graphWidth}
                  y2={getParetoY(preset.benchmarkValue)}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />

                {/* Convergence Curve */}
                <path
                  d={progPathD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {history.map((run, idx) => {
                  const x = getProgX(idx);
                  const y = getParetoY(run.primaryMetricValue);
                  const isSelected = currentRun?.id === run.id;
                  return (
                    <circle
                      key={run.id}
                      cx={x}
                      cy={y}
                      r={isSelected ? 5 : 3}
                      fill={isSelected ? '#f59e0b' : '#38bdf8'}
                      stroke="#050811"
                      strokeWidth="1"
                      onClick={() => onSelectRun(run)}
                      className="cursor-pointer"
                    />
                  );
                })}

                <text
                  x={padding.left + graphWidth / 2}
                  y={svgHeight - 8}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  Experimental Cycles (Closed-Loop MAP)
                </text>
              </svg>
            </div>
          </div>
        )}

        {activeTab === 'aiChat' && (
          <div className="flex flex-col h-full">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {[
                'Explain (111) lattice strain',
                'How to get < 20 mV overpotential?',
                'Evaluate noble metal reduction %',
                'Explain d-band center shift'
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isAiThinking}
                  className="px-2 py-1 rounded bg-slate-900/90 text-slate-300 hover:text-sky-300 hover:bg-slate-800 border border-slate-700/60 text-[10px] font-mono whitespace-nowrap transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs font-mono leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-500/10 text-sky-200 border border-sky-500/30 ml-6'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold text-slate-400">
                      {msg.sender === 'user' ? 'Materials Engineer' : 'Autonomous Chemist AI'}
                    </span>
                    <span>{msg.time}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}

              {isAiThinking && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Consulting density functional theory & active learning surrogate...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask about strain, volcano curve, or synthesis..."
                className="flex-1 bg-slate-900 text-xs font-mono text-slate-200 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isAiThinking || !chatInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Sample Real-time Scientific Diagnosis */}
      {currentRun && activeTab !== 'aiChat' && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Sample {currentRun.id} Scientific Interpretation:
            </span>
            <span className="text-slate-500">{currentRun.morphology.dominantFacet} Facets</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
            {currentRun.notes}
          </p>
        </div>
      )}
    </div>
  );
};
