import { Play, GitFork, ChevronLeft } from 'lucide-react';

interface TopNavBarProps {
    onBack: () => void;
    onWalkthrough: () => void;
    onFlow: () => void;
    isLoading: boolean;
    hasRepo: boolean;
    walkthroughActive: boolean;
    flowActive: boolean;
    projectName: string;
}

export default function TopNavBar({
    onBack, onWalkthrough, onFlow, isLoading, hasRepo, walkthroughActive, flowActive, projectName,
}: TopNavBarProps) {
    return (
        <nav className="h-12 flex items-center px-3 z-50 bg-white border-b border-rn-border">
            {/* Left — back button */}
            <button onClick={onBack}
                className="flex items-center gap-1 text-sm font-bold text-rn-text-dim hover:text-rn-primary transition-colors mr-3 shrink-0 h-8 px-2 rounded-md hover:bg-rn-surface-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
            </button>

            {/* Center — project name */}
            <div className="flex-1 flex items-center justify-center min-w-0">
                {projectName ? (
                    <div className="flex items-center gap-2 max-w-md">
                        <img src="/ninja-logo.png" alt="RN" className="w-6 h-6 rounded-md object-cover" />
                        <span className="text-sm font-bold text-rn-dark truncate">{projectName}</span>
                    </div>
                ) : (
                    <span className="text-sm font-bold text-rn-text-muted">RepoNinja</span>
                )}
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-1.5 ml-3 shrink-0">
                <button onClick={onWalkthrough} disabled={!hasRepo || isLoading}
                    className={`h-8 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${walkthroughActive
                        ? 'bg-rn-success/10 text-rn-success border border-rn-success/20'
                        : 'bg-rn-surface-2 text-rn-text-dim border border-transparent hover:border-rn-border hover:text-rn-primary'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}>
                    <Play className="w-3 h-3" />
                    {walkthroughActive ? 'Stop' : 'Walkthrough'}
                </button>
                <button onClick={onFlow} disabled={!hasRepo || isLoading}
                    className={`h-8 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${flowActive
                        ? 'bg-rn-primary/10 text-rn-primary border border-rn-primary/20'
                        : 'bg-rn-surface-2 text-rn-text-dim border border-transparent hover:border-rn-border hover:text-rn-accent'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}>
                    <GitFork className="w-3 h-3" />
                    Flow
                </button>
            </div>
        </nav>
    );
}
