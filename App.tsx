
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import saveAs from 'file-saver';

import { JOURNALS } from './constants';
import { ProcessingState, FormattedDocument, JournalMetadata } from './types';

const App: React.FC = () => {
  const [selectedJournalId, setSelectedJournalId] = useState<string>(JOURNALS[1].id); // 預設臺大
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [result, setResult] = useState<FormattedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedJournal = JOURNALS.find(j => j.id === selectedJournalId) || JOURNALS[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile);
        setResult(null);
        setProcessing({ status: 'idle', message: '' });
      } else {
        setProcessing({ status: 'error', message: '目前僅支援 .docx 檔案格式', error: 'Invalid file format' });
      }
    }
  };

  const processDocument = async () => {
    if (!file) return;

    setProcessing({ status: 'reading', message: '正在讀取 Word 內容...' });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });
      
      if (!text.trim()) {
        throw new Error("檔案內容為空");
      }

      setProcessing({ status: 'analyzing', message: `正在依照「${selectedJournal.name}」精確體例校對文獻...` });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        你是一位專業的台灣學術期刊編輯。任務是從提供的文本中提取「參考文獻列表」，並嚴格依照「${selectedJournal.name}」的體例進行格式校正。
        
        【期刊體例要求摘要】：
        ${selectedJournal.rulesSummary}
        
        【通用極重要原則】：
        1. 排序：中文文獻在前（依筆劃），西文在後（依字母）。
        2. 括號與標點：注意是「（ ）」還是「( )」，「，《 》」還是「，《 》」。
        3. 篇名與書名：區分哪些用《 》(如專書、期刊名、學位論文)，哪些用〈 〉(如期刊論文篇名、書中章節)。
        4. 引用實例參考：
           - 若是「臺大社工」：胡幼慧(1996)。《質性研究》。巨流。 / 陳麗欣(1995)。〈篇名〉。《期刊名》, 1, 77-112。
           - 若是「臺灣社會學」：瞿海源，1997，《書名》。台北：桂冠。 / 作者，年代，〈篇名〉。《期刊名》卷(期)：頁碼。
           - 若是「東吳社工」：
             * 中文論文：作者（年代）。《論文名稱》。發表地點：校系名稱博碩士論文。例如：盧慧怡（1990）。《標題》。台北：東吳大學社會學研究所碩士論文。
             * 英文論文：Author, A. A. (Year). Title (Unpublished doctoral dissertation). Name of University, Location.
             * 多位作者：8位以上作者用「作者1、作者2...最後一位作者」。西文兩位作者用 ＆。
           - 若是「人文社科集刊」：瞿同祖。1978。中國法律與中國社會。僶勉出版社。(句點隔開)
           
        請確保輸出結果完全符合該期刊的最新規範，特別是全半型標點符號的切換。

        請將結果以 JSON 格式回傳：
        {
          "title": "提取的論文標題",
          "references": ["校正後文獻1", "校正後文獻2", ...]
        }

        待處理文本內容：
        ${text.substring(0, 10000)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              references: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "references"]
          }
        }
      });

      const formattedJson = JSON.parse(response.text || '{}') as FormattedDocument;
      setResult(formattedJson);
      setProcessing({ status: 'completed', message: '文獻體例整理完成！' });

    } catch (error: any) {
      console.error(error);
      setProcessing({ 
        status: 'error', 
        message: '處理過程中發生錯誤，請稍後再試。', 
        error: error.message 
      });
    }
  };

  const downloadDocx = async () => {
    if (!result) return;
    
    setProcessing(prev => ({ ...prev, status: 'generating', message: '正在生成 Word 檔案...' }));

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "參考文獻",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            }),
            ...result.references.map(ref => 
              new Paragraph({
                children: [new TextRun(ref)],
                indent: { hanging: 425 }, // 標準懸掛縮進
                spacing: { after: 120 },
              })
            )
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `參考文獻_${selectedJournal.id}_${result.title.substring(0, 10)}.docx`);
      setProcessing(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      console.error(err);
      setProcessing({ status: 'error', message: '生成檔案失敗' });
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">學術期刊文獻整理小編</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Academic Reference Formatter</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-full border border-indigo-100">
            <CheckCircle2 size={14} />
            <span>AI 精準校閱體例</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        {/* Step 1 */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <span className="bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-sm">1</span>
              選擇投稿期刊與體例
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-600 ml-1">投稿目標期刊</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer font-bold text-lg pr-12"
                    value={selectedJournalId}
                    onChange={(e) => setSelectedJournalId(e.target.value)}
                  >
                    {JOURNALS.map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Download size={18} className="rotate-180" />
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-indigo-100 group-hover:text-indigo-200 transition-colors">
                  <BookOpen size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">期刊核心規範</span>
                    <a href={selectedJournal.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-xs font-bold transition-colors">
                      規範鏈結 <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed font-bold">
                    {selectedJournal.rulesSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <span className="bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-sm">2</span>
              上傳文獻或原始稿件
            </h2>
          </div>
          <div className="p-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all group
                ${file ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
              `}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".docx" />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-100 p-5 rounded-3xl text-indigo-600 mb-5 shadow-inner">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{file.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">檔案已就緒</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-6 text-sm text-red-500 hover:text-red-700 font-black flex items-center gap-1 transition-colors">
                    重選檔案
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-slate-100 p-5 rounded-3xl text-slate-400 mb-5 group-hover:scale-110 transition-transform">
                    <Upload size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">點擊上傳原始 Word 檔案</h3>
                  <p className="text-sm text-slate-500 mt-3 max-w-sm mx-auto font-medium leading-relaxed">
                    AI 將精確識別書目類型（期刊、專書、研討會等），並依照期刊特定標點重新排列。
                  </p>
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                disabled={!file || (processing.status !== 'idle' && processing.status !== 'completed' && processing.status !== 'error')}
                onClick={processDocument}
                className={`
                  px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 transition-all active:scale-95
                  ${!file || (processing.status !== 'idle' && processing.status !== 'completed' && processing.status !== 'error')
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:-translate-y-1'}
                `}
              >
                {processing.status === 'reading' || processing.status === 'analyzing' ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <CheckCircle2 size={24} />
                )}
                開始體例校對
              </button>
            </div>

            {processing.status !== 'idle' && (
              <div className={`mt-8 p-5 rounded-2xl border-2 flex gap-4 items-center ${
                processing.status === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <div className="shrink-0">
                  {processing.status === 'error' ? <AlertCircle size={24} /> : <Loader2 size={24} className={processing.status !== 'completed' && processing.status !== 'error' ? 'animate-spin text-indigo-600' : 'hidden'} />}
                  {processing.status === 'completed' && <CheckCircle2 size={24} className="text-green-600" />}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">系統狀態</p>
                  <p className="text-base font-bold">{processing.message}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Result Area */}
        {result && (
          <section className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-3">
                <CheckCircle2 size={28} className="text-emerald-500" />
                文獻校對預覽
              </h2>
              <button onClick={downloadDocx} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                <Download size={20} />
                下載校正後 Word
              </button>
            </div>
            <div className="p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto space-y-6 bg-white p-12 shadow-sm border border-slate-100 rounded-2xl font-serif">
                <h3 className="text-2xl font-black mb-10 text-center border-b border-slate-100 pb-6 text-slate-900">參考文獻</h3>
                <div className="space-y-6 text-sm sm:text-lg leading-loose text-slate-800">
                  {result.references.map((ref, idx) => (
                    <p key={idx} className="pl-10 -indent-10 text-justify tracking-normal">
                      {ref}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-100/50 py-4 px-8 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>整理體例: {selectedJournal.name}</span>
              <span>AI 校對助手 v2.0</span>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-24 border-t border-slate-200 bg-white py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Academic Journal Reference Specialist</p>
          <p className="text-xs text-slate-400 mt-2">© 2024 學術期刊編輯小編 - 專注社會科學文獻格式化</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
