import { useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { FileCode } from 'lucide-react';
import TextShimmer from './TextShimmer';

interface CodeViewerProps {
    filePath: string;
    content: string;
    highlightLines?: { start: number; end: number } | null;
    loading?: boolean;
}

function getLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        py: 'python', json: 'json', md: 'markdown', css: 'css', scss: 'scss',
        html: 'html', htm: 'html', xml: 'xml', svg: 'xml', yaml: 'yaml', yml: 'yaml',
        rs: 'rust', go: 'go', java: 'java', rb: 'ruby', php: 'php', sh: 'shell',
        sql: 'sql', c: 'c', h: 'c', cpp: 'cpp', cs: 'csharp', swift: 'swift', kt: 'kotlin',
        toml: 'ini', dockerfile: 'dockerfile',
    };
    return map[ext] || 'plaintext';
}

export default function CodeViewer({ filePath, content, highlightLines, loading }: CodeViewerProps) {
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<any>([]);

    const handleMount: OnMount = (editor) => { editorRef.current = editor; };

    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        if (highlightLines) {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
                range: {
                    startLineNumber: highlightLines.start, startColumn: 1,
                    endLineNumber: highlightLines.end, endColumn: 1,
                },
                options: { isWholeLine: true, className: 'highlighted-line', glyphMarginClassName: 'highlighted-glyph' },
            }]);
            editor.revealLineInCenter(highlightLines.start);
        } else {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        }
    }, [highlightLines]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-rn-bg gap-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-glow">
                    <FileCode className="w-5 h-5 text-white" />
                </div>
                <TextShimmer className="font-mono text-sm font-semibold" duration={1.5}>
                    Loading file content...
                </TextShimmer>
            </div>
        );
    }

    if (!content && !filePath) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-rn-bg text-rn-text-muted gap-3">
                <FileCode className="w-14 h-14 opacity-15" />
                <p className="text-sm font-bold">Select a file to view its code</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-rn-bg">
            <div className="h-10 flex items-center px-3 bg-white border-b border-rn-border shrink-0 gap-2">
                <FileCode className="w-3.5 h-3.5 text-rn-primary shrink-0" />
                <span className="text-xs text-rn-text-dim font-mono font-semibold truncate">{filePath}</span>
            </div>
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={getLanguage(filePath)}
                    value={content}
                    theme="vs"
                    onMount={handleMount}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineHeight: 20,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: 'none',
                        padding: { top: 8 },
                        wordWrap: 'on',
                        smoothScrolling: true,
                        glyphMargin: true,
                    }}
                />
            </div>
        </div>
    );
}
