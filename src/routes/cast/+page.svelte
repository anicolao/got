<script lang="ts">
  import { page } from '$app/stores';
  import { displayName } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);
  $: snapshot = $game;
  $: state = snapshot.state;
  $: answers = state.players.map((player) => ({
    player,
    answer: state.playerToAnswer[player],
    alive: state.alive[state.players.indexOf(player)]
  }));
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
          <strong>{displayName(player)}</strong>
          <span>{state.scores[i]}</span>
        </div>
      {/each}
    </aside>
  {:else}
    <section class="join">
      <div aria-label="Join code">{tableId}</div>
      <p>Open the player screen and enter this table.</p>
    </section>
  {/if}
</main>

<style>
  .cast {
    min-height: 100svh;
    padding: clamp(20px, 4vw, 48px);
    background: #0f172a;
    color: #fff;
    display: grid;
    grid-template-columns: 1fr minmax(220px, 28vw);
    grid-template-rows: auto 1fr;
    gap: 24px;
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
    margin-top: 8px;
    font-size: clamp(2rem, 6vw, 5.5rem);
    line-height: 1.02;
  }

  .answers {
    display: grid;
    gap: 14px;
    align-content: start;
  }

  article {
    min-height: 72px;
    display: grid;
    align-items: center;
    background: #ffffff;
    color: #111827;
    border-radius: 8px;
    padding: 18px 22px;
    font-size: clamp(1.25rem, 2.4vw, 2.4rem);
    font-weight: 900;
  }

  article.out {
    background: #fee2e2;
    color: #7f1d1d;
    text-decoration: line-through;
  }

  .scores {
    display: grid;
    align-content: start;
    gap: 10px;
  }

  .scores div {
    min-height: 54px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 8px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.08);
  }

  .scores .current {
    border-color: #facc15;
    background: rgba(250, 204, 21, 0.16);
  }

  .scores span {
    font-size: 1.6rem;
    font-weight: 900;
  }

  .join {
    grid-column: 1 / -1;
    display: grid;
    place-items: center;
    gap: 16px;
  }

  .join div {
    width: min(62vw, 420px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 12px solid #fff;
    font-size: clamp(2rem, 7vw, 5rem);
    font-weight: 900;
    background: #facc15;
    color: #111827;
  }

  @media (max-width: 720px) {
    .cast {
      grid-template-columns: 1fr;
    }
  }
</style>
