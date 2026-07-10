<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import QRCode from '$lib/components/QRCode.svelte';
  import { displayPlayerName } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';
  import { lobbyStore, subscribeLobby } from '$lib/firebase/lobby-store';
  import { onMount } from 'svelte';

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);
  onMount(() => {
    if (!localMode) subscribeLobby();
  });
  $: snapshot = $game;
  $: state = snapshot.state;
  $: answers = state.players.map((player) => ({
    player,
    answer: state.playerToAnswer[player],
    alive: state.alive[state.players.indexOf(player)]
  }));
  $: joinUrl = `${$page.url.origin}${base}/play?slug=${encodeURIComponent(tableId)}`;
  $: nameOf = (player: string) => displayPlayerName(player, $lobbyStore.users);
</script>

<svelte:head>
  <title>Cast | Game of Things</title>
</svelte:head>

<main class="cast">
  <header>
    <p>Game of Things</p>
    <h1>{state.showRound ? `Things ... ${state.currentCategory}` : 'Scan to join the table'}</h1>
  </header>

  {#if state.showRound}
    <section class="answers" aria-label="Answers">
      {#each answers as item}
        <article class:out={!item.alive}>
          <span>{item.answer}</span>
        </article>
      {/each}
    </section>
    <aside class="scores" aria-label="Scores">
      {#each state.players as player, i}
        <div class:current={i === state.currentPlayerIndex}>
          <strong>{nameOf(player)}</strong>
          <span>{state.scores[i]}</span>
        </div>
      {/each}
    </aside>
  {:else}
    <section class="join">
      <div class="qr-wrap">
        <QRCode value={joinUrl} label="Join game QR code" />
      </div>
      <p>Scan to join</p>
    </section>
  {/if}
</main>

<style>
  .cast {
    width: 100vw;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
    padding: clamp(12px, 2.4vw, 34px);
    background: #0f172a;
    color: #fff;
    display: grid;
    grid-template-columns: 1fr minmax(220px, 28vw);
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(10px, 1.8vw, 22px);
  }

  header {
    grid-column: 1 / -1;
  }

  p,
  h1 {
    margin: 0;
  }

  header p {
    color: #facc15;
    font-weight: 900;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 5px;
    font-size: clamp(1.4rem, 4.4vw, 4.4rem);
    line-height: 1.02;
    max-height: 2.1em;
    overflow: hidden;
  }

  .answers {
    display: grid;
    grid-auto-rows: minmax(0, min(13vh, 132px));
    align-content: start;
    gap: clamp(6px, 1vw, 12px);
    min-height: 0;
    overflow: hidden;
  }

  article {
    min-height: 0;
    display: grid;
    align-items: center;
    background: #ffffff;
    color: #111827;
    border-radius: 8px;
    padding: clamp(8px, 1.4vw, 18px);
    font-size: clamp(0.95rem, 2vw, 2.2rem);
    font-weight: 900;
    overflow: hidden;
  }

  article span {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  article.out {
    background: #fee2e2;
    color: #7f1d1d;
    text-decoration: line-through;
  }

  .scores {
    display: grid;
    grid-auto-rows: minmax(0, min(8vh, 74px));
    align-content: start;
    gap: clamp(5px, 0.8vw, 10px);
    min-height: 0;
    overflow: hidden;
  }

  .scores div {
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 8px;
    padding: clamp(6px, 1vw, 10px);
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .scores strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scores .current {
    border-color: #facc15;
    background: rgba(250, 204, 21, 0.16);
  }

  .scores span {
    font-size: clamp(1rem, 2vw, 1.6rem);
    font-weight: 900;
  }

  .join {
    grid-column: 1 / -1;
    min-height: 0;
    display: grid;
    place-items: center;
    gap: 16px;
    overflow: hidden;
  }

  .qr-wrap {
    width: min(46vw, 46vh, 420px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    background: #facc15;
    border: clamp(8px, 1.4vw, 14px) solid #fff;
    padding: clamp(8px, 1.4vw, 14px);
  }

  .join p {
    font-size: clamp(1.2rem, 2.8vw, 3rem);
    font-weight: 900;
    color: #facc15;
  }

  @media (max-width: 720px) {
    .cast {
      grid-template-columns: 1fr;
      grid-template-rows: auto minmax(0, 1fr) minmax(96px, 26vh);
    }
  }
</style>
