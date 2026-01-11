
import { JournalMetadata } from './types';

export const JOURNALS: JournalMetadata[] = [
  {
    id: 'apa7',
    name: 'APA 7th 格式 (通用)',
    url: 'https://apastyle.apa.org/',
    description: '美國心理學會第七版格式，廣泛應用於社會科學。',
    rulesSummary: '使用雙倍行高、12號字、左對齊。參考文獻需有懸掛縮進 0.5 吋，排序先按作者姓氏字母，中文則按筆劃。'
  },
  {
    id: 'ntu-sw',
    name: '臺大社會工作學刊',
    url: 'https://drive.google.com/file/d/1GO-OtiXuDPI_kPzcSuQaS9MSlHaXf7tV/view',
    description: '國立臺灣大學社會工作學系出版。',
    rulesSummary: '1.書籍：作者(年代)。《書名》。出版者。2.期刊：作者(年代)。〈篇名〉。《期刊名》, 卷(期), 頁碼。3.研討會：作者(年代月)。〈篇名〉,「會議名稱」, 地點。4.學位論文：作者(年代)。《題目》〔碩士/博士論文, 學校〕。5.中文在前按筆劃，西文在後按字母。6.書名/期刊名用《 》，篇名用〈 〉，中文標點用全型。'
  },
  {
    id: 'tjs',
    name: '臺灣社會學刊',
    url: 'https://www.tjs.org.tw/up_photo/moon-system/images/%E6%92%B0%E7%A8%BF%E9%AB%94%E4%BE%8B.pdf',
    description: '臺灣社會學會出版。',
    rulesSummary: '1.專書：作者，年代，《書名》。出版地：出版者。2.專書論文：作者，年代，〈篇名〉。頁碼，收錄於編者編，《書名》。出版地：出版者。3.期刊：作者，年代，〈篇名〉。《期刊名》卷(期)：頁碼。4.會議：作者，年代，〈篇名〉。論文發表於「會議名稱」，地點：主辦單位，期間。5.碩博論文：作者，年代，《書名》。地點：校系名稱博碩士論文。'
  },
  {
    id: 'sinica-hss',
    name: '人文及社會科學集刊',
    url: 'https://www.rchss.sinica.edu.tw/files/archive/1039_29ab9158.pdf',
    description: '中研院人文社會科學研究中心出版。',
    rulesSummary: '1.格式：作者。年代。書名。出版者。(句點隔開)。2.翻譯：中文文獻需提供英譯，以括號附於後。3.字體：中文專書/期刊名請用標楷體，英文用斜體。4.專書論文：作者。年代。篇名。見編者（編），書名（頁碼）。出版者。'
  },
  {
    id: 'sp-sw',
    name: '社會政策與社會工作學刊',
    url: 'https://www.tasp.ncnu.edu.tw/wp-content/uploads/2022/08/%E7%A4%BE%E6%9C%83%E6%94%BF%E7%AD%96%E8%88%87%E7%A4%BE%E6%9C%83%E5%B7%A5%E4%BD%9C%E5%AD%B8%E5%88%8A%E8%AB%96%E6%96%87%E6%92%B0%E7%A8%BF%E6%96%87%E7%8D%BB%E6%A0%BC%E5%BC%8F-1.pdf',
    description: '台灣社會政策學會與暨南大學社工系出版。',
    rulesSummary: '1.中文書籍：作者（年代）。《書名》。出版地點：出版商。2.期刊：作者（年代）。〈篇名〉，《期刊名稱》，卷期別，頁別。3.英文期刊：Author, A. A. (Year). \'Article title\', Title of Periodical, xx (xx): xxx-xxx. (篇名用單引號)。'
  },
  {
    id: 'tacws',
    name: '台灣社區工作與社區研究學刊',
    url: 'http://www.tacws.org/zh-TW/practices/microsoft_word_form.pdf',
    description: '中華民國社區發展訓練中心出版。',
    rulesSummary: '1.並列英譯：中文書目需並列英文書目。2.英文作者：第一位姓氏在前名字在後，第二位起名字在前姓氏在後。3.期刊：一定要有頁碼。4.翻譯書：原著，譯者（譯）。《書名》。出版。'
  },
  {
    id: 'tjsw',
    name: '臺灣社會福利學刊',
    url: 'https://tjsw.welfaretaiwan.org/%E7%A8%BF%E4%BB%B6%E6%A0%BC%E5%BC%8F/',
    description: '臺灣社會福利學會出版。',
    rulesSummary: '1.英文作者：連接詞為 & (半形)，第一位姓在前，第二位後名在前。2.縮排：每筆第二行起縮排兩個中文字。3.期刊：作者(出版年)。〈篇名〉。《期刊名》, 卷(期), 頁碼。'
  },
  {
    id: 'scu-sw',
    name: '東吳社會工作學報',
    url: 'https://www.scu.edu.tw/sw/publish/journalrule1010410.pdf',
    description: '東吳大學社會工作學系出版。',
    rulesSummary: '1.作者：2位中文用「、」/英文用「＆」；7位內全列；8位以上列前6位...最後1位。2.書籍：作者（年代）。《書名》。出版地：出版商。3.學題論文：（中）作者（年代）。《論文名稱》。發表地點：校系名稱博碩士論文。（英）Author, A. A. (Year). Title (Unpublished doctoral dissertation). Name of University, Location. 4.期刊：作者（年代）。〈篇名〉，《期刊名稱》，卷(期)，頁碼。5.法規：法律名稱（公布日期）。'
  },
  {
    id: 'tasw',
    name: '臺灣社會工作學刊',
    url: 'https://tasw.org.tw/product_image/images/%E7%A0%94%E7%A9%B6%E6%88%90%E6%9E%9C%E6%9A%A8%E5%87%BA%E7%89%88%E5%93%81-%E5%AD%B8%E5%88%8A/%E5%BE%B5%E7%A8%BF%E7%B0%A1%E5%89%87%E3%80%81%E8%91%97%E4%BD%9C%E6%AC%8A%E8%AE%93%E8%88%87%E6%9B%B8%E3%80%81%E6%96%87%E7%8D%BB%E6%A0%BC%E5%BC%8F.pdf',
    description: '臺灣社會工作專業人員協會出版。',
    rulesSummary: '1.作者數：20人以下全列，21人以上列前19人...最後1人。2.研討會：[論文發表] 標註，題目加〈〉。3.博碩論文：[碩士論文, 學校] 標註。4.網路：中文題目加〈〉，英文為斜體。'
  },
  {
    id: 'jswsw',
    name: '社會工作與社會福利學刊',
    url: 'https://www.ipress.tw/J0254?pWebID=1753&mSeq=2',
    description: '各大院校社工系合辦，華藝出版。',
    rulesSummary: '遵循 APA 7th 的最新規範。特別強調 DOI 的正確引用格式。'
  },
  {
    id: 'jsd',
    name: '社會發展研究學刊',
    url: 'https://swcw.pu.edu.tw/p/404-1088-35081.php?Lang=zh-tw',
    description: '靜宜大學社會工作與兒童少年福利學系出版。',
    rulesSummary: '注意各級標題之編號格式（一、 (一) 1. (1)）。參考文獻需詳實。'
  }
];
