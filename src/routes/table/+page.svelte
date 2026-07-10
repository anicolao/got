<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import { authState } from '$lib/firebase/auth-store';
  import { lobbyStore, subscribeLobby } from '$lib/firebase/lobby-store';
  import { drawNextPromptCard } from '$lib/firebase/prompt-deck';
  import {
    answer_category,
    currentPlayer,
    displayPlayerName,
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

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const urlMe = $page.url.searchParams.get('me') || 'moderator@example.com';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);

  let ready = false;
  let category = '';
  let answer = '';
  let quickPlayer = '';
  let quickAnswer = '';
  let drawingPrompt = false;
  let promptError = '';

  $: snapshot = $game;
  $: state = snapshot.state;
  $: me = localMode ? urlMe : $authState.user?.email || '';
  $: signedIn = localMode || !!$authState.user?.email;
  $: current = currentPlayer(state);
  $: waitingPlayers = state.players.filter((player) => !state.playerToAnswer[player]);
  $: submittedPlayers = state.players.filter((player) => !!state.playerToAnswer[player]);
  $: joined = !!me && state.players.includes(me);
  $: myAnswer = state.playerToAnswer[me] || '';

  function revealCategory() {
    const value = category.trim();
    if (value) game.dispatch(set_category(value));
  }

  async function autofillCategory() {
    drawingPrompt = true;
    promptError = '';
    try {
      const card = await drawNextPromptCard();
      category = card.text;
    } catch (error) {
      promptError = error instanceof Error ? error.message : String(error);
    } finally {
      drawingPrompt = false;
    }
  }

  function submitAnswer() {
    const value = answer.trim();
    if (value && me) {
      game.dispatch(answer_category({ player: me, answer: value }));
    }
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
    if (!localMode) subscribeLobby();
  });

  $: table = $lobbyStore.tables.tableIdToTable[tableId];
  $: isOwner = localMode || table?.owner === me;
  $: nameOf = (player: string) => displayPlayerName(player, $lobbyStore.users);
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
    <a href={`${base}/cast?slug=${encodeURIComponent(tableId)}${localMode ? '&mode=local' : ''}`} target="_blank" rel="noreferrer">Cast</a>
  </header>

  {#if !localMode}
    <AuthBar />
  {/if}

  {#if signedIn && isOwner}
    <section class="scoreboard" aria-label="Scoreboard">
      {#each state.players as player, i}
        <article class:out={!state.alive[i]} class:active={i === state.currentPlayerIndex && state.showRound}>
          <strong>{nameOf(player)}</strong>
          <span>{state.scores[i]}</span>
          <button aria-label={`Remove ${nameOf(player)}`} on:click={() => game.dispatch(leave_game(player))}>
            x
          </button>
        </article>
      {/each}
    </section>
  {/if}

  {#if signedIn && joined}
    <section class="player-panel" aria-label="Your clue">
      <div>
        <p class="label">Your clue</p>
        <h2>Things {state.currentCategory ? `... ${state.currentCategory}` : 'need a category first'}</h2>
      </div>
      {#if myAnswer}
        <p class="submitted">Submitted: <strong>{myAnswer}</strong></p>
      {/if}
      {#if !state.showRound || state.roundOver}
        <label>
          Your clue
          <textarea aria-label="Your clue" bind:value={answer} placeholder="Type your clue"></textarea>
        </label>
        <button class="primary" disabled={!state.currentCategory || !answer.trim()} on:click={submitAnswer}>
          Submit Clue
        </button>
      {/if}
    </section>
  {/if}

  <section class="control">
    {#if snapshot.error}
      <p class="error">{snapshot.error}</p>
    {/if}
    {#if !signedIn}
      <p class="waiting">Sign in to moderate this table.</p>
    {:else if !isOwner}
      <p class="waiting">Only {nameOf(table?.owner || 'the table owner')} can moderate this table.</p>
      <a class="primary" href={`${base}/play?slug=${encodeURIComponent(tableId)}`}>Play at this table</a>
    {:else}
      <div class="section-title">
        <p class="label">Round</p>
        <h2>Things {state.currentCategory ? `... ${state.currentCategory}` : ''}</h2>
      </div>

      {#if !state.showRound || state.roundOver}
        <label>
          Category
          <input aria-label="Category" bind:value={category} placeholder="you should never say..." />
        </label>
        <button disabled={drawingPrompt} on:click={autofillCategory}>Draw Category Card</button>
        {#if promptError}
          <p class="error">{promptError}</p>
        {/if}
        <button class="primary" on:click={revealCategory}>Reveal Category</button>

        <div class="readiness" aria-label="Player readiness">
          <div>
            <h3>Submitted ({submittedPlayers.length})</h3>
            {#if submittedPlayers.length === 0}
              <p class="waiting">No clues submitted yet.</p>
            {:else}
              <ul>
                {#each submittedPlayers as player}
                  <li>
                    <span>{nameOf(player)}</span>
                    <strong>Ready</strong>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
          <div>
            <h3>Waiting ({waitingPlayers.length})</h3>
            {#if waitingPlayers.length === 0}
              <p class="waiting">Everyone is ready.</p>
            {:else}
              <ul>
                {#each waitingPlayers as player}
                  <li>
                    <span>{nameOf(player)}</span>
                    <button aria-label={`Remove ${nameOf(player)}`} on:click={() => game.dispatch(leave_game(player))}>Remove</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        {#if localMode}
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
        {:else if state.players.length === 0}
          <p class="waiting">Waiting for signed-in players to join.</p>
        {/if}

        {#if state.roundReady}
          <button class="primary" on:click={() => game.dispatch(show_round(true))}>
            Show Answers on Cast
          </button>
        {:else if state.players.length > 0}
          <p class="waiting">Waiting for {waitingPlayers.map(nameOf).join(', ')}</p>
        {/if}
      {:else}
        <p class="turn">Current player: <strong>{nameOf(current)}</strong></p>
        <div class="eliminations">
          {#each state.players as player, i}
            {#if state.alive[i] && player !== current}
              <button on:click={() => game.dispatch(guesses({ player: current, dead_player: player }))}>
                {nameOf(current)} guessed {nameOf(player)}
              </button>
            {/if}
          {/each}
        </div>
        <button class="primary" on:click={wrongGuess}>{nameOf(current)} guessed wrong</button>
      {/if}
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
    max-width: 840px;
    margin: 0 auto;
  }

  header,
  .control,
  .player-panel,
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
    background: #fee2e2;
    color: #7f1d1d;
    text-decoration: line-through;
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
    text-decoration: none;
  }

  .control {
    display: grid;
    gap: 12px;
  }

  .player-panel {
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

  textarea {
    width: 100%;
    min-height: 104px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 10px 12px;
    resize: vertical;
  }

  .submitted {
    color: #15803d;
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

  .readiness {
    display: grid;
    gap: 10px;
  }

  .readiness h3 {
    margin: 0 0 8px;
    font-size: 0.95rem;
  }

  .readiness ul {
    list-style: none;
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
  }

  .readiness li {
    min-height: 42px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    border: 1px solid #d8dee8;
    border-radius: 6px;
    padding: 6px 8px;
    background: #f8fafc;
  }

  .readiness strong {
    color: #15803d;
  }

  .log ol {
    margin: 10px 0 0;
    padding-left: 22px;
  }

  @media (min-width: 800px) {
    .shell {
      padding-block: 20px;
    }
  }
</style>
