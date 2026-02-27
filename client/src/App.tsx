import { useState, useCallback, useRef, useEffect } from 'react';
import HomePage from './components/HomePage';
import TopNavBar from './components/TopNavBar';
import FileExplorer from './components/FileExplorer';
import CodeViewer from './components/CodeViewer';
import AIPanel from './components/AIPanel';
import TextShimmer from './components/TextShimmer';
import type { RepoData, FileNode, WalkthroughState } from './types';
import * as api from './services/api';

const CACHE_PREFIX = 'rn_cache_';
const RECENT_KEY = 'rn_recent_repos';

interface RecentRepo { url: string; name: string; timestamp: number; }
function getRecentRepos(): RecentRepo[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
function saveRecentRepo(url: string) {
  const repos = getRecentRepos();
  const name = url.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const filtered = repos.filter(r => r.url !== url);
  filtered.unshift({ url, name, timestamp: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 10)));
}
function clearRecentRepos() { localStorage.removeItem(RECENT_KEY); }
function getCachedExplanation(o: string, r: string, p: string) {
  try { const c = localStorage.getItem(`${CACHE_PREFIX}${o}_${r}_${p}`); return c ? JSON.parse(c) as { explanation: string; content: string } : null; } catch { return null; }
}
function setCachedExplanation(o: string, r: string, p: string, d: { explanation: string; content: string }) {
  try { localStorage.setItem(`${CACHE_PREFIX}${o}_${r}_${p}`, JSON.stringify(d)); } catch { }
}

export default function App() {
  const [page, setPage] = useState<'home' | 'workspace'>('home');
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>(getRecentRepos());

  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [highlightLines, setHighlightLines] = useState<{ start: number; end: number } | null>(null);
  const [explanation, setExplanation] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [walkthroughState, setWalkthroughState] = useState<WalkthroughState>({ active: false, steps: [], currentStep: 0, doubt: false });
  const [walkthroughLoading, setWalkthroughLoading] = useState(false);
  const [flowActive, setFlowActive] = useState(false);

  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(340);
  const resizingRef = useRef<'left' | 'right' | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = (panel: 'left' | 'right') => (e: React.MouseEvent) => {
    resizingRef.current = panel; startXRef.current = e.clientX;
    startWidthRef.current = panel === 'left' ? leftWidth : rightWidth;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!resizingRef.current) return; const d = e.clientX - startXRef.current;
      if (resizingRef.current === 'left') setLeftWidth(Math.max(180, Math.min(450, startWidthRef.current + d)));
      else setRightWidth(Math.max(280, Math.min(550, startWidthRef.current - d)));
    };
    const up = () => { resizingRef.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  // Project name
  const projectName = repoData ? `${repoData.owner}/${repoData.repo}` : '';

  const handleAnalyze = useCallback(async (url: string) => {
    setPage('workspace'); setIsAnalyzing(true); setAnalyzeError(null); setRepoData(null); setSelectedFile(''); setFileContent('');
    setExplanation(''); setWalkthroughState({ active: false, steps: [], currentStep: 0, doubt: false }); setFlowActive(false); setHighlightLines(null);
    saveRecentRepo(url); setRecentRepos(getRecentRepos());
    try { const data = await api.analyzeRepo(url); setRepoData(data); }
    catch (err: any) { setAnalyzeError(err.message); } finally { setIsAnalyzing(false); }
  }, []);

  const handleBack = useCallback(() => { setPage('home'); }, []);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (!repoData) return; setSelectedFile(node.path); setHighlightLines(null); setFlowActive(false);
    const cached = getCachedExplanation(repoData.owner, repoData.repo, node.path);
    if (cached) { setFileContent(cached.content); setExplanation(cached.explanation); setExplanationLoading(false); return; }
    setExplanationLoading(true); setFileLoading(true);
    try {
      const { explanation: exp, content } = await api.explainFile(repoData.owner, repoData.repo, node.path, repoData.summary.summary);
      setFileContent(content); setExplanation(exp); setCachedExplanation(repoData.owner, repoData.repo, node.path, { explanation: exp, content });
    } catch { setExplanation('Failed to load explanation.'); } finally { setExplanationLoading(false); setFileLoading(false); }
  }, [repoData]);

  const handleFolderSelect = useCallback(async (node: FileNode) => {
    if (!repoData) return; setExplanationLoading(true);
    try {
      const children = node.children?.map(c => c.name) || [];
      const { explanation: exp } = await api.explainFolder(node.path, children, repoData.summary.summary); setExplanation(exp);
    } catch { setExplanation('Failed to load folder explanation.'); } finally { setExplanationLoading(false); }
  }, [repoData]);

  const handleWalkthrough = useCallback(async () => {
    if (!repoData) return;
    if (walkthroughState.active) { setWalkthroughState({ active: false, steps: [], currentStep: 0, doubt: false }); setHighlightLines(null); return; }
    setWalkthroughLoading(true);
    try {
      const { steps } = await api.generateWalkthrough(repoData.summary, repoData.tree, repoData.owner, repoData.repo);
      setWalkthroughState({ active: true, steps, currentStep: 0, doubt: false }); setFlowActive(false);
      if (steps.length > 0) await loadStep(steps[0]);
    } catch (err) { console.error('Walkthrough error:', err); } finally { setWalkthroughLoading(false); }
  }, [repoData, walkthroughState.active]);

  const loadStep = async (step: typeof walkthroughState.steps[0]) => {
    if (!repoData) return; setSelectedFile(step.file); setHighlightLines({ start: step.startLine, end: step.endLine });
    const cached = getCachedExplanation(repoData.owner, repoData.repo, step.file);
    if (cached) { setFileContent(cached.content); return; }
    setFileLoading(true);
    try {
      const { content, explanation: exp } = await api.explainFile(repoData.owner, repoData.repo, step.file, repoData.summary.summary);
      setFileContent(content); setCachedExplanation(repoData.owner, repoData.repo, step.file, { explanation: exp, content });
    } catch { setFileContent('// Failed to load file content'); } finally { setFileLoading(false); }
  };

  const handleNextStep = useCallback(async () => {
    const nx = walkthroughState.currentStep + 1; if (nx >= walkthroughState.steps.length) return;
    setWalkthroughState(p => ({ ...p, currentStep: nx, doubt: false })); await loadStep(walkthroughState.steps[nx]);
  }, [walkthroughState, repoData]);

  const handleDoubt = useCallback(() => setWalkthroughState(p => ({ ...p, doubt: true })), []);
  const handleContinue = useCallback(() => setWalkthroughState(p => ({ ...p, doubt: false })), []);
  const handleFlow = useCallback(() => setFlowActive(p => !p), []);
  const handleCloseFlow = useCallback(() => setFlowActive(false), []);

  if (page === 'home') return <HomePage onExplore={handleAnalyze} recentRepos={recentRepos} onClearHistory={() => { clearRecentRepos(); setRecentRepos([]); }} />;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-rn-bg">
      <TopNavBar onBack={handleBack} onWalkthrough={handleWalkthrough} onFlow={handleFlow}
        isLoading={isAnalyzing || walkthroughLoading} hasRepo={!!repoData}
        walkthroughActive={walkthroughState.active} flowActive={flowActive} projectName={projectName} />

      {(isAnalyzing || walkthroughLoading) && (
        <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-xl shadow-rn-primary/25 animate-glow">
            <span className="text-xl font-black text-white">RN</span>
          </div>
          <TextShimmer className="text-base font-bold" duration={1.5}>
            {walkthroughLoading ? 'Generating walkthrough...' : 'Analyzing repository...'}
          </TextShimmer>
          <p className="text-rn-text-muted text-sm font-medium">This may take a moment</p>
        </div>
      )}

      {analyzeError && (
        <div className="mx-3 mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
          <span className="font-bold">Error:</span> {analyzeError}
          <button onClick={() => setAnalyzeError(null)} className="ml-auto hover:text-red-800 font-bold text-lg">×</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div style={{ width: leftWidth }} className="shrink-0">
          <FileExplorer tree={repoData?.tree || []} onFileSelect={handleFileSelect} onFolderSelect={handleFolderSelect} selectedPath={selectedFile} />
        </div>
        <div className="resize-handle" onMouseDown={handleResizeStart('left')} />
        <div className="flex-1 min-w-0">
          <CodeViewer filePath={selectedFile} content={fileContent} highlightLines={highlightLines} loading={fileLoading} />
        </div>
        <div className="resize-handle" onMouseDown={handleResizeStart('right')} />
        <div style={{ width: rightWidth }} className="shrink-0">
          <AIPanel repoSummary={repoData?.summary || null} explanation={explanation} explanationLoading={explanationLoading}
            walkthroughState={walkthroughState} onNextStep={handleNextStep} onDoubt={handleDoubt}
            onContinueWalkthrough={handleContinue} flowActive={flowActive} onCloseFlow={handleCloseFlow}
            owner={repoData?.owner || ''} repo={repoData?.repo || ''} currentFile={selectedFile} fileContent={fileContent} />
        </div>
      </div>
    </div>
  );
}
