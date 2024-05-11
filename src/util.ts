export const getYoudaoApi = (le: string, dict: string): string => (
  `http://dict.youdao.com/jsonapi?le=${le}&dicts=${encodeURIComponent(`{"count": 1, dicts: [["${dict}"]]}`)}&jsonversion=2&q=`
);

export const getYoudaoVoice = (audio: string): string => `https://dict.youdao.com/dictvoice?audio=${audio}`;

export function get(url: string, responseType?: 'arraybuffer' | 'blob' | 'json'): Promise<string> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType,
      onload: (res) => resolve(res.response),
      onerror: reject,
    });
  });
}

export function setPosition(el: HTMLElement, rect: DOMRect, offset = 0): void {
  const { innerWidth, innerHeight } = window;
  let left = rect.right;
  let top = rect.bottom;

  const { clientWidth, clientHeight } = el;

  if (left + clientWidth > innerWidth) {
    left -= clientWidth;
  }
  if (top + clientHeight + offset > innerHeight) {
    top -= (clientHeight + offset);
  }

  if (left < 0) {
    left = 0;
  }
  if (top < 0) {
    top = 0;
  }

  /* eslint-disable no-param-reassign */
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}
