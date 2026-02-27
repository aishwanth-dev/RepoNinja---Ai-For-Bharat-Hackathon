import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, ArrowRight, HelpCircle, RotateCcw, Sparkles, User, X } from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';
import TextShimmer from './TextShimmer';
import type { WalkthroughState, ChatMessage, RepoSummary, FlowData } from '../types';
import * as api from '../services/api';

interface AIPanelProps {
    repoSummary: RepoSummary | null;
    explanation: string;
    explanationLoading: boolean;
    walkthroughState: WalkthroughState;
    onNextStep: () => void;
    onDoubt: () => void;
    onContinueWalkthrough: () => void;
    flowActive: boolean;
    onCloseFlow: () => void;
    owner: string;
    repo: string;
    currentFile: string;
    fileContent: string;
}

/* Soft, calm, chill robot buddy */
function ChillBot({ size = 28, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" className={className} fill="none">
            {/* Rounded body/head */}
            <rect x="6" y="8" width="28" height="24" rx="10" fill="url(#chillGrad)" />
            {/* Soft cheeks */}
            <circle cx="12" cy="23" r="3" fill="#e9d5ff" opacity="0.5" />
            <circle cx="28" cy="23" r="3" fill="#e9d5ff" opacity="0.5" />
            {/* Happy eyes — soft blink */}
            <g className="animate-bot-blink" style={{ transformOrigin: '15px 18px' }}>
                <circle cx="15" cy="18" r="2.5" fill="white" />
                <circle cx="15.3" cy="17.8" r="1.3" fill="#3f3f46" />
                {/* Eye sparkle */}
                <circle cx="16" cy="17" r="0.6" fill="white" opacity="0.9" />
            </g>
            <g className="animate-bot-blink" style={{ transformOrigin: '25px 18px', animationDelay: '0.2s' }}>
                <circle cx="25" cy="18" r="2.5" fill="white" />
                <circle cx="25.3" cy="17.8" r="1.3" fill="#3f3f46" />
                <circle cx="26" cy="17" r="0.6" fill="white" opacity="0.9" />
            </g>
            {/* Happy smile */}
            <path d="M16 24 Q20 27.5 24 24" stroke="#3f3f46" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Tiny antenna */}
            <line x1="20" y1="8" x2="20" y2="4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="3.5" r="1.5" fill="#a78bfa">
                <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* Soft glow around */}
            <rect x="6" y="8" width="28" height="24" rx="10" fill="none" stroke="#c4b5fd" strokeWidth="0.6" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="4s" repeatCount="indefinite" />
            </rect>
            <defs>
                <linearGradient id="chillGrad" x1="6" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function AIPanel({
    repoSummary, explanation, explanationLoading, walkthroughState,
    onNextStep, onDoubt, onContinueWalkthrough,
    flowActive, onCloseFlow, owner: _owner, repo: _repo, currentFile, fileContent,
}: AIPanelProps) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [flowData, setFlowData] = useState<FlowData | null>(null);
    const [flowLevel, setFlowLevel] = useState<'overview' | 'simple' | 'deep'>('overview');
    const [flowLoading, setFlowLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
    useEffect(() => { if (flowActive && repoSummary) loadFlow(flowLevel); }, [flowActive, flowLevel]);

    const loadFlow = async (level: string) => {
        setFlowLoading(true);
        try { const data = await api.generateFlow(repoSummary, level); setFlowData(data); }
        catch (e) { console.error('Flow error:', e); }
        finally { setFlowLoading(false); }
    };

    const handleChat = async () => {
        if (!chatInput.trim() || chatLoading) return;
        const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
        const msgs = [...chatMessages, userMsg];
        setChatMessages(msgs); setChatInput(''); setChatLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = '42px';
        try {
            const ctx: Record<string, unknown> = { repoSummary: repoSummary?.summary || '', currentFile, fileContent: fileContent?.substring(0, 4000) || '' };
            if (walkthroughState.doubt && walkthroughState.steps[walkthroughState.currentStep]) {
                const step = walkthroughState.steps[walkthroughState.currentStep];
                ctx.doubtContext = `Studying "${step.file}" lines ${step.startLine}-${step.endLine}, topic: "${step.title}"`;
            }
            const { response } = await api.chatWithAI(msgs, ctx);
            setChatMessages([...msgs, { role: 'assistant', content: response }]);
        } catch { setChatMessages([...msgs, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]); }
        finally { setChatLoading(false); }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setChatInput(e.target.value);
        const el = e.target;
        el.style.height = '42px';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
    };

    // === FLOW MODE ===
    if (flowActive) {
        return (
            <div className="h-full flex flex-col bg-white border-l border-rn-border">
                <div className="h-12 flex items-center px-3 border-b border-rn-border shrink-0 justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-rn-primary" />
                        <span className="text-xs font-bold text-rn-text-dim">Architecture Flow</span>
                    </div>
                    <button onClick={onCloseFlow} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-rn-surface-2 text-rn-text-muted hover:text-rn-danger transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex border-b border-rn-border shrink-0">
                    {(['overview', 'simple', 'deep'] as const).map(l => (
                        <button key={l} onClick={() => setFlowLevel(l)}
                            className={`flex-1 py-2.5 text-xs font-bold capitalize transition-all ${flowLevel === l ? 'text-rn-primary border-b-2 border-rn-primary bg-rn-primary/4' : 'text-rn-text-muted hover:text-rn-text hover:bg-rn-surface-2'}`}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-auto p-4">
                    {flowLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <ChillBot size={44} className="animate-float" />
                            <TextShimmer className="font-mono text-sm font-semibold" duration={1.5}>Generating architecture diagram...</TextShimmer>
                        </div>
                    ) : flowData?.mermaid ? (
                        <MermaidDiagram chart={flowData.mermaid} />
                    ) : <div className="text-center text-rn-text-muted text-sm font-medium pt-8">Select a level above to generate.</div>}
                </div>
            </div>
        );
    }

    // === MAIN ===
    const step = walkthroughState.active ? walkthroughState.steps[walkthroughState.currentStep] : null;

    return (
        <div className="h-full flex flex-col bg-white border-l border-rn-border">
            <div className="h-12 flex items-center px-3 border-b border-rn-border shrink-0 gap-2">
                <ChillBot size={26} />
                <span className="text-xs font-bold text-rn-text-dim">AI Assistant</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Walkthrough step */}
                {walkthroughState.active && step && !walkthroughState.doubt && (
                    <div className="p-4 border-b border-rn-border gradient-subtle animate-slide-in">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold text-rn-primary uppercase tracking-widest">Walkthrough</span>
                            <span className="text-xs font-mono font-bold text-rn-text-muted">{walkthroughState.currentStep + 1}/{walkthroughState.steps.length}</span>
                        </div>
                        <div className="h-1 bg-rn-surface-2 rounded-full mb-3 overflow-hidden">
                            <div className="h-full gradient-primary rounded-full transition-all duration-500"
                                style={{ width: `${((walkthroughState.currentStep + 1) / walkthroughState.steps.length) * 100}%` }} />
                        </div>
                        <h3 className="text-sm font-bold text-rn-dark mb-1">{step.title}</h3>
                        <p className="text-xs text-rn-text-muted font-mono">{step.file} (L{step.startLine}–{step.endLine})</p>
                    </div>
                )}

                {walkthroughState.active && step && !walkthroughState.doubt && (
                    <div className="p-4 border-b border-rn-border">
                        <div className="ai-markdown text-sm"><ReactMarkdown>{step.explanation}</ReactMarkdown></div>
                    </div>
                )}

                {walkthroughState.active && !walkthroughState.doubt && (
                    <div className="p-3 border-b border-rn-border flex flex-wrap gap-2">
                        <button onClick={onNextStep} disabled={walkthroughState.currentStep >= walkthroughState.steps.length - 1}
                            className="flex-1 h-8 gradient-primary text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rn-primary/20">
                            Next Step <ArrowRight className="w-3 h-3" />
                        </button>
                        <button onClick={onDoubt}
                            className="h-8 px-3.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-md hover:bg-amber-100 transition-all flex items-center gap-1.5">
                            <HelpCircle className="w-3 h-3" /> I Have Doubts
                        </button>
                    </div>
                )}

                {/* Doubt */}
                {walkthroughState.active && walkthroughState.doubt && step && (
                    <div className="p-4 border-b border-rn-border">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Doubt Mode</span>
                            </div>
                            <div className="text-xs text-amber-800 space-y-0.5 font-medium">
                                <p>📄 <strong>{step.file}</strong></p>
                                <p>📍 Lines {step.startLine}–{step.endLine}</p>
                                <p>📚 <em>{step.title}</em></p>
                            </div>
                        </div>
                        <button onClick={onContinueWalkthrough}
                            className="w-full h-8 gradient-primary text-white text-xs font-bold rounded-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rn-primary/20">
                            <RotateCcw className="w-3 h-3" /> Continue Walkthrough
                        </button>
                    </div>
                )}

                {/* Summary */}
                {repoSummary && !walkthroughState.active && !explanation && !explanationLoading && (
                    <div className="p-4 border-b border-rn-border animate-slide-in">
                        <h3 className="text-[10px] font-extrabold text-rn-primary uppercase tracking-widest mb-3">Repository Summary</h3>
                        <div className="ai-markdown text-sm">
                            <p>{repoSummary.summary}</p>
                            <h3>Tech Stack</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
                                {repoSummary.techStack.map(t => (
                                    <span key={t} className="px-2 py-0.5 bg-rn-primary/6 text-rn-primary rounded-md text-[11px] font-bold border border-rn-primary/12">{t}</span>
                                ))}
                            </div>
                            <h3>Architecture</h3><p>{repoSummary.architecture}</p>
                            <h3>Key Features</h3><ul>{repoSummary.keyFeatures.map(f => <li key={f}>{f}</li>)}</ul>
                        </div>
                    </div>
                )}

                {/* Explanation */}
                {(explanation || explanationLoading) && !walkthroughState.active && (
                    <div className="p-4 border-b border-rn-border animate-slide-in">
                        <h3 className="text-[10px] font-extrabold text-rn-accent uppercase tracking-widest mb-3">AI Explanation</h3>
                        {explanationLoading ? (
                            <div className="space-y-3">
                                <TextShimmer className="font-mono text-sm font-semibold" duration={1.2}>Analyzing code...</TextShimmer>
                                <div className="space-y-2">{[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-3 bg-rn-surface-2 rounded-md animate-pulse-soft" style={{ width: `${88 - i * 10}%`, animationDelay: `${i * 0.15}s` }} />
                                ))}</div>
                            </div>
                        ) : (
                            <div className="ai-markdown text-sm"><ReactMarkdown>{explanation}</ReactMarkdown></div>
                        )}
                    </div>
                )}

                {/* Chat */}
                {chatMessages.length > 0 && (
                    <div className="p-4 space-y-3">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'gradient-header' : ''}`}>
                                    {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <ChillBot size={24} />}
                                </div>
                                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-rn-dark text-white' : 'bg-rn-surface-2 text-rn-text border border-rn-border'}`}>
                                    <div className="ai-markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex gap-2">
                                <ChillBot size={24} />
                                <div className="bg-rn-surface-2 border border-rn-border rounded-lg px-3 py-2">
                                    <TextShimmer className="font-mono text-xs font-semibold" duration={1}>Thinking...</TextShimmer>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* Empty */}
                {!repoSummary && !explanation && !explanationLoading && chatMessages.length === 0 && !walkthroughState.active && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4 py-20">
                        <ChillBot size={56} className="animate-float" />
                        <div>
                            <p className="text-sm text-rn-dark font-bold mb-1">AI Assistant</p>
                            <p className="text-xs text-rn-text-muted font-medium leading-relaxed max-w-[200px]">
                                Analyze a repository to get AI insights, walkthroughs, and architecture diagrams.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Multiline chat input */}
            <div className="p-3 border-t border-rn-border shrink-0 bg-rn-bg">
                <div className="rounded-lg border border-rn-border bg-white focus-within:border-rn-primary focus-within:ring-1 focus-within:ring-rn-primary/20 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={handleTextareaInput}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={walkthroughState.doubt ? 'Ask about this code section...' : 'Ask about the code...'}
                        rows={1}
                        className="w-full px-3 pt-2.5 pb-1 bg-transparent text-sm text-rn-text font-medium placeholder:text-rn-text-muted focus:outline-none resize-none"
                        style={{ minHeight: '42px', maxHeight: '160px' }}
                    />
                    <div className="flex items-center justify-end px-2 pb-2">
                        <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                            className="h-7 px-3 flex items-center gap-1.5 gradient-primary text-white rounded-md text-xs font-bold hover:opacity-90 disabled:opacity-30 transition-all shadow-sm shadow-rn-primary/15">
                            Send <Send className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
