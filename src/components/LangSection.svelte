<script lang="ts">
/* eslint-disable import/no-extraneous-dependencies */
import type { Lang } from '../types';
import ResultEntry from './ResultEntry.svelte';

export let lang: Lang;
export let text: string;
</script>

<div class="content">
  {#await lang.request(text)}
    <svg aria-hidden="true" class="loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100">
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
  {:catch}
    <div class="tip">
      <p>{'查无结果'}，点击右上箭头，或试试这些词典:</p>
      <p class="alternatives">
        {#each lang.alternatives.concat([
          {
            name: '维基词典',
            url: 'https://zh.wiktionary.org/wiki/',
            icon: 'data:image/x-icon;base64,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',
          },
          {
            name: 'Wiktionary',
            url: 'https://en.wiktionary.org/wiki/',
            icon: 'data:image/x-icon;base64,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',
          },
        ]) as item }
          <a href="{item.url + text}" target="_blank" title="去{item.name}查询“{text}”">
            <img src="{item.icon}" alt="{item.name}" width="20" height="20">
          </a>
        {/each}
      </p>
      {#if lang.type === 'en'}
        <p>(所查若非英语，请手动切换语言)</p>
      {/if}
    </div>
  {/await}
</div>

<style>
.content {
  flex: auto;
  padding: 0 1em;
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

.content:has(> .tip, > .loading) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1em;
  width: 100%;
  color: #666;
}

.tip p {
  margin: 0;
}

.alternatives {
  display: flex;
  gap: 0.4em;
}

.alternatives a {
  padding: 0.5em;
  border-radius: 3px;
  background-color: #eee;
}

.alternatives img {
  display: block;
}

.loading {
  box-sizing: border-box;
  display: block;
  margin: 0 auto;
  height: 4em;
  fill: var(--main-color);
  opacity: 0.75;
}
</style>
