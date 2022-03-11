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

const langs: Lang[] = [
  {
    enabled: true,
    type: 'en',
    name: '英',
    api: getYoudaoApi('eng', 'ec'),
    url: 'https://dict.cn/',

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
    name: '法',
    api: getYoudaoApi('fr', 'fc'),
    url: 'https://www.frdic.com/dicts/fr/',

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
    name: '日',
    api: getYoudaoApi('ja', 'newjc'),
    url: 'http://dict.asia/jc/',

    is(text: string): boolean {
      return /^(\p{sc=Han}|\p{sc=Hira}|\p{scx=Kana})+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const { newjc: { word: data } } = JSON.parse(res) as JapanseResult;

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
    name: '韩',
    api: 'https://zh.dict.naver.com/api3/kozh/tooltip?query=',
    url: 'https://zh.dict.naver.com/#/search?query=',

    is(text: string): boolean {
      return /^\p{sc=Hangul}+$/u.test(text);
    },

    async request(text: string): Promise<Entry[]> {
      const res = await get(this.api + text);
      const { jsonResult } = JSON.parse(res) as { jsonResult: KoreanResult[] };

      if (!jsonResult.length) throw new Error('查无结果');

      return jsonResult.map((item) => ({
        word: item.entryName,
        phonetic: item.phoneticSymbolP,
        meanings: item.partOfSpeechs.map((speech) => ({
          type: speech.partOfSpeechNameForeign,
          items: speech.means.map(({ mean }) => mean),
        })),
      }));
    },
  },

  {
    enabled: true,
    type: 'th',
    name: '泰',
    api: 'https://api.thai2english.com/translations?q=',
    url: 'https://www.thai2english.com/search?q=',

    is(text: string): boolean {
      return /^\p{sc=Thai}+$/u.test(text);
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
    name: '越',
    api: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',
    url: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',

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
    name: '他加禄',
    api: 'https://www.tagalog.com/ajax/reference_guide_search_results.php?json=1&num_results=5&keyword=',
    url: 'https://www.tagalog.com/dictionary/#',

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
    type: 'all',
    name: '谷歌翻译',
    api: 'https://translate.google.cn/translate_a/single?client=gtx&dt=t&dt=bd&dj=1&source=input&sl=auto&tl=en&q=',
    url: 'https://translate.google.cn/?sl=auto&tl=en&op=translate&text=',

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
