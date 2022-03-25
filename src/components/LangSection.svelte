<script lang="ts">
import type { Lang } from '../types';
import ResultEntry from './ResultEntry.svelte';

export let lang: Lang;
export let text: string;

function onToggleLanguage() {
  lang.enabled = !lang.enabled;
}
</script>

<div class="lang {lang.type}">
  <div class="header">
    <button
      class="switch"
      role="switch"
      aria-checked="{lang.enabled}"
      title="{lang.enabled ? '收起' : '展开'}{lang.name}语查询"
      on:click={onToggleLanguage}
    >
      {#if lang.enabled}
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
      {/if}


    </button>
    <span class="name">{lang.name}</span>
    <a
      class="more"
      target="_blank"
      rel="noopener noreferrer"
      href="{lang.url}{text}"
      title="详细释义"
      on:click|stopPropagation
    >
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    </a>
  </div>

  {#if lang.enabled}
    <div class="content">
      {#await lang.request(text)}
        <svg aria-hidden="true" class="loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">
            <rect x="20" y="20" width="4" height="10">
              <animateTransform
                attributeType="xml"
                attributeName="transform" type="translate"
                values="0 0; 0 20; 0 0"
                begin="0" dur="0.6s" repeatCount="indefinite"
              />
            </rect>
            <rect x="30" y="20" width="4" height="10">
              <animateTransform attributeType="xml"
                attributeName="transform" type="translate"
                values="0 0; 0 20; 0 0"
                begin="0.2s" dur="0.6s" repeatCount="indefinite"
              />
            </rect>
            <rect x="40" y="20" width="4" height="10">
              <animateTransform
                attributeType="xml"
                attributeName="transform" type="translate"
                values="0 0; 0 20; 0 0"
                begin="0.4s" dur="0.6s" repeatCount="indefinite"
              />
            </rect>
        </svg>
      {:then results}
        {#each results as entry}
          <ResultEntry entry={entry}></ResultEntry>
        {/each}
      {:catch error}
        <div class="tip">
          <p>{error.message || '查询出错'}，点击右上箭头，或试试这些词典：</p>
          <p class="alternatives">
            {#each lang.alternatives.concat([{
              name: '维基词典',
              url: 'https://en.wiktionary.org/wiki/',
              icon: 'https://en.wiktionary.org/static/apple-touch/wiktionary/en.png',
            }]) as item }
              <a href="{item.url + text}" target="_blank" title="去{item.name}查询{text}">
                <img src="{item.icon}" alt="{item.name}" width="24" height="24">
              </a>
            {/each}
          </p>
        </div>
      {/await}
    </div>
  {/if}
</div>

<style>
.lang:not(:first-child) {
  margin-top: 1em;
}

.header {
  display: flex;
  align-items: center;
  height: 2.5em;
  border-bottom: 1px solid #f5f5f5;
  font-size: 12px;
  transition: 0.2s;
}
.switch {
  all: unset;
  width: 1em;
  height: 1em;
  padding: 0.5em;
  margin-left: -0.5em;
  cursor: pointer;
}

.switch > svg {
  fill: #a2a5a6;
}

.switch:hover > svg {
  fill: var(--main-color);
}

.name {
  margin: 0;
  color: var(--main-color);
  font-family: 'Segoe UI', 'Malgun Gothic', meiryo, sans-serif;
  font-weight: 600;
  margin-right: auto;
}

.more {
  width: 1rem;
  height: 1rem;
  padding: 0.5em;
  color: #a2a5a6;
  transition: 0.3s;
}

.more:hover {
  color: #000;
}

.content {
  min-height: var(--content-min-height);
  max-height: 250px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-gutter: stable;
}

.content a {
  color:var(--main-color);
}

.tip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1em;
  width: 100%;
  height: var(--content-min-height);
  margin-top: 0.5em;
  color: #666;
}

.tip p {
  margin: 0;
}

.alternatives {
  display: flex;
  gap: 0.4em;
}

.alternatives img {
  border-radius: 3px;
}

.loading {
  box-sizing: border-box;
  display: block;
  padding: 1.5em;
  margin: 0.5em auto 0;
  width: var(--content-min-height);
  height: var(--content-min-height);
  color: var(--main-color);
  opacity: 0.75;
}
</style>
