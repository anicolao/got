<script lang="ts">
  import { normalizeAction, replayThings, displayName, type ThingsAction } from '$lib/domain/things';
  import { sampleActionLog } from '$lib/domain/fixtures';

  let raw = JSON.stringify(sampleActionLog, null, 2);
  $: actions = parseActions(raw);
  $: state = replayThings(actions);

  function parseActions(value: string): ThingsAction[] {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeAction).filter((action): action is ThingsAction => !!action);
    } catch {
      return [];
    }
  }
</script>

<svelte:head>
  <title>Replay | Game of Things</title>
</svelte:head>

<main class="replay">
  <section class="editor">
    <p class="label">Replay</p>
    <h1>Paste an old action log</h1>
    <textarea aria-label="Action log JSON" bind:value={raw}></textarea>
  </section>

  <section class="state" aria-label="Replayed state">
    <h2>Things {state.currentCategory ? `... ${state.currentCategory}` : ''}</h2>
    <div class="players">
      {#each state.players as player, i}
        <article class:out={!state.alive[i]}>
          <strong>{displayName(player)}</strong>
          <span>{state.scores[i]}</span>
          <p>{state.playerToAnswer[player]}</p>
        </article>
      {/each}
    </div>
    <p class="meta">{actions.length} actions replayed</p>
  </section>
</main>

<style>
  .replay {
    min-height: 100svh;
    display: grid;
    gap: 14px;
    padding: 14px;
  }

  section {
    background: #fff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    padding: 14px;
  }

  p,
  h1,
  h2 {
    margin: 0;
  }

  .label {
    color: #b42318;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  h1 {
    margin-top: 4px;
    font-size: 1.5rem;
  }

  textarea {
    margin-top: 12px;
    width: 100%;
    min-height: 280px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.86rem;
  }

  .state {
    display: grid;
    gap: 12px;
  }

  .players {
    display: grid;
    gap: 8px;
  }

  article {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 10px;
    min-height: 64px;
    border: 1px solid #d8dee8;
    border-left: 5px solid #1d4ed8;
    border-radius: 8px;
    padding: 10px 12px;
  }

  article.out {
    border-left-color: #b42318;
  }

  article p {
    grid-column: 1 / -1;
    color: #475569;
  }

  article span {
    font-weight: 900;
    font-size: 1.3rem;
  }

  .meta {
    color: #64748b;
  }

  @media (min-width: 900px) {
    .replay {
      grid-template-columns: 1fr 1fr;
      max-width: 1180px;
      margin: 0 auto;
      align-items: start;
    }
  }
</style>
