<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { CAMPAIGN_LEVELS, generateSkirmishLevel } from '../lib/data/levels';
  import { THEMES } from '../lib/data/themes';
  import { GameEngine, type EngineSnapshot } from '../lib/engine/GameEngine';
  import { SoundSynth } from '../lib/engine/SoundSynth';
  import { gameStore } from '../lib/stores/gameStore';

  let canvasEl: HTMLCanvasElement;
  let containerEl: HTMLDivElement;
  let engine: GameEngine | null = null;
  const sound = new SoundSynth();

  let showMenu = $state(false);
  let snapshot = $state<EngineSnapshot>({
    phase: 'PLAYER_AIM',
    activeTeam: 'p1',
    p1Remaining: 3,
    p2Remaining: 3,
    selectedUnitId: null,
    aiQuip: null,
    levelName: '',
    opponentName: '',
    shotsFired: 0
  });

  let lastMatchNonce = -1;

  const theme = $derived(THEMES[$gameStore.themeId]);
  const isPassPlayP2 = $derived(
    $gameStore.activeMode === 'pass_and_play' && snapshot.activeTeam === 'p2'
  );

  function startCurrentMatch() {
    if (!engine) return;
    showMenu = false;
    const state = $gameStore;
    const level =
      state.activeMode === 'campaign'
        ? CAMPAIGN_LEVELS.find((l) => l.id === state.activeLevelId) ?? CAMPAIGN_LEVELS[0]
        : state.activeMode === 'pass_and_play'
          ? {
              ...CAMPAIGN_LEVELS[Math.floor(Math.random() * 6)],
              id: 0,
              name: 'Lunch Table 2P',
              subtitle: 'Pass & Play Duel'
            }
          : generateSkirmishLevel(state.skirmishDifficulty, 4);

    engine.setAppearance(state.themeId, state.decalStyle);
    engine.setControlMode(state.controlMode);
    sound.setMuted(state.muted);
    engine.startMatch(level, state.activeMode);
  }

  onMount(() => {
    engine = new GameEngine(canvasEl, sound, {
      onStateChange: (next) => {
        snapshot = next;
      },
      onMatchEnd: (stats) => {
        gameStore.recordMatchEnd(stats);
      }
    });

    const handleResize = () => {
      if (!engine || !containerEl) return;
      engine.resize(containerEl.clientWidth, containerEl.clientHeight);
    };
    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerEl);

    lastMatchNonce = $gameStore.matchNonce;
    startCurrentMatch();

    return () => {
      observer.disconnect();
      engine?.stop();
    };
  });

  onDestroy(() => {
    engine?.stop();
  });

  $effect(() => {
    const state = $gameStore;
    engine?.setAppearance(state.themeId, state.decalStyle);
    engine?.setControlMode(state.controlMode);
    sound.setMuted(state.muted);

    if (engine && state.matchNonce !== lastMatchNonce) {
      lastMatchNonce = state.matchNonce;
      startCurrentMatch();
    }
  });

  $effect(() => {
    engine?.setPaused(showMenu || Boolean($gameStore.matchResult) || $gameStore.showSupporterModal);
  });

  function onPointerDown(e: PointerEvent) {
    if (showMenu || $gameStore.matchResult) return;
    canvasEl.setPointerCapture(e.pointerId);
    engine?.handlePointerDown(e.clientX, e.clientY, e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    engine?.handlePointerMove(e.clientX, e.clientY, e.pointerId);
  }

  function onPointerUp(e: PointerEvent) {
    if (canvasEl.hasPointerCapture(e.pointerId)) {
      canvasEl.releasePointerCapture(e.pointerId);
    }
    engine?.handlePointerUp(e.pointerId);
  }
</script>

<div
  bind:this={containerEl}
  class="game-wrap"
  style="background-color: {theme.paperBg}; color: {theme.hudText};"
>
  <canvas
    bind:this={canvasEl}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  ></canvas>

  <!-- Minimalist Margin-Note Top HUD -->
  <header class="hud-top" class:flipped={isPassPlayP2}>
    <div class="hud-badge" style="color: {theme.p2Ink}; border-color: {theme.p2Ink}; background: {theme.cardBg};">
      {$gameStore.activeMode === 'pass_and_play' ? 'P2' : 'FOE'}: {snapshot.p2Remaining} LEFT
    </div>

    <div
      class="turn-pill hand-title"
      style="
        color: {snapshot.activeTeam === 'p1' ? theme.p1Ink : theme.p2Ink};
        border-color: {snapshot.activeTeam === 'p1' ? theme.p1Ink : theme.p2Ink};
        background: {theme.cardBg};
      "
    >
      {#if snapshot.phase === 'AI_THINKING' || snapshot.phase === 'AI_ANIMATING'}
        {snapshot.opponentName.toUpperCase()}
      {:else}
        TURN: {snapshot.activeTeam === 'p1' ? 'BLUE' : 'RED'}
      {/if}
    </div>

    <button
      class="menu-btn"
      style="color: {theme.hudText}; border-color: {theme.hudText}; background: {theme.cardBg};"
      onclick={() => (showMenu = !showMenu)}
    >
      MENU
    </button>
  </header>

  <!-- AI Trash-Talk Margin Note -->
  {#if snapshot.aiQuip && (snapshot.phase === 'AI_THINKING' || snapshot.phase === 'AI_ANIMATING')}
    <div
      class="quip-note hand-title"
      style="background: {theme.cardBg}; color: {theme.p2Ink}; border-color: {theme.p2Ink};"
    >
      "{snapshot.aiQuip}"
    </div>
  {/if}

  <!-- Bottom Margin-Note HUD -->
  <footer class="hud-bottom">
    <div class="hud-badge" style="color: {theme.p1Ink}; border-color: {theme.p1Ink}; background: {theme.cardBg};">
      P1: {snapshot.p1Remaining} LEFT
    </div>

    <div class="stage-note" style="color: {theme.hudText};">
      {#if snapshot.shotsFired === 0 && snapshot.phase === 'PLAYER_AIM'}
        <span class="hint-blink">
          {$gameStore.controlMode === 'slingshot'
            ? 'PULL BACK & RELEASE TO FLICK'
            : 'SWIPE TOWARD TARGET TO FLICK'}
        </span>
      {:else}
        <span>{snapshot.levelName}</span>
      {/if}
    </div>
  </footer>

  <!-- Folded Index Card Pause / Settings Overlay -->
  {#if showMenu}
    <div class="overlay-backdrop" role="dialog" aria-modal="true">
      <div
        class="index-card"
        style="background: {theme.cardBg}; color: {theme.hudText}; border-color: {theme.cardBorder};"
      >
        <div class="index-card-red-line" style="background: {theme.marginLineColor};"></div>
        <h2 class="hand-title card-title">NOTEBOOK PAUSED</h2>

        <div class="setting-row">
          <span>Aiming Style</span>
          <button
            class="toggle-chip"
            style="border-color: {theme.p1Ink}; color: {theme.p1Ink};"
            onclick={() =>
              gameStore.setControlMode(
                $gameStore.controlMode === 'slingshot' ? 'flick' : 'slingshot'
              )}
          >
            {$gameStore.controlMode === 'slingshot' ? 'Slingshot Pull' : 'Direct Flick'}
          </button>
        </div>

        <div class="setting-row">
          <span>Pencil &amp; Paper SFX</span>
          <button
            class="toggle-chip"
            style="border-color: {theme.p1Ink}; color: {theme.p1Ink};"
            onclick={() => gameStore.toggleMute()}
          >
            {$gameStore.muted ? 'MUTED' : 'SOUND ON'}
          </button>
        </div>

        <div class="card-actions">
          <button
            class="paper-btn"
            style="background: {theme.paperBg}; color: {theme.p1Ink};"
            onclick={() => (showMenu = false)}
          >
            RESUME DUEL
          </button>
          <button
            class="paper-btn"
            style="background: {theme.paperBg}; color: {theme.hudText};"
            onclick={() => gameStore.setShowSupporterModal(true)}
          >
            PAPER &amp; INK THEMES
          </button>
          <button
            class="paper-btn"
            style="background: {theme.paperBg}; color: {theme.hudText};"
            onclick={startCurrentMatch}
          >
            FRESH SHEET (RESTART)
          </button>
          <button
            class="paper-btn"
            style="background: {theme.paperBg}; color: {theme.p2Ink};"
            onclick={() => gameStore.returnToTitle()}
          >
            QUIT TO COVER
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .hud-top,
  .hud-bottom {
    position: absolute;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    z-index: 5;
  }

  .hud-top {
    top: max(10px, env(safe-area-inset-top));
    transition: transform 0.25s ease;
  }

  .hud-top.flipped {
    transform: rotate(180deg);
  }

  .hud-bottom {
    bottom: max(10px, env(safe-area-inset-bottom));
  }

  .hud-badge,
  .turn-pill,
  .menu-btn {
    pointer-events: auto;
    border: 1.8px solid;
    border-radius: 4px;
    padding: 4px 9px;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 1px 2px 0 rgba(0, 0, 0, 0.16);
  }

  .turn-pill {
    font-size: 13px;
    padding: 4px 12px;
  }

  .stage-note {
    font-size: 11px;
    font-weight: 700;
    opacity: 0.85;
    text-align: right;
    max-width: 62%;
  }

  .hint-blink {
    animation: pulseNote 1.5s ease-in-out infinite;
  }

  @keyframes pulseNote {
    0%,
    100% {
      opacity: 0.95;
    }
    50% {
      opacity: 0.45;
    }
  }

  .quip-note {
    position: absolute;
    top: calc(max(10px, env(safe-area-inset-top)) + 40px);
    left: 50%;
    transform: translateX(-50%) rotate(-1.2deg);
    border: 1.5px dashed;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 700;
    z-index: 5;
    pointer-events: none;
    white-space: nowrap;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.12);
  }

  .overlay-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 18, 25, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 20;
  }

  .index-card {
    position: relative;
    width: 100%;
    max-width: 340px;
    border: 2.5px solid;
    border-radius: 8px;
    padding: 18px 18px 20px;
    box-shadow: 5px 7px 0 rgba(0, 0, 0, 0.25);
  }

  .index-card-red-line {
    height: 2px;
    width: 100%;
    margin-bottom: 10px;
  }

  .card-title {
    margin: 0 0 14px;
    text-align: center;
    font-size: 22px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed rgba(128, 128, 128, 0.35);
    font-size: 13px;
    font-weight: 700;
  }

  .toggle-chip {
    background: transparent;
    border: 1.8px solid;
    border-radius: 4px;
    padding: 4px 9px;
    font-size: 12px;
    font-weight: 800;
  }

  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 16px;
  }
</style>
