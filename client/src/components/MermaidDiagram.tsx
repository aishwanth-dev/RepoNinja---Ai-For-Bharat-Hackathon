import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

interface MermaidDiagramProps {
    chart: string;
}

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
        primaryColor: '#ede9fe',
        primaryTextColor: '#2d2d2d',
        primaryBorderColor: '#7c3aed',
        lineColor: '#8a8a8a',
        secondaryColor: '#f0ede8',
        tertiaryColor: '#f8f7f4',
        fontFamily: 'Inter, sans-serif',
    },
    flowchart: { curve: 'basis', padding: 20 },
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [svgHtml, setSvgHtml] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (!chart) return;
        const render = async () => {
            try {
                setError(null);
                const id = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, chart);
                setSvgHtml(svg);
            } catch (e: any) {
                setError(e.message || 'Failed to render diagram');
            }
        };
        render();
    }, [chart]);

    useEffect(() => {
        if (containerRef.current && svgHtml) {
            containerRef.current.innerHTML = svgHtml;
            const svgEl = containerRef.current.querySelector('svg');
            if (svgEl) { svgEl.style.maxWidth = '100%'; svgEl.style.height = 'auto'; }
        }
    }, [svgHtml]);

    useEffect(() => {
        if (popupRef.current && svgHtml && showPopup) {
            popupRef.current.innerHTML = svgHtml;
            const svgEl = popupRef.current.querySelector('svg');
            if (svgEl) {
                svgEl.style.maxWidth = '100%';
                svgEl.style.height = 'auto';
                svgEl.style.transform = `scale(${zoom})`;
                svgEl.style.transformOrigin = 'center center';
                svgEl.style.transition = 'transform 0.2s ease';
            }
        }
    }, [svgHtml, showPopup, zoom]);

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <p className="font-bold mb-1">Diagram Error</p>
                <p className="text-xs opacity-70 font-mono">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative">
                <div ref={containerRef} className="w-full flex items-center justify-center p-4 overflow-auto" />
                {svgHtml && (
                    <button
                        onClick={() => { setShowPopup(true); setZoom(1); }}
                        className="absolute top-2 right-2 p-2 bg-white border border-rn-border rounded-lg shadow-sm hover:shadow-md hover:border-rn-primary transition-all"
                        title="View fullscreen"
                    >
                        <Maximize2 className="w-4 h-4 text-rn-text-dim" />
                    </button>
                )}
            </div>

            {/* Fullscreen popup */}
            {showPopup && (
                <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-8"
                    onClick={() => setShowPopup(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[90vw] max-h-[90vh] overflow-auto relative p-8"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Controls */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                                className="p-2 bg-rn-surface-2 rounded-lg hover:bg-rn-surface-3 transition-all border border-rn-border">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-rn-text-muted min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                                className="p-2 bg-rn-surface-2 rounded-lg hover:bg-rn-surface-3 transition-all border border-rn-border">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowPopup(false)}
                                className="p-2 bg-rn-surface-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all border border-rn-border ml-2">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div ref={popupRef} className="min-w-[500px] min-h-[400px] flex items-center justify-center overflow-auto pt-8" />
                    </div>
                </div>
            )}
        </>
    );
}
