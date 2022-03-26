<script lang="ts">
/* eslint-disable import/no-extraneous-dependencies */
import { createEventDispatcher } from 'svelte';
import { slide } from 'svelte/transition';
import type { Lang } from '../types';
import ResultEntry from './ResultEntry.svelte';

const dispatch = createEventDispatcher();

export let lang: Lang;
export let text: string;

function onToggleLanguage() {
  lang.enabled = !lang.enabled;
  if (lang.enabled) {
    dispatch('toggle', lang);
  }
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
    <div class="content" transition:slide>
      {#await lang.request(text)}
        <svg aria-hidden="true" class="loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 100">
          <circle cx="6" cy="50" r="6">
            <animateTransform
               attributeName="transform"
               dur="1s"
               type="translate"
               values="0 15 ; 0 -15; 0 15"
               repeatCount="indefinite"
               begin="0.1"/>
          </circle>
          <circle cx="30" cy="50" r="6">
            <animateTransform
               attributeName="transform"
               dur="1s"
               type="translate"
               values="0 10 ; 0 -10; 0 10"
               repeatCount="indefinite"
               begin="0.2"/>
          </circle>
          <circle cx="54" cy="50" r="6">
            <animateTransform
               attributeName="transform"
               dur="1s"
               type="translate"
               values="0 5 ; 0 -5; 0 5"
               repeatCount="indefinite"
               begin="0.3"/>
          </circle>
        </svg>
      {:then results}
        {#each results as entry}
          <ResultEntry entry={entry}></ResultEntry>
        {/each}
      {:catch error}
        <div class="tip">
          {#if lang.type === 'en'}
            <p>(如果这不是英语，请切换为下方其它语言)</p>
          {/if}
          <p>{error.message || '查询出错'}，点击右上箭头，或试试这些词典:</p>
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
  margin-top: 0.5em;
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
  height: 12em;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-gutter: stable;

  background:
    linear-gradient(#fff 33%, rgba(255,255,255, 0)),
    linear-gradient(rgba(255,255,255, 0), #fff 66%) 0 100%,
    radial-gradient(farthest-side at 50% 0, rgba(200,200,200, 0.5), rgba(0,0,0,0)),
    radial-gradient(farthest-side at 50% 100%, rgba(200,200,200, 0.5), rgba(0,0,0,0)) 0 100%;
  background-color: #fff;
  background-repeat: no-repeat;
  background-attachment: local, local, scroll, scroll;
  background-size: 100% 12px, 100% 12px, 100% 4px, 100% 4px;
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
  height: 100%;
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
  padding: 3.5em;
  margin: 0 auto;
  height: 100%;
  aspect-ratio: 1;
  fill: var(--main-color);
  opacity: 0.75;
}
</style>
