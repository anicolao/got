<script lang="ts">
  import { page } from '$app/stores';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import { authState } from '$lib/firebase/auth-store';
  import {
    answer_category,
    displayName,
    displayPlayerName,
    eliminatedPlayersForCurrentRound,
    join_game,
    remainingPlayersByScore
  } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';
  import { lobbyStore, subscribeLobby } from '$lib/firebase/lobby-store';
  import { onMount } from 'svelte';

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const urlMe = $page.url.searchParams.get('me') || 'player@example.com';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);
  let answer = '';
  let lastCategory = '';

  onMount(() => {
    if (!localMode) subscribeLobby();
  });

  $: snapshot = $game;
  $: state = snapshot.state;
  $: me = localMode ? urlMe : $authState.user?.email || '';
  $: signedIn = localMode || !!$authState.user?.email;
  $: joined = state.players.includes(me);
  $: existingAnswer = state.playerToAnswer[me] || '';
  $: playerName = localMode ? displayName(me) : displayPlayerName(me, $lobbyStore.users);
  $: remainingPlayers = remainingPlayersByScore(state);
  $: eliminatedPlayers = eliminatedPlayersForCurrentRound(snapshot.actions);
  $: if (state.currentCategory !== lastCategory) {
    lastCategory = state.currentCategory;
    answer = '';
  }
  $: nameOf = (player: string) => localMode ? displayName(player) : displayPlayerName(player, $lobbyStore.users);

  function submit() {
    if (answer.trim()) game.dispatch(answer_category({ player: me, answer: answer.trim() }));
  }
</script>

<svelte:head>
  <title>Player | Game of Things</title>
</svelte:head>

<main class="player">
  <section class="play-card">
    {#if !signedIn}
      <p class="label">Player</p>
      <h1>Sign in to play</h1>
      <p class="category">Your answer is tied to your Google account.</p>
    {:else}
      <div class="category-block">
        <p class="label">Category</p>
        <h1>Things {state.currentCategory ? `... ${state.currentCategory}` : 'are waiting for a category'}</h1>
      </div>

      {#if !joined}
        <button class="primary" on:click={() => game.dispatch(join_game(me))}>Join Game</button>
      {:else if state.showRound}
        <section class="progress" aria-label="Guessing progress">
          <div>
            <p class="label">Still in</p>
            {#if remainingPlayers.length === 0}
              <p class="muted">No players remain.</p>
            {:else}
              <ol class="roster">
                {#each remainingPlayers as player}
                  {@const index = state.players.indexOf(player)}
                  <li>
                    <span>{nameOf(player)}</span>
                    <strong>{state.scores[index] || 0}</strong>
                  </li>
                {/each}
              </ol>
            {/if}
          </div>

          <div>
            <p class="label">Eliminated</p>
            {#if eliminatedPlayers.length === 0}
              <p class="muted">No one has been eliminated yet.</p>
            {:else}
              <ul class="eliminated">
                {#each eliminatedPlayers as player}
                  <li>{nameOf(player)} said {state.playerToAnswer[player]}</li>
                {/each}
              </ul>
            {/if}
          </div>
        </section>
      {:else}
        <label>
          {existingAnswer ? `Your answer: ${existingAnswer}` : 'Your answer'}
          <input aria-label="Your answer" bind:value={answer} placeholder="Type something the room can guess" />
        </label>
        <button class="primary" on:click={submit}>{existingAnswer ? 'Update' : 'Submit'}</button>
        {#if snapshot.error}
          <p class="error">{snapshot.error}</p>
        {/if}
      {/if}
    {/if}
  </section>

  <footer class="player-footer">
    {#if signedIn}
      <div class="player-info">
        <p class="label">Player</p>
        <strong>{playerName}</strong>
      </div>
    {/if}
    {#if !localMode}
      <AuthBar />
    {/if}
  </footer>
</main>

<style>
  .player {
    min-height: 100svh;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 14px;
    padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
  }

  .play-card {
    width: min(100%, 460px);
    align-self: start;
    justify-self: center;
    display: grid;
    gap: 18px;
    background: #fff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    padding: 18px;
    margin-top: clamp(18px, 8vh, 72px);
  }

  p,
  h1 {
    margin: 0;
  }

  .label {
    color: #b42318;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  h1 {
    font-size: clamp(1.65rem, 8vw, 2.7rem);
    line-height: 1.05;
  }

  .category-block {
    display: grid;
    gap: 6px;
  }

  .category,
  .player-info,
  .muted {
    color: #475569;
    line-height: 1.4;
  }

  .error {
    margin: 0;
    color: #b42318;
    font-weight: 800;
  }

  label {
    display: grid;
    gap: 8px;
    font-weight: 800;
  }

  input {
    min-height: 48px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 0 12px;
    font: inherit;
  }

  button {
    min-height: 48px;
    border-radius: 6px;
    font-weight: 900;
    background: #fff;
    border: 1px solid #b8c0cc;
  }

  .primary {
    color: #fff;
    background: #0f172a;
    border-color: #0f172a;
  }

  .progress {
    display: grid;
    gap: 18px;
  }

  .roster,
  .eliminated {
    display: grid;
    gap: 8px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }

  .roster li,
  .eliminated li {
    min-height: 42px;
    display: grid;
    align-items: center;
    border: 1px solid #d8dee8;
    border-radius: 6px;
    background: #f8fafc;
    padding: 8px 10px;
  }

  .roster li {
    grid-template-columns: 1fr auto;
    gap: 10px;
  }

  .roster strong {
    font-size: 1.15rem;
  }

  .player-footer {
    position: sticky;
    bottom: 0;
    width: min(100%, 460px);
    justify-self: center;
    display: grid;
    gap: 8px;
  }

  .player-info {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: #fff;
  }

  .player-info strong {
    color: #0f172a;
  }
</style>
