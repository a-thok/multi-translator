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
let matchedLangs: Lang[] = [];
let activeLang: Lang;

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
  matchedLangs = [];
});

function onTranslate() {
  matchedLangs = Object.values(langs).filter((lang: Lang) => lang.is(text));
  if (!activeLang || !matchedLangs.find((lang) => lang === activeLang)) {
    ([activeLang] = matchedLangs);
  }

  setTimeout(() => {
    setPosition(panel, rect);
    showTrigger = false;
    showPanel = true;
  });
}

function onToggleLanguage(targetLang: Lang) {
  activeLang = targetLang;
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
    <ul class="tabs" role="tablist">
      {#each matchedLangs as lang}
        <li
          class="tab{lang === activeLang ? ' active' : ''}"
          title="{lang.name}"
          role="tab"
          aria-selected="{lang === activeLang}"
          on:click="{() => onToggleLanguage(lang)}"
        >
          {lang.name.split('')[0]}
        </li>
      {/each}
      {#if activeLang}
        <li class="more">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="{activeLang.url}{text}"
            title="详细释义"
            on:click|stopPropagation
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </li>
      {/if}
    </ul>

    {#if activeLang}
      <LangSection lang={activeLang} text={text}></LangSection>
    {/if}
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
  height: 16em;
  width: 24em;
  max-width: 100vw;
  max-height: 100vh;
  padding-bottom: 0.5em;
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

.tabs {
  list-style: none;
  display: flex;
  padding: 0;
  border-bottom: 1px solid #f5f5f5;
  margin: 0;
  background-color: #fcfcfc;
  user-select: none;
}

.tab {
  flex: none;
  padding: 0.5em 1em;
  border-right: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: -1px;
  color: #666;
  cursor: pointer;
  transition: 0.2s;
}

.tab.active {
  padding-inline: 1.25em;
  background-color: #fff;
  color: var(--main-color);
  border-bottom-color: #fff;
  font-weight: bold;
}

.more {
  box-sizing: border-box;;
  height: 100%;
  margin-left: auto;
  aspect-ratio: 1;
}

.more a {
  display: block;
  padding: 0.65em;
  color: #a2a5a6;
  line-height: 0;
  transition: 0.3s;
}

.more a:hover {
  color: #000;
}
</style>
