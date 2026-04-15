
import { GoogleGenAI } from '@google/genai';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function findSalientCenter(
  img: HTMLImageElement,
  srcW: number,
  srcH: number
): { x: number; y: number } {
  const SW = Math.min(srcW, 160);
  const SH = Math.min(srcH, 160);
  const scaleX = srcW / SW;
  const scaleY = srcH / SH;

  const c = document.createElement('canvas');
  c.width = SW;
  c.height = SH;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, SW, SH);
  const { data } = ctx.getImageData(0, 0, SW, SH);

  let totalW = 0, wx = 0, wy = 0;

  for (let y = 1; y < SH - 1; y++) {
    for (let x = 1; x < SW - 1; x++) {
      const up  = ((y - 1) * SW + x) * 4;
      const dn  = ((y + 1) * SW + x) * 4;
      const lt  = (y * SW + (x - 1)) * 4;
      const rt  = (y * SW + (x + 1)) * 4;

      const gx = Math.abs(data[rt] - data[lt]) + Math.abs(data[rt+1] - data[lt+1]) + Math.abs(data[rt+2] - data[lt+2]);
      const gy = Math.abs(data[dn] - data[up]) + Math.abs(data[dn+1] - data[up+1]) + Math.abs(data[dn+2] - data[up+2]);
      let w = Math.sqrt(gx * gx + gy * gy) / 3;

      const dx = x / SW - 0.5;
      const dy = y / SH - 0.5;
      w += Math.exp(-(dx * dx + dy * dy) * 6) * 30;

      totalW += w;
      wx += x * w;
      wy += y * w;
    }
  }

  return {
    x: totalW > 0 ? (wx / totalW) * scaleX : srcW / 2,
    y: totalW > 0 ? (wy / totalW) * scaleY : srcH / 2,
  };
}

export function canvasSmartResize(
  img: HTMLImageElement,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
): string {
  const MAX_DIM = 3000;
  const dimScale = Math.min(1, MAX_DIM / Math.max(targetW, targetH));
  const outW = Math.round(targetW * dimScale);
  const outH = Math.round(targetH * dimScale);

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d')!;

  const srcRatio = srcW / srcH;
  const tgtRatio = targetW / targetH;
  const ratioFactor = Math.max(srcRatio, tgtRatio) / Math.min(srcRatio, tgtRatio);

  if (ratioFactor < 1.35) {
    const scale = Math.max(outW / srcW, outH / srcH);
    const scaledW = srcW * scale;
    const scaledH = srcH * scale;

    const { x: sx, y: sy } = findSalientCenter(img, srcW, srcH);
    const salientX = sx * scale;
    const salientY = sy * scale;

    const cropX = Math.max(0, Math.min(salientX - outW / 2, scaledW - outW));
    const cropY = Math.max(0, Math.min(salientY - outH / 2, scaledH - outH));

    ctx.drawImage(
      img,
      cropX / scale, cropY / scale,
      outW / scale, outH / scale,
      0, 0, outW, outH
    );
  } else {
    const fitScale = Math.min(outW / srcW, outH / srcH);
    const fitW = Math.round(srcW * fitScale);
    const fitH = Math.round(srcH * fitScale);

    const bgScale = Math.max(outW / srcW, outH / srcH) * 1.08;
    const bgW = srcW * bgScale;
    const bgH = srcH * bgScale;
    const bgX = (outW - bgW) / 2;
    const bgY = (outH - bgH) / 2;

    ctx.filter = 'blur(22px) brightness(0.72) saturate(0.85)';
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.filter = 'none';

    const grad = ctx.createRadialGradient(
      outW / 2, outH / 2, Math.min(outW, outH) * 0.3,
      outW / 2, outH / 2, Math.max(outW, outH) * 0.75
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);

    const { x: sx, y: sy } = findSalientCenter(img, srcW, srcH);
    const salientFitX = sx * fitScale;
    const salientFitY = sy * fitScale;

    let pasteX = Math.round(outW / 2 - salientFitX);
    let pasteY = Math.round(outH / 2 - salientFitY);
    pasteX = Math.max(0, Math.min(pasteX, outW - fitW));
    pasteY = Math.max(0, Math.min(pasteY, outH - fitH));

    ctx.drawImage(img, pasteX, pasteY, fitW, fitH);
  }

  return out.toDataURL('image/png');
}

async function aiAdaptImage(
  file: File,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  onProgress: (msg: string) => void,
  overrideKey?: string
): Promise<string | null> {
  const apiKey = overrideKey || (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const base64 = await fileToBase64(file);
  const mimeType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';

  const srcRatioStr = `${srcW}×${srcH}`;
  const tgtRatioStr = `${targetW}×${targetH}`;
  const isWider = (targetW / targetH) > (srcW / srcH);

  const hint = (targetW > srcW || targetH > srcH)
    ? `目標比原圖${isWider ? '更寬' : '更高'}，請向${isWider ? '左右兩側' : '上下'}延伸背景。`
    : `目標比原圖更窄，請智慧裁切不重要的邊緣，保留核心視覺元素。`;

  const prompt =
    `你是一位專業廣告設計師。請將這張 ${srcRatioStr} 的廣告圖片重新構圖為 ${tgtRatioStr} 像素。

要求：
1. 保留所有主要視覺元素（產品、人物、標誌等）。
2. 保留所有文字內容，依新比例重新排版文字位置與大小，確保文字清晰可讀且不被裁切。
3. ${hint}
4. 背景延伸須與原始背景風格一致（顏色、紋理、圖案）。
5. 若有 CTA 按鈕，保留並確保清晰可見。
6. 最終輸出比例必須為 ${tgtRatioStr}，畫面專業、自然、符合廣告美學。

請直接輸出重新構圖後的最終圖片，不要加邊框或浮水印。`;

  onProgress('AI 正在分析圖片內容與構圖...');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    onProgress('AI 正在重新排版，請稍候...');

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if ((part as any).inlineData?.data) {
        const { mimeType: m, data } = (part as any).inlineData;
        return `data:${m || 'image/png'};base64,${data}`;
      }
    }
    return null;
  } catch (err) {
    console.warn('[AI adapt] failed:', err);
    return null;
  }
}

export interface ProcessOptions {
  useAI: boolean;
  apiKey?: string;
  onProgress: (msg: string) => void;
}

export async function processImage(
  file: File,
  targetW: number,
  targetH: number,
  { useAI, apiKey, onProgress }: ProcessOptions
): Promise<string> {
  const srcUrl = URL.createObjectURL(file);
  const img = await loadImage(srcUrl);
  URL.revokeObjectURL(srcUrl);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const srcRatio = srcW / srcH;
  const tgtRatio = targetW / targetH;
  const ratioFactor = Math.max(srcRatio, tgtRatio) / Math.min(srcRatio, tgtRatio);

  if (useAI && ratioFactor >= 1.5) {
    onProgress('啟動 AI 模型，分析構圖需求...');
    const aiResult = await aiAdaptImage(file, srcW, srcH, targetW, targetH, onProgress, apiKey);
    if (aiResult) {
      onProgress('AI 處理完成！');
      return aiResult;
    }
    onProgress('AI 模型未返回結果，改用智慧裁切...');
  } else if (useAI) {
    onProgress('比例差異較小，採用智慧裁切縮放...');
  } else {
    onProgress('使用智慧裁切縮放處理...');
  }

  const result = canvasSmartResize(img, srcW, srcH, targetW, targetH);
  onProgress('圖片處理完成！');
  return result;
}
