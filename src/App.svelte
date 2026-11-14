<script lang="ts">
  import GameCanvas from './components/GameCanvas.svelte';
  import SupporterModal from './components/SupporterModal.svelte';
  import TitleOverlay from './components/TitleOverlay.svelte';
  import VictoryModal from './components/VictoryModal.svelte';
  import { gameStore } from './lib/stores/gameStore';
</script>

<main class="app-root">
  {#if $gameStore.screen === 'title'}
    <TitleOverlay />
  {:else}
    <GameCanvas />
  {/if}

  {#if $gameStore.matchResult}
    <VictoryModal stats={$gameStore.matchResult} />
  {/if}

  {#if $gameStore.showSupporterModal}
    <SupporterModal />
  {/if}
</main>

<style>
  .app-root {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
</style>
