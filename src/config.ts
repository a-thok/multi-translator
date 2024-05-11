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
    enabled: true,
    type: 'en',
    name: '英语',
    api: getYoudaoApi('eng', 'ec'),
    url: 'https://dict.cn/',
    alternatives: [
      { name: '金山词霸', url: 'https://www.iciba.com/word?w=', icon: 'https://cdn.iciba.com/www/img/www/favicon.ico' },
      { name: 'Urban Dictionary', url: 'https://www.urbandictionary.com/define.php?term=', icon: 'https://g.udimg.com/assets/apple-touch-icon-2ad9dfa3cb34c1d2740aaf1e8bcac791e2e654939e105241f3d3c8b889e4ac0c.png' },
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
    enabled: false,
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
    enabled: true,
    type: 'ja',
    name: '日语',
    api: getYoudaoApi('ja', 'newjc'),
    url: 'http://dict.asia/jc/',
    alternatives: [
      { name: '沪江小D', url: 'https://dict.hjenglish.com/jp/jc/', icon: 'https://res.hjfile.cn/tool/dict.hjenglish.com/img/logo@2x-e5fcc.png' },
      { name: 'JapanDict', url: 'https://www.japandict.com/?s=', icon: 'https://www.japandict.com/apple-touch-icon-57x57.png?v=3.8' },
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
    enabled: true,
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
        // phonetic: item.phoneticSymbolP,
        meanings: [{
          items: items.flat().map((item) => `[${item[0]}] ${item[3]}`),
        }],
      }];
    },
  },

  {
    enabled: true,
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
    enabled: false,
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
    enabled: false,
    type: 'tl',
    name: '他加禄语',
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
    enabled: false,
    type: 'in',
    name: '马来·印尼语',
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
    enabled: false,
    type: 'all',
    name: '谷歌翻译',
    api: 'https://translate.google.cn/translate_a/single?client=gtx&dt=t&dt=bd&dj=1&source=input&sl=auto&tl=en&q=',
    url: 'https://translate.google.cn/?sl=auto&tl=en&op=translate&text=',
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
