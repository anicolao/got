<script lang="ts">
  let tableId = 'demo';
  let player = 'ana@example.com';
</script>

<svelte:head>
  <title>Game of Things</title>
</svelte:head>

<main class="home">
  <section class="panel" aria-labelledby="title">
    <p class="eyebrow">Game of Things</p>
    <h1 id="title">Run the room from one phone.</h1>
    <p class="summary">
      Open a table as moderator, let players submit answers, and cast the shared screen for the room.
    </p>

    <label>
      Table
      <input bind:value={tableId} autocomplete="off" />
    </label>
    <label>
      Player
      <input bind:value={player} autocomplete="email" />
    </label>

    <div class="actions">
      <a class="primary" href={`/table?slug=${encodeURIComponent(tableId)}&me=${encodeURIComponent(player)}${tableId === 'demo' ? '&mode=local' : ''}`}>
        Moderate
      </a>
      <a href={`/play?slug=${encodeURIComponent(tableId)}&me=${encodeURIComponent(player)}${tableId === 'demo' ? '&mode=local' : ''}`}>Player</a>
      <a href={`/cast?slug=${encodeURIComponent(tableId)}${tableId === 'demo' ? '&mode=local' : ''}`}>Cast</a>
      <a href="/replay">Replay</a>
    </div>
  </section>
</main>

<style>
  .home {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 20px;
    background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.08), transparent 32%),
      #f7f8fb;
  }

  .panel {
    width: min(100%, 440px);
    background: #ffffff;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    padding: 22px;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #b42318;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 0.78rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    line-height: 1.05;
  }

  .summary {
    color: #4b5563;
    line-height: 1.45;
  }

  label {
    display: grid;
    gap: 6px;
    margin-top: 14px;
    font-weight: 700;
  }

  input {
    min-height: 46px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    padding: 0 12px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 18px;
  }

  a {
    display: grid;
    place-items: center;
    min-height: 46px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 800;
    background: #fff;
  }

  .primary {
    background: #0f172a;
    color: #fff;
    border-color: #0f172a;
  }
</style>
