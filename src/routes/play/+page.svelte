<script lang="ts">
  import { page } from '$app/stores';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import { authState } from '$lib/firebase/auth-store';
  import { answer_category, displayName, join_game } from '$lib/domain/things';
  import { getLocalSession } from '$lib/domain/session';
  import { createRemoteGame } from '$lib/firebase/remote-game';

  const tableId = $page.url.searchParams.get('slug') || 'game-night';
  const urlMe = $page.url.searchParams.get('me') || 'player@example.com';
  const localMode = $page.url.searchParams.get('mode') === 'local' || tableId.startsWith('e2e-');
  const game = localMode ? getLocalSession(tableId) : createRemoteGame(tableId);
  let answer = '';

  $: snapshot = $game;
  $: state = snapshot.state;
  $: me = localMode ? urlMe : $authState.user?.email || '';
  $: signedIn = localMode || !!$authState.user?.email;
  $: joined = state.players.includes(me);
  $: existingAnswer = state.playerToAnswer[me] || '';

  function submit() {
    if (answer.trim()) game.dispatch(answer_category({ player: me, answer: answer.trim() }));
  }
</script>

<svelte:head>
  <title>Player | Game of Things</title>
</svelte:head>

<main class="player">
  <section>
    {#if !localMode}
      <AuthBar />
    {/if}
    {#if !signedIn}
      <p class="label">Player</p>
      <h1>Sign in to play</h1>
      <p class="category">Your answer is tied to your Google account.</p>
    {:else}
      <p class="label">Player</p>
      <h1>{displayName(me)}</h1>
      <p class="category">Things {state.currentCategory ? `... ${state.currentCategory}` : 'are waiting for a category'}</p>

      {#if !joined}
        <button class="primary" on:click={() => game.dispatch(join_game(me))}>Join Game</button>
      {:else}
        <label>
          Your answer
          <textarea aria-label="Your answer" bind:value={answer} placeholder="Type something the room can guess"></textarea>
        </label>
        <button class="primary" on:click={submit}>Submit Answer</button>
        {#if existingAnswer}
          <p class="submitted">Submitted: <strong>{existingAnswer}</strong></p>
        {/if}
        {#if snapshot.error}
          <p class="error">{snapshot.error}</p>
        {/if}
      {/if}
    {/if}
  </section>
</main>

<style>
  .player {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 14px;
  }

  section {
    width: min(100%, 460px);
    display: grid;
    gap: 14px;
    background: #fff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    padding: 16px;
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
    font-size: 1.7rem;
  }

  .category,
  .submitted {
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

  textarea {
    min-height: 140px;
    resize: vertical;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 12px;
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
</style>
