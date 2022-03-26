<script lang="ts">
import type { Lang } from '../types';
import LangSection from './LangSection.svelte';
import langs from '../config';
import { setPosition } from '../util';

let text = '';
let rect: DOMRect;
let trigger: HTMLButtonElement;
let panel: HTMLDivElement;
let showTrigger = false;
let showPanel = false;
let currentLangs: Lang[] = [];

window.addEventListener('mouseup', () => {
  const selection = window.getSelection() as Selection;
  text = selection.toString().trim().toLowerCase();
  if (text) {
    const rects = selection.getRangeAt(0).getClientRects();
    rect = rects[rects.length - 1];

    setPosition(trigger, rect);
    showTrigger = true;
  }
});

window.addEventListener('mousedown', () => {
  showTrigger = false;
  showPanel = false;
  currentLangs = [];
});

function onTranslate() {
  const filterResult = Object.values(langs).filter((lang: Lang) => lang.is(text));
  // 只有谷歌翻译结果时，默认展开谷歌翻译
  const typeAll = filterResult.find((lang) => lang.type === 'all');
  if (typeAll) {
    typeAll.enabled = filterResult.length === 1;
  }

  currentLangs = filterResult;
  setTimeout(() => {
    // 156 用于补偿受展开动画影响而缺失的面板高度
    setPosition(panel, rect, 156);
    showTrigger = false;
    showPanel = true;
  });
}

function onToggleLanguage(event: CustomEvent<Lang>) {
  currentLangs = currentLangs.map((currentLang) => {
    if (currentLang !== event.detail) {
      // eslint-disable-next-line no-param-reassign
      currentLang.enabled = false;
    }
    return currentLang;
  });
}
</script>

<div
  class="app"
  on:mousedown|stopPropagation
  on:mouseup|stopPropagation
>
  <button
    bind:this={trigger}
    class="trigger"
    class:is-show={showTrigger}
    aria-label="开始翻译"
    on:click={onTranslate}
  >
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
</button>

  <div
    bind:this={panel}
    class="panel"
    class:is-show={showPanel}
  >
    {#each currentLangs as lang}
      <LangSection lang={lang} text={text} on:toggle="{onToggleLanguage}"></LangSection>
    {/each}
  </div>
</div>

<style>
.app {
  --main-color: #0C9553;

  font-size: 16px;
  color: #000;
}

.trigger {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: block;
  width: 24px;
  height: 24px;
  padding: 4px;
  border: 0;
  border-radius: 15%;
  background-color: var(--main-color);
  color: #fff;
  transition: visibility 0.3s, opcacity 0.3s;
  cursor: pointer;
}

.trigger:hover {
  opacity: 0.85;
}

.panel {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 24em;
  /* min-height: 10em; */
  max-height: 90vh;
  padding: 0.5em 1em 1.2em;
  border: 1px solid #eee;
  background-color: #fff;
  box-shadow:
    3px 2.8px 4.2px -5px rgba(0, 0, 0, 0.07),
    7.3px 6.7px 10px -5px rgba(0, 0, 0, 0.05),
    13.8px 12.5px 18.8px -5px rgba(0, 0, 0, 0.042),
    24.6px 22.3px 33.5px -5px rgba(0, 0, 0, 0.035),
    46px 41.8px 62.7px -5px rgba(0, 0, 0, 0.028),
    110px 100px 150px -5px rgba(0, 0, 0, 0.02)
  ;
  font-family: "Segoe UI", "Microsoft Yahei", meiryo, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  transition: visibility 0.2s, opacity 0.2s;
  transition-timing-function: ease-in;
}

.trigger:not(.is-show),
.panel:not(.is-show) {
  visibility: hidden;
  opacity: 0;
  transition: none;
}

.panel:empty {
  align-items: center;
}

.panel:empty::before {
  content: "不受支持的文本";
}
</style>
