
import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Download, Loader2, CheckCircle2, AlertCircle,
  Layers, Zap, ZapOff, LayoutGrid, RefreshCw, Info
} from 'lucide-react';
import { PLATFORMS, PLATFORM_CATEGORIES } from './constants';
import { Platform, ProcessState } from './types';
import { processImage } from './imageProcessor';

// ── Ratio-difficulty badge ────────────────────────────────────────────────────

function getRatioDifficulty(src: { w: number; h: number } | null, p: Platform) {
  if (!src) return null;
  const sr = src.w / src.h;
  const tr = p.width / p.height;
  const f = Math.max(sr, tr) / Math.min(sr, tr);
  if (f < 1.35) return { label: '相似', color: 'text-green-600 bg-green-50' };
  if (f < 2.0)  return { label: '中等', color: 'text-yellow-600 bg-yellow-50' };
  return { label: '差異大', color: 'text-red-600 bg-red-50' };
}

// ── Ratio preview thumbnail ───────────────────────────────────────────────────

function RatioBox({ w, h, active }: { w: number; h: number; active: boolean }) {
  const maxSide = 44;
  const landscape = w >= h;
  const boxW = landscape ? maxSide : Math.round(maxSide * (w / h));
  const boxH = landscape ? Math.round(maxSide * (h / w)) : maxSide;
  return (
    <div
      className={`rounded transition-colors ${active ? 'bg-blue-200 border-blue-400' : 'bg-gray-100 border-gray-300'} border`}
      style={{ width: boxW, height: boxH }}
    />
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [processState, setProcessState] = useState<ProcessState>({ status: 'idle', message: '' });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setProcessState({ status: 'error', message: '請上傳 JPG、PNG 或 WEBP 格式的圖片' });
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setSrcDims({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.src = url;

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setProcessState({ status: 'idle', message: '' });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Processing ─────────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (!file || !selectedPlatform) return;
    setResultUrl(null);
    setProcessState({ status: 'processing', message: '準備中...' });

    try {
      const result = await processImage(
        file,
        selectedPlatform.width,
        selectedPlatform.height,
        {
          useAI,
          onProgress: (msg) => setProcessState({ status: 'processing', message: msg }),
        }
      );
      setResultUrl(result);
      setProcessState({ status: 'done', message: '處理完成！圖片已準備好下載。' });
    } catch (err: any) {
      setProcessState({ status: 'error', message: `處理失敗：${err.message ?? '未知錯誤'}` });
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !selectedPlatform) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `banner_${selectedPlatform.id}_${selectedPlatform.width}x${selectedPlatform.height}.png`;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setSrcDims(null);
    setSelectedPlatform(null);
    setResultUrl(null);
    setProcessState({ status: 'idle', message: '' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isProcessing = processState.status === 'processing';
  const canProcess = !!file && !!selectedPlatform && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-100">
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Banner 縮圖全平台適配工具</h1>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5">智慧適配廣告素材至各平台尺寸</p>
            </div>
          </div>
          {(file || resultUrl) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <RefreshCw size={14} /> 重新開始
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── Step 1: Upload ── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <StepBadge n={1} done={!!file} />
            <h2 className="font-bold text-gray-800">上傳圖片</h2>
            {srcDims && (
              <span className="ml-auto text-xs text-gray-400 font-mono">
                {srcDims.w} × {srcDims.h} px
              </span>
            )}
          </div>

          <div className="p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${isDragging ? 'border-blue-400 bg-blue-50 scale-[1.01]' :
                  file ? 'border-blue-300 bg-blue-50/40' :
                  'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="flex items-center gap-5 p-5">
                  <img
                    src={previewUrl}
                    alt="預覽"
                    className="h-28 w-28 object-contain rounded-lg border border-gray-200 bg-white shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{file?.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {srcDims ? `${srcDims.w} × ${srcDims.h} px・` : ''}
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      移除，重新上傳
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 px-6 text-center">
                  <div className="bg-gray-100 p-4 rounded-full text-gray-400 mb-4">
                    <Upload size={30} />
                  </div>
                  <p className="font-bold text-gray-700 text-base">拖曳圖片至此，或點擊上傳</p>
                  <p className="text-sm text-gray-400 mt-1">支援 JPG、PNG、WEBP</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Step 2: Platform selection ── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <StepBadge n={2} done={!!selectedPlatform} />
            <h2 className="font-bold text-gray-800">選擇目標平台</h2>
            {selectedPlatform && (
              <span className="ml-auto text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {selectedPlatform.width} × {selectedPlatform.height} px
              </span>
            )}
          </div>

          <div className="p-6 space-y-7">
            {PLATFORM_CATEGORIES.map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid size={14} className="text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {PLATFORMS.filter(p => p.category === cat).map(p => {
                    const active = selectedPlatform?.id === p.id;
                    const diff = getRatioDifficulty(srcDims, p);
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPlatform(p); setResultUrl(null); }}
                        className={`
                          relative p-3 rounded-xl border-2 text-left transition-all
                          ${active
                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex justify-center mb-2.5">
                          <RatioBox w={p.width} h={p.height} active={active} />
                        </div>
                        <p className={`text-sm font-bold leading-tight ${active ? 'text-blue-700' : 'text-gray-800'}`}>
                          {p.name}
                        </p>
                        <p className={`text-[11px] mt-0.5 font-mono ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                          {p.width}×{p.height}{p.note ? ` (${p.note})` : ''}
                        </p>
                        {srcDims && diff && (
                          <span className={`mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${diff.color}`}>
                            {diff.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Difficulty legend */}
            {srcDims && (
              <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold text-green-600">相似</span>：比例接近，品質佳
                  <span className="font-bold text-yellow-600">中等</span>：適度差異，啟用 AI 模式效果更好
                  <span className="font-bold text-red-600">差異大</span>：比例差距大，強烈建議開啟 AI 模式
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Step 3: Process ── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <StepBadge n={3} done={processState.status === 'done'} />
            <h2 className="font-bold text-gray-800">處理與下載</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* AI toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useAI ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>
                  {useAI ? <Zap size={18} /> : <ZapOff size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">AI 智慧構圖模式</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {useAI
                      ? '比例差異 ≥ 1.5× 時自動啟用 Gemini 重新排版'
                      : '僅使用智慧裁切縮放（速度快，不消耗 API）'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUseAI(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${useAI ? 'bg-blue-500' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={useAI}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${useAI ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* Process button */}
            <div className="flex justify-center">
              <button
                onClick={handleProcess}
                disabled={!canProcess}
                className={`
                  px-10 py-4 rounded-xl font-bold text-base flex items-center gap-2.5 transition-all
                  ${canProcess
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                {isProcessing
                  ? <><Loader2 size={20} className="animate-spin" />處理中...</>
                  : <><Zap size={20} />開始適配</>}
              </button>
            </div>

            {/* Status bar */}
            {processState.status !== 'idle' && (
              <StatusBar state={processState} />
            )}

            {/* Result */}
            {resultUrl && selectedPlatform && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PreviewCard
                    label="原始圖片"
                    sub={srcDims ? `${srcDims.w} × ${srcDims.h} px` : ''}
                    url={previewUrl!}
                    accent={false}
                  />
                  <PreviewCard
                    label={`適配結果：${selectedPlatform.name}`}
                    sub={`${selectedPlatform.width} × ${selectedPlatform.height} px`}
                    url={resultUrl}
                    accent
                  />
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleDownload}
                    className="px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                  >
                    <Download size={18} />
                    下載圖片（{selectedPlatform.width}×{selectedPlatform.height} px）
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center text-xs text-gray-300 pb-6">
        Banner 縮圖全平台適配工具 · 智慧裁切 + Gemini AI 排版
      </footer>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${done ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
      {done ? <CheckCircle2 size={16} /> : n}
    </span>
  );
}

function StatusBar({ state }: { state: ProcessState }) {
  const styles: Record<string, string> = {
    processing: 'bg-blue-50 border-blue-200 text-blue-700',
    done:       'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:      'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${styles[state.status] ?? ''}`}>
      {state.status === 'processing' && <Loader2 size={18} className="animate-spin flex-shrink-0" />}
      {state.status === 'done'       && <CheckCircle2 size={18} className="flex-shrink-0" />}
      {state.status === 'error'      && <AlertCircle size={18} className="flex-shrink-0" />}
      <span className="text-sm font-medium">{state.message}</span>
    </div>
  );
}

function PreviewCard({ label, sub, url, accent }: {
  label: string; sub: string; url: string; accent: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 overflow-hidden ${accent ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className={`px-4 py-2.5 border-b flex items-baseline gap-2 ${accent ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
        <span className={`text-sm font-bold ${accent ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
        {sub && <span className="text-xs font-mono text-gray-400">{sub}</span>}
      </div>
      <div className="flex items-center justify-center bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] min-h-44 p-4">
        <img
          src={url}
          alt={label}
          className="max-h-56 max-w-full object-contain shadow-md rounded"
        />
      </div>
    </div>
  );
}

export default App;
