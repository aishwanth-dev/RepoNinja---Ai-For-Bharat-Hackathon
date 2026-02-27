import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Github, BookOpen, Sparkles, Code2, GitFork, Trash2, ArrowRight } from 'lucide-react';
import VanishInput from './VanishInput';

interface RecentRepo { url: string; name: string; timestamp: number; }
interface HomePageProps { onExplore: (url: string) => void; recentRepos: RecentRepo[]; onClearHistory: () => void; }

/* Rotating hero words */
const heroWords = [
    'codebase instantly',
    'repo deeply',
    'project fully',
    'architecture clearly',
    'logic visually',
];

function TypingHero() {
    const [wordIndex, setWordIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);

    const currentWord = heroWords[wordIndex];

    useEffect(() => {
        if (!deleting && charIndex < currentWord.length) {
            const t = setTimeout(() => setCharIndex(i => i + 1), 70);
            return () => clearTimeout(t);
        }
        if (!deleting && charIndex === currentWord.length) {
            const t = setTimeout(() => setDeleting(true), 2000);
            return () => clearTimeout(t);
        }
        if (deleting && charIndex > 0) {
            const t = setTimeout(() => setCharIndex(i => i - 1), 40);
            return () => clearTimeout(t);
        }
        if (deleting && charIndex === 0) {
            setDeleting(false);
            setWordIndex(i => (i + 1) % heroWords.length);
        }
    }, [charIndex, deleting, currentWord]);

    return (
        <span className="bg-gradient-to-r from-rn-primary via-rn-accent to-rn-primary-light bg-clip-text text-transparent">
            {currentWord.slice(0, charIndex)}
            <span className="animate-pulse text-rn-primary">|</span>
        </span>
    );
}

/* Tiles background */
function TilesBackground() {
    const cols = 30, rows = 20;
    return (
        <div className="absolute inset-0 z-0 flex flex-wrap overflow-hidden pointer-events-none select-none">
            {Array.from({ length: cols * rows }).map((_, i) => (
                <div key={i} className="w-[calc(100%/30)] aspect-square border-r border-b border-zinc-200/50 tile-hover pointer-events-auto"
                    style={{ transition: `background-color 0.8s ease ${Math.random() * 0.3}s` }} />
            ))}
        </div>
    );
}

/* Shimmer Explore button */
function ShimmerExploreBtn({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick}
            style={{ '--speed': '3s', '--bg': 'rgba(124, 58, 237, 1)' } as React.CSSProperties}
            className="group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 h-12 px-6 text-white [background:var(--bg)] rounded-lg transform-gpu transition-transform duration-200 active:translate-y-px shadow-md shadow-rn-primary/20 hover:shadow-lg hover:shadow-rn-primary/30 shrink-0">
            <div className="-z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]">
                <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1]">
                    <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-45deg),transparent_0,#ffffff_90deg,transparent_90deg)]" />
                </div>
            </div>
            <span className="relative flex items-center gap-2 text-sm font-bold tracking-tight">
                Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="absolute inset-0 rounded-lg shadow-[inset_0_-8px_10px_#ffffff1f] group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] transition-all duration-300" />
            <div className="absolute -z-20 [background:var(--bg)] rounded-lg [inset:0.05em]" />
        </button>
    );
}

export default function HomePage({ onExplore, recentRepos, onClearHistory }: HomePageProps) {
    const placeholders = [
        'https://github.com/facebook/react',
        'https://github.com/vercel/next.js',
        'https://github.com/expressjs/express',
        'Paste any GitHub repository URL...',
        'https://github.com/microsoft/vscode',
    ];

    return (
        <div className="h-screen w-screen overflow-y-auto bg-white relative">
            <TilesBackground />
            {/* Purple radial glow */}
            <div className="absolute inset-0 z-[1] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.06) 0%, transparent 60%), radial-gradient(circle at 30% 70%, rgba(147,51,234,0.04) 0%, transparent 50%)',
            }} />

            <div className="relative z-10">
                {/* Nav */}
                <nav className="flex items-center justify-between px-8 py-5">
                    <div className="flex items-center gap-2.5">
                        <img src="/ninja-logo.png" alt="RepoNinja" className="w-9 h-9 rounded-lg object-cover" />
                        <span className="font-black text-xl tracking-tight">
                            <span className="text-rn-dark">Repo</span><span className="text-rn-primary">Ninja</span>
                        </span>
                    </div>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-rn-text-muted hover:text-rn-text transition-colors">
                        <Github className="w-5 h-5" />
                    </a>
                </nav>

                {/* Hero */}
                <div className="max-w-3xl mx-auto px-6 pt-20 pb-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-rn-primary/6 border border-rn-primary/12 text-rn-primary text-xs font-bold mb-6">
                            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Code Explorer
                        </div>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
                        className="text-5xl sm:text-[3.5rem] font-black tracking-tight leading-[1.1] mb-5"
                        style={{ minHeight: '7.5rem' }}>
                        <span className="text-rn-dark">Understand any</span><br />
                        <TypingHero />
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
                        className="text-rn-text-dim text-lg font-medium max-w-md mx-auto mb-10 leading-relaxed">
                        Paste a GitHub URL and let AI guide you through the code with walkthroughs, explanations, and architecture diagrams.
                    </motion.p>

                    {/* Input */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}
                        className="mb-6">
                        <VanishInput placeholders={placeholders} onSubmit={onExplore} />
                    </motion.div>

                    {/* Feature cards */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.32 }}
                        className="flex flex-wrap justify-center gap-2.5 mb-20">
                        {[
                            { icon: BookOpen, text: 'Guided Walkthroughs' },
                            { icon: Code2, text: 'AI Explanations' },
                            { icon: GitFork, text: 'Architecture Flows' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-zinc-200 text-sm font-semibold text-rn-text-dim shadow-sm hover:shadow-md hover:border-rn-primary/20 transition-all">
                                <Icon className="w-4 h-4 text-rn-primary" /> {text}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Recent */}
                {recentRepos.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
                        className="max-w-xl mx-auto px-6 pb-20">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-extrabold text-rn-text-muted uppercase tracking-widest">Recent Learnings</h2>
                            <button onClick={onClearHistory} className="flex items-center gap-1 text-xs font-bold text-rn-text-muted hover:text-rn-danger transition-colors">
                                <Trash2 className="w-3 h-3" /> Clear
                            </button>
                        </div>
                        <div className="grid gap-1.5">
                            {recentRepos.map((repo) => (
                                <button key={repo.url + repo.timestamp} onClick={() => onExplore(repo.url)}
                                    className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-zinc-200 hover:border-rn-primary/25 hover:shadow-md transition-all group text-left">
                                    <div className="w-8 h-8 rounded-md gradient-subtle flex items-center justify-center shrink-0 border border-rn-primary/8">
                                        <Github className="w-3.5 h-3.5 text-rn-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-rn-dark truncate group-hover:text-rn-primary transition-colors">{repo.name}</p>
                                        <p className="text-xs text-rn-text-muted truncate font-medium">{repo.url}</p>
                                    </div>
                                    <span className="text-[10px] text-rn-text-muted font-medium shrink-0">{formatTimeAgo(repo.timestamp)}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-rn-text-muted group-hover:text-rn-primary transition-colors shrink-0" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="text-center pb-8">
                    <p className="text-xs text-rn-text-muted font-medium">
                        Built by <span className="font-bold text-rn-primary">TeamZypher</span> · Powered by Gemini AI
                    </p>
                </div>
            </div>
        </div>
    );
}

function formatTimeAgo(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}
