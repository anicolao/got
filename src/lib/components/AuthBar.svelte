<script lang="ts">
  import { authState, signIn, signOutUser } from '$lib/firebase/auth-store';
</script>

<div class="auth" data-auth={$authState.user ? 'signed-in' : 'signed-out'}>
  {#if $authState.loading}
    <span>Checking sign-in</span>
  {:else if $authState.user}
    <span>{$authState.user.email}</span>
    <button on:click={signOutUser}>Sign out</button>
  {:else}
    <span>Firebase mode</span>
    <button on:click={signIn}>Sign in</button>
  {/if}
</div>

<style>
  .auth {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid #d8dee8;
    border-radius: 8px;
    background: #fff;
    color: #475569;
    font-size: 0.9rem;
  }

  button {
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid #b8c0cc;
    border-radius: 6px;
    background: #fff;
    font-weight: 800;
  }
</style>
