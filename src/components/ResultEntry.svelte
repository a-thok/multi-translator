<script lang="ts">
import type { Entry } from '../types';
import { get } from '../util';

export let entry: Entry;

let isPlaying = false;

const audio = new Audio();
audio.addEventListener('ended', () => {
  isPlaying = false;
});

async function play() {
  isPlaying = true;

  if (audio.src) {
    audio.play();
    return;
  }

  const res = await get(entry.sound as string, 'blob') as unknown as Blob;
  const blob = res.slice(0, res.size, 'audio/mpeg');
  audio.src = URL.createObjectURL(blob);
  audio.play();
}
</script>

<div class="entry">
  {#if entry.word}
    <div class="info">
      <h2 class="word">{@html entry.word}</h2>
      {#if entry.phonetic}
        <span class="phonetic">[{@html entry.phonetic}]</span>
      {/if}
      {#if entry.sound}
        <button
          class="sound"
          aria-label="播放"
          disabled={isPlaying}
          on:click={play}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      {/if}
    </div>
  {/if}

  <ul class="meanings">
    {#each entry.meanings as meaning}
      <li class="meaning">
        {#if meaning.type}
          <div class="meaning-type">{meaning.type}</div>
        {/if}
        <ol class="meaning-content">
          {#each meaning.items as item}
            <li>{@html item}</li>
          {/each}
        </ol>
      </li>
    {/each}
  </ul>
</div>

<style>
.info {
  display: flex;
  align-items: baseline;
  margin: 0.5em 0;
}

.word {
  margin: 0;
}

.phonetic {
  margin-left: 0.5em;
  color: #a2a5a6;
}

.sound {
  all: unset;
  align-self: center;
  width: 1.5em;
  height: 1.5em;
  padding: 0.1em;
  margin-left: auto;
  color: var(--main-color);
  cursor: pointer;
}

.sound:disabled {
  opacity: 0.3;
}
.meanings {
  all: unset;
}

.meaning {
  list-style: none;
  margin: 0.4em 0;
}

.meaning-type {
  margin-right: 0.5em;
  color: var(--main-color);
}

.meaning-content {
  all: unset;
}

:global(.en) .meaning,
:global(.fr) .meaning,
:global(.th) .meaning {
  display: flex;
}
</style>
