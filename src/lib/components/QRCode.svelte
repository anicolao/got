<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  export let value = '';
  export let label = 'QR code';
  export let logoSrc = '';
  export let logoAlt = '';

  let canvas: HTMLCanvasElement;

  async function render() {
    if (!canvas || !value) return;
    await QRCode.toCanvas(canvas, value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });
  }

  onMount(() => {
    void render();
  });

  $: if (canvas && value) {
    void render();
  }
</script>

<div class="qr">
  <canvas bind:this={canvas} aria-label={label}></canvas>
  {#if logoSrc}
    <span class="logo">
      <img src={logoSrc} alt={logoAlt} />
    </span>
  {/if}
</div>

<style>
  .qr {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }

  .logo {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 24%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    border: max(3px, 0.7vw) solid #fff;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
</style>
