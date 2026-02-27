import { useState } from 'react';
import { ChevronRight, Folder, FileText, FileCode, FileJson, FileType, File } from 'lucide-react';
import type { FileNode } from '../types';

interface FileExplorerProps {
    tree: FileNode[];
    onFileSelect: (node: FileNode) => void;
    onFolderSelect: (node: FileNode) => void;
    selectedPath: string;
}

function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, { icon: typeof FileText; color: string }> = {
        ts: { icon: FileCode, color: 'text-blue-600' },
        tsx: { icon: FileCode, color: 'text-blue-500' },
        js: { icon: FileCode, color: 'text-yellow-600' },
        jsx: { icon: FileCode, color: 'text-yellow-500' },
        json: { icon: FileJson, color: 'text-orange-500' },
        md: { icon: FileType, color: 'text-gray-500' },
        css: { icon: FileText, color: 'text-pink-500' },
        html: { icon: FileText, color: 'text-red-500' },
        py: { icon: FileCode, color: 'text-green-600' },
        rs: { icon: FileCode, color: 'text-orange-600' },
        go: { icon: FileCode, color: 'text-cyan-600' },
    };
    const config = iconMap[ext] || { icon: File, color: 'text-rn-text-muted' };
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color} shrink-0`} />;
}

function TreeNode({
    node, depth, onFileSelect, onFolderSelect, selectedPath,
}: {
    node: FileNode; depth: number;
    onFileSelect: (n: FileNode) => void;
    onFolderSelect: (n: FileNode) => void;
    selectedPath: string;
}) {
    const [expanded, setExpanded] = useState(depth < 1);
    const isSelected = node.path === selectedPath;
    const isFolder = node.type === 'folder';

    const handleClick = () => {
        if (isFolder) { setExpanded(!expanded); onFolderSelect(node); }
        else onFileSelect(node);
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-1.5 py-[5px] pr-2 text-left text-[13px] font-medium transition-colors group ${isSelected
                        ? 'bg-rn-primary/8 text-rn-primary border-r-2 border-rn-primary'
                        : 'text-rn-text-dim hover:bg-rn-surface-2'
                    }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {isFolder ? (
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-rn-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                {isFolder ? <Folder className="w-4 h-4 text-rn-warning shrink-0" /> : getFileIcon(node.name)}
                <span className="truncate group-hover:text-rn-text">{node.name}</span>
            </button>
            {isFolder && expanded && node.children && (
                <div>
                    {[...node.children]
                        .sort((a, b) => {
                            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                            return a.name.localeCompare(b.name);
                        })
                        .map((child) => (
                            <TreeNode key={child.path} node={child} depth={depth + 1}
                                onFileSelect={onFileSelect} onFolderSelect={onFolderSelect} selectedPath={selectedPath} />
                        ))}
                </div>
            )}
        </div>
    );
}

export default function FileExplorer({ tree, onFileSelect, onFolderSelect, selectedPath }: FileExplorerProps) {
    return (
        <div className="h-full flex flex-col bg-white border-r border-rn-border">
            <div className="h-10 flex items-center px-3 border-b border-rn-border shrink-0">
                <span className="text-xs font-extrabold text-rn-text-muted uppercase tracking-widest">Explorer</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
                {tree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-rn-text-muted text-sm px-6 text-center gap-3">
                        <Folder className="w-12 h-12 opacity-20" />
                        <p className="font-medium">Paste a GitHub URL<br />and click Analyze</p>
                    </div>
                ) : (
                    tree.sort((a, b) => {
                        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                        return a.name.localeCompare(b.name);
                    }).map((node) => (
                        <TreeNode key={node.path} node={node} depth={0}
                            onFileSelect={onFileSelect} onFolderSelect={onFolderSelect} selectedPath={selectedPath} />
                    ))
                )}
            </div>
        </div>
    );
}
