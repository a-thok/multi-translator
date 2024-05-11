export interface Entry {
  word?: string;
  phonetic?: string;
  sound?: string;
  meanings: {
      type?: string;
      items: string[];
  }[];
}
export interface Lang {
    enabled: boolean;
    type: 'en' | 'fr' | 'ja' | 'kr' | 'th' | 'vt' | 'tl' | 'in' | 'all';
    name: string;
    api: string;
    url: string;
    alternatives: { name: string; url: string; icon: string }[]
    is: (text: string) => boolean;
    request: (text: string) => Promise<Entry[]>;
}

export interface EnglishResult {
    ec?: {
        word: {
            usphone: string;
            ukphone: string;
            usspeech: string;
            ukspeech: string;
            'return-phrase': {
                l: {
                    i: string;
                }
            };
            trs: {
                tr: {
                    l: {
                        i: string[];
                    };
                }[];
            }[];
        }[];
    };
}

export interface FrenchResult {
    fc?: {
        word: {
            phone: string;
            speech: string;
            'return-phrase': {
                l: {
                    i: string;
                }
            };
            trs: {
                pos: string;
                tr: {
                    l: {
                        i: string[];
                    };
                }[];
            }[];
        }[];
    };
}

export interface JapanseResult {
    newjc?: {
        word: {
            head: {
                hw: string;
                pjm: string;
                ppjm: string;
                rs: string;
                tone: string;
            };
            sense: {
                cx?: string;
                phrList: {
                    jmsy: string;
                    jmsyT: string;
                }[];
            }[];
            homonymD?: {
                head: {
                    hw: string;
                    pjm: string;
                    ppjm: string;
                    rs: string;
                    tone: string;
                };
                sense: {
                    cx?: string;
                    phrList: {
                        jmsy: string;
                        jmsyT: string;
                    }[];
                }[];
            }[];
            mPhonicD?: {
                head: {
                    hw: string;
                    pjm: string;
                    ppjm: string;
                    rs: string;
                    tone: string;
                };
                sense: {
                    cx?: string;
                    phrList: {
                        jmsy: string;
                        jmsyT: string;
                    }[];
                }[];
            }[];
        };
    };
}

export interface ThaiResult {
    unspacedText: string,
    phonetic: string,
    wordObjects: {
        meanings: { meaning: string }[],
        phonetic: string,
        isThai: boolean,
        word: string
    }[]
}

export interface KoreanResult {
    entryId: string,
    entryName: string,
    phoneticSymbolP: string,
    mPhoneticSymbolP: string,
    haja: string,
    prons: string,
    detailUrl: string,
    moreUrl: string,
    query: string,
    noresult: string,
    langTypeCode: string,
    partGroupYn: null,
    partOfSpeechs: {
        partOfSpeechName: string,
        partOfSpeechNameForeign: string,
        means: {
            sequence: string,
            mean: string
        }[]
    }[],
    matchType: null,
    documentQuality: number
}

export interface TagalogResult {
  content: string;
  english: string;
  translation_entry_id: string;
  has_conjugations: number;
  has_audio: number;
  num_example_sentences: number;
  frequency_count: number;
  conjugations?: string;
}

export interface GoogleResult {
  sentences: {
    trans: string;
    orig: string;
    backend: number;
  }[];
  dict: {
    pos: string;
    terms: string[];
    entry: {
      word: string;
      reverse_translation: string[];
      score?: number;
    }[];
    base_form: string;
    pos_enum: number;
  }[];
  src: string;
  confidence: number;
  ld_result: {
    srclangs: string[];
    srclangs_confidences: number[];
    extended_srclangs: string[];
  };
}
