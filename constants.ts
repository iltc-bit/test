
import { Platform } from './types';

export const PLATFORMS: Platform[] = [
  { id: 'floating_pc',   name: '浮動 PC',            width: 320,  height: 220,  category: '浮動廣告' },
  { id: 'floating_mb',   name: '浮動 MB',            width: 320,  height: 100,  category: '浮動廣告' },
  { id: 'inline_pc',     name: '文中 PC',            width: 728,  height: 110,  category: '文中廣告' },
  { id: 'inline_mb',     name: '文中 MB',            width: 320,  height: 70,   category: '文中廣告' },
  { id: 'end_pcmb',      name: '文末（pc+mb）',      width: 300,  height: 250,  category: '版位廣告' },
  { id: 'recommend',     name: '推薦版位（pc+mb）',  width: 300,  height: 450,  category: '版位廣告' },
  { id: 'senior_video',  name: '熟齡閱讀 影音橫式', width: 1920, height: 1080, category: '影音版位', note: '16:9' },
  { id: 'home_pc',       name: '首頁 PC',            width: 2400, height: 960,  category: '首頁' },
  { id: 'home_mb',       name: '首頁 MB',            width: 720,  height: 960,  category: '首頁' },
  { id: 'cover_pc',      name: '蓋板 PC',            width: 970,  height: 480,  category: '蓋板' },
  { id: 'cover_mb',      name: '蓋板 MB',            width: 320,  height: 480,  category: '蓋板' },
  { id: 'line',          name: 'LINE 圖文訊息',      width: 1040, height: 1040, category: '社群媒體' },
  { id: 'fb_vertical',   name: 'Facebook 直向廣告',  width: 1080, height: 1920, category: '社群媒體', note: '9:16' },
  { id: 'fb_horizontal', name: 'Facebook 橫向廣告',  width: 1200, height: 628,  category: '社群媒體', note: '1.91:1' },
];

export const PLATFORM_CATEGORIES = [...new Set(PLATFORMS.map(p => p.category))];
