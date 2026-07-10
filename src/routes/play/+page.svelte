<script lang="ts">
  import { page } from '$app/stores';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import { authState } from '$lib/firebase/auth-store';
  import { answer_category, displayName, displayPlayerName, join_game } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';
  import { lobbyStore, subscribeLobby } from '$lib/firebase/lobby-store';
  import { onMount } from 'svelte';

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const urlMe = $page.url.searchParams.get('me') || 'player@example.com';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);
  let answer = '';

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
  .player-info {
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
