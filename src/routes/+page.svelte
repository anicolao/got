<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import AuthBar from '$lib/components/AuthBar.svelte';
  import { authState, signIn } from '$lib/firebase/auth-store';
  import {
    appendLobbyAction,
    createThingsTable,
    lobbyStore,
    subscribeLobby
  } from '$lib/firebase/lobby-store';
  import { appendTableAction } from '$lib/firebase/action-log';
  import { join_game } from '$lib/domain/things';
  import { displayName } from '$lib/domain/things';
  import {
    isThingsGame,
    join_table,
    leave_table,
    start_table,
    type Table
  } from '$lib/domain/tables';

  let busy = false;
  let error = '';

  onMount(() => {
    subscribeLobby();
  });

  $: me = $authState.user?.email || '';
  $: signedIn = !!me;
  $: tables = $lobbyStore.tables.tableIds
    .map((tableId) => $lobbyStore.tables.tableIdToTable[tableId])
    .filter((table): table is Table => !!table && !table.completed)
    .filter((table) => isThingsGame(table.gameid, $lobbyStore.gamedefs));

  async function withBusy(fn: () => Promise<void>) {
    busy = true;
    error = '';
    try {
      await fn();
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    } finally {
      busy = false;
    }
  }

  async function createTable() {
    await withBusy(async () => {
      const tableId = await createThingsTable(me);
      await goto(`${base}/table?slug=${encodeURIComponent(tableId)}`);
    });
  }

  async function joinTable(tableId: string) {
    await withBusy(async () => {
      await appendLobbyAction(join_table({ tableid: tableId, player: me }));
    });
  }

  async function leaveTable(tableId: string) {
    await withBusy(async () => {
      await appendLobbyAction(leave_table({ tableid: tableId, player: me }));
    });
  }

  async function startTable(table: Table) {
    await withBusy(async () => {
      for (const player of table.players) {
        await appendTableAction(table.tableid, join_game(player));
      }
      await appendLobbyAction(start_table({ tableid: table.tableid }));
      await goto(`${base}/table?slug=${encodeURIComponent(table.tableid)}`);
    });
  }
</script>

<svelte:head>
  <title>Tables | Game of Things</title>
</svelte:head>

<main class="lobby">
  <header>
    <div>
      <p class="eyebrow">Game of Things</p>
      <h1>Tables</h1>
    </div>
    <AuthBar />
  </header>

  {#if $authState.loading}
    <section class="panel">
      <h2>Loading</h2>
    </section>
  {:else if !signedIn}
    <section class="panel signin">
      <h2>Sign in to play</h2>
      <p>Players and moderators use their Google identity, then join the table they want to play at.</p>
      <button class="primary" on:click={signIn}>Sign in with Google</button>
    </section>
  {:else}
    <section class="toolbar">
      <button class="primary" disabled={busy} on:click={createTable}>New Game of Things Table</button>
      <a href={`${base}/replay`}>Replay old game</a>
    </section>

    {#if error || $lobbyStore.error}
      <p class="error">{error || $lobbyStore.error}</p>
    {/if}

    <section class="table-list" aria-label="Tables">
      {#if tables.length === 0}
        <article class="empty">
          <h2>No active tables</h2>
          <p>Create a table to start a game.</p>
        </article>
      {/if}

      {#each tables as table}
        {@const joined = table.players.includes(me)}
        {@const owner = table.owner === me}
        <article class:started={table.started}>
          <div class="table-main">
            <p class="status">{table.started ? 'Started' : 'Waiting'}</p>
            <h2>{displayName(table.owner)}'s table</h2>
            <p class="table-id">{table.tableid}</p>
            <div class="players" aria-label="Players">
              {#each table.players as player}
                <span>{displayName(player)}</span>
              {/each}
            </div>
          </div>

          <div class="table-actions">
            {#if table.started}
              <a class="primary" href={`${base}/play?slug=${encodeURIComponent(table.tableid)}`}>Play</a>
              {#if owner}
                <a href={`${base}/table?slug=${encodeURIComponent(table.tableid)}`}>Moderate</a>
              {/if}
              <a href={`${base}/cast?slug=${encodeURIComponent(table.tableid)}`}>Cast</a>
            {:else if owner}
              <button class="primary" disabled={busy || table.players.length < 2} on:click={() => startTable(table)}>
                Start
              </button>
            {:else if joined}
              <button disabled={busy} on:click={() => leaveTable(table.tableid)}>Leave</button>
            {:else}
              <button class="primary" disabled={busy} on:click={() => joinTable(table.tableid)}>Join</button>
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}
</main>

<style>
  .lobby {
    min-height: 100svh;
    padding: 14px;
    display: grid;
    align-content: start;
    gap: 14px;
  }

  header,
  .panel,
  .toolbar,
  article {
    background: #fff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
  }

  header {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-size: 1.8rem;
  }

  h2 {
    font-size: 1.1rem;
  }

  .eyebrow,
  .status {
    color: #b42318;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  .panel {
    display: grid;
    gap: 12px;
    padding: 16px;
  }

  .signin p,
  .empty p,
  .table-id {
    color: #64748b;
    line-height: 1.4;
  }

  .toolbar {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding: 10px;
    align-items: center;
  }

  .table-list {
    display: grid;
    gap: 10px;
  }

  article {
    display: grid;
    gap: 12px;
    padding: 12px;
    border-left: 5px solid #1d4ed8;
  }

  article.started {
    border-left-color: #15803d;
  }

  .empty {
    border-left-color: #b8c0cc;
  }

  .table-main {
    display: grid;
    gap: 5px;
  }

  .players {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .players span {
    border: 1px solid #d8dee8;
    border-radius: 999px;
    padding: 4px 8px;
    background: #f8fafc;
    font-weight: 700;
    font-size: 0.86rem;
  }

  .table-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button,
  a {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 6px;
    border: 1px solid #b8c0cc;
    background: #fff;
    color: #111827;
    display: inline-grid;
    place-items: center;
    text-decoration: none;
    font-weight: 900;
  }

  .primary {
    color: #fff;
    background: #0f172a;
    border-color: #0f172a;
  }

  .error {
    color: #b42318;
    font-weight: 800;
  }

  @media (min-width: 760px) {
    .lobby {
      max-width: 980px;
      margin: 0 auto;
    }

    header {
      grid-template-columns: 1fr minmax(260px, 360px);
      align-items: center;
    }

    article {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }
</style>
