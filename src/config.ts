import type {
  Lang,
  Entry,
  EnglishResult,
  FrenchResult,
  JapanseResult,
  KoreanResult,
  ThaiResult,
  TagalogResult,
  GoogleResult,
} from './types';
import { getYoudaoApi, getYoudaoVoice, get } from './util';

export const langs: Lang[] = [
  {
    type: 'en',
    name: '英语',
    api: getYoudaoApi('eng', 'ec'),
    url: 'https://dict.cn/',
    alternatives: [
      { name: '金山词霸', url: 'https://www.iciba.com/word?w=', icon: 'data:image/x-icon;base64,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///07tf/69ee//n9/P/8////792k/+KlAv/mqAH/46gE/+SoAv/mqQD/5qgA/+aoAP/mqAD/5aoA/+WqAP/iqgP/8qsA/02fqf8AmP//Bqnw/wLY/f8A2P//Atn//wDV/v+J6PL////6//3////8+vT/8uGs/+7XkP/x5Lj//Pv3/////////v3//v///+7cof/lqAT/5akB/+WrAv/lqgD/5aoA/+WqAP/lqgD/5aoA/+WqAP/lqgD/5KoA/+KqA//xqwD/Tp+p/wCY//8GqfD/Atj9/wLY//8A1v7/V+H7/////P/9////8uKy/+KyH//jpgD/4qQB/+KnAf/lty7/8+jE///////9////5rg9/+SmAP/lrAP/5KoA/+WqAP/lqgD/5aoA/+WqAP/lqgD/5aoA/+OrAP/jqwD/4asD//CsAP9OoKn/AJj//wap8P8C2P3/ANj//wTW/P/U9fj///////Dmuf/ipwT/5KkA/+SsA//krQX/5K0D/+OnAP/jrBP/8+/W///////w4rH/4agA/+SsAv/jqwH/46sA/+OrAP/jqwD/46sA/+OrAP/jqwD/46wB/+OsAf/grAP/764A/02hqf8AmP//Bqnw/wXZ/f8A1v//QN/7/////f/6/f7/47kz/+KpAP/krgX/46wB/+OsAf/jrAH/5K8G/+GnAP/ox17///////v68//mtCT/46oA/+OtAv/jrAH/46wB/+OsAf/jrAH/46wB/+OsAf/irQD/4q0A/9+tA//wrwD/T6Co/wCY//8GqfD/Btn9/wDV//9m5Pr///////Tz4f/jsAv/4q0A/+KuAf/irQD/4q0A/+KtAP/jrgL/4asA/+e5LP///f3//////+m+O//hqQD/464D/+KtAP/irQD/4q0A/+KtAP/irQD/4q0A/+KuAP/irgD/364D//CvAP9Poan/AJj//wap8P8G2f3/ANX//2bj+///////9fHa/+SwB//irgD/4q8B/+KuAP/irgD/4q4A/+OvAv/hrAD/5rkl///8+P//////6MFC/+GqAP/irwP/4q4A/+KuAP/irgD/4q4A/+KuAP/irgD/4a8A/+GvAP/erwP/7rEA/0yiqf8AmP//Bqnw/wXZ/f8A1v//V+H6///////2+/L/4rUc/+GuAP/hsAL/4a8A/+GvAP/hrwD/4bAE/9+sAP/mwUT///////7////lvTf/4KwA/+GwAv/hrwD/4a8A/+GvAP/hrwD/4a8A/+GvAP/isAD/4rAA/9+wA//wsQD/UqKo/wCY//8HqvD/BNj9/wDY//8V2Pv/6fj4///////r1H//4KgA/+OyBf/jsQT/47ED/+OxBP/jsQP/3qkA/+/hq///////9vLY/+KyCv/isAD/4rAB/+KwAP/isAD/4rAA/+KwAP/isAD/4rAA/+KxAf/isQH/37AD/++yAP9JoKv/AJX//wWm7/8C2P3/BNn//wDV/f+M6vn////+//n8+v/myFz/3qoA/+CsAv/frQD/4KwB/9+rAP/p0Hb//f7+///////q0HD/4KsA/+KyBP/isAH/4rEB/+KxAf/isQH/4rEB/+KxAf/isQH/4rIA/+KyAf/hsgP/6K8A/5bAhf9r6f//Xtz1/xDY+v8A1///ANj//w/X/P/K9fr///////z+/P/v4qn/5shU/+XDPP/nylj/8ui6///+/v//////8OSy/+CvAv/isgH/4rIB/+KyAf/isgD/4rIA/+KyAP/isgD/4rIA/+KyAP/isgD/4rIA/+KyAP/isgH/6rMA/73Vef+T+/3/dvH8/xrb+f8A1v3/ANn//0HTzv/56rv//f///////v///////v////7////+//7//v////Hiqf/isgv/4rEA/+KyAf/isgD/4rIA/+KyAP/isgD/4rIA/+KyAP/isgD/4rIA/+GzAf/hswH/4bMB/+GzAf/gsgP/56wA/8bESv+V8+z/gff//y7e9f8A1///Ns68/+SxAP/pz2n/9ezE//z47P/8+O//+fbo//Touf/nyVn/368A/+KyAv/hswL/4bIA/+GzAf/hswH/4bMB/+GzAf/hswH/4bMB/+GzAf/hswH/4bQA/+G0AP/htAD/4bQA/+G0Af/ftQT/57AA/9W7Jf+d6cn/ivn//yzo//8v0sb/5rQA/96vAf/gsgP/5LkS/+S7Gv/iuBD/4LEC/9+vAP/htAL/4bQB/+G0AP/htAD/4bQA/+G0AP/htAD/4bQA/+G0AP/htAD/4bQA/+G0AP/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/etQT/47EA/96zDf+x1on/peW4/5HOg//esQD/4LYF/9+0Av/fswD/37IA/9+zAP/gtAP/4LUE/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/etQP/4LQC/+OwAP/jsQD/6rMB/+C0Av/ftAH/37UB/9+1Av/ftQL/37UC/9+1Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/37QB/9+0Af/ftAH/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtgH/37YD/9+2A//etgL/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/+C1AP/gtQD/4LUA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/3rYA/962AP/etgD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' },
      { name: 'Urban Dictionary', url: 'https://www.urbandictionary.com/define.php?term=', icon: 'data:image/png;base64,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' },
    ],

    is(text: string): boolean {
      return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const { ec } = JSON.parse(res) as EnglishResult;

      if (!ec) throw new Error('查无结果');

      return ec.word.map((word) => ({
        word: word['return-phrase'].l.i,
        phonetic: word.ukphone,
        sound: word.ukspeech && getYoudaoVoice(word.ukspeech),
        meanings: word.trs.map((tr) => {
          let [type, items] = tr.tr[0].l.i[0].split('.');
          if (!items) {
            items = type;
            type = '';
          }
          return {
            type: type.trim(),
            items: [items.trim()],
          };
        }),
      }));
    },
  },

  {
    type: 'fr',
    name: '法语',
    api: getYoudaoApi('fr', 'fc'),
    url: 'https://www.frdic.com/dicts/fr/',
    alternatives: [],

    is(text: string): boolean {
      return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const { fc } = JSON.parse(res) as FrenchResult;

      if (!fc) throw new Error('查无结果');

      return fc.word.map((word) => ({
        word: word['return-phrase'].l.i,
        phonetic: word.phone.replace(/\s/g, ''),
        sound: word.speech && getYoudaoVoice(word.speech),
        meanings: word.trs.map((tr) => ({
          type: tr.pos,
          items: tr.tr[0].l.i,
        })),
      }));
    },
  },

  {
    type: 'ja',
    name: '日语',
    api: getYoudaoApi('ja', 'newjc'),
    url: 'http://dict.asia/jc/',
    alternatives: [
      { name: '沪江小D', url: 'https://dict.hjenglish.com/jp/jc/', icon: 'data:image/png;base64,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' },
      { name: 'JapanDict', url: 'https://www.japandict.com/?s=', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAhUExURcsiIv///wAAAOGAgM8yMvff3+2xseaVldNFRfLMzNtnZ6ZgghMAAABtSURBVDjL5dBbDsAgCERRpyCo+19wP9pUY4RZQO8vJ/goF6lc5ZTgLQLOgBGgnYBWCRggwAiYJwTg+4UAzDcEYFlwBMsNjkANOXDkQJCDbb4DdaSgGTKgUpEAlQ6EQIdXIABD3ILpA5D2H0C6ATXuA+6Kb9pZAAAAAElFTkSuQmCC' },
    ],

    is(text: string): boolean {
      return /^(\p{sc=Han}|\p{sc=Hira}|\p{scx=Kana})+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const { newjc } = JSON.parse(res) as JapanseResult;

      if (!newjc) throw new Error('查无结果');

      const { word: data } = newjc;
      const { mPhonicD, homonymD = [] } = data;
      const words = mPhonicD || [data];
      words.push(...homonymD.filter((part) => part.head.pjm));
      return words.map((word) => ({
        word: word.head.hw,
        phonetic: `${word.head.pjm} ${word.head.tone || ''}`,
        sound: getYoudaoVoice(`${word.head.hw}&le=jap`),
        meanings: word.sense.map((sensePart) => ({
          type: sensePart.cx,
          items: sensePart.phrList.map(({ jmsy }) => jmsy),
        })),
      }));
    },
  },

  {
    type: 'kr',
    name: '韩语',
    api: 'https://ac-dict.naver.com/kozh/ac?st=11&r_lt=11&q=',
    url: 'https://korean.dict.naver.com/kozhdict/#/search?query=',
    alternatives: [],

    is(text: string): boolean {
      return /^\p{sc=Hangul}+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const jsonResult = JSON.parse(res) as KoreanResult;
      const { query: [word], items } = jsonResult;

      if (!jsonResult.items[0].length) throw new Error('查无结果');

      return [{
        word,
        meanings: [{
          items: items.flat().map((item) => `[${item[0]}] ${item[3]}`),
        }],
      }];
    },
  },

  {
    type: 'th',
    name: '泰语',
    api: 'https://api.thai2english.com/translations?q=',
    url: 'https://www.thai2english.com/search?q=',
    alternatives: [],

    is(text: string): boolean {
      return /^(\p{sc=Thai}|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const [{ wordObjects }] = JSON.parse(res) as ThaiResult[];
      return wordObjects.map((item) => ({
        word: item.word,
        phonetic: item.phonetic,
        meanings: [{
          items: item.meanings.map(({ meaning }) => meaning),
        }],
      }));
    },
  },

  {
    type: 'vt',
    name: '越南语',
    api: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',
    url: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',
    alternatives: [],

    is(text: string): boolean {
      return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);

      const doc = new DOMParser().parseFromString(res, 'text/html');
      const div = doc.getElementById('idnghia');
      const word = div?.querySelector('h2')?.textContent?.trim();

      if (!word) throw new Error('查无结果');

      const tds = div?.querySelectorAll('td[colspan="2"]') || [];
      const items = Array.from(tds).map((td) => td.textContent as string);

      return [{
        word,
        sound: `https://vtudien.com/doc/viet/${word}.mp3`,
        meanings: [{
          items,
        }],
      }];
    },
  },

  {
    type: 'tl',
    name: '他加禄语（菲律宾语）',
    api: 'https://www.tagalog.com/ajax/reference_guide_search_results.php?json=1&num_results=5&keyword=',
    url: 'https://www.tagalog.com/dictionary/#',
    alternatives: [],

    is(text: string): boolean {
      return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const entries: TagalogResult[] = JSON.parse(res);

      if (!entries.length) throw new Error('查无结果');

      return entries.map((entry) => {
        const {
          content, english, has_conjugations: hasConjugations, conjugations,
        } = entry;
        const meanings = english.split('[').slice(1)
          .map((segment) => segment.split(']'))
          .map(([type, meaning]) => ({
            type,
            items: [
              ...(type === 'verb' && hasConjugations === 1 ? [`( ${conjugations} )`] : []),
              meaning.trim(),
            ],
          }));
        return {
          word: content.replaceAll('***', '<u>').replaceAll('^^^', '</u>'),
          meanings,
        };
      });
    },
  },

  {
    type: 'in',
    name: '印尼语（马来语）',
    api: 'https://www.ekamus.info/index.php/term/%E9%A9%AC%E6%9D%A5%E6%96%87-%E5%8D%8E%E6%96%87%E5%AD%97%E5%85%B8,',
    url: 'https://www.ekamus.info/index.php/term/%E9%A9%AC%E6%9D%A5%E6%96%87-%E5%8D%8E%E6%96%87%E5%AD%97%E5%85%B8,',
    alternatives: [],

    is(text: string): boolean {
      return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const domparser = new DOMParser();
      const dom = domparser.parseFromString(res, 'text/html');

      const card = dom.querySelector('.row > .col-xs-12 .card') as HTMLDivElement;
      const cardHeader = card.querySelector('.card-header') as HTMLDivElement;
      const cardDefn = card.querySelector('.defn') as HTMLDivElement;
      const cardDefnChildNodes = Array.from(cardDefn.childNodes);

      const meanings = [];

      const mainMeaning = cardDefnChildNodes
        .filter((childNode) => childNode.nodeName === '#text')
        .map((childNode) => childNode.textContent || '');
      meanings.push({ items: mainMeaning });

      const otherMeanings = cardDefnChildNodes
        .filter((childNode) => childNode.nodeName === 'P')
        .map((paragrahpNode) => {
          const meaning: Entry['meanings'][0] = { type: '', items: [] };
          paragrahpNode.childNodes.forEach((childNode) => {
            if (childNode.nodeName === 'STRONG') {
              meaning.type = childNode.textContent || '';
            }
            if (childNode.nodeName === '#text') {
              meaning.items.push(childNode.textContent || '');
            }
          });
          return meaning;
        });
      meanings.push(...otherMeanings);

      return [{
        word: cardHeader.textContent || '',
        meanings,
      }];
    },
  },

  {
    type: 'all',
    name: 'Google 翻译',
    api: 'https://translate.google.com/translate_a/single?client=gtx&dt=t&dt=bd&dj=1&source=input&sl=auto&tl=zh-CN&q=',
    url: 'https://translate.google.com/?sl=auto&tl=zh-CN&op=translate&text=',
    alternatives: [],

    is(): boolean {
      return true;
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const result: GoogleResult = JSON.parse(res);

      return [{
        meanings: [{
          items: [result.sentences[0].trans],
        }],
      }];
    },
  },
];

export default langs;
