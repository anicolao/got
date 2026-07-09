<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import {
    answer_category,
    currentPlayer,
    displayName,
    guesses,
    join_game,
    leave_game,
    nextLivingPlayerIndex,
    set_category,
    set_current_player,
    show_round
  } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';

  const tableId = $page.url.searchParams.get('slug') || 'demo';
  const me = $page.url.searchParams.get('me') || 'moderator@example.com';
  const localMode =
    $page.url.searchParams.get('mode') === 'local' || tableId === 'demo' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);

  let ready = false;
  let category = '';
  let quickPlayer = '';
  let quickAnswer = '';

  $: snapshot = $game;
  $: state = snapshot.state;
  $: current = currentPlayer(state);
  $: waitingPlayers = state.players.filter((player) => !state.playerToAnswer[player]);

  function revealCategory() {
    const value = category.trim();
    if (value) game.dispatch(set_category(value));
  }

  function addPlayer() {
    const value = quickPlayer.trim();
    if (value) {
      game.dispatch(join_game(value));
      quickPlayer = '';
    }
  }

  function addAnswer() {
    if (quickPlayer.trim() && quickAnswer.trim()) {
      game.dispatch(answer_category({ player: quickPlayer.trim(), answer: quickAnswer.trim() }));
      quickAnswer = '';
    }
  }

  function wrongGuess() {
    game.dispatch(set_current_player(nextLivingPlayerIndex(state)));
  }

  onMount(() => {
    ready = true;
  });
</script>

<svelte:head>
  <title>Moderator | Game of Things</title>
</svelte:head>

<main class="shell" data-ready={ready}>
  <header>
    <div>
      <p class="label">Moderator</p>
      <h1>Game of Things</h1>
      <p class="table">Table {tableId}</p>
    </div>
    <a href={`/cast?slug=${encodeURIComponent(tableId)}`} target="_blank" rel="noreferrer">Cast</a>
  </header>

  {#if !localMode}
    <AuthBar />
  {/if}

  <section class="scoreboard" aria-label="Scoreboard">
    {#each state.players as player, i}
      <article class:out={!state.alive[i]} class:active={i === state.currentPlayerIndex && state.showRound}>
        <strong>{displayName(player)}</strong>
        <span>{state.scores[i]}</span>
        <button aria-label={`Remove ${displayName(player)}`} on:click={() => game.dispatch(leave_game(player))}>
          x
        </button>
      </article>
    {/each}
  </section>

  <section class="control">
    {#if snapshot.error}
      <p class="error">{snapshot.error}</p>
    {/if}
    <div class="section-title">
      <p class="label">Round</p>
      <h2>Things {state.currentCategory ? `... ${state.currentCategory}` : ''}</h2>
    </div>

    {#if !state.showRound || state.roundOver}
      <label>
        Category
        <input aria-label="Category" bind:value={category} placeholder="you should never say..." />
      </label>
      <button class="primary" on:click={revealCategory}>Reveal Category</button>

      <div class="inline-form">
        <label>
          Player
          <input aria-label="Player email" bind:value={quickPlayer} placeholder="player@example.com" />
        </label>
        <button on:click={addPlayer}>Join</button>
      </div>

      <div class="inline-form">
        <label>
          Answer
          <input aria-label="Answer for selected player" bind:value={quickAnswer} />
        </label>
        <button on:click={addAnswer}>Record</button>
      </div>

      {#if state.roundReady}
        <button class="primary" on:click={() => game.dispatch(show_round(true))}>Start Round</button>
      {:else if state.players.length > 0}
        <p class="waiting">Waiting for {waitingPlayers.map(displayName).join(', ')}</p>
      {/if}
    {:else}
      <p class="turn">Current player: <strong>{displayName(current)}</strong></p>
      <div class="eliminations">
        {#each state.players as player, i}
          {#if state.alive[i] && player !== current}
            <button on:click={() => game.dispatch(guesses({ player: current, dead_player: player }))}>
              {displayName(current)} guessed {displayName(player)}
            </button>
          {/if}
        {/each}
      </div>
      <button class="primary" on:click={wrongGuess}>{displayName(current)} guessed wrong</button>
    {/if}
  </section>

  <section class="log" aria-label="Action log">
    <h2>Actions</h2>
    <ol>
      {#each snapshot.actions as action}
        <li><code>{action.type}</code></li>
      {/each}
    </ol>
  </section>
</main>

<style>
  .shell {
    min-height: 100svh;
    padding: 14px;
    display: grid;
    gap: 14px;
  }

  header,
  .control,
  .log {
    background: #fff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    padding: 14px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-size: 1.55rem;
  }

  h2 {
    font-size: 1.1rem;
  }

  .label {
    color: #b42318;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  .table,
  .waiting {
    color: #64748b;
    margin-top: 4px;
  }

  .error {
    color: #b42318;
    font-weight: 800;
  }

  header a,
  button {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 6px;
    border: 1px solid #b8c0cc;
    background: #fff;
    text-decoration: none;
    display: inline-grid;
    place-items: center;
    font-weight: 800;
  }

  .primary {
    color: #fff;
    background: #0f172a;
    border-color: #0f172a;
  }

  .scoreboard {
    display: grid;
    gap: 8px;
  }

  article {
    display: grid;
    grid-template-columns: 1fr auto 36px;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    background: #ffffff;
    border: 1px solid #d8dee8;
    border-left: 5px solid #1d4ed8;
    border-radius: 8px;
    padding: 8px 8px 8px 12px;
  }

  article.out {
    border-left-color: #b42318;
    color: #64748b;
  }

  article.active {
    outline: 3px solid #facc15;
  }

  article span {
    font-size: 1.4rem;
    font-weight: 900;
  }

  article button {
    min-height: 36px;
    padding: 0;
  }

  .control {
    display: grid;
    gap: 12px;
  }

  .section-title {
    display: grid;
    gap: 4px;
  }

  label {
    display: grid;
    gap: 6px;
    font-weight: 800;
  }

  input {
    width: 100%;
    min-height: 46px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 0 12px;
  }

  .inline-form {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: end;
  }

  .eliminations {
    display: grid;
    gap: 8px;
  }

  .turn {
    color: #334155;
  }

  .log ol {
    margin: 10px 0 0;
    padding-left: 22px;
  }

  @media (min-width: 800px) {
    .shell {
      grid-template-columns: 1fr 360px;
      align-items: start;
      max-width: 1120px;
      margin: 0 auto;
    }

    header,
    .scoreboard {
      grid-column: 1 / -1;
    }
  }
</style>
