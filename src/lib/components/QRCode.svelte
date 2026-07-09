<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  export let value = '';
  export let label = 'QR code';

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

<canvas bind:this={canvas} aria-label={label}></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
</style>
